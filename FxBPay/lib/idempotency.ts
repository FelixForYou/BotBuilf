/**
 * Idempotency-Key untuk operasi finansial API: permintaan ulang dengan key sama mengembalikan respons
 * yang sama; key sama dengan body berbeda ditolak (422). Permintaan paralel dengan key sama → 409.
 */
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { idempotencyRecords } from "./db/schema";
import { sha256Hex } from "./crypto";
import { AppError, isUniqueViolation } from "./errors";
import { json } from "./http";

export async function withIdempotency(scope: string, key: string | null, requestBody: unknown, run: () => Promise<{ status: number; body: unknown }>) {
  if (!key) throw new AppError("idempotency_key_required", "Header Idempotency-Key wajib untuk operasi ini", 400);
  if (!/^[A-Za-z0-9_\-:.]{8,128}$/.test(key)) throw new AppError("invalid_idempotency_key", "Idempotency-Key harus 8–128 karakter alfanumerik", 400);
  const hash = sha256Hex(JSON.stringify(requestBody));
  try {
    await db.insert(idempotencyRecords).values({ scope, key, requestHash: hash });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
    const [rec] = await db.select().from(idempotencyRecords).where(and(eq(idempotencyRecords.scope, scope), eq(idempotencyRecords.key, key)));
    if (rec.requestHash !== hash) throw new AppError("idempotency_mismatch", "Idempotency-Key sudah dipakai untuk permintaan berbeda", 422);
    if (rec.statusCode === null) throw new AppError("idempotency_in_progress", "Permintaan dengan Idempotency-Key ini sedang diproses", 409);
    return json(rec.response, rec.statusCode, { "Idempotent-Replayed": "true" });
  }
  try {
    const res = await run();
    const safe = JSON.parse(JSON.stringify(res.body, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
    await db.update(idempotencyRecords).set({ statusCode: res.status, response: safe }).where(and(eq(idempotencyRecords.scope, scope), eq(idempotencyRecords.key, key)));
    return json(safe, res.status);
  } catch (e) {
    // Error validasi/bisnis: hapus agar klien bisa memperbaiki dan mencoba lagi dengan key yang sama.
    await db.delete(idempotencyRecords).where(and(eq(idempotencyRecords.scope, scope), eq(idempotencyRecords.key, key)));
    throw e;
  }
}
