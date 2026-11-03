import { ok, route } from "@/lib/http";
import { activePlans, availableGateways } from "@/lib/payments";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const s = await getSettings();
  return ok({
    free: { daily_limit: s.free_daily_limit, rpm: s.free_rpm, max_keys: s.max_free_keys },
    plans: await activePlans(),
    gateways: await availableGateways(),
  });
});
