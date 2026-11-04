import { and, eq, not } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { webhookEndpoints } from "@/lib/db/schema";
export const POST = authed<Record<string, never>, { id: string }>({}, async ({ auth, params }) => {
  await db.update(webhookEndpoints).set({ active: not(webhookEndpoints.active) }).where(and(eq(webhookEndpoints.id, params.id), eq(webhookEndpoints.userId, auth.user.id)));
  return { message: "Status endpoint diperbarui" };
});
