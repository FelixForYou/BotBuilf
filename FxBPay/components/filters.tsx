import { PAYMENT_STATUSES } from "@/lib/db/schema";
import { STATUS_LABEL } from "@/lib/payments/status";
import { Icon } from "./icons";

/** Filter transaksi (GET form, dapat di-bookmark). */
export function PaymentFilters({ sp, exportHref, extra }: { sp: Record<string, string | undefined>; exportHref?: string; extra?: React.ReactNode }) {
  return (
    <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto]" method="get">
      <div className="relative">
        <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
        <input name="q" defaultValue={sp.q} placeholder="Cari referensi / deskripsi" className="input pl-11" aria-label="Cari" />
      </div>
      <select name="status" defaultValue={sp.status ?? ""} className="input" aria-label="Status">
        <option value="">Semua status</option>
        {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
      </select>
      <input type="date" name="from" defaultValue={sp.from} className="input" aria-label="Dari tanggal" />
      <input type="date" name="to" defaultValue={sp.to} className="input" aria-label="Sampai tanggal" />
      <div className="flex gap-2">
        {extra}
        <button className="btn btn-primary btn-md" type="submit"><Icon name="filter" size={16} />Terapkan</button>
        {exportHref && <a href={exportHref} className="btn btn-secondary btn-md" aria-label="Ekspor CSV"><Icon name="download" size={16} />CSV</a>}
      </div>
    </form>
  );
}

export function Pager({ page, total, perPage, sp, base }: { page: number; total: number; perPage: number; sp: Record<string, string | undefined>; base: string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    u.set("page", String(p));
    return `${base}?${u}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted">
      <span>Halaman {page} dari {pages} · {total} data</span>
      <div className="flex gap-2">
        {page > 1 && <a className="btn btn-secondary btn-sm" href={href(page - 1)}>Sebelumnya</a>}
        {page < pages && <a className="btn btn-secondary btn-sm" href={href(page + 1)}>Berikutnya</a>}
      </div>
    </div>
  );
}
