import { eq } from "drizzle-orm";
import { route } from "@/lib/http";
import { db } from "@/lib/db";
import { payments, users } from "@/lib/db/schema";
import { renderInvoicePdf } from "@/lib/pdf/invoice";
import { PAID_LIKE } from "@/lib/payments/status";
import { getSetting } from "@/lib/settings";
import { AppError, notFound } from "@/lib/errors";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp } from "@/lib/http";

/** Bukti pembayaran untuk pembeli (pemegang link). publicId acak 16 karakter. */
export const GET = route(async (req, ctx: { params: Promise<{ publicId: string }> }) => {
  await rateLimit(`receipt:${clientIp(req)}`, 30, 60);
  const [p] = await db.select().from(payments).where(eq(payments.publicId, (await ctx.params).publicId));
  if (!p) throw notFound("Pembayaran");
  if (!PAID_LIKE.includes(p.status)) throw new AppError("not_paid", "Bukti tersedia setelah pembayaran terverifikasi", 409);
  const [m] = await db.select().from(users).where(eq(users.id, p.userId));
  const pdf = await renderInvoicePdf(p, { storeName: m.storeName, email: m.email }, "receipt", (await getSetting("branding")).siteName);
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="bukti-${p.partnerReferenceNo}.pdf"` } });
});
