import { requireAdmin } from "@/lib/auth";
import { all } from "@/lib/db";
import { ok, route } from "@/lib/http";
import { dayKey } from "@/lib/limits";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const tier = sp.get("tier") ?? "";
  const rows = await all(
    `SELECT k.id,k.user_id,k.name,k.prefix,k.tier,k.plan_id,k.daily_limit,k.rpm_limit,k.expires_at,k.status,k.created_at,k.last_used_at,u.email,
       COALESCE((SELECT count FROM usage_counters c WHERE c.subject='key:'||k.id AND c.bucket=?),0) AS used_today
     FROM api_keys k JOIN users u ON u.id=k.user_id
     WHERE (?='' OR u.email LIKE ? OR k.prefix LIKE ? OR k.name LIKE ?) AND (?='' OR k.tier=?)
     ORDER BY k.created_at DESC LIMIT 300`,
    [`d:${dayKey()}`, q, `%${q}%`, `${q}%`, `%${q}%`, tier, tier],
  );
  return ok(rows);
});
