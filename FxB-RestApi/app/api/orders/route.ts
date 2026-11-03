import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, baseUrl, memLimit, ok, readJson, route, str } from "@/lib/http";
import { createOrder, expireStale, type Gateway } from "@/lib/payments";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const u = await requireUser();
  await expireStale();
  const rows = await all(
    "SELECT o.*, p.name AS plan_name, k.name AS key_name, k.prefix AS key_prefix FROM orders o LEFT JOIN plans p ON p.id=o.plan_id LEFT JOIN api_keys k ON k.id=o.key_id WHERE o.user_id=? ORDER BY o.created_at DESC LIMIT 100",
    [u.id],
  );
  return ok(rows);
});

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireUser();
  memLimit(`order:${u.id}`, 5, 1 / 60);
  const b = await readJson(req);
  const gateway = str(b.gateway, "Metode pembayaran", { max: 20 }) as Gateway;
  if (!["midtrans", "xendit", "manual"].includes(gateway)) throw new AppError("BAD_REQUEST", "Metode pembayaran tidak valid.");
  const order = await createOrder({
    userId: u.id,
    email: u.email,
    name: u.name,
    planId: str(b.planId, "Paket", { max: 40 }),
    keyId: str(b.keyId, "API key", { max: 40 }),
    gateway,
    base: baseUrl(req),
  });
  return ok(order);
});
