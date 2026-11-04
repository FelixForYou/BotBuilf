/**
 * Penarikan saldo. Saat diajukan, nominal langsung dicadangkan (available → reserved) di transaksi
 * yang sama dengan pembuatan baris, sehingga saldo yang sama tidak dapat dipakai dua kali.
 * Pencairan dilakukan manual oleh admin dengan bukti, karena produk Disbursement DANA memerlukan
 * akses & perjanjian terpisah (lihat docs/DANA.md).
 */
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { users, withdrawalEvents, withdrawals, type WithdrawalStatus } from "./db/schema";
import { AppError, isUniqueViolation, notFound } from "./errors";
import { postJournal, type Env } from "./ledger";
import { formatRupiah } from "./money";
import { notifyAdmins, notifyUser } from "./notify";
import { getSetting } from "./settings";
import { audit, type Actor } from "./audit";
import { emitMerchantEvent } from "./webhooks-out";
import { assertEnvUsable } from "./payments/service";

export type Withdrawal = typeof withdrawals.$inferSelect;

const ALLOWED: Record<WithdrawalStatus, WithdrawalStatus[]> = {
  PENDING_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["PROCESSING", "PAID", "REJECTED", "FAILED", "UNCERTAIN"],
  PROCESSING: ["PAID", "FAILED", "UNCERTAIN"],
  UNCERTAIN: ["PAID", "FAILED"],
  PAID: [],
  REJECTED: [],
  FAILED: [],
};

export const WITHDRAWAL_LABEL: Record<WithdrawalStatus, string> = {
  PENDING_REVIEW: "Menunggu tinjauan",
  APPROVED: "Disetujui",
  PROCESSING: "Diproses",
  PAID: "Dicairkan",
  REJECTED: "Ditolak",
  FAILED: "Gagal",
  UNCERTAIN: "Perlu rekonsiliasi",
};

export type WithdrawalInput = {
  amount: bigint;
  destinationType: "bank" | "dana";
  destinationBank: string;
  destinationAccount: string;
  destinationName: string;
  idempotencyKey?: string | null;
};

export async function quoteWithdrawal(amount: bigint) {
  const fees = await getSetting("fees");
  const fee = BigInt(fees.withdrawalFlat);
  return { fee, net: amount - fee };
}

export async function requestWithdrawal(actor: Actor, userId: string, env: Env, input: WithdrawalInput): Promise<Withdrawal> {
  await assertEnvUsable(env);
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u || u.status !== "active") throw new AppError("account_frozen", "Akun dibekukan. Penarikan tidak dapat diajukan.", 403);
  const limits = await getSetting("limits");
  if (input.amount < BigInt(limits.withdrawalMin) || input.amount > BigInt(limits.withdrawalMax)) {
    throw new AppError("amount_out_of_range", `Penarikan harus antara ${formatRupiah(BigInt(limits.withdrawalMin))} dan ${formatRupiah(BigInt(limits.withdrawalMax))}`);
  }
  if (!/^[0-9]{5,20}$/.test(input.destinationAccount.replace(/[\s-]/g, ""))) throw new AppError("invalid_destination", "Nomor rekening/DANA tidak valid");
  if (input.destinationName.trim().length < 3) throw new AppError("invalid_destination", "Nama pemilik rekening wajib diisi");
  if (input.destinationType === "bank" && input.destinationBank.trim().length < 2) throw new AppError("invalid_destination", "Nama bank wajib diisi");
  const { fee, net } = await quoteWithdrawal(input.amount);
  if (net <= 0n) throw new AppError("amount_too_small", "Nominal lebih kecil dari biaya penarikan");

  try {
    return await db.transaction(async (tx) => {
      if (input.idempotencyKey) {
        const ex = await tx.select().from(withdrawals).where(and(eq(withdrawals.userId, userId), eq(withdrawals.env, env), eq(withdrawals.idempotencyKey, input.idempotencyKey)));
        if (ex[0]) return ex[0];
      }
      // Kunci per pengguna+env agar batas harian tidak bisa dilewati oleh permintaan paralel.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`withdraw:${userId}:${env}`}))`);
      const today = await tx.execute<{ s: string }>(sql`SELECT coalesce(sum(amount),0)::text s FROM withdrawals WHERE user_id=${userId} AND env=${env}
        AND status NOT IN ('REJECTED','FAILED') AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'`);
      if (BigInt(today.rows[0].s) + input.amount > BigInt(limits.withdrawalDailyMax)) throw new AppError("daily_limit", `Melebihi batas penarikan harian ${formatRupiah(BigInt(limits.withdrawalDailyMax))}`);
      const [w] = await tx
        .insert(withdrawals)
        .values({
          userId,
          env,
          amount: input.amount,
          fee,
          net,
          destinationType: input.destinationType,
          destinationBank: input.destinationType === "dana" ? "DANA" : input.destinationBank.trim(),
          destinationAccount: input.destinationAccount.replace(/[\s-]/g, ""),
          destinationName: input.destinationName.trim(),
          idempotencyKey: input.idempotencyKey ?? null,
        })
        .returning();
      await postJournal(tx, {
        env,
        type: "withdrawal_reserve",
        idempotencyKey: `withdrawal:${w.id}:reserve`,
        referenceType: "withdrawal",
        referenceId: w.id,
        memo: `Cadangan penarikan ke ${w.destinationBank} ${w.destinationAccount}`,
        createdBy: actor.id,
        lines: [
          { account: { kind: "user_available", ownerUserId: userId }, debit: input.amount },
          { account: { kind: "user_reserved", ownerUserId: userId }, credit: input.amount },
        ],
      });
      await tx.insert(withdrawalEvents).values({ withdrawalId: w.id, fromStatus: null, toStatus: "PENDING_REVIEW", actorId: actor.id, note: "Diajukan" });
      await notifyAdmins("withdrawal", "Penarikan baru", `${u.storeName || u.name}: ${formatRupiah(input.amount)} (${env})`, { env, href: "/admin/penarikan" }, tx);
      await audit(actor, "withdrawal.request", { type: "withdrawal", id: w.id }, { amount: input.amount, env }, tx);
      return w;
    });
  } catch (e) {
    if (isUniqueViolation(e) && input.idempotencyKey) {
      const ex = await db.select().from(withdrawals).where(and(eq(withdrawals.userId, userId), eq(withdrawals.env, env), eq(withdrawals.idempotencyKey, input.idempotencyKey)));
      if (ex[0]) return ex[0];
    }
    throw e;
  }
}

type ReviewAction =
  | { action: "approve" }
  | { action: "reject"; reason: string }
  | { action: "processing" }
  | { action: "paid"; proofReference: string; proofNote?: string }
  | { action: "failed"; reason: string }
  | { action: "uncertain"; reason: string };

export async function reviewWithdrawal(admin: Actor, id: string, act: ReviewAction): Promise<Withdrawal> {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(withdrawals).where(eq(withdrawals.id, id)).for("update");
    const w = rows[0];
    if (!w) throw notFound("Penarikan");
    const to: WithdrawalStatus = { approve: "APPROVED", reject: "REJECTED", processing: "PROCESSING", paid: "PAID", failed: "FAILED", uncertain: "UNCERTAIN" }[act.action] as WithdrawalStatus;
    if (!ALLOWED[w.status].includes(to)) throw new AppError("invalid_transition", `Status ${WITHDRAWAL_LABEL[w.status]} tidak dapat diubah menjadi ${WITHDRAWAL_LABEL[to]}`, 409);
    let note = "";
    const patch: Partial<Withdrawal> = { status: to, reviewedBy: admin.id, reviewedAt: new Date(), updatedAt: new Date() };

    if (act.action === "reject" || act.action === "failed") {
      if (act.reason.trim().length < 3) throw new AppError("reason_required", "Alasan wajib diisi");
      if (act.action === "failed" && w.status === "UNCERTAIN" && !/konfirm|tidak terkirim|gagal/i.test(act.reason)) {
        throw new AppError("reconcile_first", "Status tidak pasti: tulis hasil konfirmasi ke bank/provider (mis. 'dikonfirmasi tidak terkirim') sebelum menandai gagal.");
      }
      note = act.reason.trim();
      patch.rejectReason = note;
      await postJournal(tx, {
        env: w.env,
        type: "withdrawal_release",
        idempotencyKey: `withdrawal:${w.id}:release`,
        referenceType: "withdrawal",
        referenceId: w.id,
        memo: `Penarikan ${act.action === "reject" ? "ditolak" : "gagal"}: saldo dikembalikan`,
        createdBy: admin.id,
        lines: [
          { account: { kind: "user_reserved", ownerUserId: w.userId }, debit: w.amount },
          { account: { kind: "user_available", ownerUserId: w.userId }, credit: w.amount },
        ],
      });
      await notifyUser(w.userId, "withdrawal", act.action === "reject" ? "Penarikan ditolak" : "Penarikan gagal", `${formatRupiah(w.amount)} dikembalikan ke saldo tersedia. Alasan: ${note}`, { href: "/app/penarikan", env: w.env }, tx);
      await emitMerchantEvent(tx, w.userId, w.env, "withdrawal.rejected", { id: w.id, amount: Number(w.amount), reason: note, status: to });
    }
    if (act.action === "paid") {
      if (act.proofReference.trim().length < 4) throw new AppError("proof_required", "Nomor referensi bukti transfer wajib diisi");
      patch.proofReference = act.proofReference.trim();
      patch.proofNote = act.proofNote?.trim() ?? null;
      patch.paidAt = new Date();
      note = `Bukti: ${patch.proofReference}`;
      const lines = [
        { account: { kind: "user_reserved" as const, ownerUserId: w.userId }, debit: w.amount },
        { account: { kind: "settlement_bank" as const }, credit: w.net },
      ];
      if (w.fee > 0n) lines.push({ account: { kind: "platform_fee" as const }, credit: w.fee } as never);
      await postJournal(tx, { env: w.env, type: "withdrawal_paid", idempotencyKey: `withdrawal:${w.id}:paid`, referenceType: "withdrawal", referenceId: w.id, memo: `Pencairan ${w.destinationBank} ${w.destinationAccount} (${patch.proofReference})`, createdBy: admin.id, lines });
      await notifyUser(w.userId, "withdrawal", "Penarikan dicairkan", `${formatRupiah(w.net)} dikirim ke ${w.destinationBank} ${w.destinationAccount}`, { href: "/app/penarikan", env: w.env }, tx);
      await emitMerchantEvent(tx, w.userId, w.env, "withdrawal.paid", { id: w.id, amount: Number(w.amount), net: Number(w.net), proof_reference: patch.proofReference });
    }
    if (act.action === "uncertain") {
      note = act.reason;
      await notifyAdmins("withdrawal", "Penarikan perlu rekonsiliasi", `${formatRupiah(w.amount)}: ${act.reason}`, { env: w.env, href: "/admin/penarikan" }, tx);
    }
    if (act.action === "approve") note = "Disetujui untuk pencairan manual";
    const [u] = await tx.update(withdrawals).set(patch).where(eq(withdrawals.id, w.id)).returning();
    await tx.insert(withdrawalEvents).values({ withdrawalId: w.id, fromStatus: w.status, toStatus: to, actorId: admin.id, note });
    await audit(admin, `withdrawal.${act.action}`, { type: "withdrawal", id: w.id }, { note, amount: w.amount }, tx);
    return u;
  });
}
