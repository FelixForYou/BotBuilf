import { and, desc, eq } from "drizzle-orm";
import { merchantRoute } from "@/lib/merchant-api";
import { db } from "@/lib/db";
import { ledgerAccounts, ledgerEntries, ledgerJournals } from "@/lib/db/schema";

/** Mutasi saldo (entri ledger) milik pemanggil saja. */
export const GET = merchantRoute("transactions:read", async ({ req, caller }) => {
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 50) || 50));
  const rows = await db
    .select({ id: ledgerEntries.id, account: ledgerAccounts.kind, debit: ledgerEntries.debit, credit: ledgerEntries.credit, balance: ledgerEntries.balanceAfter, type: ledgerJournals.type, ref_type: ledgerJournals.referenceType, ref: ledgerJournals.referenceId, memo: ledgerJournals.memo, at: ledgerEntries.createdAt })
    .from(ledgerEntries)
    .innerJoin(ledgerAccounts, eq(ledgerAccounts.id, ledgerEntries.accountId))
    .innerJoin(ledgerJournals, eq(ledgerJournals.id, ledgerEntries.journalId))
    .where(and(eq(ledgerAccounts.ownerUserId, caller.userId), eq(ledgerAccounts.env, caller.env)))
    .orderBy(desc(ledgerEntries.id))
    .limit(limit);
  return {
    body: {
      data: rows.map((r) => ({ id: r.id, account: r.account.replace("user_", ""), amount: Number(r.credit - r.debit), balance_after: Number(r.balance), type: r.type, reference_type: r.ref_type, reference_id: r.ref, memo: r.memo, created_at: r.at.toISOString() })),
    },
  };
});
