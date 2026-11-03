import "server-only";
import { randomBytes } from "node:crypto";
import { all, one, run } from "./db";
import { AppError } from "./errors";
import { id, safeEqual, sha256 } from "./crypto";
import { createHash } from "node:crypto";
import { providerFetch } from "./net";
import { getSettings } from "./settings";

export type Gateway = "midtrans" | "xendit" | "manual";

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_days: number;
  daily_limit: number;
  rpm_limit: number;
  rank: number;
  active: number;
  sort: number;
}

export interface Order {
  id: string;
  invoice_no: string;
  user_id: string;
  plan_id: string;
  key_id: string | null;
  action: "upgrade" | "renew";
  amount: number;
  currency: string;
  status: "pending" | "paid" | "expired" | "cancelled" | "failed";
  gateway: Gateway;
  gateway_ref: string | null;
  payment_url: string | null;
  note: string | null;
  created_at: number;
  paid_at: number | null;
  expires_at: number;
}

const midtransProd = () => process.env.MIDTRANS_IS_PRODUCTION === "true";

export async function availableGateways(): Promise<{ id: Gateway; name: string; description: string }[]> {
  const out: { id: Gateway; name: string; description: string }[] = [];
  if (process.env.MIDTRANS_SERVER_KEY) out.push({ id: "midtrans", name: "Midtrans", description: "QRIS, e-wallet (GoPay, ShopeePay), virtual account bank, kartu." });
  if (process.env.XENDIT_SECRET_KEY) out.push({ id: "xendit", name: "Xendit", description: "QRIS, e-wallet (OVO, DANA, LinkAja), virtual account, retail." });
  const s = await getSettings();
  if (s.manual_payment_info.trim()) out.push({ id: "manual", name: "Transfer manual", description: "Transfer lalu konfirmasi; diverifikasi admin." });
  return out;
}

export async function activePlans(): Promise<Plan[]> {
  return all<Plan>("SELECT * FROM plans WHERE active=1 ORDER BY sort, price");
}

export function invoiceNo(): string {
  const d = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10).replace(/-/g, "");
  return `FXB-${d}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Tandai order kedaluwarsa (lazy). */
export async function expireStale(): Promise<void> {
  await run("UPDATE orders SET status='expired' WHERE status='pending' AND expires_at < ?", [Date.now()]);
}

export async function createOrder(opts: { userId: string; email: string; name: string; planId: string; keyId: string; gateway: Gateway; base: string }): Promise<Order> {
  const plan = await one<Plan>("SELECT * FROM plans WHERE id=? AND active=1", [opts.planId]);
  if (!plan) throw new AppError("BAD_REQUEST", "Paket tidak ditemukan atau tidak aktif.");
  const key = await one<{ id: string; tier: string; plan_id: string | null; expires_at: number | null; status: string }>(
    "SELECT id,tier,plan_id,expires_at,status FROM api_keys WHERE id=? AND user_id=?",
    [opts.keyId, opts.userId],
  );
  if (!key || key.status !== "active") throw new AppError("BAD_REQUEST", "API key tidak ditemukan atau sudah dicabut.");
  const gws = await availableGateways();
  if (!gws.some((g) => g.id === opts.gateway)) throw new AppError("BAD_REQUEST", "Metode pembayaran tidak tersedia.");
  const pending = await one<{ n: number }>("SELECT COUNT(*) AS n FROM orders WHERE user_id=? AND status='pending'", [opts.userId]);
  if (Number(pending?.n) >= 5) throw new AppError("TOO_MANY_PENDING", "Terlalu banyak order menunggu pembayaran. Selesaikan atau batalkan dulu.", 429);

  const premiumActive = key.tier === "premium" && (!key.expires_at || Number(key.expires_at) > Date.now());
  const action = premiumActive && key.plan_id === plan.id ? "renew" : "upgrade";
  const s = await getSettings();
  const now = Date.now();
  const order: Order = {
    id: id("ord_"),
    invoice_no: invoiceNo(),
    user_id: opts.userId,
    plan_id: plan.id,
    key_id: key.id,
    action,
    amount: plan.price,
    currency: plan.currency,
    status: "pending",
    gateway: opts.gateway,
    gateway_ref: null,
    payment_url: null,
    note: null,
    created_at: now,
    paid_at: null,
    expires_at: now + Math.max(1, s.order_ttl_hours) * 3600_000,
  };

  if (plan.price <= 0) throw new AppError("BAD_REQUEST", "Harga paket tidak valid.");

  if (opts.gateway === "midtrans") {
    const r = await providerFetch(`https://app.${midtransProd() ? "" : "sandbox."}midtrans.com/snap/v1/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ":").toString("base64")}` },
      body: JSON.stringify({
        transaction_details: { order_id: order.invoice_no, gross_amount: plan.price },
        item_details: [{ id: plan.id, price: plan.price, quantity: 1, name: `FxB RestApi ${plan.name} ${plan.duration_days} hari`.slice(0, 50) }],
        customer_details: { first_name: opts.name.slice(0, 50), email: opts.email },
        expiry: { unit: "hour", duration: Math.max(1, s.order_ttl_hours) },
        callbacks: { finish: `${opts.base}/dashboard/orders/${order.id}` },
      }),
    });
    const b = (await r.json().catch(() => null)) as { token?: string; redirect_url?: string; error_messages?: string[] } | null;
    if (!r.ok || !b?.redirect_url) throw new AppError("PAYMENT_ERROR", `Gagal membuat transaksi Midtrans${b?.error_messages ? `: ${b.error_messages.join(", ")}` : ""}.`, 502);
    order.gateway_ref = b.token ?? null;
    order.payment_url = b.redirect_url;
  } else if (opts.gateway === "xendit") {
    const r = await providerFetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString("base64")}` },
      body: JSON.stringify({
        external_id: order.invoice_no,
        amount: plan.price,
        currency: plan.currency,
        payer_email: opts.email,
        description: `FxB RestApi — ${plan.name} (${plan.duration_days} hari)`,
        invoice_duration: Math.max(1, s.order_ttl_hours) * 3600,
        success_redirect_url: `${opts.base}/dashboard/orders/${order.id}`,
        failure_redirect_url: `${opts.base}/dashboard/orders/${order.id}`,
      }),
    });
    const b = (await r.json().catch(() => null)) as { id?: string; invoice_url?: string; message?: string } | null;
    if (!r.ok || !b?.invoice_url) throw new AppError("PAYMENT_ERROR", `Gagal membuat invoice Xendit${b?.message ? `: ${b.message}` : ""}.`, 502);
    order.gateway_ref = b.id ?? null;
    order.payment_url = b.invoice_url;
  }

  await run(
    "INSERT INTO orders (id,invoice_no,user_id,plan_id,key_id,action,amount,currency,status,gateway,gateway_ref,payment_url,note,created_at,paid_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [order.id, order.invoice_no, order.user_id, order.plan_id, order.key_id, order.action, order.amount, order.currency, order.status, order.gateway, order.gateway_ref, order.payment_url, order.note, order.created_at, null, order.expires_at],
  );
  return order;
}

/**
 * Tandai order lunas dan aktifkan premium pada key. Idempoten:
 * hanya order berstatus pending/expired yang diproses, sekali saja.
 */
export async function markPaid(orderId: string, opts: { amount?: number; ref?: string; note?: string } = {}): Promise<boolean> {
  const order = await one<Order>("SELECT * FROM orders WHERE id=?", [orderId]);
  if (!order) throw new AppError("NOT_FOUND", "Order tidak ditemukan.", 404);
  if (opts.amount !== undefined && Math.round(opts.amount) !== Number(order.amount)) {
    await run("UPDATE orders SET note=? WHERE id=?", [`Nominal tidak cocok: diterima ${opts.amount}`, orderId]);
    throw new AppError("AMOUNT_MISMATCH", "Nominal pembayaran tidak sesuai.", 400);
  }
  const now = Date.now();
  const upd = await run("UPDATE orders SET status='paid', paid_at=?, gateway_ref=COALESCE(?, gateway_ref), note=COALESCE(?, note) WHERE id=? AND status IN ('pending','expired')", [now, opts.ref ?? null, opts.note ?? null, orderId]);
  if (upd.rowsAffected !== 1) return false;
  const plan = await one<Plan>("SELECT * FROM plans WHERE id=?", [order.plan_id]);
  const key = await one<{ id: string; tier: string; expires_at: number | null }>("SELECT id,tier,expires_at FROM api_keys WHERE id=?", [order.key_id]);
  if (!plan || !key) {
    await run("UPDATE orders SET note='Lunas, tapi paket/key sudah dihapus — perlu tindakan admin.' WHERE id=?", [orderId]);
    return true;
  }
  const current = key.tier === "premium" && key.expires_at && Number(key.expires_at) > now ? Number(key.expires_at) : now;
  const expires = current + plan.duration_days * 86400_000;
  await run("UPDATE api_keys SET tier='premium', plan_id=?, daily_limit=?, rpm_limit=?, expires_at=?, status='active' WHERE id=?", [plan.id, plan.daily_limit, plan.rpm_limit, expires, key.id]);
  return true;
}

export async function setOrderStatus(orderId: string, status: "failed" | "expired" | "cancelled"): Promise<void> {
  await run("UPDATE orders SET status=? WHERE id=? AND status='pending'", [status, orderId]);
}

// ---------------------------------------------------------------------------
// Verifikasi webhook
// ---------------------------------------------------------------------------
export function midtransSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  return createHash("sha512").update(orderId + statusCode + grossAmount + serverKey).digest("hex");
}

export async function handleMidtrans(body: Record<string, unknown>): Promise<string> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new AppError("NOT_CONFIGURED", "Midtrans tidak aktif.", 404);
  const orderId = String(body.order_id ?? "");
  const statusCode = String(body.status_code ?? "");
  const gross = String(body.gross_amount ?? "");
  const sig = String(body.signature_key ?? "");
  if (!orderId || !sig || !safeEqual(midtransSignature(orderId, statusCode, gross, serverKey), sig)) {
    throw new AppError("INVALID_SIGNATURE", "Signature tidak valid.", 401);
  }
  const order = await one<Order>("SELECT * FROM orders WHERE invoice_no=? AND gateway='midtrans'", [orderId]);
  if (!order) return "ignored";
  // Verifikasi ulang langsung ke API Midtrans (tidak hanya percaya payload).
  const r = await providerFetch(`https://api.${midtransProd() ? "" : "sandbox."}midtrans.com/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: `Basic ${Buffer.from(serverKey + ":").toString("base64")}` },
  });
  const st = (await r.json().catch(() => ({}))) as { transaction_status?: string; fraud_status?: string; gross_amount?: string; transaction_id?: string };
  const ts = st.transaction_status ?? "";
  if ((ts === "settlement" || (ts === "capture" && st.fraud_status === "accept"))) {
    await markPaid(order.id, { amount: Number(st.gross_amount), ref: st.transaction_id });
    return "paid";
  }
  if (ts === "expire") await setOrderStatus(order.id, "expired");
  else if (ts === "cancel" || ts === "deny" || ts === "failure") await setOrderStatus(order.id, "failed");
  return ts || "unknown";
}

export async function handleXendit(token: string | null, body: Record<string, unknown>): Promise<string> {
  const expected = process.env.XENDIT_CALLBACK_TOKEN;
  if (!process.env.XENDIT_SECRET_KEY || !expected) throw new AppError("NOT_CONFIGURED", "Xendit tidak aktif.", 404);
  if (!token || !safeEqual(sha256(token), sha256(expected))) throw new AppError("INVALID_SIGNATURE", "Callback token tidak valid.", 401);
  const ext = String(body.external_id ?? "");
  const order = await one<Order>("SELECT * FROM orders WHERE invoice_no=? AND gateway='xendit'", [ext]);
  if (!order) return "ignored";
  // Verifikasi ulang status invoice ke API Xendit.
  const r = await providerFetch(`https://api.xendit.co/v2/invoices/${encodeURIComponent(order.gateway_ref ?? String(body.id ?? ""))}`, {
    headers: { Authorization: `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString("base64")}` },
  });
  const inv = (await r.json().catch(() => ({}))) as { status?: string; amount?: number; external_id?: string; id?: string };
  if (inv.external_id !== ext) throw new AppError("INVALID_SIGNATURE", "Invoice tidak cocok.", 400);
  if (inv.status === "PAID" || inv.status === "SETTLED") {
    await markPaid(order.id, { amount: inv.amount, ref: inv.id });
    return "paid";
  }
  if (inv.status === "EXPIRED") await setOrderStatus(order.id, "expired");
  return inv.status ?? "unknown";
}

