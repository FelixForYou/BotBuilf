import { requireUser } from "@/lib/auth/session";
import { effectiveEnv } from "@/lib/views";
import { listPayments, parseFilters } from "@/lib/payments/query";
import { formatRupiah } from "@/lib/money";
import { fmtDate } from "@/lib/format";
import { EmptyState, ListGroup, ListRow, PageHeader } from "@/components/ui";
import { PaymentFilters, Pager } from "@/components/filters";
import { PaymentStatusBadge } from "@/components/status";

export const metadata = { title: "Riwayat transaksi" };
const PER = 20;

export default async function Payments({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { user } = await requireUser();
  const env = await effectiveEnv();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const f = parseFilters(sp);
  const { items, total } = await listPayments({ userId: user.id, env, ...f, limit: PER, offset: (page - 1) * PER });
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Riwayat" subtitle={`Pembayaran & isi saldo · ${env === "production" ? "Production" : "Sandbox"}`} />
      <PaymentFilters sp={sp} exportHref={`/api/payments/export?${qs}`} />
      {items.length === 0 ? (
        <EmptyState title="Tidak ada transaksi" icon="search">Ubah filter atau buat link pembayaran baru.</EmptyState>
      ) : (
        <ListGroup>
          {items.map((p) => (
            <ListRow key={p.id} href={`/app/pembayaran/${p.id}`} icon={p.purpose === "topup" ? "wallet" : "receipt"} title={p.description} subtitle={`${fmtDate(p.createdAt)} · ${p.orderRef || p.partnerReferenceNo}`} chevron={false}
              right={<div className="flex flex-col items-end gap-1"><span className="tabular text-sm font-bold">{formatRupiah(p.amount)}</span><PaymentStatusBadge status={p.status} /></div>} />
          ))}
        </ListGroup>
      )}
      <Pager page={page} total={total} perPage={PER} sp={sp} base="/app/pembayaran" />
    </>
  );
}
