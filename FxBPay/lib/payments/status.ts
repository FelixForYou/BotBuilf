import type { PaymentStatus } from "../db/schema";

/**
 * Transisi status internal yang valid.
 * Status "dari provider" (`providerVerified`) mengizinkan EXPIRED/FAILED/CANCELLED → PAID,
 * karena uang sudah diterima DANA (callback terlambat / tidak berurutan) dan wajib dicatat.
 */
const NORMAL: Record<PaymentStatus, PaymentStatus[]> = {
  CREATED: ["PENDING", "PAID", "EXPIRED", "FAILED", "CANCELLED"],
  PENDING: ["PAID", "EXPIRED", "FAILED", "CANCELLED"],
  PAID: ["REFUND_PENDING"],
  REFUND_PENDING: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"],
  PARTIALLY_REFUNDED: ["REFUND_PENDING", "REFUNDED"],
  EXPIRED: [],
  FAILED: [],
  CANCELLED: [],
  REFUNDED: [],
};
const PROVIDER_VERIFIED_EXTRA: Partial<Record<PaymentStatus, PaymentStatus[]>> = {
  EXPIRED: ["PAID"],
  FAILED: ["PAID"],
  CANCELLED: ["PAID"],
};

export function canTransition(from: PaymentStatus, to: PaymentStatus, providerVerified = false): boolean {
  if (NORMAL[from].includes(to)) return true;
  return providerVerified && (PROVIDER_VERIFIED_EXTRA[from] ?? []).includes(to);
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  CREATED: "Dibuat",
  PENDING: "Menunggu pembayaran",
  PAID: "Lunas",
  EXPIRED: "Kedaluwarsa",
  FAILED: "Gagal",
  CANCELLED: "Dibatalkan",
  REFUND_PENDING: "Refund diproses",
  PARTIALLY_REFUNDED: "Refund sebagian",
  REFUNDED: "Direfund",
};

export const STATUS_TONE: Record<PaymentStatus, "mint" | "amber" | "red" | "gray" | "blue"> = {
  CREATED: "gray",
  PENDING: "amber",
  PAID: "mint",
  EXPIRED: "gray",
  FAILED: "red",
  CANCELLED: "gray",
  REFUND_PENDING: "blue",
  PARTIALLY_REFUNDED: "blue",
  REFUNDED: "blue",
};

export const PAID_LIKE: PaymentStatus[] = ["PAID", "REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED"];
export const OPEN_STATUSES: PaymentStatus[] = ["CREATED", "PENDING"];
