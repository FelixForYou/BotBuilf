import { authed } from "@/lib/api-helpers";
import { setSetting } from "@/lib/settings";
import { ensureHarnessKey } from "@/lib/uat/harness";
import { audit } from "@/lib/audit";

/** Rotasi kunci test harness lokal sandbox. */
export const POST = authed({ admin: true, limit: 5 }, async ({ actor }) => {
  await setSetting("harness", { privateKeyEnc: null, publicKey: null }, actor.id);
  await ensureHarnessKey();
  await audit(actor, "uat.harness_rotate", { type: "settings", id: "harness" });
  return { message: "Kunci test harness diganti" };
});
