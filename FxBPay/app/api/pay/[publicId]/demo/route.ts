import { z } from "zod";
import { eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { AppError, notFound } from "@/lib/errors";
import { buildFinishNotify, sendHarnessNotify } from "@/lib/uat/harness";
import { audit } from "@/lib/audit";

/**
 * Checkout DEMO (sandbox, tanpa DANA). Hanya pemilik pembayaran atau admin.
 * Hasil dikirim lewat jalur verifikasi notifikasi yang sama (ditandatangani test harness lokal).
 * Tidak mungkin dipakai di production: provider demo & kunci harness ditolak di env production.
 */
export const POST = authed<{ result: "success" | "fail" }, { publicId: string }>({ schema: z.object({ result: z.enum(["success", "fail"]) }) as never, limit: 20 }, async ({ auth, actor, input, params }) => {
  const [p] = await db.select().from(payments).where(eq(payments.publicId, params.publicId));
  if (!p || (p.userId !== auth.user.id && auth.user.role !== "admin")) throw notFound("Pembayaran");
  if (p.env !== "sandbox" || p.provider !== "demo") throw new AppError("forbidden", "Simulasi hanya untuk pembayaran DEMO di Sandbox", 403);
  const r = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: input.result === "success" ? "00" : "05" }));
  await audit(actor, "demo.simulate", { type: "payment", id: p.id }, { result: input.result, outcome: r.response.outcome });
  return { message: input.result === "success" ? "Simulasi pembayaran berhasil (DEMO)" : "Simulasi pembayaran ditutup (DEMO)", redirect: `/pay/${p.publicId}/selesai` };
});
