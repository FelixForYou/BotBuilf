import { requireUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route } from "@/lib/http";
import { expireStale, setOrderStatus } from "@/lib/payments";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const u = await requireUser();
  const { id } = await ctx.params;
  await expireStale();
  const o = await one<Record<string, unknown>>(
    "SELECT o.*, p.name AS plan_name, p.duration_days, p.daily_limit, p.rpm_limit, k.name AS key_name, k.prefix AS key_prefix, k.expires_at AS key_expires FROM orders o LEFT JOIN plans p ON p.id=o.plan_id LEFT JOIN api_keys k ON k.id=o.key_id WHERE o.id=? AND (o.user_id=? OR ?='admin')",
    [id, u.id, u.role],
  );
  if (!o) throw Errors.notFound("Order tidak ditemukan.");
  const s = await getSettings();
  return ok({ ...o, manual_payment_info: o.gateway === "manual" ? s.manual_payment_info : null });
});

export const POST = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  const u = await requireUser();
  const { id } = await ctx.params;
  const b = await readJson(req);
  const o = await one<{ id: string; status: string }>("SELECT id,status FROM orders WHERE id=? AND user_id=?", [id, u.id]);
  if (!o) throw Errors.notFound("Order tidak ditemukan.");
  if (b.action !== "cancel") throw Errors.bad("Aksi tidak dikenal.");
  if (o.status !== "pending") throw Errors.bad("Hanya order pending yang bisa dibatalkan.");
  await setOrderStatus(id, "cancelled");
  return ok(true);
});
