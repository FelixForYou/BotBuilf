import { one } from "@/lib/db";
import { ENDPOINTS } from "@/lib/endpoints/registry";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Statistik publik (angka nyata dari database). */
export const GET = route(async () => {
  const since = Date.now() - 86400_000;
  const [users, req24, okReq, lat] = await Promise.all([
    one<{ n: number }>("SELECT COUNT(*) AS n FROM users"),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM request_logs WHERE created_at>=?", [since]),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM request_logs WHERE created_at>=? AND status<400", [since]),
    one<{ n: number }>("SELECT AVG(latency_ms) AS n FROM request_logs WHERE created_at>=? AND status<400", [since]),
  ]);
  const total = Number(req24?.n ?? 0);
  return ok({
    endpoints: ENDPOINTS.length,
    users: Number(users?.n ?? 0),
    requests_24h: total,
    success_rate: total ? Math.round((Number(okReq?.n) / total) * 1000) / 10 : null,
    avg_latency: lat?.n ? Math.round(Number(lat.n)) : null,
  });
});
