import { and, eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { webhookEndpoints } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
export const POST = authed<Record<string, never>, { id: string }>({}, async ({ auth, actor, params }) => {
  await db.delete(webhookEndpoints).where(and(eq(webhookEndpoints.id, params.id), eq(webhookEndpoints.userId, auth.user.id)));
  await audit(actor, "webhook.delete", { type: "webhook_endpoint", id: params.id });
  return { message: "Endpoint dihapus" };
});
