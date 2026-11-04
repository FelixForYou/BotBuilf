/**
 * TEST HARNESS LOKAL (khusus Sandbox, khusus admin).
 * Membuat pasangan kunci RSA milik FxB Pay sendiri untuk menandatangani notifikasi simulasi
 * dengan format Finish Notify DANA. Kunci ini HANYA diterima oleh endpoint notify sandbox
 * — endpoint production tidak pernah memuatnya, sehingga simulasi tidak dapat menambah saldo production.
 */
import "server-only";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { encrypt } from "../crypto";
import { getSetting, setSetting } from "../settings";
import { AppError } from "../errors";
import { jakartaTimestamp, signB2B } from "../dana/signature";
import { notifyPath } from "../dana/config";
import { HARNESS_MERCHANT_ID, handleDanaNotify, harnessPrivateKey } from "../dana/notify";
import { toDanaValue } from "../money";

export async function ensureHarnessKey() {
  const h = await getSetting("harness");
  if (h.privateKeyEnc && h.publicKey) return;
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
  await setSetting("harness", { privateKeyEnc: encrypt(privateKey), publicKey }, null);
}

export function buildFinishNotify(p: { partnerReferenceNo: string; amount: bigint; status: "00" | "05"; merchantId?: string; currency?: string; amountValue?: string }) {
  const now = jakartaTimestamp();
  return {
    originalPartnerReferenceNo: p.partnerReferenceNo,
    originalReferenceNo: `HARNESS${randomUUID().replace(/-/g, "").slice(0, 20)}`,
    merchantId: p.merchantId ?? HARNESS_MERCHANT_ID,
    amount: { value: p.amountValue ?? toDanaValue(p.amount), currency: p.currency ?? "IDR" },
    latestTransactionStatus: p.status,
    transactionStatusDesc: p.status === "00" ? "SUCCESS" : "CLOSED",
    createdTime: now,
    finishedTime: now,
    additionalInfo: p.status === "00" ? { paidTime: now } : { extendInfoClosedReason: "EXPIRED" },
  };
}

/** Kirim notifikasi bertanda tangan harness melalui jalur verifikasi yang SAMA dengan notifikasi DANA asli. */
export async function sendHarnessNotify(payload: object, opts: { signWith?: string; tamperBody?: boolean } = {}) {
  await ensureHarnessKey();
  const key = opts.signWith ?? (await harnessPrivateKey());
  if (!key) throw new AppError("harness_missing", "Kunci harness belum dibuat");
  const path = notifyPath("sandbox");
  const body = JSON.stringify(payload);
  const ts = jakartaTimestamp();
  const signature = signB2B("POST", path, body, ts, key);
  const sent = opts.tamperBody ? body.replace(/"value":"(\d+)/, (_m, d) => `"value":"${BigInt(d) + 1n}`) : body;
  const headers = new Headers({ "content-type": "application/json", "x-timestamp": ts, "x-signature": signature, "x-partner-id": "FXB-HARNESS", "x-external-id": randomUUID() });
  const res = await handleDanaNotify("sandbox", "POST", path, headers, sent);
  return { request: { path, headers: { "x-timestamp": ts, "x-signature": "[disensor]" }, body: JSON.parse(sent) }, response: res };
}
