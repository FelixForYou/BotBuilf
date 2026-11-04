import { z } from "zod";
import { merchantRoute } from "@/lib/merchant-api";
import { createPayment, paymentPayload } from "@/lib/payments/service";
import { listPayments, parseFilters } from "@/lib/payments/query";
import { withIdempotency } from "@/lib/idempotency";
import { config } from "@/lib/env";

const S = z.object({
  amount: z.number().int().positive(),
  description: z.string().trim().min(3).max(140),
  order_ref: z.string().trim().max(64).regex(/^[A-Za-z0-9._\-/#]*$/).optional(),
  expires_in_minutes: z.number().int().min(5).max(10080).default(30),
  fee_bearer: z.enum(["merchant", "customer"]).optional(),
  method: z.enum(["redirect", "qris"]).optional(),
  customer: z.object({ name: z.string().max(80).optional(), email: z.string().email().optional() }).optional(),
});

export const POST = merchantRoute("payments:write", async ({ req, caller }) => {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const key = req.headers.get("idempotency-key");
  return withIdempotency(`pay:${caller.keyId}`, key, raw, async () => {
    const b = S.parse(raw);
    const p = await createPayment(caller.userId, caller.env, {
      amount: BigInt(b.amount),
      description: b.description,
      orderRef: b.order_ref,
      expiresInMinutes: b.expires_in_minutes,
      feeBearer: b.fee_bearer,
      method: b.method,
      customerName: b.customer?.name,
      customerEmail: b.customer?.email,
      idempotencyKey: key,
      via: "api",
    });
    return { status: 201, body: { ...paymentPayload(p), checkout_url: `${config.appUrl}/pay/${p.publicId}`, demo: p.provider === "demo" } };
  });
});

export const GET = merchantRoute("payments:read", async ({ req, caller }) => {
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const limit = Math.min(100, Math.max(1, Number(sp.limit ?? 20) || 20));
  const offset = Math.max(0, Number(sp.offset ?? 0) || 0);
  const r = await listPayments({ userId: caller.userId, env: caller.env, ...parseFilters(sp), limit, offset });
  return { body: { data: r.items.map(paymentPayload), total: r.total, limit, offset } };
});
