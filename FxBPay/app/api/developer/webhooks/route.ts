import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { currentEnv } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { webhookEndpoints } from "@/lib/db/schema";
import { encrypt, randomToken } from "@/lib/crypto";
import { assertPublicDestination, validateWebhookUrlSyntax } from "@/lib/ssrf";
import { WEBHOOK_EVENTS } from "@/lib/webhooks-out";
import { audit } from "@/lib/audit";

const S = z.object({ url: z.string().trim().max(500), events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, "Pilih minimal satu event") });
export const POST = authed({ schema: S, limit: 10 }, async ({ auth, actor, input }) => {
  const u = validateWebhookUrlSyntax(input.url);
  await assertPublicDestination(u);
  const secret = `whsec_${randomToken(24)}`;
  const env = await currentEnv();
  const [ep] = await db.insert(webhookEndpoints).values({ userId: auth.user.id, env, url: u.toString(), secretEnc: encrypt(secret), events: input.events }).returning();
  await audit(actor, "webhook.create", { type: "webhook_endpoint", id: ep.id }, { url: ep.url, env });
  return { id: ep.id, secret, message: "Endpoint webhook ditambahkan. Simpan signing secret sekarang." };
});
