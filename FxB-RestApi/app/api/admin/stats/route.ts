import { requireAdmin } from "@/lib/auth";
import { all, one } from "@/lib/db";
import { ok, route } from "@/lib/http";
import { dayKey } from "@/lib/limits";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const now = Date.now();
  const since = now - 14 * 86400_000;
  const [users, keys, premium, revenue, pending, today] = await Promise.all([
    one<{ n: number }>("SELECT COUNT(*) AS n FROM users"),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM api_keys WHERE status='active'"),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM api_keys WHERE status='active' AND tier='premium' AND (expires_at IS NULL OR expires_at>?)", [now]),
    one<{ n: number }>("SELECT COALESCE(SUM(amount),0) AS n FROM orders WHERE status='paid'"),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM orders WHERE status='pending' AND expires_at>?", [now]),
    one<{ n: number; e: number }>("SELECT COUNT(*) AS n, SUM(CASE WHEN status>=400 THEN 1 ELSE 0 END) AS e FROM request_logs WHERE created_at>=?", [now - 86400_000]),
  ]);
  const logs = await all<{ created_at: number; status: number }>("SELECT created_at,status FROM request_logs WHERE created_at>=?", [since]);
  const series = new Map<string, { date: string; success: number; error: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = dayKey(now - i * 86400_000);
    series.set(d, { date: d, success: 0, error: 0 });
  }
  for (const l of logs) {
    const s = series.get(dayKey(Number(l.created_at)));
    if (s) Number(l.status) < 400 ? s.success++ : s.error++;
  }
  const top = await all<{ endpoint_id: string; n: number; e: number; lat: number }>(
    "SELECT endpoint_id, COUNT(*) AS n, SUM(CASE WHEN status>=400 THEN 1 ELSE 0 END) AS e, AVG(latency_ms) AS lat FROM request_logs WHERE created_at>=? GROUP BY endpoint_id ORDER BY n DESC LIMIT 10",
    [since],
  );
  return ok({
    users: Number(users?.n),
    active_keys: Number(keys?.n),
    premium_keys: Number(premium?.n),
    revenue: Number(revenue?.n),
    pending_orders: Number(pending?.n),
    requests_24h: Number(today?.n ?? 0),
    errors_24h: Number(today?.e ?? 0),
    series: [...series.values()],
    top: top.map((t) => ({ id: t.endpoint_id, count: Number(t.n), errors: Number(t.e), latency: Math.round(Number(t.lat)) })),
  });
});
