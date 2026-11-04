import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { ledgerAccounts, ledgerEntries, ledgerJournals } from "./db/schema";
import type { Env } from "./ledger";

export const JOURNAL_LABEL: Record<string, string> = {
  payment_capture: "Pembayaran diterima",
  hold_release: "Saldo tertahan dilepas",
  withdrawal_reserve: "Penarikan dicadangkan",
  withdrawal_release: "Cadangan penarikan dikembalikan",
  withdrawal_paid: "Penarikan dicairkan",
  refund_reserve: "Refund dicadangkan",
  refund_complete: "Refund selesai",
  refund_release: "Cadangan refund dikembalikan",
  admin_adjustment: "Koreksi admin",
  reversal: "Reversal",
  settlement: "Settlement DANA",
};
export const ACCOUNT_LABEL: Record<string, string> = {
  user_available: "Tersedia",
  user_held: "Tertahan",
  user_reserved: "Dicadangkan",
  platform_fee: "Biaya platform",
  provider_clearing: "Piutang DANA",
  settlement_bank: "Rekening settlement",
  platform_adjustment: "Penyesuaian",
};

export async function userEntries(userId: string, env: Env, limit = 50, offset = 0) {
  return db
    .select({ id: ledgerEntries.id, kind: ledgerAccounts.kind, debit: ledgerEntries.debit, credit: ledgerEntries.credit, balanceAfter: ledgerEntries.balanceAfter, type: ledgerJournals.type, memo: ledgerJournals.memo, refType: ledgerJournals.referenceType, refId: ledgerJournals.referenceId, at: ledgerEntries.createdAt })
    .from(ledgerEntries)
    .innerJoin(ledgerAccounts, eq(ledgerAccounts.id, ledgerEntries.accountId))
    .innerJoin(ledgerJournals, eq(ledgerJournals.id, ledgerEntries.journalId))
    .where(and(eq(ledgerAccounts.ownerUserId, userId), eq(ledgerAccounts.env, env)))
    .orderBy(desc(ledgerEntries.id))
    .limit(limit)
    .offset(offset);
}
