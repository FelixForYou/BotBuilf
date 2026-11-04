import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { reconciliationRuns, settlements } from "@/lib/db/schema";
import { formatRupiah } from "@/lib/money";
import { fmtDate, jakartaDay } from "@/lib/format";
import { Badge, Card, Notice, PageHeader, SectionTitle, Stat, TableWrap } from "@/components/ui";
import { ActionButton, ActionForm, Disclosure, SheetTrigger } from "@/components/client";
import { EnvTabs, pickEnv } from "@/components/env-tabs";

export default async function Settlement({ searchParams }: { searchParams: Promise<{ env?: string }> }) {
  const env = pickEnv((await searchParams).env);
  const [list, runs, unsettled] = await Promise.all([
    db.select().from(settlements).where(eq(settlements.env, env)).orderBy(desc(settlements.createdAt)).limit(50),
    db.select().from(reconciliationRuns).where(eq(reconciliationRuns.env, env)).orderBy(desc(reconciliationRuns.createdAt)).limit(10),
    db.execute<{ c: string; s: string; oldest: string | null }>(sql`SELECT count(*)::text c, coalesce(sum(amount - refunded_amount),0)::text s, min(paid_at)::text oldest FROM payments WHERE env=${env} AND provider='dana' AND captured_journal_id IS NOT NULL AND settlement_id IS NULL`),
  ]);
  const u = unsettled.rows[0];
  const today = jakartaDay(new Date());
  return (
    <>
      <PageHeader title="Settlement & rekonsiliasi" action={<ActionButton action="/api/admin/reconcile" body={{ env }} icon="scale" variant="primary" size="md">Jalankan rekonsiliasi</ActionButton>} />
      <EnvTabs env={env} base="/admin/settlement" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Pembayaran DANA belum settle" value={formatRupiah(BigInt(u.s))} hint={`${u.c} transaksi · tertua ${u.oldest ? fmtDate(u.oldest) : "—"}`} />
        <Card className="flex flex-col justify-between gap-3">
          <div><div className="font-bold">Catat settlement masuk</div><p className="text-sm text-muted">Setelah dana dari DANA masuk ke rekening platform, catat nominal & referensi mutasi bank.</p></div>
          <SheetTrigger title="Catat settlement" label="Catat settlement" icon="bank" size="md">
            <>
              <ActionForm action="/api/admin/settlements" submit="Simpan settlement" extra={{ env }}>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label" htmlFor="ps">Periode dari</label><input id="ps" type="date" name="periodStart" className="input" defaultValue={today} /></div>
                  <div><label className="label" htmlFor="pe">Sampai</label><input id="pe" type="date" name="periodEnd" className="input" defaultValue={today} /></div>
                </div>
                <div><label className="label" htmlFor="ra">Nominal diterima</label><input id="ra" name="receivedAmount" inputMode="numeric" className="input tabular" /></div>
                <div><label className="label" htmlFor="br">Referensi mutasi bank</label><input id="br" name="bankReference" className="input" /></div>
                <div><label className="label" htmlFor="sn">Catatan</label><input id="sn" name="note" className="input" /></div>
              </ActionForm>
            </>
          </SheetTrigger>
        </Card>
      </div>
      <SectionTitle>Riwayat rekonsiliasi</SectionTitle>
      {runs.length === 0 ? <Notice tone="info">Belum pernah dijalankan. Rekonsiliasi otomatis berjalan tiap 6 jam lewat worker.</Notice> : (
        <div className="space-y-3">
          {runs.map((r) => {
            const s = r.summary as Record<string, string | number | boolean>;
            const m = r.mismatches as { kind: string; ref: string; detail: string; fixed?: boolean }[];
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">{fmtDate(r.createdAt)}</div>
                  <Badge tone={r.status === "ok" ? "mint" : r.status === "running" ? "blue" : "red"}>{{ ok: "Cocok", mismatch: "Ada selisih", running: "Berjalan", error: "Error" }[r.status]}</Badge>
                </div>
                <div className="mt-2 text-sm text-muted">Piutang DANA {formatRupiah(BigInt(String(s.providerClearing ?? 0)))} · belum settle {formatRupiah(BigInt(String(s.unsettledDanaPayments ?? 0)))} · dicek ke DANA {String(s.queriedAtProvider ?? 0)} · temuan {String(s.mismatchCount ?? m.length)}</div>
                {m.length > 0 && <div className="mt-3"><Disclosure title={`${m.length} temuan`} text={m.map((x) => `${x.fixed ? "[DIPERBAIKI] " : ""}${x.kind} · ${x.ref} · ${x.detail}`).join("\n")} /></div>}
              </Card>
            );
          })}
        </div>
      )}
      <SectionTitle>Settlement tercatat</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Dicatat</th><th>Periode</th><th className="text-right">Diharapkan</th><th className="text-right">Diterima</th><th className="text-right">Selisih</th><th>Referensi</th></tr></thead><tbody>
        {list.length === 0 && <tr><td colSpan={6} className="text-muted">Belum ada</td></tr>}
        {list.map((x) => { const d = x.receivedAmount - x.expectedAmount; return (
          <tr key={x.id}><td>{fmtDate(x.createdAt)}</td><td className="text-xs">{fmtDate(x.periodStart, false)} – {fmtDate(x.periodEnd, false)} · {x.paymentCount} trx</td><td className="tabular text-right">{formatRupiah(x.expectedAmount)}</td><td className="tabular text-right">{formatRupiah(x.receivedAmount)}</td><td className={`tabular text-right ${d === 0n ? "" : "text-danger"}`}>{formatRupiah(d, { sign: true })}</td><td className="text-xs">{x.bankReference}</td></tr>
        ); })}
      </tbody></table></TableWrap>
    </>
  );
}
