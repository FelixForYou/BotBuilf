/** API key merchant: disimpan sebagai hash SHA-256, terpisah sandbox (fxb_test_) dan production (fxb_live_). */
import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "./db";
import { apiKeys, users } from "./db/schema";
import { randomToken, sha256Hex } from "./crypto";
import { AppError } from "./errors";
import { rateLimit } from "./ratelimit";
import type { Env } from "./ledger";
import { audit, type Actor } from "./audit";

export const API_SCOPES = ["payments:write", "payments:read", "balance:read", "transactions:read"] as const;
export type ApiScope = (typeof API_SCOPES)[number];
export const SCOPE_LABEL: Record<ApiScope, string> = {
  "payments:write": "Membuat pembayaran",
  "payments:read": "Membaca status pembayaran",
  "balance:read": "Membaca saldo",
  "transactions:read": "Membaca mutasi transaksi",
};

export async function createApiKey(actor: Actor, userId: string, env: Env, input: { name: string; scopes: ApiScope[]; expiresInDays: number | null; rotatedFrom?: string }) {
  const secret = `fxb_${env === "production" ? "live" : "test"}_${randomToken(30)}`;
  const [k] = await db
    .insert(apiKeys)
    .values({
      userId,
      env,
      name: input.name.trim().slice(0, 60) || "API key",
      prefix: secret.slice(0, 16),
      keyHash: sha256Hex(secret),
      scopes: input.scopes,
      expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86400_000) : null,
      rotatedFrom: input.rotatedFrom ?? null,
    })
    .returning();
  await audit(actor, "apikey.create", { type: "api_key", id: k.id }, { env, scopes: input.scopes, prefix: k.prefix });
  return { key: k, secret };
}

export async function revokeApiKey(actor: Actor, userId: string, id: string) {
  const r = await db.update(apiKeys).set({ revokedAt: new Date() }).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt))).returning();
  if (!r[0]) throw new AppError("not_found", "API key tidak ditemukan", 404);
  await audit(actor, "apikey.revoke", { type: "api_key", id }, {});
}

export async function rotateApiKey(actor: Actor, userId: string, id: string) {
  const [old] = await db.select().from(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
  if (!old || old.revokedAt) throw new AppError("not_found", "API key tidak ditemukan", 404);
  const days = old.expiresAt ? Math.max(1, Math.round((old.expiresAt.getTime() - old.createdAt.getTime()) / 86400_000)) : null;
  const created = await createApiKey(actor, userId, old.env, { name: old.name, scopes: old.scopes as ApiScope[], expiresInDays: days, rotatedFrom: old.id });
  await revokeApiKey(actor, userId, id);
  return created;
}

export type ApiCaller = { keyId: string; userId: string; env: Env; scopes: string[] };

export async function authenticateApiKey(req: NextRequest, scope: ApiScope): Promise<ApiCaller> {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(fxb_(test|live)_[A-Za-z0-9_-]{20,})$/.exec(h.trim());
  if (!m) throw new AppError("unauthenticated", "Header Authorization: Bearer <API key> diperlukan", 401);
  const rows = await db
    .select({ k: apiKeys, status: users.status })
    .from(apiKeys)
    .innerJoin(users, eq(users.id, apiKeys.userId))
    .where(eq(apiKeys.keyHash, sha256Hex(m[1])))
    .limit(1);
  const r = rows[0];
  if (!r || r.k.revokedAt || (r.k.expiresAt && r.k.expiresAt < new Date())) throw new AppError("unauthenticated", "API key tidak valid, dicabut, atau kedaluwarsa", 401);
  if (r.status !== "active") throw new AppError("account_frozen", "Akun merchant dibekukan", 403);
  if (!r.k.scopes.includes(scope)) throw new AppError("insufficient_scope", `API key tidak memiliki scope ${scope}`, 403);
  await rateLimit(`api:${r.k.id}`, Number(process.env.API_RATE_LIMIT_PER_MIN ?? 120), 60);
  if (!r.k.lastUsedAt || Date.now() - r.k.lastUsedAt.getTime() > 60_000) await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, r.k.id));
  return { keyId: r.k.id, userId: r.k.userId, env: r.k.env, scopes: r.k.scopes };
}
