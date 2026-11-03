import { requireAdmin } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route } from "@/lib/http";
import { parsePlan } from "@/lib/plans";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await requireAdmin();
  const { id } = await ctx.params;
  if (!(await one("SELECT id FROM plans WHERE id=?", [id]))) throw Errors.notFound();
  const p = parsePlan(await readJson(req));
  await run("UPDATE plans SET name=?,description=?,price=?,duration_days=?,daily_limit=?,rpm_limit=?,rank=?,active=?,sort=? WHERE id=?", [
    p.name, p.description, p.price, p.duration_days, p.daily_limit, p.rpm_limit, p.rank, p.active, p.sort, id,
  ]);
  return ok(true);
});

export const DELETE = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await requireAdmin();
  const { id } = await ctx.params;
  const used = await one<{ n: number }>("SELECT COUNT(*) AS n FROM orders WHERE plan_id=?", [id]);
  if (Number(used?.n) > 0) {
    await run("UPDATE plans SET active=0 WHERE id=?", [id]);
    return ok({ archived: true });
  }
  await run("DELETE FROM plans WHERE id=?", [id]);
  return ok({ deleted: true });
});
