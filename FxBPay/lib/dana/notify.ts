/**
 * Penerima Finish Notify DANA.
 * 1. Simpan notifikasi mentah (header disensor) untuk audit & monitoring.
 * 2. Verifikasi X-SIGNATURE (RSA-SHA256) dengan public key DANA env terkait.
 *    Sandbox juga menerima kunci "test harness lokal" (dibuat server, hanya untuk admin di pusat UAT).
 *    Production HANYA menerima public key DANA production.
 * 3. Cocokkan merchant, referensi, nominal, mata uang, status → terapkan secara idempoten.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { providerNotifications } from "../db/schema";
import { sha256Hex, decrypt } from "../crypto";
import { redactHeaders } from "../redact";
import { getSetting } from "../settings";
import { notifyAdmins } from "../notify";
import { applyProviderResult, type ApplyOutcome } from "../payments/service";
import type { Env } from "../ledger";
import { loadDanaConfig } from "./config";
import { DANA_NOTIFY_SKEW_MS, NOTIFY_ACK_BAD_REQUEST, NOTIFY_ACK_BAD_SIGNATURE, NOTIFY_ACK_INTERNAL, NOTIFY_ACK_SUCCESS } from "./constants";
import { DANA_SANDBOX_PUBLIC_KEY, timestampWithin, verifyB2B } from "./signature";

export const HARNESS_MERCHANT_ID = "FXB-LOCAL-HARNESS";

export type NotifyResult = { httpStatus: number; body: typeof NOTIFY_ACK_SUCCESS; outcome: string; notificationId: string };

type FinishNotify = {
  originalPartnerReferenceNo?: string;
  originalReferenceNo?: string;
  merchantId?: string;
  amount?: { value?: string; currency?: string };
  latestTransactionStatus?: string;
  transactionStatusDesc?: string;
  finishedTime?: string;
  additionalInfo?: { paidTime?: string };
};

async function verificationKeys(env: Env): Promise<{ label: "dana" | "local_harness"; key: string; merchantId: string | null }[]> {
  const cfg = await loadDanaConfig(env).catch(() => null);
  const keys: { label: "dana" | "local_harness"; key: string; merchantId: string | null }[] = [];
  if (env === "production") {
    if (cfg?.danaPublicKey) keys.push({ label: "dana", key: cfg.danaPublicKey, merchantId: cfg.merchantId });
    return keys;
  }
  keys.push({ label: "dana", key: cfg?.danaPublicKey ?? DANA_SANDBOX_PUBLIC_KEY, merchantId: cfg?.merchantId ?? null });
  const harness = await getSetting("harness");
  if (harness.publicKey) keys.push({ label: "local_harness", key: harness.publicKey, merchantId: HARNESS_MERCHANT_ID });
  return keys;
}

export async function handleDanaNotify(env: Env, method: string, path: string, headers: Headers, rawBody: string): Promise<NotifyResult> {
  const sig = headers.get("x-signature") ?? "";
  const ts = headers.get("x-timestamp") ?? "";
  const [rec] = await db
    .insert(providerNotifications)
    .values({ env, path, headers: redactHeaders(headers), body: rawBody.slice(0, 20000), bodyHash: sha256Hex(rawBody), signatureValid: false, outcome: "received" })
    .returning({ id: providerNotifications.id });
  const finish = async (httpStatus: number, body: typeof NOTIFY_ACK_SUCCESS, outcome: string, patch: Partial<typeof providerNotifications.$inferInsert> = {}) => {
    await db.update(providerNotifications).set({ outcome, ...patch }).where(eq(providerNotifications.id, rec.id));
    return { httpStatus, body, outcome, notificationId: rec.id };
  };

  let verified: { label: "dana" | "local_harness"; merchantId: string | null } | null = null;
  try {
    for (const k of await verificationKeys(env)) {
      if (verifyB2B(method, path, rawBody, ts, sig, k.key)) {
        verified = { label: k.label, merchantId: k.merchantId };
        break;
      }
    }
  } catch {
    verified = null;
  }
  if (!verified) {
    if (env === "production") await notifyAdmins("integration", "Notifikasi DANA ditolak", "Signature tidak valid atau public key production belum diatur", { env, href: "/admin/dana" });
    return finish(401, NOTIFY_ACK_BAD_SIGNATURE, "invalid_signature", { detail: sig ? "Signature tidak cocok" : "Header X-SIGNATURE/X-TIMESTAMP tidak ada" });
  }
  if (!timestampWithin(ts, DANA_NOTIFY_SKEW_MS)) {
    return finish(400, NOTIFY_ACK_BAD_REQUEST, "stale_timestamp", { signatureValid: true, verifiedWith: verified.label, detail: `X-TIMESTAMP di luar toleransi: ${ts}` });
  }

  let n: FinishNotify;
  try {
    n = JSON.parse(rawBody);
  } catch {
    return finish(400, NOTIFY_ACK_BAD_REQUEST, "invalid_json", { signatureValid: true, verifiedWith: verified.label });
  }
  const ref = n.originalPartnerReferenceNo;
  if (!ref || !n.latestTransactionStatus || !n.amount?.value || !n.amount?.currency) {
    return finish(400, NOTIFY_ACK_BAD_REQUEST, "missing_fields", { signatureValid: true, verifiedWith: verified.label, partnerReferenceNo: ref ?? null, detail: "Field wajib tidak lengkap" });
  }

  try {
    const { outcome, payment } = await db.transaction((tx) =>
      applyProviderResult(
        tx,
        { env, partnerReferenceNo: ref },
        {
          status: n.latestTransactionStatus!,
          amountValue: n.amount!.value,
          currency: n.amount!.currency,
          merchantId: n.merchantId ?? "",
          referenceNo: n.originalReferenceNo ?? null,
          paidTime: n.additionalInfo?.paidTime ?? (n.latestTransactionStatus === "00" ? n.finishedTime : null) ?? null,
          desc: n.transactionStatusDesc,
        },
        verified!.label === "local_harness" ? "uat" : "webhook",
        verified!.merchantId,
      ),
    );
    if (outcome === "not_found") {
      await notifyAdmins("integration", "Notifikasi untuk referensi tidak dikenal", `${env}: ${ref}`, { env, href: "/admin/dana" });
    }
    const ok: ApplyOutcome[] = ["credited", "duplicate", "status_updated", "ignored_out_of_order", "not_found", "amount_mismatch", "currency_mismatch", "merchant_mismatch", "unknown_status"];
    // Signature valid → kirim ACK sukses agar DANA berhenti retry; kasus tidak cocok ditahan untuk tinjauan admin.
    return finish(ok.includes(outcome) ? 200 : 500, NOTIFY_ACK_SUCCESS, outcome, { signatureValid: true, verifiedWith: verified.label, partnerReferenceNo: ref, paymentId: payment?.id ?? null });
  } catch (e) {
    // Error internal → 5xx agar DANA mengirim ulang; pemrosesan idempoten.
    return finish(500, NOTIFY_ACK_INTERNAL, "internal_error", { signatureValid: true, verifiedWith: verified.label, partnerReferenceNo: ref, detail: (e as Error).message.slice(0, 500) });
  }
}

export async function harnessPrivateKey(): Promise<string | null> {
  const h = await getSetting("harness");
  return h.privateKeyEnc ? decrypt(h.privateKeyEnc) : null;
}
