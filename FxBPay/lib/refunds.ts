/**
 * Refund: saldo merchant dicadangkan dulu (user_available → user_reserved), lalu Refund Order DANA dipanggil.
 * Sukses → reserved didebit ke provider_clearing. Gagal final → cadangan dikembalikan.
 * Timeout → UNCERTAIN; admin wajib mengecek/mengulang dengan partnerRefundNo yang sama (idempoten di DANA).
 */
import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, type Tx } from "./db";
import { payments, refunds } from "./db/schema";
import { AppError, notFound } from "./errors";
import { postJournal } from "./ledger";
import { formatRupiah } from "./money";
import { notifyAdmins, notifyUser } from "./notify";
import { shortId } from "./crypto";
import { lockPayment, paymentPayload, transition } from "./payments/service";
import { emitMerchantEvent } from "./webhooks-out";
import { loadDanaConfig } from "./dana/config";
import { DanaClient } from "./dana/client";
import { isSnapAccepted, isSnapSuccess } from "./dana/constants";
import { audit, type Actor } from "./audit";

export type Refund = typeof refunds.$inferSelect;

export async function requestRefund(actor: Actor, opts: { paymentId: string; ownerUserId: string | null; amount: bigint; reason: string }) {
  if (opts.amount <= 0n) throw new AppError("invalid_amount", "Nominal refund harus lebih dari 0");
  if (opts.reason.trim().length < 3) throw new AppError("reason_required", "Alasan refund wajib diisi");
  const refund = await db.transaction(async (tx) => {
    const p = await lockPayment(tx, opts.paymentId);
    if (opts.ownerUserId && p.userId !== opts.ownerUserId) throw notFound("Pembayaran");
    if (!["PAID", "PARTIALLY_REFUNDED"].includes(p.status)) throw new AppError("not_refundable", "Hanya pembayaran lunas yang dapat direfund", 409);
    if (p.purpose === "topup") throw new AppError("not_refundable", "Isi saldo tidak dapat direfund; gunakan penarikan saldo.", 409);
    const pending = await tx.execute<{ s: string }>(sql`SELECT coalesce(sum(amount),0)::text s FROM refunds WHERE payment_id=${p.id} AND status IN ('PENDING','UNCERTAIN')`);
    const refundable = p.amount - p.refundedAmount - BigInt(pending.rows[0].s);
    if (opts.amount > refundable) throw new AppError("exceeds_refundable", `Maksimal yang dapat direfund ${formatRupiah(refundable)}`, 409);
    const [r] = await tx
      .insert(refunds)
      .values({ paymentId: p.id, userId: p.userId, env: p.env, amount: opts.amount, reason: opts.reason.trim(), partnerRefundNo: `FXBR${shortId(18).toUpperCase()}`, requestedBy: actor.id })
      .returning();
    await postJournal(tx, {
      env: p.env,
      type: "refund_reserve",
      idempotencyKey: `refund:${r.id}:reserve`,
      referenceType: "refund",
      referenceId: r.id,
      memo: `Cadangan refund ${p.partnerReferenceNo}`,
      createdBy: actor.id,
      lines: [
        { account: { kind: "user_available", ownerUserId: p.userId }, debit: opts.amount },
        { account: { kind: "user_reserved", ownerUserId: p.userId }, credit: opts.amount },
      ],
    });
    await transition(tx, p, "REFUND_PENDING", actor.id === p.userId ? "dashboard" : "admin", `Refund ${formatRupiah(opts.amount)} diajukan: ${opts.reason}`);
    await audit(actor, "refund.request", { type: "payment", id: p.id }, { amount: opts.amount, refundId: r.id });
    return r;
  });
  return executeRefund(refund.id);
}

export async function executeRefund(refundId: string): Promise<Refund> {
  const [r] = await db.select().from(refunds).where(eq(refunds.id, refundId));
  if (!r) throw notFound("Refund");
  if (r.status === "SUCCEEDED" || r.status === "FAILED") return r;
  const [p] = await db.select().from(payments).where(eq(payments.id, r.paymentId));
  if (p.provider === "demo") return finalizeRefund(r.id, "success", { note: "Refund DEMO (sandbox lokal)" });
  const cfg = await loadDanaConfig(r.env);
  if (!cfg) return markUncertain(r.id, "Integrasi DANA belum dikonfigurasi");
  const res = await new DanaClient(cfg).refundOrder({ partnerReferenceNo: p.partnerReferenceNo, referenceNo: p.providerReferenceNo, partnerRefundNo: r.partnerRefundNo, amount: r.amount, reason: r.reason });
  if (res.outcome !== "response") return markUncertain(r.id, res.error ?? "Tidak ada respons");
  const code = res.body?.responseCode;
  if (isSnapSuccess(code)) return finalizeRefund(r.id, "success", { providerRefundNo: (res.body as { refundNo?: string }).refundNo, code });
  if (isSnapAccepted(code)) return markUncertain(r.id, `Diterima DANA, diproses asinkron (${code})`, code);
  if (res.httpStatus && res.httpStatus >= 500) return markUncertain(r.id, `DANA error ${code ?? res.httpStatus}`, code ?? undefined);
  return finalizeRefund(r.id, "failed", { code: code ?? String(res.httpStatus), note: (res.body as { responseMessage?: string } | null)?.responseMessage ?? "Ditolak DANA" });
}

async function markUncertain(id: string, reason: string, code?: string) {
  const [u] = await db.update(refunds).set({ status: "UNCERTAIN", failureReason: reason, providerResponseCode: code ?? null, updatedAt: new Date() }).where(eq(refunds.id, id)).returning();
  await notifyAdmins("refund", "Refund perlu dicek", `Status refund ${u.partnerRefundNo} belum pasti: ${reason}`, { env: u.env, href: "/admin/refund" });
  return u;
}

export async function finalizeRefund(id: string, result: "success" | "failed", info: { providerRefundNo?: string; code?: string; note?: string; actor?: Actor } = {}): Promise<Refund> {
  return db.transaction(async (tx) => {
    const locked = await tx.select().from(refunds).where(eq(refunds.id, id)).for("update");
    const r = locked[0];
    if (!r) throw notFound("Refund");
    if (r.status === "SUCCEEDED" || r.status === "FAILED") return r;
    const p = await lockPayment(tx, r.paymentId);
    if (result === "success") {
      await postJournal(tx, {
        env: r.env,
        type: "refund_complete",
        idempotencyKey: `refund:${r.id}:complete`,
        referenceType: "refund",
        referenceId: r.id,
        memo: `Refund ${r.partnerRefundNo}`,
        createdBy: info.actor?.id ?? null,
        lines: [
          { account: { kind: "user_reserved", ownerUserId: r.userId }, debit: r.amount },
          { account: { kind: "provider_clearing" }, credit: r.amount },
        ],
      });
      const refunded = p.refundedAmount + r.amount;
      const stillPending = await otherPending(tx, p.id, r.id);
      const to = refunded >= p.amount ? "REFUNDED" : stillPending ? "REFUND_PENDING" : "PARTIALLY_REFUNDED";
      const up = await transition(tx, p, to, info.actor ? "admin" : "system", `Refund ${formatRupiah(r.amount)} berhasil`, { refundedAmount: refunded });
      const [u] = await tx.update(refunds).set({ status: "SUCCEEDED", providerRefundNo: info.providerRefundNo ?? null, providerResponseCode: info.code ?? null, failureReason: null, updatedAt: new Date() }).where(eq(refunds.id, r.id)).returning();
      await notifyUser(r.userId, "refund", "Refund berhasil", `${formatRupiah(r.amount)} untuk ${p.partnerReferenceNo}`, { href: `/app/pembayaran/${p.id}`, env: r.env }, tx);
      await emitMerchantEvent(tx, r.userId, r.env, "refund.succeeded", { refund_id: r.id, amount: Number(r.amount), payment: paymentPayload(up) });
      if (info.actor) await audit(info.actor, "refund.finalize_success", { type: "refund", id: r.id }, { note: info.note }, tx);
      return u;
    }
    await postJournal(tx, {
      env: r.env,
      type: "refund_release",
      idempotencyKey: `refund:${r.id}:release`,
      referenceType: "refund",
      referenceId: r.id,
      memo: `Refund gagal ${r.partnerRefundNo}: cadangan dikembalikan`,
      createdBy: info.actor?.id ?? null,
      lines: [
        { account: { kind: "user_reserved", ownerUserId: r.userId }, debit: r.amount },
        { account: { kind: "user_available", ownerUserId: r.userId }, credit: r.amount },
      ],
    });
    const stillPending = await otherPending(tx, p.id, r.id);
    const to = stillPending ? "REFUND_PENDING" : p.refundedAmount > 0n ? "PARTIALLY_REFUNDED" : "PAID";
    const up = await transition(tx, p, to, info.actor ? "admin" : "system", `Refund ${formatRupiah(r.amount)} gagal: ${info.note ?? info.code ?? ""}`);
    const [u] = await tx.update(refunds).set({ status: "FAILED", providerResponseCode: info.code ?? null, failureReason: info.note ?? null, updatedAt: new Date() }).where(eq(refunds.id, r.id)).returning();
    await notifyUser(r.userId, "refund", "Refund gagal", `${formatRupiah(r.amount)} — saldo dikembalikan. ${info.note ?? ""}`, { href: `/app/pembayaran/${p.id}`, env: r.env }, tx);
    await emitMerchantEvent(tx, r.userId, r.env, "refund.failed", { refund_id: r.id, amount: Number(r.amount), payment: paymentPayload(up) });
    if (info.actor) await audit(info.actor, "refund.finalize_failed", { type: "refund", id: r.id }, { note: info.note }, tx);
    return u;
  });
}

async function otherPending(tx: Tx, paymentId: string, exceptId: string) {
  const rows = await tx.select({ id: refunds.id }).from(refunds).where(and(eq(refunds.paymentId, paymentId), inArray(refunds.status, ["PENDING", "UNCERTAIN"])));
  return rows.some((x) => x.id !== exceptId);
}
