import { assertSameOrigin, clientIp, json, route } from "@/lib/http";
import { startCheckout } from "@/lib/payments/service";
import { rateLimit } from "@/lib/ratelimit";

/** Pembeli menekan "Bayar dengan DANA" — tidak perlu login. */
export const POST = route(async (req, ctx: { params: Promise<{ publicId: string }> }) => {
  assertSameOrigin(req);
  const { publicId } = await ctx.params;
  await rateLimit(`checkout:${clientIp(req)}`, 20, 60);
  const r = await startCheckout(publicId, clientIp(req));
  if (r.kind === "redirect") return json({ url: r.url });
  if (r.kind === "qris") return json({ qris: r.paymentCode, message: "Pindai kode QRIS" });
  if (r.kind === "rejected") return json({ error: { code: "provider_rejected", message: r.message } }, 502);
  return json({ message: r.message });
});
