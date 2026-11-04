import { requireUser } from "@/lib/auth/session";
import { effectiveEnv } from "@/lib/views";
import { db } from "@/lib/db";
import { getUserBalances } from "@/lib/ledger";
import { ACCOUNT_LABEL, JOURNAL_LABEL, userEntries } from "@/lib/ledger-view";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { EmptyState, EnvBadge, ListGroup, ListRow, PageHeader, SectionTitle, Stat, Badge } from "@/components/ui";
import { Pager } from "@/components/filters";

export const metadata = { title: "Saldo" };
const PER = 30;

export default async function Balance({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { user } = await requireUser();
  const env = await effectiveEnv();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [b, rows] = await Promise.all([getUserBalances(db, user.id, env), userEntries(user.id, env, PER + 1, (page - 1) * PER)]);
  return (
    <>
      <PageHeader title="Saldo" subtitle={<span className="flex items-center gap-2">Dompet internal FxB Pay — terpisah dari saldo akun DANA pribadi Anda <EnvBadge env={env} /></span>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Tersedia" value={formatRupiah(b.available)} icon="wallet" tone="mint" hint="Bisa ditarik atau dipakai untuk refund" />
        <Stat label="Tertahan" value={formatRupiah(b.held)} icon="clock" hint="Menunggu masa tahan settlement" />
        <Stat label="Dicadangkan" value={formatRupiah(b.reserved)} icon="lock" hint="Penarikan/refund yang sedang diproses" />
      </div>
      <SectionTitle>Mutasi ledger</SectionTitle>
      {rows.length === 0 ? (
        <EmptyState icon="book" title="Belum ada mutasi">Mutasi muncul setelah pembayaran terverifikasi.</EmptyState>
      ) : (
        <ListGroup>
          {rows.slice(0, PER).map((r) => {
            const amt = r.credit - r.debit;
            return (
              <ListRow key={r.id} icon={amt >= 0n ? "arrowDown" : "arrowUp"} title={JOURNAL_LABEL[r.type] ?? r.type} subtitle={`${fmtDate(r.at)} · ${r.memo}`} chevron={false}
                href={r.refType === "payment" ? `/app/pembayaran/${r.refId}` : undefined}
                right={<div className="flex flex-col items-end gap-1"><span className={`tabular text-sm font-bold ${amt >= 0n ? "text-mint" : ""}`}>{formatRupiah(amt, { sign: true })}</span><Badge>{ACCOUNT_LABEL[r.kind]} · {formatRupiah(r.balanceAfter)}</Badge></div>} />
            );
          })}
        </ListGroup>
      )}
      <Pager page={page} total={(page - 1) * PER + rows.length} perPage={PER} sp={{}} base="/app/saldo" />
    </>
  );
}
