import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ledgerJournals, users } from "@/lib/db/schema";
import { getSystemBalances, verifyLedgerIntegrity } from "@/lib/ledger";
import { JOURNAL_LABEL } from "@/lib/ledger-view";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { Badge, Notice, PageHeader, SectionTitle, Stat, TableWrap } from "@/components/ui";
import { ActionForm, SheetTrigger } from "@/components/client";
import { EnvTabs, pickEnv } from "@/components/env-tabs";

export default async function Ledger({ searchParams }: { searchParams: Promise<{ env?: string }> }) {
  const env = pickEnv((await searchParams).env);
  const [sys, integrity, journals] = await Promise.all([
    getSystemBalances(db, env),
    verifyLedgerIntegrity(db, env),
    db.select({ j: ledgerJournals, by: users.email, total: sql<string>`(SELECT sum(debit)::text FROM ledger_entries e WHERE e.journal_id = ${ledgerJournals.id})` }).from(ledgerJournals).leftJoin(users, eq(users.id, ledgerJournals.createdBy)).where(eq(ledgerJournals.env, env)).orderBy(desc(ledgerJournals.createdAt)).limit(100),
  ]);
  return (
    <>
      <PageHeader title="Saldo & ledger" subtitle="Double-entry, immutable. Koreksi selalu berupa jurnal baru." />
      <EnvTabs env={env} base="/admin/ledger" />
      {integrity.ok ? <Notice tone="ok" title="Integritas ledger valid">Semua jurnal seimbang, cache saldo sesuai entri, aset ({formatRupiah(integrity.assets)}) = kewajiban + pendapatan + ekuitas.</Notice>
        : <Notice tone="danger" title="Integritas ledger bermasalah">Drift: {integrity.balanceDrift.length}, jurnal tidak seimbang: {integrity.unbalancedJournals.length}, aset {formatRupiah(integrity.assets)} vs klaim {formatRupiah(integrity.claims)}. Jalankan rekonsiliasi.</Notice>}
      <SectionTitle>Neraca akun sistem</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Aset: Piutang DANA" value={formatRupiah(sys.providerClearing)} />
        <Stat label="Aset: Rekening settlement" value={formatRupiah(sys.settlementBank)} />
        <Stat label="Kewajiban: Dana pengguna" value={formatRupiah(sys.userAvailable + sys.userHeld + sys.userReserved)} />
        <Stat label="Pendapatan biaya" value={formatRupiah(sys.platformFee)} hint={`Ekuitas penyesuaian ${formatRupiah(sys.platformAdjustment)}`} />
      </div>
      <SectionTitle action={
        <SheetTrigger title="Reversal jurnal" label="Reversal" icon="refresh" variant="secondary" size="sm">
          <>
            <ActionForm action="/api/admin/reverse" submit="Catat reversal" confirm="Reversal membuat jurnal baru yang membalik jurnal asal. Lanjutkan?">
              <div><label className="label" htmlFor="jid">ID jurnal</label><input id="jid" name="journalId" className="input mono" /></div>
              <div><label className="label" htmlFor="jr">Alasan</label><textarea id="jr" name="reason" className="input" /></div>
              <div><label className="label" htmlFor="jp">Password admin</label><input id="jp" name="password" type="password" className="input" /></div>
            </ActionForm>
          </>
        </SheetTrigger>
      }>Jurnal terbaru</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Waktu</th><th>Jenis</th><th className="text-right">Nominal</th><th>Referensi</th><th>Memo</th><th>ID jurnal</th></tr></thead><tbody>
        {journals.map(({ j, by, total }) => (
          <tr key={j.id}><td className="whitespace-nowrap">{fmtDate(j.createdAt)}</td><td><Badge tone={j.type === "admin_adjustment" || j.type === "reversal" ? "amber" : "gray"}>{JOURNAL_LABEL[j.type] ?? j.type}</Badge></td><td className="tabular text-right">{formatRupiah(BigInt(total ?? "0"))}</td><td className="text-xs">{j.referenceType}</td><td className="text-xs text-muted">{j.memo}{by && ` · oleh ${by}`}</td><td className="mono text-[10px] text-subtle">{j.id}</td></tr>
        ))}
      </tbody></table></TableWrap>
    </>
  );
}
