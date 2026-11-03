import { currentUser } from "@/lib/auth";
import { bestKey, effective } from "@/lib/keys";
import { peek, dayKey, nextResetMs } from "@/lib/limits";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const u = await currentUser();
  if (!u) return ok(null);
  const k = await bestKey(u.id);
  let quota = null;
  if (k) {
    const e = await effective(k);
    quota = { keyName: k.name, tier: e.tier, used: await peek(`key:${k.id}`, `d:${dayKey()}`), limit: e.daily, reset: nextResetMs() };
  }
  return ok({ ...u, quota });
});
