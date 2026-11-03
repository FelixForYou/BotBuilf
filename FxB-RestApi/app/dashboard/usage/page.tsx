"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarSeries } from "@/components/charts";
import { Card, PageTransition, ProgressBar, SectionLabel, Segmented, Skeleton, StatGrid, toast } from "@/components/ui";
import { api, fmtNum, fmtRel } from "@/lib/client";

interface Usage {
  total: number; success: number; errors: number; avg_latency: number;
  series: { date: string; success: number; error: number }[];
  top: { id: string; count: number; errors: number; latency: number }[];
  recent: { endpoint: string; status: number; latency: number; at: number }[];
}

export default function UsagePage() {
  const [days, setDays] = useState<"7" | "30" | "90">("7");
  const [u, setU] = useState<Usage | null>(null);
  useEffect(() => {
    setU(null);
    api<Usage>(`/api/usage?days=${days}`).then(setU).catch((e) => toast(e.message, "error"));
  }, [days]);
  const maxTop = Math.max(1, ...(u?.top.map((t) => t.count) ?? [1]));
  return (
    <PageTransition>
      <h1 className="text-[28px] font-extrabold">Statistik penggunaan</h1>
      <p className="text-[14.5px] text-muted">Semua request dari key milikmu (termasuk dari API Explorer).</p>
      <div className="mt-5"><Segmented value={days} onChange={setDays} options={[{ value: "7", label: "7 hari" }, { value: "30", label: "30 hari" }, { value: "90", label: "90 hari" }]} /></div>
      {!u ? (
        <div className="mt-5 space-y-4"><Skeleton className="h-[70px]" /><Skeleton className="h-60" /><Skeleton className="h-60" /></div>
      ) : (
        <>
          <StatGrid className="mt-5" items={[{ value: fmtNum(u.total), label: "Total" }, { value: fmtNum(u.success), label: "Sukses" }, { value: fmtNum(u.errors), label: "Error" }, { value: u.total ? `${u.avg_latency}ms` : "—", label: "Latency" }]} />
          <SectionLabel right={<span className="flex items-center gap-3 text-[12.5px] text-muted"><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-mint" />sukses</span><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-danger" />error</span></span>}>Request per hari</SectionLabel>
          <Card><BarSeries data={u.series} /></Card>
          <SectionLabel>Endpoint teratas</SectionLabel>
          {u.top.length === 0 ? (
            <Card className="text-center text-[14.5px] text-muted">Belum ada data.</Card>
          ) : (
            <Card className="space-y-4">
              {u.top.map((t) => (
                <Link key={t.id} href={`/docs/${t.id}`} className="block">
                  <div className="flex justify-between gap-3 text-[14px]">
                    <span className="truncate font-mono">{t.id}</span>
                    <span className="shrink-0 text-muted">{fmtNum(t.count)} · {t.latency}ms{t.errors ? ` · ${t.errors} err` : ""}</span>
                  </div>
                  <ProgressBar className="mt-1.5" value={(t.count / maxTop) * 100} />
                </Link>
              ))}
            </Card>
          )}
          <SectionLabel>Log terbaru</SectionLabel>
          <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-card">
            {u.recent.length === 0 && <div className="p-5 text-center text-[14.5px] text-muted">Belum ada log.</div>}
            {u.recent.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 text-[14px]">
                <span className={`w-11 shrink-0 font-mono font-semibold ${r.status < 400 ? "text-mint" : "text-danger"}`}>{r.status}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{r.endpoint}</span>
                <span className="shrink-0 text-muted">{r.latency}ms · {fmtRel(r.at)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </PageTransition>
  );
}
