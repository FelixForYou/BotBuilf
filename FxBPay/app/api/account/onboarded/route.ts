import { eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const POST = authed({}, async ({ auth }) => {
  await db.update(users).set({ onboardedAt: new Date() }).where(eq(users.id, auth.user.id));
  return { redirect: "/app" };
});
