import { z } from "zod";
import { eq } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { paymentEvents, payments } from "@/lib/db/schema";
import { audit } from "@/lib/audit";

export const POST = authed<{ note: string }, { id: string }>({ admin: true, schema: z.object({ note: z.string().trim().min(5, "Catatan tinjauan wajib") }) }, async ({ actor, input, params }) => {
  const [p] = await db.update(payments).set({ needsReview: false, updatedAt: new Date() }).where(eq(payments.id, params.id)).returning();
  await db.insert(paymentEvents).values({ paymentId: p.id, fromStatus: p.status, toStatus: p.status, source: "admin", note: `Tinjauan selesai: ${input.note}` });
  await audit(actor, "payment.review_clear", { type: "payment", id: p.id }, { note: input.note });
  return { message: "Tanda tinjauan dihapus" };
});
