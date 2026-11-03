"use client";

import { AlertTriangle, ArrowUpRight, BookOpen, KeyRound, Plus, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Badge, Button, Card, PageTransition, ProgressBar, SectionLabel, SegmentBar, Skeleton, StatGrid } from "@/components/ui";
import { api, fmtDate, fmtNum, fmtRel } from "@/lib/client";

interface Key { id: string; name: string; prefix: string; status: string; effective_tier: string; plan_name: string | null; expires_at: number | null; used_today: number; daily: number; premium_expired: boolean }
interface Usage { total: number; success: number; errors: number; avg_latency: number; recent: { endpoint: string; status: number; latency: number; at: number }[] }

export default function DashboardHome() {
  const { me } = useApp();
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  useEffect(() => {
    api<Key[]>("/api/keys").then(setKeys).catch(() => setKeys([]));
    api<Usage>("/api/usage?days=7").then(setUsage).catch(() => {});
  }, []);
  const active = keys?.filter((k) => k.status === "active") ?? [];
  const q = me?.quota;
  const expiring = active.filter((k) => k.effective_tier === "premium" && k.expires_at && Number(k.expires_at) - Date.now() < 5 * 86400_000);
  const expired = active.filter((k) => k.premium_expired);

  return (
    <PageTransition>
      <h1 className="text-[28px] font-extrabold">Halo, {me?.name.split(" ")[0]} 👋</h1>
      <p className="mt-0.5 text-[14.5px] text-muted">{me?.email}</p>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold tracking-[0.08em] text-muted">REQUEST HARI INI</span>
          <span className="text-[14px] font-semibold text-mint">{fmtNum(q?.used ?? 0)} dari {fmtNum(q?.limit ?? 0)}</span>
        </div>
        <div className="mt-3"><SegmentBar used={q?.used ?? 0} limit={q?.limit ?? 1} segments={10} /></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13.5px] text-muted">
          <span>Key utama: <b className="text-fg">{q?.keyName ?? "—"}</b></span>
          <span className="flex items-center gap-2">
            <Badge tone={q?.tier === "premium" ? "mint" : "neutral"}>{q?.tier ?? "free"}</Badge>
            Reset {q ? new Date(q.reset).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) : "00.00"} WIB
          </span>
        </div>
      </Card>

      {(expiring.length > 0 || expired.length > 0) && (
        <Card className="mt-4 flex items-start gap-3 !bg-warn-soft">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" />
          <div className="min-w-0 flex-1 text-[14.5px]">
            {expired.length > 0 ? (
              <>Premium pada <b>{expired.map((k) => k.name).join(", ")}</b> sudah berakhir — key kembali ke limit free.</>
            ) : (
              <>Premium <b>{expiring[0].name}</b> berakhir {fmtDate(expiring[0].expires_at)}.</>
            )}
            <Link href="/pricing" className="ml-1 font-semibold text-warn underline">Perpanjang</Link>
          </div>
        </Card>
      )}

      <SectionLabel>7 hari terakhir</SectionLabel>
      {usage ? (
        <StatGrid items={[{ value: fmtNum(usage.total), label: "Request" }, { value: usage.total ? `${Math.round((usage.success / usage.total) * 100)}%` : "—", label: "Sukses" }, { value: usage.total ? `${usage.avg_latency}ms` : "—", label: "Latency" }, { value: active.length, label: "Key aktif" }]} />
      ) : (
        <Skeleton className="h-[70px] rounded-[20px]" />
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/dashboard/keys?new=1", icon: Plus, label: "Buat key" },
          { href: "/explorer", icon: Terminal, label: "Explorer" },
          { href: "/docs", icon: BookOpen, label: "Docs" },
          { href: "/pricing", icon: Sparkles, label: "Upgrade" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 rounded-[22px] bg-card py-5 transition hover:bg-card-2 active:scale-[0.98]">
            <span className="grid size-11 place-items-center rounded-full bg-mint-soft text-mint"><a.icon className="size-5" /></span>
            <span className="text-[14px] font-medium">{a.label}</span>
          </Link>
        ))}
      </div>

      <SectionLabel right={<Link href="/dashboard/keys" className="text-[14px] font-medium text-mint">Kelola</Link>}>API key</SectionLabel>
      {!keys ? (
        <Skeleton className="h-28 rounded-[22px]" />
      ) : (
        <div className="space-y-3">
          {active.slice(0, 3).map((k) => (
            <Card key={k.id} className="!p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-mint-soft text-mint"><KeyRound className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{k.name}</div>
                  <div className="font-mono text-[12.5px] text-muted">{k.prefix}••••••••</div>
                </div>
                <Badge tone={k.effective_tier === "premium" ? "mint" : "neutral"}>{k.plan_name ?? k.effective_tier}</Badge>
              </div>
              <ProgressBar className="mt-3" value={(k.used_today / Math.max(1, k.daily)) * 100} />
              <div className="mt-1.5 text-right text-[12.5px] text-muted">{fmtNum(k.used_today)} / {fmtNum(k.daily)} hari ini</div>
            </Card>
          ))}
          {active.length === 0 && <Button href="/dashboard/keys?new=1" className="w-full" icon={Plus}>Buat API key</Button>}
        </div>
      )}

      <SectionLabel right={<Link href="/dashboard/usage" className="text-[14px] font-medium text-mint">Detail</Link>}>Request terbaru</SectionLabel>
      {!usage ? (
        <Skeleton className="h-40 rounded-[22px]" />
      ) : usage.recent.length === 0 ? (
        <Card className="text-center text-[14.5px] text-muted">Belum ada request. Coba di <Link className="text-mint" href="/explorer">API Explorer</Link>.</Card>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-card">
          {usage.recent.slice(0, 8).map((r, i) => (
            <Link key={i} href={`/docs/${r.endpoint}`} className="flex items-center gap-3 px-4 py-3 text-[14px] hover:bg-card-2">
              <span className={`w-11 shrink-0 font-mono font-semibold ${r.status < 400 ? "text-mint" : "text-danger"}`}>{r.status}</span>
              <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{r.endpoint}</span>
              <span className="shrink-0 text-muted">{r.latency}ms · {fmtRel(r.at)}</span>
              <ArrowUpRight className="size-4 shrink-0 text-subtle" />
            </Link>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
