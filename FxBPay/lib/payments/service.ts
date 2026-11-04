/**
 * Layanan pembayaran. Semua keputusan finansial terjadi di sini (server).
 * Saldo hanya bertambah lewat `applyProviderResult` — dipanggil dari notifikasi DANA yang
 * signature-nya valid, hasil Query Payment resmi, atau provider DEMO (khusus sandbox).
 * Halaman redirect sukses TIDAK pernah mengubah status.
 */
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, type Tx } from "../db";
import { paymentEvents, payments, users, type PaymentStatus } from "../db/schema";
import { AppError, isUniqueViolation, notFound } from "../errors";
import { postJournal, type Env } from "../ledger";
import { computeFee, formatRupiah, fromDanaValue, MAX_AMOUNT } from "../money";
import { notifyAdmins, notifyUser } from "../notify";
import { getSetting } from "../settings";
import { shortId } from "../crypto";
import { enqueueJob } from "../jobs";
import { emitMerchantEvent } from "../webhooks-out";
import { loadDanaConfig, notifyUrl, returnUrl } from "../dana/config";
import { DanaClient } from "../dana/client";
import { isSnapSuccess, mapDanaStatus, VALID_UP_TO_MAX_MS } from "../dana/constants";
import { canTransition } from "./status";
import { redact } from "../redact";

export type Payment = typeof payments.$inferSelect;
type EventSource = (typeof paymentEvents.$inferInsert)["source"];

export async function lockPayment(tx: Tx, id: string): Promise<Payment> {
  const rows = await tx.select().from(payments).where(eq(payments.id, id)).for("update");
  if (!rows[0]) throw notFound("Pembayaran");
  return rows[0];
}

export async function transition(tx: Tx, p: Payment, to: PaymentStatus, source: EventSource, note = "", extra: Partial<Payment> = {}, providerVerified = false) {
  if (p.status === to && Object.keys(extra).length === 0) return p;
  if (p.status !== to && !canTransition(p.status, to, providerVerified)) {
    throw new AppError("invalid_transition", `Transisi status ${p.status} → ${to} tidak valid`, 409);
  }
  const [updated] = await tx
    .update(payments)
    .set({ ...extra, status: to, updatedAt: new Date() })
    .where(eq(payments.id, p.id))
    .returning();
  if (p.status !== to) await tx.insert(paymentEvents).values({ paymentId: p.id, fromStatus: p.status, toStatus: to, source, note });
  return updated;
}

export async function resolveProvider(env: Env): Promise<"dana" | "demo"> {
  const cfg = await loadDanaConfig(env);
  if (cfg) return "dana";
  if (env === "production") throw new AppError("not_configured", "Integrasi belum dikonfigurasi untuk Production. Hubungi admin.", 503);
  return "demo";
}

export async function assertEnvUsable(env: Env) {
  if (env === "production") {
    const prod = await getSetting("production");
    if (!prod.enabled) throw new AppError("production_disabled", "Mode Production belum diaktifkan oleh admin.", 403);
  }
}

export type CreatePaymentInput = {
  amount: bigint;
  description: string;
  orderRef?: string;
  expiresInMinutes: number;
  customerName?: string;
  customerEmail?: string;
  feeBearer?: "merchant" | "customer";
  purpose?: "payment" | "topup";
  method?: "redirect" | "qris";
  idempotencyKey?: string | null;
  via?: "dashboard" | "api" | "uat";
  providerOverride?: "dana" | "demo";
};

export async function quoteFee(base: bigint, bearer: "merchant" | "customer") {
  const fees = await getSetting("fees");
  const fee = computeFee(base, { flat: BigInt(fees.paymentFlat), bps: fees.paymentBps, min: BigInt(fees.paymentMin) });
  const amount = bearer === "customer" ? base + fee : base;
  return { fee, amount, net: amount - fee };
}

export async function createPayment(userId: string, env: Env, input: CreatePaymentInput): Promise<Payment> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw notFound("Pengguna");
  if (user.status !== "active") throw new AppError("account_frozen", "Akun dibekukan. Hubungi admin.", 403);
  await assertEnvUsable(env);

  if (input.idempotencyKey) {
    const existing = await db.select().from(payments).where(and(eq(payments.userId, userId), eq(payments.env, env), eq(payments.idempotencyKey, input.idempotencyKey)));
    if (existing[0]) return existing[0];
  }

  const limits = await getSetting("limits");
  const fees = await getSetting("fees");
  const base = input.amount;
  if (base < BigInt(limits.paymentMin) || base > BigInt(limits.paymentMax) || base > MAX_AMOUNT) {
    throw new AppError("amount_out_of_range", `Nominal harus antara ${formatRupiah(BigInt(limits.paymentMin))} dan ${formatRupiah(BigInt(limits.paymentMax))}`);
  }
  const provider = input.providerOverride ?? (await resolveProvider(env));
  if (input.providerOverride === "demo" && env === "production") throw new AppError("forbidden", "Provider demo tidak tersedia di Production", 403);
  const maxMinutes = Math.min(limits.linkMaxHours * 60, provider === "dana" ? VALID_UP_TO_MAX_MS[env] / 60_000 : Infinity);
  if (input.expiresInMinutes < 5 || input.expiresInMinutes > maxMinutes) {
    throw new AppError("invalid_expiry", `Masa berlaku harus 5–${maxMinutes} menit${provider === "dana" && env === "sandbox" ? " (DANA Sandbox membatasi maksimal 30 menit)" : ""}`);
  }
  let method = input.method ?? "redirect";
  if (method === "qris") {
    const cfg = provider === "dana" ? await loadDanaConfig(env) : null;
    if (!cfg?.qrisEnabled) throw new AppError("qris_unavailable", "QRIS tidak tersedia: akses QRIS belum diaktifkan pada akun merchant DANA.", 400);
  }
  const bearer = input.feeBearer ?? fees.defaultFeeBearer;
  const q = await quoteFee(base, bearer);
  if (q.net <= 0n) throw new AppError("amount_too_small", "Nominal terlalu kecil dibanding biaya");

  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  try {
    const [p] = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(payments)
        .values({
          publicId: `pl_${shortId(16)}`,
          userId,
          env,
          provider,
          purpose: input.purpose ?? "payment",
          partnerReferenceNo: `FXB${ymd}${shortId(14).toUpperCase()}`,
          orderRef: input.orderRef?.trim() ?? "",
          description: input.description.trim(),
          customerName: input.customerName?.trim() ?? "",
          customerEmail: input.customerEmail?.trim() ?? "",
          baseAmount: base,
          amount: q.amount,
          fee: q.fee,
          net: q.net,
          feeBearer: bearer,
          expiresAt: new Date(now.getTime() + input.expiresInMinutes * 60_000),
          paymentMethod: method,
          idempotencyKey: input.idempotencyKey ?? null,
          createdVia: input.via ?? "dashboard",
        })
        .returning();
      await tx.insert(paymentEvents).values({ paymentId: inserted[0].id, fromStatus: null, toStatus: "CREATED", source: input.via === "api" ? "api" : input.via === "uat" ? "uat" : "dashboard", note: provider === "demo" ? "Provider DEMO (sandbox lokal, tidak memakai DANA)" : "Provider DANA" });
      return inserted;
    });
    return p;
  } catch (e) {
    if (isUniqueViolation(e) && input.idempotencyKey) {
      const existing = await db.select().from(payments).where(and(eq(payments.userId, userId), eq(payments.env, env), eq(payments.idempotencyKey, input.idempotencyKey)));
      if (existing[0]) return existing[0];
    }
    throw e;
  }
}

export type StartCheckoutResult =
  | { kind: "redirect"; url: string }
  | { kind: "qris"; paymentCode: string }
  | { kind: "pending_check"; message: string };

/**
 * Dipanggil saat pembeli menekan "Bayar dengan DANA". Order DANA dibuat sekali (lazy) dan dipakai ulang.
 * Baris pembayaran dikunci agar klik ganda tidak membuat dua order.
 */
export async function startCheckout(publicId: string, clientIp = ""): Promise<StartCheckoutResult> {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(payments).where(eq(payments.publicId, publicId)).for("update");
    const p = rows[0];
    if (!p) throw notFound("Pembayaran");
    if (!["CREATED", "PENDING"].includes(p.status)) throw new AppError("not_payable", "Pembayaran ini tidak dapat dibayar lagi", 409);
    if (p.expiresAt.getTime() - Date.now() < 60_000) throw new AppError("expired", "Link pembayaran sudah kedaluwarsa", 410);
    if (p.providerRedirectUrl) return { kind: "redirect", url: p.providerRedirectUrl };
    if (p.providerPaymentCode) return { kind: "qris", paymentCode: p.providerPaymentCode };
    if (p.providerStatus === "CREATE_UNCERTAIN") return { kind: "pending_check", message: "Pembuatan pesanan DANA sebelumnya belum terkonfirmasi. Kami sedang mengecek statusnya ke DANA, coba lagi sebentar." };

    if (p.provider === "demo") {
      const url = `/pay/${p.publicId}/demo`;
      await transition(tx, p, "PENDING", "demo", "Checkout DEMO dibuka (tanpa DANA)", { providerRedirectUrl: url, providerStatus: "01" });
      return { kind: "redirect", url };
    }

    const cfg = await loadDanaConfig(p.env, tx);
    if (!cfg) throw new AppError("not_configured", "Integrasi belum dikonfigurasi", 503);
    const client = new DanaClient(cfg);
    const orderInput = {
      partnerReferenceNo: p.partnerReferenceNo,
      amount: p.amount,
      validUpTo: p.expiresAt,
      title: p.description,
      returnUrl: returnUrl(p.publicId),
      notifyUrl: notifyUrl(p.env),
    };
    void clientIp;
    const res = p.paymentMethod === "qris" ? await client.createOrderQris(orderInput) : await client.createOrderRedirect(orderInput);

    if (res.outcome !== "response") {
      // Timeout / jaringan: DANA mungkin sudah membuat order. Jangan buat ulang — cek status dulu.
      await tx.update(payments).set({ providerStatus: "CREATE_UNCERTAIN", updatedAt: new Date() }).where(eq(payments.id, p.id));
      await tx.insert(paymentEvents).values({ paymentId: p.id, fromStatus: p.status, toStatus: p.status, source: "system", note: `Create Order DANA tidak pasti: ${res.error}` });
      await enqueueJob("payment.query", { paymentId: p.id }, { tx, runAt: new Date(Date.now() + 30_000), dedupeKey: `query:${p.id}` });
      return { kind: "pending_check", message: "DANA belum merespons. Kami akan mengecek status pesanan secara otomatis." };
    }
    const body = res.body as { responseCode?: string; responseMessage?: string; referenceNo?: string; webRedirectUrl?: string; additionalInfo?: { paymentCode?: string } } | null;
    if (!isSnapSuccess(body?.responseCode)) {
      await transition(tx, p, "FAILED", "system", `Create Order ditolak DANA: ${body?.responseCode ?? res.httpStatus} ${body?.responseMessage ?? ""}`.trim(), { providerStatus: body?.responseCode ?? null });
      await notifyAdmins("integration", "Create Order DANA gagal", `${p.env.toUpperCase()} ${p.partnerReferenceNo}: ${body?.responseCode ?? res.httpStatus} ${body?.responseMessage ?? ""}`, { env: p.env, href: `/admin/transaksi/${p.id}` }, tx);
      throw new AppError("provider_rejected", `DANA menolak pembuatan pesanan (${body?.responseCode ?? res.httpStatus}). Silakan hubungi merchant.`, 502);
    }
    if (p.paymentMethod === "qris") {
      const code = body?.additionalInfo?.paymentCode;
      if (!code) throw new AppError("provider_rejected", "DANA tidak mengembalikan kode QRIS", 502);
      await transition(tx, p, "PENDING", "system", "Order QRIS DANA dibuat", { providerReferenceNo: body?.referenceNo ?? null, providerPaymentCode: code, providerStatus: "01" });
      return { kind: "qris", paymentCode: code };
    }
    if (!body?.webRedirectUrl || !/^https:\/\//.test(body.webRedirectUrl)) throw new AppError("provider_rejected", "DANA tidak mengembalikan URL checkout", 502);
    await transition(tx, p, "PENDING", "system", "Order DANA dibuat (redirect ke DANA)", { providerReferenceNo: body.referenceNo ?? null, providerRedirectUrl: body.webRedirectUrl, providerStatus: "01" });
    return { kind: "redirect", url: body.webRedirectUrl };
  });
}

export type ProviderResult = {
  status: string; // latestTransactionStatus DANA ("00", "05", ...)
  amountValue?: string;
  currency?: string;
  merchantId?: string;
  referenceNo?: string | null;
  paidTime?: string | null;
  desc?: string;
};

export type ApplyOutcome =
  | "credited"
  | "duplicate"
  | "status_updated"
  | "ignored_out_of_order"
  | "amount_mismatch"
  | "currency_mismatch"
  | "merchant_mismatch"
  | "not_found"
  | "unknown_status";

/**
 * Terapkan status terverifikasi dari provider. Idempoten dan aman terhadap callback duplikat,
 * terlambat, dan tidak berurutan. Dijalankan dalam transaksi dengan baris pembayaran terkunci.
 */
export async function applyProviderResult(
  tx: Tx,
  where: { env: Env; partnerReferenceNo: string },
  r: ProviderResult,
  source: "webhook" | "query" | "demo" | "uat",
  expectedMerchantId: string | null,
): Promise<{ outcome: ApplyOutcome; payment: Payment | null }> {
  const rows = await tx.select().from(payments).where(and(eq(payments.env, where.env), eq(payments.partnerReferenceNo, where.partnerReferenceNo))).for("update");
  const p = rows[0];
  if (!p) return { outcome: "not_found", payment: null };

  if (expectedMerchantId !== null && r.merchantId !== undefined && r.merchantId !== expectedMerchantId) {
    await flagReview(tx, p, `Merchant ID tidak cocok (${r.merchantId})`);
    return { outcome: "merchant_mismatch", payment: p };
  }
  const mapped = mapDanaStatus(r.status);
  if (mapped === "PAID") {
    if (r.currency !== undefined && r.currency !== "IDR") {
      await flagReview(tx, p, `Mata uang tidak cocok (${r.currency})`);
      return { outcome: "currency_mismatch", payment: p };
    }
    if (r.amountValue !== undefined) {
      let v: bigint | null = null;
      try {
        v = fromDanaValue(r.amountValue);
      } catch {
        v = null;
      }
      if (v !== p.amount) {
        await flagReview(tx, p, `Nominal tidak cocok: provider ${r.amountValue}, tagihan ${p.amount}`);
        return { outcome: "amount_mismatch", payment: p };
      }
    } else if (source === "webhook") {
      await flagReview(tx, p, "Notifikasi tanpa nominal");
      return { outcome: "amount_mismatch", payment: p };
    }
    if (p.capturedJournalId) return { outcome: "duplicate", payment: p };
    const captured = await capture(tx, p, source, r);
    return { outcome: "credited", payment: captured };
  }
  if (mapped === "CANCELLED_OR_EXPIRED") {
    if (p.status === "CREATED" || p.status === "PENDING") {
      const expired = p.expiresAt.getTime() <= Date.now() + 60_000;
      const to: PaymentStatus = expired ? "EXPIRED" : "CANCELLED";
      const updated = await transition(tx, p, to, source, `DANA: ${r.status} ${r.desc ?? ""}`.trim(), { providerStatus: r.status });
      await emitMerchantEvent(tx, p.userId, p.env, to === "EXPIRED" ? "payment.expired" : "payment.cancelled", paymentPayload(updated));
      return { outcome: "status_updated", payment: updated };
    }
    // Status 05 setelah PAID/terminal → callback tidak berurutan, abaikan.
    return { outcome: "ignored_out_of_order", payment: p };
  }
  if (mapped === "PENDING") {
    if (p.status === "CREATED") {
      const u = await transition(tx, p, "PENDING", source, `DANA: ${r.status}`, { providerStatus: r.status });
      return { outcome: "status_updated", payment: u };
    }
    return { outcome: "ignored_out_of_order", payment: p };
  }
  if (mapped === "NOT_FOUND") return { outcome: "not_found", payment: p };
  return { outcome: "unknown_status", payment: p };
}

async function flagReview(tx: Tx, p: Payment, reason: string) {
  await tx.update(payments).set({ needsReview: true, reviewReason: reason, updatedAt: new Date() }).where(eq(payments.id, p.id));
  await tx.insert(paymentEvents).values({ paymentId: p.id, fromStatus: p.status, toStatus: p.status, source: "system", note: `Ditahan untuk tinjauan: ${reason}` });
  await notifyAdmins("integration", "Pembayaran perlu ditinjau", `${p.partnerReferenceNo}: ${reason}`, { env: p.env, href: `/admin/transaksi/${p.id}` }, tx);
}

async function capture(tx: Tx, p: Payment, source: "webhook" | "query" | "demo" | "uat", r: ProviderResult): Promise<Payment> {
  const fees = await getSetting("fees", tx);
  const holdMs = fees.holdHours * 3600_000;
  const lines = [
    { account: { kind: "provider_clearing" as const }, debit: p.amount },
    { account: { kind: holdMs > 0 ? ("user_held" as const) : ("user_available" as const), ownerUserId: p.userId }, credit: p.net },
  ];
  if (p.fee > 0n) lines.push({ account: { kind: "platform_fee" as const }, credit: p.fee } as never);
  const j = await postJournal(tx, {
    env: p.env,
    type: "payment_capture",
    idempotencyKey: `payment:${p.id}:capture`,
    referenceType: "payment",
    referenceId: p.id,
    memo: `Pembayaran ${p.partnerReferenceNo} (${source})`,
    lines,
  });
  const late = p.status === "EXPIRED" || p.status === "CANCELLED" || p.status === "FAILED";
  const now = new Date();
  const paidAt = r.paidTime && !Number.isNaN(Date.parse(r.paidTime)) ? new Date(r.paidTime) : now;
  const updated = await transition(
    tx,
    p,
    "PAID",
    source,
    late ? `Pembayaran terverifikasi SETELAH status ${p.status} (callback terlambat)` : "Pembayaran terverifikasi",
    {
      capturedJournalId: j.journalId,
      paidAt,
      providerStatus: r.status,
      providerReferenceNo: r.referenceNo ?? p.providerReferenceNo,
      lateCallback: late,
      heldUntil: holdMs > 0 ? new Date(now.getTime() + holdMs) : null,
      releasedAt: holdMs > 0 ? null : now,
      needsReview: late ? true : p.needsReview,
      reviewReason: late ? `Callback terlambat setelah ${p.status}` : p.reviewReason,
    },
    true,
  );
  await tx.insert(paymentEvents).values({ paymentId: p.id, fromStatus: "PAID", toStatus: "PAID", source: "system", note: holdMs > 0 ? `Saldo dicatat sebagai tertahan hingga ${updated.heldUntil?.toISOString()}` : "Saldo dicatat ke saldo tersedia" });
  await notifyUser(p.userId, "payment", p.purpose === "topup" ? "Isi saldo berhasil" : "Pembayaran diterima", `${formatRupiah(p.amount)} — ${p.description}${p.env === "sandbox" ? " (SANDBOX)" : ""}`, { href: `/app/pembayaran/${p.id}`, env: p.env }, tx);
  await emitMerchantEvent(tx, p.userId, p.env, "payment.paid", paymentPayload(updated));
  return updated;
}

export function paymentPayload(p: Payment) {
  return {
    id: p.publicId,
    reference: p.partnerReferenceNo,
    order_ref: p.orderRef,
    env: p.env,
    status: p.status,
    amount: Number(p.amount),
    fee: Number(p.fee),
    net: Number(p.net),
    currency: p.currency,
    description: p.description,
    paid_at: p.paidAt?.toISOString() ?? null,
    expires_at: p.expiresAt.toISOString(),
    refunded_amount: Number(p.refundedAmount),
    created_at: p.createdAt.toISOString(),
  };
}

/** Query Payment resmi ke DANA lalu terapkan hasilnya. */
export async function syncWithProvider(paymentId: string, source: "query" | "uat" = "query") {
  const [p] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!p) throw notFound("Pembayaran");
  if (p.provider !== "dana") return { outcome: "skipped" as const, detail: "Bukan pembayaran DANA" };
  const cfg = await loadDanaConfig(p.env);
  if (!cfg) return { outcome: "skipped" as const, detail: "Integrasi belum dikonfigurasi" };
  const res = await new DanaClient(cfg).queryPayment({ partnerReferenceNo: p.partnerReferenceNo, referenceNo: p.providerReferenceNo });
  if (res.outcome !== "response" || !res.body) throw new Error(res.error ?? "Query DANA gagal");
  const b = res.body;
  if (!isSnapSuccess(b.responseCode)) {
    // 404xx01 transaksi tidak ditemukan → aman untuk mengizinkan pembuatan ulang order dengan referensi sama.
    if (/^404/.test(b.responseCode ?? "") && p.providerStatus === "CREATE_UNCERTAIN") {
      await db.update(payments).set({ providerStatus: null, updatedAt: new Date() }).where(eq(payments.id, p.id));
      return { outcome: "not_found" as const, detail: "Order tidak ditemukan di DANA; pembeli dapat mencoba lagi." };
    }
    return { outcome: "error" as const, detail: `${b.responseCode} ${b.responseMessage}`, response: redact(b) };
  }
  const result = await db.transaction(async (tx) => {
    if (p.providerStatus === "CREATE_UNCERTAIN" && b.latestTransactionStatus && mapDanaStatus(b.latestTransactionStatus) === "PENDING") {
      // Order ada di DANA tetapi URL checkout tidak diketahui → batalkan agar tidak ada order ganda.
      const locked = await lockPayment(tx, p.id);
      await new DanaClient(cfg).cancelOrder({ partnerReferenceNo: p.partnerReferenceNo, reason: "Respons create order hilang (timeout)" });
      await transition(tx, locked, "FAILED", "query", "Order DANA dibatalkan karena respons pembuatan hilang; silakan buat link baru.", { providerStatus: "05" });
      return { outcome: "status_updated" as ApplyOutcome };
    }
    return applyProviderResult(
      tx,
      { env: p.env, partnerReferenceNo: p.partnerReferenceNo },
      { status: b.latestTransactionStatus ?? "", amountValue: b.amount?.value, currency: b.amount?.currency, referenceNo: b.originalReferenceNo, paidTime: b.paidTime, desc: b.transactionStatusDesc },
      source,
      null,
    );
  });
  return { outcome: result.outcome, detail: b.latestTransactionStatus };
}

/** Sapu pembayaran kedaluwarsa. Pembayaran DANA dicek dulu ke provider (bisa saja sudah dibayar). */
export async function sweepExpired(limit = 100) {
  const due = await db.execute<{ id: string; provider: string; provider_reference_no: string | null; provider_redirect_url: string | null; provider_payment_code: string | null }>(sql`
    SELECT id, provider, provider_reference_no, provider_redirect_url, provider_payment_code FROM payments
    WHERE status IN ('CREATED','PENDING') AND expires_at < now() - interval '2 minutes' ORDER BY expires_at LIMIT ${limit}`);
  let expired = 0, queued = 0;
  for (const row of due.rows) {
    const providerOrderExists = row.provider === "dana" && (row.provider_redirect_url || row.provider_payment_code || row.provider_reference_no);
    if (providerOrderExists) {
      await enqueueJob("payment.query", { paymentId: row.id, expireIfOpen: true }, { dedupeKey: `query:${row.id}` });
      queued++;
      continue;
    }
    await db.transaction(async (tx) => {
      const p = await lockPayment(tx, row.id);
      if (p.status !== "CREATED" && p.status !== "PENDING") return;
      if (p.providerStatus === "CREATE_UNCERTAIN") return; // ditangani payment.query
      const u = await transition(tx, p, "EXPIRED", "job", "Masa berlaku habis");
      await emitMerchantEvent(tx, p.userId, p.env, "payment.expired", paymentPayload(u));
      expired++;
    });
  }
  return { expired, queued };
}

/** Lepaskan saldo tertahan → tersedia setelah masa tahan selesai. */
export async function releaseHeldFunds(limit = 200) {
  const due = await db.execute<{ id: string }>(sql`
    SELECT id FROM payments WHERE captured_journal_id IS NOT NULL AND released_at IS NULL AND held_until <= now() ORDER BY held_until LIMIT ${limit}`);
  let released = 0;
  for (const row of due.rows) {
    await db.transaction(async (tx) => {
      const p = await lockPayment(tx, row.id);
      if (p.releasedAt || !p.capturedJournalId) return;
      await postJournal(tx, {
        env: p.env,
        type: "hold_release",
        idempotencyKey: `payment:${p.id}:release`,
        referenceType: "payment",
        referenceId: p.id,
        memo: `Pelepasan saldo tertahan ${p.partnerReferenceNo}`,
        lines: [
          { account: { kind: "user_held", ownerUserId: p.userId }, debit: p.net },
          { account: { kind: "user_available", ownerUserId: p.userId }, credit: p.net },
        ],
      });
      await tx.update(payments).set({ releasedAt: new Date(), updatedAt: new Date() }).where(eq(payments.id, p.id));
      await tx.insert(paymentEvents).values({ paymentId: p.id, fromStatus: p.status, toStatus: p.status, source: "job", note: "Saldo tertahan dilepas ke saldo tersedia" });
      released++;
    });
  }
  return { released };
}
