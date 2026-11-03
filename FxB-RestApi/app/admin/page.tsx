"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarSeries } from "@/components/charts";
import { Card, PageTransition, ProgressBar, SectionLabel, Skeleton, StatGrid, toast } from "@/components/ui";
import { api, fmtIDR, fmtNum } from "@/lib/client";

interface Stats {
  users: number; active_keys: number; premium_keys: number; revenue: number; pending_orders: number; requests_24h: number; errors_24h: number;
  series: { date: string; success: number; error: number }[];
  top: { id: string; count: number; errors: number; latency: number }[];
}

export default function AdminHome() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    api<Stats>("/api/admin/stats").then(setS).catch((e) => toast(e.message, "error"));
  }, []);
  if (!s) return <div className="space-y-4"><Skeleton className="h-10 w-60" /><Skeleton className="h-20" /><Skeleton className="h-64" /></div>;
  const max = Math.max(1, ...s.top.map((t) => t.count));
  return (
    <PageTransition>
      <h1 className="text-[28px] font-extrabold">Admin Dashboard</h1>
      <p className="text-[14.5px] text-muted">Statistik nyata dari database.</p>
      <StatGrid className="mt-5" items={[{ value: fmtNum(s.users), label: "Pengguna" }, { value: fmtNum(s.active_keys), label: "Key aktif" }, { value: fmtNum(s.premium_keys), label: "Premium" }]} />
      <StatGrid className="mt-3" items={[{ value: fmtNum(s.requests_24h), label: "Request 24j" }, { value: s.requests_24h ? `${Math.round((s.errors_24h / s.requests_24h) * 100)}%` : "—", label: "Error rate" }, { value: <Link href="/admin/orders?status=pending" className="text-warn">{s.pending_orders}</Link>, label: "Order pending" }]} />
      <Card className="mt-3 flex items-center justify-between">
        <span className="text-muted">Total pendapatan (lunas)</span>
        <span className="text-[22px] font-bold text-mint">{fmtIDR(s.revenue)}</span>
      </Card>
      <SectionLabel>Request 14 hari</SectionLabel>
      <Card><BarSeries data={s.series} /></Card>
      <SectionLabel>Endpoint teratas (14 hari)</SectionLabel>
      <Card className="space-y-4">
        {s.top.length === 0 && <p className="text-center text-muted">Belum ada request.</p>}
        {s.top.map((t) => (
          <div key={t.id}>
            <div className="flex justify-between gap-3 text-[14px]"><span className="truncate font-mono">{t.id}</span><span className="shrink-0 text-muted">{fmtNum(t.count)} · {t.latency}ms · {t.errors} err</span></div>
            <ProgressBar className="mt-1.5" value={(t.count / max) * 100} />
          </div>
        ))}
      </Card>
    </PageTransition>
  );
}
