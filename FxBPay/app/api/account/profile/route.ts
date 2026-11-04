import { z } from "zod";
import { eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { audit } from "@/lib/audit";

const S = z.object({
  name: z.string().trim().min(2).max(80),
  storeName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(\+62|62|0)8[0-9]{7,12}$/, "Nomor telepon Indonesia tidak valid"),
});
export const POST = authed({ schema: S }, async ({ auth, actor, input }) => {
  await db.update(users).set(input).where(eq(users.id, auth.user.id));
  await audit(actor, "account.profile_update", { type: "user", id: auth.user.id }, input);
  return { message: "Profil disimpan" };
});
