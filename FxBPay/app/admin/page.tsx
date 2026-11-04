import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getSystemBalances } from "@/lib/ledger";
import { dailySeries } from "@/lib/views";
import { getSetting } from "@/lib/settings";
import { loadDanaConfig } from "@/lib/dana/config";
import { formatRupiah } from "@/lib/money";
import { relTime } from "@/lib/format";
import { Badge, ListGroup, ListRow, Notice, PageHeader, SectionTitle, Stat } from "@/components/ui";
import { DailyChart } from "@/components/chart";
import { EnvTabs, pickEnv } from "@/components/env-tabs";
import { ActionButton } from "@/components/client";

export const dynamic = "force-dynamic";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ env?: string; range?: string }> }) {
  const sp = await searchParams;
  const env = pickEnv(sp.env);
  const range = [7, 30, 90].includes(Number(sp.range)) ? Number(sp.range) : 30;
  const [sys, counts, series, prod, cfg, notifs, jobs] = await Promise.all([
    getSystemBalances(db, env),
    db.execute<{ users: string; frozen: string; pending_w: string; review: string; open: string; paid_today: string; uncertain: string }>(sql`SELECT
      (SELECT count(*) FROM users WHERE role='user')::text users,
      (SELECT count(*) FROM users WHERE status='frozen')::text frozen,
      (SELECT count(*) FROM withdrawals WHERE env=${env} AND status IN ('PENDING_REVIEW','APPROVED','PROCESSING'))::text pending_w,
      (SELECT count(*) FROM payments WHERE env=${env} AND needs_review)::text review,
      (SELECT count(*) FROM payments WHERE env=${env} AND status IN ('CREATED','PENDING'))::text open,
      (SELECT coalesce(sum(amount),0) FROM payments WHERE env=${env} AND paid_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta')::text paid_today,
      ((SELECT count(*) FROM withdrawals WHERE env=${env} AND status='UNCERTAIN') + (SELECT count(*) FROM refunds WHERE env=${env} AND status='UNCERTAIN'))::text uncertain`),
    dailySeries(null, env, range),
    getSetting("production"),
    loadDanaConfig(env).catch(() => null),
    db.select().from(notifications).where(sql`${notifications.audience} = 'admin'`).orderBy(desc(notifications.createdAt)).limit(6),
    db.execute<{ failed: string; queued: string; last_done: string | null }>(sql`SELECT (SELECT count(*) FROM jobs WHERE status='failed')::text failed, (SELECT count(*) FROM jobs WHERE status='queued' AND run_at < now() - interval '5 minutes')::text queued, (SELECT max(updated_at)::text FROM jobs WHERE status='done') last_done`),
  ]);
  const c = counts.rows[0];
  const j = jobs.rows[0];
  const userFunds = sys.userAvailable + sys.userHeld + sys.userReserved;
  return (
    <>
      <PageHeader title="Ringkasan operasional" action={<ActionButton action="/api/admin/jobs" icon="play">Proses job</ActionButton>} />
      <EnvTabs env={env} base="/admin" />
      <div className="mb-4 space-y-2">
        {env === "production" && !prod.enabled && <Notice tone="warn" title="Production belum aktif">Merchant hanya dapat bertransaksi di Sandbox. Selesaikan checklist di <Link className="font-semibold text-mint" href="/admin/uat">Sandbox & UAT</Link>.</Notice>}
        {!cfg && <Notice tone="warn" title="Integrasi belum dikonfigurasi">Kredensial DANA {env} belum lengkap. <Link className="font-semibold text-mint" href="/admin/dana">Atur sekarang</Link>{env === "sandbox" && " — sementara sandbox memakai mode DEMO."}</Notice>}
        {Number(j.queued) > 0 && <Notice tone="danger" title="Worker tertunda">{j.queued} job menunggu lebih dari 5 menit. Pastikan <span className="mono">npm run worker</span> atau cron berjalan.</Notice>}
        {Number(c.uncertain) > 0 && <Notice tone="danger" title="Status tidak pasti">{c.uncertain} penarikan/refund perlu rekonsiliasi.</Notice>}
      </div>
      <SectionTitle>Pemisahan dana ({env})</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Dana pengguna" value={formatRupiah(userFunds)} icon="users" hint={`Tersedia ${formatRupiah(sys.userAvailable)} · tertahan ${formatRupiah(sys.userHeld)} · dicadangkan ${formatRupiah(sys.userReserved)}`} />
        <Stat label="Pendapatan biaya platform" value={formatRupiah(sys.platformFee)} icon="chart" tone="mint" />
        <Stat label="Piutang DANA (belum settle)" value={formatRupiah(sys.providerClearing)} icon="clock" />
        <Stat label="Rekening settlement" value={formatRupiah(sys.settlementBank)} icon="bank" hint={`Penyesuaian admin ${formatRupiah(sys.platformAdjustment)}`} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Lunas hari ini" value={formatRupiah(BigInt(c.paid_today))} />
        <Stat label="Link terbuka" value={c.open} />
        <Stat label="Penarikan menunggu" value={c.pending_w} tone={Number(c.pending_w) ? "amber" : undefined} />
        <Stat label="Transaksi perlu tinjauan" value={c.review} tone={Number(c.review) ? "red" : undefined} hint={`${c.users} merchant · ${c.frozen} dibekukan`} />
      </div>
      <div className="mt-6"><DailyChart data={series} range={range} basePath={`/admin?env=${env}`} /></div>
      <SectionTitle action={<Link href="/admin/notifikasi" className="text-sm font-semibold text-mint">Semua</Link>}>Notifikasi terbaru</SectionTitle>
      <ListGroup>
        {notifs.length === 0 && <ListRow icon="bell" title="Belum ada notifikasi" />}
        {notifs.map((n) => <ListRow key={n.id} href={n.href ?? undefined} icon={n.type === "integration" ? "alert" : n.type === "withdrawal" ? "arrowUpRight" : "bell"} title={<span className="flex items-center gap-2">{n.title}{n.env && <Badge>{n.env}</Badge>}</span>} subtitle={`${relTime(n.createdAt)} · ${n.body}`} />)}
      </ListGroup>
      <p className="mt-4 text-xs text-subtle">Job terakhir selesai: {j.last_done ? relTime(j.last_done) : "belum pernah"} · job gagal permanen: {j.failed}</p>
    </>
  );
}
