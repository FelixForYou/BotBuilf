import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { effectiveEnv, dailySeries, createContext } from "@/lib/views";
import { db } from "@/lib/db";
import { notifications, payments } from "@/lib/db/schema";
import { getUserBalances } from "@/lib/ledger";
import { formatRupiah } from "@/lib/money";
import { fmtDate, relTime } from "@/lib/format";
import { Card, EmptyState, EnvBadge, ListGroup, ListRow, SectionTitle } from "@/components/ui";
import { Hideable, HideToggle } from "@/components/client";
import { CreateButton } from "@/components/create-sheet";
import { DailyChart } from "@/components/chart";
import { PaymentStatusBadge } from "@/components/status";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { user } = await requireUser();
  const env = await effectiveEnv();
  const range = [7, 30, 90].includes(Number((await searchParams).range)) ? Number((await searchParams).range) : 30;
  const [bal, totals, recent, series, ctx, notifs] = await Promise.all([
    getUserBalances(db, user.id, env),
    db.execute<{ received: string; withdrawn: string; pending: string }>(sql`SELECT
      (SELECT coalesce(sum(net),0) FROM payments WHERE user_id=${user.id} AND env=${env} AND captured_journal_id IS NOT NULL)::text received,
      (SELECT coalesce(sum(amount),0) FROM withdrawals WHERE user_id=${user.id} AND env=${env} AND status='PAID')::text withdrawn,
      (SELECT count(*) FROM payments WHERE user_id=${user.id} AND env=${env} AND status IN ('CREATED','PENDING'))::text pending`),
    db.select().from(payments).where(and(eq(payments.userId, user.id), eq(payments.env, env))).orderBy(desc(payments.createdAt)).limit(6),
    dailySeries(user.id, env, range),
    createContext(env),
    db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(3),
  ]);
  const t = totals.rows[0];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Halo, {user.name.split(" ")[0]}</p>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight">{user.storeName || "Toko Anda"}</h1>
      </div>

      <section className="card relative overflow-hidden bg-gradient-to-br from-[#1e1e1e] to-[#16302b] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            Saldo tersedia <EnvBadge env={env} demo={env === "sandbox" && ctx.demo} />
          </div>
          <HideToggle />
        </div>
        <div className="mt-2 text-[2.5rem] font-extrabold leading-none tracking-tight sm:text-5xl">
          <Hideable>{formatRupiah(bal.available)}</Hideable>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-black/25 p-3">
            <div className="text-muted">Tertahan (settlement)</div>
            <div className="mt-0.5 font-bold"><Hideable>{formatRupiah(bal.held)}</Hideable></div>
          </div>
          <div className="rounded-2xl bg-black/25 p-3">
            <div className="text-muted">Dicadangkan</div>
            <div className="mt-0.5 font-bold"><Hideable>{formatRupiah(bal.reserved)}</Hideable></div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-2">
          <CreateButton variant="action" label="Isi Saldo" icon="wallet" initialTab="topup" {...ctx} />
          <CreateButton variant="action" label="Buat Bayar" icon="link" initialTab="payment" {...ctx} />
          <Link href="/app/penarikan" className="group flex flex-col items-center gap-2 text-xs font-semibold text-fg/90">
            <span className="icon-round h-14 w-14 bg-white/10 transition group-hover:bg-white/15 group-active:scale-95"><Icon name="arrowUpRight" size={22} /></span>Tarik Saldo
          </Link>
          <Link href="/app/pembayaran" className="group flex flex-col items-center gap-2 text-xs font-semibold text-fg/90">
            <span className="icon-round h-14 w-14 bg-white/10 transition group-hover:bg-white/15 group-active:scale-95"><Icon name="clock" size={22} /></span>Riwayat
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><div className="text-sm text-muted">Total diterima (bersih)</div><div className="mt-1 text-xl font-extrabold"><Hideable>{formatRupiah(BigInt(t.received))}</Hideable></div></Card>
        <Card><div className="text-sm text-muted">Total penarikan</div><div className="mt-1 text-xl font-extrabold"><Hideable>{formatRupiah(BigInt(t.withdrawn))}</Hideable></div></Card>
        <Card><div className="text-sm text-muted">Menunggu pembayaran</div><div className="mt-1 text-xl font-extrabold">{t.pending} link</div></Card>
      </div>

      <DailyChart data={series} range={range} basePath="/app" />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionTitle action={<Link href="/app/pembayaran" className="text-sm font-semibold text-mint">Lihat semua</Link>}>Transaksi terbaru</SectionTitle>
          {recent.length === 0 ? (
            <EmptyState title="Belum ada transaksi" action={<CreateButton variant="button" label="Buat link pertama" {...ctx} />}>Buat link pembayaran dan bagikan ke pelanggan Anda.</EmptyState>
          ) : (
            <ListGroup>
              {recent.map((p) => (
                <ListRow key={p.id} href={`/app/pembayaran/${p.id}`} icon={p.purpose === "topup" ? "wallet" : "receipt"} title={p.description} subtitle={`${fmtDate(p.createdAt)} · ${p.orderRef || p.partnerReferenceNo}`} chevron={false}
                  right={<div className="flex flex-col items-end gap-1"><span className="tabular text-sm font-bold">{formatRupiah(p.amount)}</span><PaymentStatusBadge status={p.status} /></div>} />
              ))}
            </ListGroup>
          )}
        </div>
        <div>
          <SectionTitle action={<Link href="/app/notifikasi" className="text-sm font-semibold text-mint">Semua</Link>}>Notifikasi</SectionTitle>
          {notifs.length === 0 ? (
            <EmptyState icon="bell" title="Belum ada notifikasi" />
          ) : (
            <ListGroup>
              {notifs.map((n) => (
                <ListRow key={n.id} href={n.href ?? "/app/notifikasi"} icon={n.type === "withdrawal" ? "arrowUpRight" : n.type === "integration" ? "alert" : n.type === "security" ? "shield" : "bell"} title={n.title} subtitle={`${relTime(n.createdAt)} · ${n.body}`} />
              ))}
            </ListGroup>
          )}
        </div>
      </div>
    </div>
  );
}
