import { requireAdmin } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

const numOrNull = (v: unknown, max: number) => {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > max) throw Errors.bad("Angka limit tidak valid.");
  return n;
};

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  await requireAdmin();
  const { id } = await ctx.params;
  if (!(await one("SELECT id FROM api_keys WHERE id=?", [id]))) throw Errors.notFound();
  const b = await readJson(req);
  if (b.status === "active" || b.status === "revoked") await run("UPDATE api_keys SET status=? WHERE id=?", [b.status, id]);
  if (b.tier === "free" || b.tier === "premium") {
    let plan: { id: string; daily_limit: number; rpm_limit: number } | null = null;
    if (b.plan_id) {
      plan = await one("SELECT id,daily_limit,rpm_limit FROM plans WHERE id=?", [String(b.plan_id)]);
      if (!plan) throw Errors.bad("Paket tidak ditemukan.");
    }
    const exp = b.expires_at === null || b.expires_at === "" ? null : Number(b.expires_at);
    if (exp !== null && !Number.isFinite(exp)) throw Errors.bad("Tanggal kedaluwarsa tidak valid.");
    await run("UPDATE api_keys SET tier=?, plan_id=?, daily_limit=?, rpm_limit=?, expires_at=? WHERE id=?", [
      b.tier,
      b.tier === "premium" ? plan?.id ?? null : null,
      numOrNull(b.daily_limit, 10_000_000) ?? plan?.daily_limit ?? null,
      numOrNull(b.rpm_limit, 100_000) ?? plan?.rpm_limit ?? null,
      b.tier === "premium" ? exp : null,
      id,
    ]);
  }
  return ok(true);
});
