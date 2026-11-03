import { requireAdmin } from "@/lib/auth";
import { all } from "@/lib/db";
import { ok, route } from "@/lib/http";
import { expireStale } from "@/lib/payments";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  await requireAdmin();
  await expireStale();
  const status = new URL(req.url).searchParams.get("status") ?? "";
  const rows = await all(
    "SELECT o.*, u.email, p.name AS plan_name, k.prefix AS key_prefix FROM orders o LEFT JOIN users u ON u.id=o.user_id LEFT JOIN plans p ON p.id=o.plan_id LEFT JOIN api_keys k ON k.id=o.key_id WHERE (?='' OR o.status=?) ORDER BY o.created_at DESC LIMIT 300",
    [status, status],
  );
  return ok(rows);
});
