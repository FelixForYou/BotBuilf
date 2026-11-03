import { requireAdmin } from "@/lib/auth";
import { all } from "@/lib/db";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  await requireAdmin();
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  const rows = await all(
    `SELECT u.id,u.email,u.name,u.role,u.status,u.created_at,
       (SELECT COUNT(*) FROM api_keys k WHERE k.user_id=u.id AND k.status='active') AS keys,
       (SELECT COUNT(*) FROM api_keys k WHERE k.user_id=u.id AND k.status='active' AND k.tier='premium' AND (k.expires_at IS NULL OR k.expires_at>?)) AS premium
     FROM users u WHERE (?='' OR u.email LIKE ? OR u.name LIKE ?) ORDER BY u.created_at DESC LIMIT 200`,
    [Date.now(), q, `%${q}%`, `%${q}%`],
  );
  return ok(rows);
});
