import { requireAdmin } from "@/lib/auth";
import { one, run, tx } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const b = await readJson(req);
  const u = await one<{ id: string; role: string }>("SELECT id,role FROM users WHERE id=?", [id]);
  if (!u) throw Errors.notFound();
  if (id === admin.id && (b.role === "user" || b.status === "banned")) throw Errors.bad("Tidak bisa menurunkan/menangguhkan akun sendiri.");
  if (b.role === "admin" || b.role === "user") await run("UPDATE users SET role=? WHERE id=?", [b.role, id]);
  if (b.status === "active" || b.status === "banned") {
    await run("UPDATE users SET status=? WHERE id=?", [b.status, id]);
    if (b.status === "banned") await run("DELETE FROM sessions WHERE user_id=?", [id]);
  }
  return ok(true);
});

export const DELETE = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  if (id === admin.id) throw Errors.bad("Tidak bisa menghapus akun sendiri dari sini.");
  await tx([
    { sql: "DELETE FROM api_keys WHERE user_id=?", args: [id] },
    { sql: "DELETE FROM sessions WHERE user_id=?", args: [id] },
    { sql: "DELETE FROM users WHERE id=?", args: [id] },
  ]);
  return ok(true);
});
