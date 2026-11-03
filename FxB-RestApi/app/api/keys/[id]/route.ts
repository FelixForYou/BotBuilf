import { requireUser } from "@/lib/auth";
import { newApiKey } from "@/lib/crypto";
import { one, run } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route, str } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

async function own(userId: string, keyId: string) {
  const k = await one<{ id: string; status: string }>("SELECT id,status FROM api_keys WHERE id=? AND user_id=?", [keyId, userId]);
  if (!k) throw Errors.notFound("API key tidak ditemukan.");
  return k;
}

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  const u = await requireUser();
  const { id } = await ctx.params;
  const k = await own(u.id, id);
  const b = await readJson(req);
  if (b.action === "regenerate") {
    if (k.status !== "active") throw Errors.bad("Key yang sudah dicabut tidak bisa dibuat ulang.");
    const nk = newApiKey();
    await run("UPDATE api_keys SET key_hash=?, prefix=? WHERE id=?", [nk.hash, nk.prefix, id]);
    return ok({ key: nk.key, prefix: nk.prefix });
  }
  const name = str(b.name, "Nama key", { min: 1, max: 40 });
  await run("UPDATE api_keys SET name=? WHERE id=?", [name, id]);
  return ok({ name });
});

export const DELETE = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  const u = await requireUser();
  const { id } = await ctx.params;
  await own(u.id, id);
  await run("UPDATE api_keys SET status='revoked' WHERE id=?", [id]);
  return ok(true);
});
