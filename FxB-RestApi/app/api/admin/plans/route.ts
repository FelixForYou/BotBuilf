import { requireAdmin } from "@/lib/auth";
import { all, one, run } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route, str } from "@/lib/http";
import { parsePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  return ok(await all("SELECT p.*, (SELECT COUNT(*) FROM orders o WHERE o.plan_id=p.id AND o.status='paid') AS sold FROM plans p ORDER BY sort, price"));
});

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  await requireAdmin();
  const b = await readJson(req);
  const id = str(b.id, "ID paket", { min: 2, max: 30 }).toLowerCase();
  if (!/^[a-z0-9-]+$/.test(id)) throw Errors.bad("ID paket hanya huruf kecil, angka, dan -.");
  if (await one("SELECT id FROM plans WHERE id=?", [id])) throw Errors.bad("ID paket sudah dipakai.");
  const p = parsePlan(b);
  await run("INSERT INTO plans (id,name,description,price,currency,duration_days,daily_limit,rpm_limit,rank,active,sort,created_at) VALUES (?,?,?,?,'IDR',?,?,?,?,?,?,?)", [
    id, p.name, p.description, p.price, p.duration_days, p.daily_limit, p.rpm_limit, p.rank, p.active, p.sort, Date.now(),
  ]);
  return ok({ id });
});
