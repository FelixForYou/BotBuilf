import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { ok, route } from "@/lib/http";
import { dayKey } from "@/lib/limits";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  const u = await requireUser();
  const days = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 7));
  const since = Date.now() - days * 86400_000;
  const rows = await all<{ endpoint_id: string; status: number; latency_ms: number; created_at: number; key_id: string | null }>(
    "SELECT endpoint_id,status,latency_ms,created_at,key_id FROM request_logs WHERE user_id=? AND created_at>=? ORDER BY created_at DESC LIMIT 20000",
    [u.id, since],
  );
  const series = new Map<string, { date: string; success: number; error: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = dayKey(Date.now() - i * 86400_000);
    series.set(d, { date: d, success: 0, error: 0 });
  }
  const endpoints = new Map<string, { id: string; count: number; errors: number; latency: number }>();
  let success = 0;
  let latency = 0;
  for (const r of rows) {
    const d = series.get(dayKey(Number(r.created_at)));
    const okr = Number(r.status) < 400;
    if (d) okr ? d.success++ : d.error++;
    if (okr) success++;
    latency += Number(r.latency_ms);
    const e = endpoints.get(r.endpoint_id) ?? { id: r.endpoint_id, count: 0, errors: 0, latency: 0 };
    e.count++;
    if (!okr) e.errors++;
    e.latency += Number(r.latency_ms);
    endpoints.set(r.endpoint_id, e);
  }
  return ok({
    days,
    total: rows.length,
    success,
    errors: rows.length - success,
    avg_latency: rows.length ? Math.round(latency / rows.length) : 0,
    series: [...series.values()],
    top: [...endpoints.values()].sort((a, b) => b.count - a.count).slice(0, 10).map((e) => ({ ...e, latency: Math.round(e.latency / e.count) })),
    recent: rows.slice(0, 25).map((r) => ({ endpoint: r.endpoint_id, status: Number(r.status), latency: Number(r.latency_ms), at: Number(r.created_at), key_id: r.key_id })),
  });
});
