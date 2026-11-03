import { requireAdmin } from "@/lib/auth";
import { run } from "@/lib/db";
import { clearOverrideCache, findEndpoint } from "@/lib/endpoints/registry";
import { Errors } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route } from "@/lib/http";

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  await requireAdmin();
  const id = decodeURIComponent((await ctx.params).id);
  if (!findEndpoint(id)) throw Errors.notFound("Endpoint tidak ada.");
  const b = await readJson(req);
  const enabled = b.enabled === false ? 0 : 1;
  const tier = b.tier === "free" || b.tier === "premium" ? b.tier : null;
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 200) || null : null;
  await run(
    "INSERT INTO endpoint_overrides (endpoint_id,enabled,tier,note,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(endpoint_id) DO UPDATE SET enabled=excluded.enabled, tier=excluded.tier, note=excluded.note, updated_at=excluded.updated_at",
    [id, enabled, tier, note, Date.now()],
  );
  clearOverrideCache();
  return ok(true);
});
