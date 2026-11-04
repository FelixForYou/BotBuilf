/**
 * Ledger double-entry immutable.
 *
 * Akun normal-kredit (liabilitas/pendapatan): saldo = Σkredit − Σdebit.
 * Akun normal-debit (aset): saldo = Σdebit − Σkredit.
 * Saldo akun di-cache pada ledger_accounts.balance dan diperbarui DI DALAM transaksi yang sama,
 * setelah baris akun dikunci `FOR UPDATE` dengan urutan deterministik (mencegah deadlock).
 * CHECK constraint `ledger_accounts_nonneg` menolak saldo negatif secara atomik.
 * idempotency_key unik per jurnal → posting ulang (webhook duplikat, retry) tidak menggandakan saldo.
 */
import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { DbOrTx, Tx } from "./db";
import { ledgerAccounts, ledgerEntries, ledgerJournals, type AccountKind } from "./db/schema";
import { InsufficientFundsError, isCheckViolation } from "./errors";

export type Env = "sandbox" | "production";

const DEBIT_NORMAL: AccountKind[] = ["provider_clearing", "settlement_bank"];
const ALLOW_NEGATIVE: AccountKind[] = ["platform_adjustment", "provider_clearing", "settlement_bank"];
const USER_KINDS: AccountKind[] = ["user_available", "user_held", "user_reserved"];

export type AccountRef = { kind: AccountKind; ownerUserId?: string | null };
export type Line = { account: AccountRef; debit?: bigint; credit?: bigint };

export async function ensureAccount(tx: DbOrTx, env: Env, ref: AccountRef): Promise<string> {
  const owner = USER_KINDS.includes(ref.kind) ? ref.ownerUserId ?? null : null;
  if (USER_KINDS.includes(ref.kind) && !owner) throw new Error(`Akun ${ref.kind} memerlukan pemilik`);
  const where = and(eq(ledgerAccounts.env, env), eq(ledgerAccounts.kind, ref.kind), owner ? eq(ledgerAccounts.ownerUserId, owner) : isNull(ledgerAccounts.ownerUserId));
  const found = await tx.select({ id: ledgerAccounts.id }).from(ledgerAccounts).where(where).limit(1);
  if (found[0]) return found[0].id;
  await tx
    .insert(ledgerAccounts)
    .values({
      env,
      kind: ref.kind,
      ownerUserId: owner,
      normalSide: DEBIT_NORMAL.includes(ref.kind) ? "debit" : "credit",
      allowNegative: ALLOW_NEGATIVE.includes(ref.kind),
    })
    .onConflictDoNothing();
  const again = await tx.select({ id: ledgerAccounts.id }).from(ledgerAccounts).where(where).limit(1);
  return again[0].id;
}

export type PostJournalInput = {
  env: Env;
  type: string;
  idempotencyKey: string;
  referenceType: string;
  referenceId: string;
  memo?: string;
  createdBy?: string | null;
  lines: Line[];
};

export type PostResult = { journalId: string; duplicate: boolean };

/**
 * Wajib dipanggil di dalam transaksi (tx). Melempar InsufficientFundsError jika ada akun
 * non-negatif yang akan minus — seluruh transaksi lalu di-rollback oleh pemanggil.
 */
export async function postJournal(tx: Tx, input: PostJournalInput): Promise<PostResult> {
  if (input.lines.length < 2) throw new Error("Jurnal memerlukan minimal dua baris");
  let td = 0n, tc = 0n;
  for (const l of input.lines) {
    const d = l.debit ?? 0n, c = l.credit ?? 0n;
    if (d < 0n || c < 0n || (d > 0n) === (c > 0n)) throw new Error("Setiap baris jurnal harus tepat satu sisi bernilai positif");
    td += d;
    tc += c;
  }
  if (td !== tc) throw new Error(`Jurnal tidak seimbang: debit ${td} ≠ kredit ${tc}`);

  const inserted = await tx
    .insert(ledgerJournals)
    .values({
      env: input.env,
      type: input.type,
      idempotencyKey: input.idempotencyKey,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      memo: input.memo ?? "",
      createdBy: input.createdBy ?? null,
    })
    .onConflictDoNothing({ target: ledgerJournals.idempotencyKey })
    .returning({ id: ledgerJournals.id });
  if (!inserted[0]) {
    const existing = await tx.select({ id: ledgerJournals.id }).from(ledgerJournals).where(eq(ledgerJournals.idempotencyKey, input.idempotencyKey));
    return { journalId: existing[0].id, duplicate: true };
  }
  const journalId = inserted[0].id;

  const ids: string[] = [];
  for (const l of input.lines) ids.push(await ensureAccount(tx, input.env, l.account));
  const unique = [...new Set(ids)].sort();
  const locked = await tx.execute<{ id: string; normal_side: "debit" | "credit" }>(
    sql`SELECT id, normal_side FROM ledger_accounts WHERE id IN (${sql.join(unique.map((u) => sql`${u}::uuid`), sql`, `)}) ORDER BY id FOR UPDATE`,
  );
  const side = new Map(locked.rows.map((r) => [r.id, r.normal_side]));

  try {
    for (let i = 0; i < input.lines.length; i++) {
      const l = input.lines[i];
      const accountId = ids[i];
      const d = l.debit ?? 0n, c = l.credit ?? 0n;
      const delta = side.get(accountId) === "debit" ? d - c : c - d;
      const upd = await tx
        .update(ledgerAccounts)
        .set({ balance: sql`${ledgerAccounts.balance} + ${delta.toString()}::bigint` })
        .where(eq(ledgerAccounts.id, accountId))
        .returning({ balance: ledgerAccounts.balance });
      await tx.insert(ledgerEntries).values({ journalId, accountId, debit: d, credit: c, balanceAfter: upd[0].balance });
    }
  } catch (e) {
    if (isCheckViolation(e, "ledger_accounts_nonneg")) throw new InsufficientFundsError();
    throw e;
  }
  return { journalId, duplicate: false };
}

export type UserBalances = { available: bigint; held: bigint; reserved: bigint };

export async function getUserBalances(tx: DbOrTx, userId: string, env: Env): Promise<UserBalances> {
  const rows = await tx
    .select({ kind: ledgerAccounts.kind, balance: ledgerAccounts.balance })
    .from(ledgerAccounts)
    .where(and(eq(ledgerAccounts.ownerUserId, userId), eq(ledgerAccounts.env, env)));
  const b: UserBalances = { available: 0n, held: 0n, reserved: 0n };
  for (const r of rows) {
    if (r.kind === "user_available") b.available = r.balance;
    if (r.kind === "user_held") b.held = r.balance;
    if (r.kind === "user_reserved") b.reserved = r.balance;
  }
  return b;
}

export async function getSystemBalances(tx: DbOrTx, env: Env) {
  const rows = await tx.execute<{ kind: AccountKind; total: string }>(
    sql`SELECT kind, coalesce(sum(balance),0)::text AS total FROM ledger_accounts WHERE env = ${env} GROUP BY kind`,
  );
  const out = Object.fromEntries(rows.rows.map((r) => [r.kind, BigInt(r.total)])) as Partial<Record<AccountKind, bigint>>;
  const v = (k: AccountKind) => out[k] ?? 0n;
  return {
    userAvailable: v("user_available"),
    userHeld: v("user_held"),
    userReserved: v("user_reserved"),
    platformFee: v("platform_fee"),
    providerClearing: v("provider_clearing"),
    settlementBank: v("settlement_bank"),
    platformAdjustment: v("platform_adjustment"),
  };
}

/**
 * Verifikasi integritas: (1) cache saldo = jumlah entri; (2) semua jurnal seimbang;
 * (3) persamaan akuntansi: aset = liabilitas + pendapatan + ekuitas.
 */
export async function verifyLedgerIntegrity(tx: DbOrTx, env: Env) {
  const drift = await tx.execute<{ id: string; kind: string; balance: string; computed: string }>(sql`
    SELECT a.id, a.kind, a.balance::text, (CASE WHEN a.normal_side='debit' THEN coalesce(sum(e.debit-e.credit),0) ELSE coalesce(sum(e.credit-e.debit),0) END)::text AS computed
    FROM ledger_accounts a LEFT JOIN ledger_entries e ON e.account_id = a.id
    WHERE a.env = ${env} GROUP BY a.id HAVING a.balance <> (CASE WHEN a.normal_side='debit' THEN coalesce(sum(e.debit-e.credit),0) ELSE coalesce(sum(e.credit-e.debit),0) END)`);
  const unbalanced = await tx.execute<{ journal_id: string }>(sql`
    SELECT e.journal_id FROM ledger_entries e JOIN ledger_journals j ON j.id = e.journal_id
    WHERE j.env = ${env} GROUP BY e.journal_id HAVING sum(e.debit) <> sum(e.credit)`);
  const s = await getSystemBalances(tx, env);
  const assets = s.providerClearing + s.settlementBank;
  const claims = s.userAvailable + s.userHeld + s.userReserved + s.platformFee + s.platformAdjustment;
  return {
    ok: drift.rows.length === 0 && unbalanced.rows.length === 0 && assets === claims,
    balanceDrift: drift.rows,
    unbalancedJournals: unbalanced.rows.map((r) => r.journal_id),
    assets,
    claims,
  };
}
