import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getUserBalances, postJournal, verifyLedgerIntegrity } from "@/lib/ledger";
import { InsufficientFundsError } from "@/lib/errors";
import { makeUser } from "./helpers";

describe("ledger double-entry", () => {
  it("menolak jurnal tidak seimbang", async () => {
    const u = await makeUser();
    await expect(
      db.transaction((tx) => postJournal(tx, { env: "sandbox", type: "t", idempotencyKey: `t-${u.id}`, referenceType: "x", referenceId: "1", lines: [{ account: { kind: "provider_clearing" }, debit: 100n }, { account: { kind: "user_available", ownerUserId: u.id }, credit: 99n }] })),
    ).rejects.toThrow(/tidak seimbang/);
  });

  it("idempoten berdasarkan idempotency key", async () => {
    const u = await makeUser();
    const j = { env: "sandbox" as const, type: "t", idempotencyKey: `idem-${u.id}`, referenceType: "x", referenceId: "1", lines: [{ account: { kind: "provider_clearing" as const }, debit: 500n }, { account: { kind: "user_available" as const, ownerUserId: u.id }, credit: 500n }] };
    const a = await db.transaction((tx) => postJournal(tx, j));
    const b = await db.transaction((tx) => postJournal(tx, j));
    expect(b.duplicate).toBe(true);
    expect(b.journalId).toBe(a.journalId);
    expect((await getUserBalances(db, u.id, "sandbox")).available).toBe(500n);
  });

  it("mencegah saldo negatif secara atomik (rollback penuh)", async () => {
    const u = await makeUser();
    await expect(
      db.transaction((tx) => postJournal(tx, { env: "sandbox", type: "w", idempotencyKey: `neg-${u.id}`, referenceType: "x", referenceId: "1", lines: [{ account: { kind: "user_available", ownerUserId: u.id }, debit: 1n }, { account: { kind: "user_reserved", ownerUserId: u.id }, credit: 1n }] })),
    ).rejects.toBeInstanceOf(InsufficientFundsError);
    const r = await db.execute(sql`SELECT count(*)::int c FROM ledger_journals WHERE idempotency_key = ${`neg-${u.id}`}`);
    expect(r.rows[0].c).toBe(0);
  });

  it("entri & jurnal tidak dapat diubah/dihapus", async () => {
    await expect(db.execute(sql`UPDATE ledger_entries SET debit = debit + 1`)).rejects.toThrow();
    await expect(db.execute(sql`DELETE FROM ledger_journals`)).rejects.toThrow();
  });

  it("sandbox dan production terpisah", async () => {
    const u = await makeUser();
    await db.transaction((tx) => postJournal(tx, { env: "sandbox", type: "t", idempotencyKey: `sep-${u.id}`, referenceType: "x", referenceId: "1", lines: [{ account: { kind: "provider_clearing" }, debit: 700n }, { account: { kind: "user_available", ownerUserId: u.id }, credit: 700n }] }));
    expect((await getUserBalances(db, u.id, "production")).available).toBe(0n);
    expect((await verifyLedgerIntegrity(db, "sandbox")).ok).toBe(true);
  });
});
