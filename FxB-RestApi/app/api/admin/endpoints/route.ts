import { requireAdmin } from "@/lib/auth";
import { all } from "@/lib/db";
import { catalog, findEndpoint, missingRequirements } from "@/lib/endpoints/registry";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const since = Date.now() - 7 * 86400_000;
  const usage = await all<{ endpoint_id: string; n: number; e: number }>(
    "SELECT endpoint_id, COUNT(*) AS n, SUM(CASE WHEN status>=400 THEN 1 ELSE 0 END) AS e FROM request_logs WHERE created_at>=? GROUP BY endpoint_id",
    [since],
  );
  const list = await catalog();
  return ok(
    list.map((e) => {
      const u = usage.find((x) => x.endpoint_id === e.id);
      const def = findEndpoint(e.id)!;
      return { ...e, default_tier: def.tier, missing_env: missingRequirements(def), requests_7d: Number(u?.n ?? 0), errors_7d: Number(u?.e ?? 0) };
    }),
  );
});
