import Link from "next/link";
import { formatRupiah } from "@/lib/money";
import { cx } from "./ui";

/** Grafik batang satu seri (pembayaran terverifikasi per hari). Hover tooltip per batang + tampilan tabel. */
export function DailyChart({ data, range, basePath }: { data: { day: string; paid: number; count: number }[]; range: number; basePath: string }) {
  const max = Math.max(1, ...data.map((d) => d.paid));
  const total = data.reduce((s, d) => s + d.paid, 0);
  const tx = data.reduce((s, d) => s + d.count, 0);
  const nice = niceMax(max);
  const label = (d: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z"));
  const every = Math.ceil(data.length / 6);
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Pembayaran terverifikasi</h2>
          <div className="tabular mt-1 text-2xl font-extrabold">{formatRupiah(BigInt(total))}</div>
          <div className="text-xs text-muted">{tx} transaksi · {range} hari terakhir</div>
        </div>
        <div className="flex rounded-full bg-surface p-1 text-xs font-bold">
          {[7, 30, 90].map((r) => (
            <Link key={r} href={`${basePath}${basePath.includes("?") ? "&" : "?"}range=${r}`} scroll={false} className={cx("rounded-full px-3 py-1.5 transition-colors", r === range ? "bg-mint text-ink" : "text-muted hover:text-fg")}>
              {r} hari
            </Link>
          ))}
        </div>
      </div>
      <div className="relative mt-6 h-44">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[nice, nice / 2, 0].map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span className="tabular w-12 shrink-0 text-right text-[10px] text-subtle">{short(v)}</span>
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 left-14 right-0 flex items-end gap-[2px]">
          {data.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end justify-center">
              <div className="w-full max-w-[18px] rounded-t-[4px] bg-mint/90 transition-colors group-hover:bg-mint" style={{ height: d.paid ? `${Math.max(2, (d.paid / nice) * 100)}%` : "0%" }} />
              <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-xl bg-surface px-3 py-2 text-xs shadow-xl group-hover:block">
                <div className="text-muted">{label(d.day)}</div>
                <div className="tabular font-bold">{formatRupiah(BigInt(d.paid))}</div>
                <div className="text-muted">{d.count} transaksi</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="ml-14 mt-2 flex gap-[2px] text-[10px] text-subtle">
        {data.map((d, i) => (
          <div key={d.day} className="flex-1 text-center">{i % every === 0 ? label(d.day) : ""}</div>
        ))}
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted hover:text-fg">Lihat sebagai tabel</summary>
        <table className="table mt-2">
          <thead><tr><th>Tanggal</th><th className="text-right">Transaksi</th><th className="text-right">Nominal</th></tr></thead>
          <tbody>
            {data.filter((d) => d.count > 0).map((d) => (
              <tr key={d.day}><td>{label(d.day)}</td><td className="tabular text-right">{d.count}</td><td className="tabular text-right">{formatRupiah(BigInt(d.paid))}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p / 2) * 2 * p;
}
function short(v: number) {
  if (v >= 1e9) return `${+(v / 1e9).toFixed(1)}M`;
  if (v >= 1e6) return `${+(v / 1e6).toFixed(1)}jt`;
  if (v >= 1e3) return `${+(v / 1e3).toFixed(0)}rb`;
  return String(v);
}
