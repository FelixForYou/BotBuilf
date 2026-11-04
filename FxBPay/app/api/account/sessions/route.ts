import { z } from "zod";
import { and, eq, isNull, ne } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { audit } from "@/lib/audit";

export const POST = authed({ schema: z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() }) }, async ({ auth, actor, input }) => {
  if (input.all) {
    await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, auth.user.id), isNull(sessions.revokedAt), ne(sessions.id, auth.session.id)));
  } else if (input.id) {
    await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.id, input.id), eq(sessions.userId, auth.user.id)));
  }
  await audit(actor, "account.session_revoke", { type: "session", id: input.id ?? "all" });
  return { message: input.all ? "Semua sesi lain dikeluarkan" : "Sesi dikeluarkan" };
});
