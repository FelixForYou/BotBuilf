import { and, eq, or } from "drizzle-orm";
import { merchantRoute } from "@/lib/merchant-api";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { paymentPayload } from "@/lib/payments/service";
import { notFound } from "@/lib/errors";
import { config } from "@/lib/env";

export const GET = merchantRoute<{ id: string }>("payments:read", async ({ caller, params }) => {
  const [p] = await db.select().from(payments).where(and(eq(payments.userId, caller.userId), eq(payments.env, caller.env), or(eq(payments.publicId, params.id), eq(payments.partnerReferenceNo, params.id))));
  if (!p) throw notFound("Pembayaran");
  return { body: { ...paymentPayload(p), checkout_url: `${config.appUrl}/pay/${p.publicId}` } };
});
