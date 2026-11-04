/**
 * Konstanta resmi Payment Gateway DANA (SNAP), bersumber dari SDK resmi dana-node v2.2.2
 * dan https://dashboard.dana.id/api-docs-v2/. Jangan menambah endpoint/status yang tidak terdokumentasi.
 */
export const DANA_BASE_URL = {
  sandbox: "https://api.sandbox.dana.id",
  production: "https://api.saas.dana.id",
} as const;

export const DANA_PATHS = {
  createOrder: "/payment-gateway/v1.0/debit/payment-host-to-host.htm",
  queryPayment: "/payment-gateway/v1.0/debit/status.htm",
  cancelOrder: "/payment-gateway/v1.0/debit/cancel.htm",
  refundOrder: "/payment-gateway/v1.0/debit/refund.htm",
  consultPay: "/v1.0/payment-gateway/consult-pay.htm",
} as const;

/** serviceCode untuk Query Payment pada produk Payment Gateway. */
export const PG_SERVICE_CODE = "54";

/** latestTransactionStatus (Query Payment & Finish Notify). */
export const DANA_TX_STATUS = {
  "00": "Success — pesanan sudah dibayar (final)",
  "01": "Initiated — pesanan dibuat, belum dibayar",
  "02": "Paying — sedang diproses, belum final",
  "05": "Cancelled — pesanan ditutup/kedaluwarsa",
  "07": "Not found — pesanan tidak ditemukan",
} as const;
export type DanaTxStatus = keyof typeof DANA_TX_STATUS;

/** Pemetaan status DANA → status internal FxB Pay. */
export function mapDanaStatus(s: string): "PAID" | "PENDING" | "CANCELLED_OR_EXPIRED" | "NOT_FOUND" | "UNKNOWN" {
  switch (s) {
    case "00":
      return "PAID";
    case "01":
    case "02":
      return "PENDING";
    case "05":
      return "CANCELLED_OR_EXPIRED";
    case "07":
      return "NOT_FOUND";
    default:
      return "UNKNOWN";
  }
}

/** SNAP responseCode = HTTP(3) + serviceCode(2) + caseCode(2). 2xx = sukses; 202 = diterima/diproses. */
export function isSnapSuccess(code?: string): boolean {
  return !!code && /^200\d{4}$/.test(code);
}
export function isSnapAccepted(code?: string): boolean {
  return !!code && /^202\d{4}$/.test(code);
}

/** Respons yang dikembalikan FxB Pay ke DANA untuk Finish Notify (serviceCode 56). */
export const NOTIFY_ACK_SUCCESS = { responseCode: "2005600", responseMessage: "Successful" };
export const NOTIFY_ACK_BAD_SIGNATURE = { responseCode: "4015600", responseMessage: "Unauthorized. Invalid Signature" };
export const NOTIFY_ACK_BAD_REQUEST = { responseCode: "4005600", responseMessage: "Bad Request" };
export const NOTIFY_ACK_INTERNAL = { responseCode: "5005600", responseMessage: "Internal Server Error" };

export const DANA_MERCHANT_PORTAL_URL = "https://dashboard.dana.id/";
export const DANA_DOCS_URL = "https://dashboard.dana.id/api-docs-v2/";
export const DANA_UAT_SCRIPT_URL = "https://github.com/dana-id/uat-script";
export const DANA_NOTIFY_SKEW_MS = 7 * 24 * 3600_000;

/** Batas validUpTo: Sandbox maks 30 menit (validasi SDK), Production maks 7 hari (dokumentasi). */
export const VALID_UP_TO_MAX_MS = { sandbox: 30 * 60_000, production: 7 * 24 * 3600_000 } as const;
