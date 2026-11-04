import { eq } from "drizzle-orm";
import { apiAuth } from "@/lib/auth/session";
import { route } from "@/lib/http";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getOwnedPayment } from "@/lib/payments/access";
import { renderInvoicePdf } from "@/lib/pdf/invoice";
import { PAID_LIKE } from "@/lib/payments/status";
import { getSetting } from "@/lib/settings";
import { AppError } from "@/lib/errors";

export const GET = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const auth = await apiAuth();
  const p = await getOwnedPayment(auth, (await ctx.params).id);
  const kind = req.nextUrl.searchParams.get("kind") === "receipt" ? "receipt" : "invoice";
  if (kind === "receipt" && !PAID_LIKE.includes(p.status)) throw new AppError("not_paid", "Bukti pembayaran tersedia setelah pembayaran terverifikasi", 409);
  const [m] = await db.select().from(users).where(eq(users.id, p.userId));
  const pdf = await renderInvoicePdf(p, m, kind, (await getSetting("branding")).siteName);
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${kind}-${p.partnerReferenceNo}.pdf"` } });
});
