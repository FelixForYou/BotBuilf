import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { getOwnedPayment } from "@/lib/payments/access";
import { lockPayment, paymentPayload, transition } from "@/lib/payments/service";
import { loadDanaConfig } from "@/lib/dana/config";
import { DanaClient } from "@/lib/dana/client";
import { isSnapSuccess } from "@/lib/dana/constants";
import { AppError } from "@/lib/errors";
import { emitMerchantEvent } from "@/lib/webhooks-out";
import { audit } from "@/lib/audit";

export const POST = authed<Record<string, never>, { id: string }>({}, async ({ auth, actor, params }) => {
  const p = await getOwnedPayment(auth, params.id);
  if (!["CREATED", "PENDING"].includes(p.status)) throw new AppError("not_cancellable", "Pembayaran ini tidak dapat dibatalkan", 409);
  if (p.provider === "dana" && (p.providerRedirectUrl || p.providerPaymentCode || p.providerReferenceNo)) {
    const cfg = await loadDanaConfig(p.env);
    if (!cfg) throw new AppError("not_configured", "Integrasi belum dikonfigurasi", 503);
    const r = await new DanaClient(cfg).cancelOrder({ partnerReferenceNo: p.partnerReferenceNo, reason: "Dibatalkan merchant" });
    if (!isSnapSuccess(r.responseCode ?? "")) throw new AppError("provider_rejected", `DANA menolak pembatalan (${r.responseCode ?? r.error}). Bisa jadi pembayaran sudah diproses — cek status.`, 409);
  }
  await db.transaction(async (tx) => {
    const locked = await lockPayment(tx, p.id);
    const u = await transition(tx, locked, "CANCELLED", auth.user.role === "admin" ? "admin" : "dashboard", "Dibatalkan oleh merchant");
    await emitMerchantEvent(tx, u.userId, u.env, "payment.cancelled", paymentPayload(u));
    await audit(actor, "payment.cancel", { type: "payment", id: p.id }, {}, tx);
  });
  return { message: "Pembayaran dibatalkan" };
});
