/** Operasi ledger khusus admin: jurnal koreksi, reversal, pencatatan settlement, dan rekonsiliasi. */
import "server-only";
import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { ledgerEntries, ledgerJournals, ledgerAccounts, payments, reconciliationRuns, refunds, settlements, users, withdrawals } from "./db/schema";
import { AppError, notFound } from "./errors";
import { getSystemBalances, postJournal, verifyLedgerIntegrity, type Env } from "./ledger";
import { audit, type Actor } from "./audit";
import { notifyAdmins, notifyUser } from "./notify";
import { formatRupiah } from "./money";
import { syncWithProvider } from "./payments/service";

export async function adjustBalance(admin: Actor, input: { userId: string; env: Env; direction: "credit" | "debit"; amount: bigint; reason: string }) {
  if (input.amount <= 0n) throw new AppError("invalid_amount", "Nominal harus lebih dari 0");
  if (input.reason.trim().length < 10) throw new AppError("reason_required", "Alasan koreksi wajib diisi (minimal 10 karakter)");
  const [u] = await db.select().from(users).where(eq(users.id, input.userId));
  if (!u) throw notFound("Pengguna");
  return db.transaction(async (tx) => {
    const id = randomUUID();
    const userLine = { account: { kind: "user_available" as const, ownerUserId: input.userId }, [input.direction]: input.amount };
    const eqLine = { account: { kind: "platform_adjustment" as const }, [input.direction === "credit" ? "debit" : "credit"]: input.amount };
    const j = await postJournal(tx, {
      env: input.env,
      type: "admin_adjustment",
      idempotencyKey: `adjustment:${id}`,
      referenceType: "adjustment",
      referenceId: id,
      memo: `Koreksi admin: ${input.reason.trim()}`,
      createdBy: admin.id,
      lines: [userLine, eqLine],
    });
    await audit(admin, "ledger.adjustment", { type: "user", id: input.userId }, { env: input.env, direction: input.direction, amount: input.amount, reason: input.reason, journalId: j.journalId }, tx);
    await notifyUser(input.userId, "system", "Penyesuaian saldo", `${input.direction === "credit" ? "+" : "−"}${formatRupiah(input.amount)}: ${input.reason}`, { href: "/app/saldo", env: input.env }, tx);
    return j;
  });
}

/** Reversal: jurnal baru yang membalik debit/kredit jurnal asal. Jurnal asal tetap utuh. */
export async function reverseJournal(admin: Actor, journalId: string, reason: string) {
  if (reason.trim().length < 10) throw new AppError("reason_required", "Alasan reversal wajib diisi (minimal 10 karakter)");
  const [j] = await db.select().from(ledgerJournals).where(eq(ledgerJournals.id, journalId));
  if (!j) throw notFound("Jurnal");
  if (j.type === "reversal") throw new AppError("invalid", "Jurnal reversal tidak dapat dibalik lagi; buat koreksi baru.");
  const entries = await db
    .select({ debit: ledgerEntries.debit, credit: ledgerEntries.credit, kind: ledgerAccounts.kind, owner: ledgerAccounts.ownerUserId })
    .from(ledgerEntries)
    .innerJoin(ledgerAccounts, eq(ledgerAccounts.id, ledgerEntries.accountId))
    .where(eq(ledgerEntries.journalId, journalId));
  return db.transaction(async (tx) => {
    const r = await postJournal(tx, {
      env: j.env,
      type: "reversal",
      idempotencyKey: `reversal:${j.id}`,
      referenceType: "journal",
      referenceId: j.id,
      memo: `Reversal ${j.type}: ${reason.trim()}`,
      createdBy: admin.id,
      lines: entries.map((e) => ({ account: { kind: e.kind, ownerUserId: e.owner }, debit: e.credit > 0n ? e.credit : undefined, credit: e.debit > 0n ? e.debit : undefined })),
    });
    if (r.duplicate) throw new AppError("already_reversed", "Jurnal ini sudah pernah dibalik", 409);
    await audit(admin, "ledger.reversal", { type: "journal", id: j.id }, { reason, reversalId: r.journalId }, tx);
    return r;
  });
}

/** Pencatatan settlement dana dari DANA ke rekening bank platform. */
export async function recordSettlement(admin: Actor, input: { env: Env; periodStart: Date; periodEnd: Date; receivedAmount: bigint; bankReference: string; note?: string }) {
  if (input.receivedAmount <= 0n) throw new AppError("invalid_amount", "Nominal settlement harus lebih dari 0");
  if (input.bankReference.trim().length < 3) throw new AppError("reference_required", "Referensi mutasi bank wajib diisi");
  if (input.periodEnd <= input.periodStart) throw new AppError("invalid_period", "Periode tidak valid");
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: payments.id, amount: payments.amount, refunded: payments.refundedAmount })
      .from(payments)
      .where(and(eq(payments.env, input.env), eq(payments.provider, "dana"), isNull(payments.settlementId), gte(payments.paidAt, input.periodStart), lte(payments.paidAt, input.periodEnd), sql`${payments.capturedJournalId} IS NOT NULL`))
      .for("update");
    const expected = rows.reduce((s, r) => s + r.amount - r.refunded, 0n);
    const [s] = await tx
      .insert(settlements)
      .values({ env: input.env, periodStart: input.periodStart, periodEnd: input.periodEnd, expectedAmount: expected, receivedAmount: input.receivedAmount, paymentCount: rows.length, bankReference: input.bankReference.trim(), note: input.note ?? "", recordedBy: admin.id })
      .returning();
    const j = await postJournal(tx, {
      env: input.env,
      type: "settlement",
      idempotencyKey: `settlement:${s.id}`,
      referenceType: "settlement",
      referenceId: s.id,
      memo: `Settlement DANA ${input.bankReference}`,
      createdBy: admin.id,
      lines: [
        { account: { kind: "settlement_bank" }, debit: input.receivedAmount },
        { account: { kind: "provider_clearing" }, credit: input.receivedAmount },
      ],
    });
    await tx.update(settlements).set({ journalId: j.journalId }).where(eq(settlements.id, s.id));
    if (rows.length) await tx.update(payments).set({ settlementId: s.id, settledAt: new Date() }).where(inArray(payments.id, rows.map((r) => r.id)));
    await audit(admin, "settlement.record", { type: "settlement", id: s.id }, { env: input.env, expected, received: input.receivedAmount, count: rows.length }, tx);
    if (expected !== input.receivedAmount) await notifyAdmins("integration", "Selisih settlement", `Diharapkan ${formatRupiah(expected)}, diterima ${formatRupiah(input.receivedAmount)} (${input.bankReference})`, { env: input.env, href: "/admin/settlement" }, tx);
    return s;
  });
}

type Mismatch = { kind: string; ref: string; detail: string; fixed?: boolean };

/** Rekonsiliasi: integritas ledger, konsistensi pembayaran↔jurnal, dan cek resmi ke DANA untuk order terbuka. */
export async function runReconciliation(env: Env, startedBy: string | null = null) {
  const [run] = await db.insert(reconciliationRuns).values({ env, status: "running", startedBy }).returning();
  const mismatches: Mismatch[] = [];
  try {
    const integrity = await verifyLedgerIntegrity(db, env);
    for (const d of integrity.balanceDrift) mismatches.push({ kind: "balance_drift", ref: d.id, detail: `Cache ${d.balance} ≠ entri ${d.computed} (${d.kind})` });
    for (const j of integrity.unbalancedJournals) mismatches.push({ kind: "unbalanced_journal", ref: j, detail: "Debit ≠ kredit" });
    if (integrity.assets !== integrity.claims) mismatches.push({ kind: "equation", ref: env, detail: `Aset ${integrity.assets} ≠ kewajiban+pendapatan+ekuitas ${integrity.claims}` });

    const paidNoJournal = await db.execute<{ partner_reference_no: string }>(sql`SELECT partner_reference_no FROM payments WHERE env=${env} AND status IN ('PAID','REFUND_PENDING','PARTIALLY_REFUNDED','REFUNDED') AND captured_journal_id IS NULL`);
    for (const r of paidNoJournal.rows) mismatches.push({ kind: "paid_without_journal", ref: r.partner_reference_no, detail: "Status lunas tanpa jurnal capture" });
    const journalNoPaid = await db.execute<{ reference_id: string }>(sql`SELECT j.reference_id FROM ledger_journals j JOIN payments p ON p.id::text = j.reference_id
      WHERE j.env=${env} AND j.type='payment_capture' AND p.status NOT IN ('PAID','REFUND_PENDING','PARTIALLY_REFUNDED','REFUNDED')`);
    for (const r of journalNoPaid.rows) mismatches.push({ kind: "journal_without_paid", ref: r.reference_id, detail: "Jurnal capture ada tetapi status belum lunas" });
    const amountDiff = await db.execute<{ partner_reference_no: string; amount: string; debit: string }>(sql`SELECT p.partner_reference_no, p.amount::text, e.debit::text FROM payments p
      JOIN ledger_entries e ON e.journal_id = p.captured_journal_id JOIN ledger_accounts a ON a.id = e.account_id AND a.kind='provider_clearing'
      WHERE p.env=${env} AND e.debit <> p.amount`);
    for (const r of amountDiff.rows) mismatches.push({ kind: "capture_amount", ref: r.partner_reference_no, detail: `Jurnal ${r.debit} ≠ tagihan ${r.amount}` });
    const refundDiff = await db.execute<{ partner_reference_no: string; refunded: string; s: string }>(sql`SELECT p.partner_reference_no, p.refunded_amount::text refunded, coalesce(sum(r.amount),0)::text s
      FROM payments p LEFT JOIN refunds r ON r.payment_id=p.id AND r.status='SUCCEEDED' WHERE p.env=${env} GROUP BY p.id HAVING p.refunded_amount <> coalesce(sum(r.amount),0)`);
    for (const r of refundDiff.rows) mismatches.push({ kind: "refund_amount", ref: r.partner_reference_no, detail: `refunded_amount ${r.refunded} ≠ total refund sukses ${r.s}` });
    const resv = await db.execute<{ owner_user_id: string; balance: string; s: string }>(sql`SELECT a.owner_user_id, a.balance::text,
      ((SELECT coalesce(sum(amount),0) FROM withdrawals w WHERE w.user_id=a.owner_user_id AND w.env=${env} AND w.status IN ('PENDING_REVIEW','APPROVED','PROCESSING','UNCERTAIN'))
      + (SELECT coalesce(sum(amount),0) FROM refunds r WHERE r.user_id=a.owner_user_id AND r.env=${env} AND r.status IN ('PENDING','UNCERTAIN')))::text s
      FROM ledger_accounts a WHERE a.env=${env} AND a.kind='user_reserved'`);
    for (const r of resv.rows) if (r.balance !== r.s) mismatches.push({ kind: "reserved_mismatch", ref: r.owner_user_id, detail: `Saldo dicadangkan ${r.balance} ≠ penarikan/refund terbuka ${r.s}` });

    // Pengecekan resmi ke DANA untuk order DANA yang masih terbuka/tidak pasti.
    const open = await db.select({ id: payments.id, ref: payments.partnerReferenceNo }).from(payments)
      .where(and(eq(payments.env, env), eq(payments.provider, "dana"), inArray(payments.status, ["CREATED", "PENDING", "EXPIRED"]), sql`(${payments.providerReferenceNo} IS NOT NULL OR ${payments.providerStatus} = 'CREATE_UNCERTAIN')`, gte(payments.createdAt, new Date(Date.now() - 14 * 86400_000))))
      .limit(50);
    let queried = 0;
    for (const p of open) {
      try {
        const r = await syncWithProvider(p.id);
        queried++;
        if (r.outcome === "credited") mismatches.push({ kind: "provider_paid_not_recorded", ref: p.ref, detail: "DANA melaporkan lunas; saldo kini dicatat dari hasil Query Payment", fixed: true });
        if (r.outcome === "amount_mismatch") mismatches.push({ kind: "provider_amount_mismatch", ref: p.ref, detail: "Nominal di DANA berbeda" });
      } catch (e) {
        mismatches.push({ kind: "provider_query_failed", ref: p.ref, detail: (e as Error).message });
      }
    }
    const uncertainW = await db.select({ id: withdrawals.id }).from(withdrawals).where(and(eq(withdrawals.env, env), eq(withdrawals.status, "UNCERTAIN")));
    for (const w of uncertainW) mismatches.push({ kind: "withdrawal_uncertain", ref: w.id, detail: "Penarikan berstatus tidak pasti — konfirmasi ke bank sebelum dicoba ulang" });
    const uncertainR = await db.select({ id: refunds.id, no: refunds.partnerRefundNo }).from(refunds).where(and(eq(refunds.env, env), eq(refunds.status, "UNCERTAIN")));
    for (const r of uncertainR) mismatches.push({ kind: "refund_uncertain", ref: r.no, detail: "Refund berstatus tidak pasti" });

    const sys = await getSystemBalances(db, env);
    const unsettled = await db.execute<{ s: string }>(sql`SELECT coalesce(sum(amount - refunded_amount),0)::text s FROM payments WHERE env=${env} AND provider='dana' AND captured_journal_id IS NOT NULL AND settlement_id IS NULL`);
    const summary = {
      integrityOk: integrity.ok,
      providerClearing: sys.providerClearing.toString(),
      unsettledDanaPayments: unsettled.rows[0].s,
      userFunds: (sys.userAvailable + sys.userHeld + sys.userReserved).toString(),
      platformFee: sys.platformFee.toString(),
      settlementBank: sys.settlementBank.toString(),
      queriedAtProvider: queried,
      mismatchCount: mismatches.filter((m) => !m.fixed).length,
    };
    const status = mismatches.some((m) => !m.fixed) ? "mismatch" : "ok";
    await db.update(reconciliationRuns).set({ status, summary, mismatches, finishedAt: new Date() }).where(eq(reconciliationRuns.id, run.id));
    if (status === "mismatch") await notifyAdmins("integration", "Rekonsiliasi menemukan selisih", `${env}: ${summary.mismatchCount} temuan`, { env, href: "/admin/settlement" });
    return { id: run.id, status, summary, mismatches };
  } catch (e) {
    await db.update(reconciliationRuns).set({ status: "error", summary: { error: (e as Error).message }, finishedAt: new Date() }).where(eq(reconciliationRuns.id, run.id));
    throw e;
  }
}
