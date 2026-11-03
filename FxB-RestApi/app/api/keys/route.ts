import { requireUser } from "@/lib/auth";
import { id, newApiKey } from "@/lib/crypto";
import { all, run } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route, str } from "@/lib/http";
import { effective, userKeys } from "@/lib/keys";
import { dayKey } from "@/lib/limits";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const u = await requireUser();
  const keys = await userKeys(u.id);
  const usage = await all<{ subject: string; count: number }>(
    `SELECT subject, count FROM usage_counters WHERE bucket=? AND subject IN (${keys.map(() => "?").join(",") || "''"})`,
    [`d:${dayKey()}`, ...keys.map((k) => `key:${k.id}`)],
  );
  const plans = await all<{ id: string; name: string }>("SELECT id,name FROM plans");
  const out = await Promise.all(
    keys.map(async (k) => {
      const e = await effective(k);
      return {
        ...k,
        effective_tier: e.tier,
        premium_expired: e.premiumExpired,
        daily: e.daily,
        rpm: e.rpm,
        used_today: Number(usage.find((x) => x.subject === `key:${k.id}`)?.count ?? 0),
        plan_name: plans.find((p) => p.id === k.plan_id)?.name ?? null,
      };
    }),
  );
  return ok(out);
});

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireUser();
  const b = await readJson(req);
  const name = str(b.name, "Nama key", { min: 1, max: 40 });
  const s = await getSettings();
  const keys = (await userKeys(u.id)).filter((k) => k.status === "active");
  if (keys.length >= s.max_keys_total) throw new AppError("KEY_LIMIT", `Maksimal ${s.max_keys_total} key aktif.`, 400);
  const freeCount = keys.filter((k) => k.tier === "free").length;
  if (freeCount >= s.max_free_keys) throw new AppError("KEY_LIMIT", `Maksimal ${s.max_free_keys} key free. Cabut key lama atau upgrade ke premium.`, 400);
  const key = newApiKey();
  const keyId = id("key_");
  await run("INSERT INTO api_keys (id,user_id,name,prefix,key_hash,tier,status,created_at) VALUES (?,?,?,?,?,'free','active',?)", [keyId, u.id, name, key.prefix, key.hash, Date.now()]);
  return ok({ id: keyId, key: key.key, prefix: key.prefix, name });
});
