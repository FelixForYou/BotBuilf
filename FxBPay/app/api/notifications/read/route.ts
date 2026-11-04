import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

export const POST = authed({ schema: z.object({ id: z.string().uuid().optional(), admin: z.boolean().optional() }) }, async ({ auth, input }) => {
  const scope = input.admin && auth.user.role === "admin" ? eq(notifications.audience, "admin") : eq(notifications.userId, auth.user.id);
  await db.update(notifications).set({ readAt: new Date() }).where(and(scope, isNull(notifications.readAt), input.id ? eq(notifications.id, input.id) : undefined));
  return { message: "Ditandai sudah dibaca" };
});
