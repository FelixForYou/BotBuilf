import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createApiKey, revokeApiKey } from "@/lib/apikeys";
import { getOwnedPayment } from "@/lib/payments/access";
import { requestRefund } from "@/lib/refunds";
import { signPayload } from "@/lib/webhooks-out";
import { hmacHex } from "@/lib/crypto";
import { POST as createPay, GET as listPay } from "@/app/api/v1/payments/route";
import { GET as getPay } from "@/app/api/v1/payments/[id]/route";
import { GET as getBalance } from "@/app/api/v1/balance/route";
import { makePayment, makeUser, payViaNotify } from "./helpers";

const actor = (id: string) => ({ id, email: "t@test" });
const req = (url: string, key: string, init: { method?: string; body?: unknown; idem?: string } = {}) =>
  new NextRequest(`http://localhost:3000${url}`, {
    method: init.method ?? "GET",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", ...(init.idem ? { "idempotency-key": init.idem } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = (params: Record<string, string> = {}) => ({ params: Promise.resolve(params) as any });

describe("isolasi akun", () => {
  it("pengguna lain tidak bisa membaca/merefund pembayaran milik orang lain", async () => {
    const a = await makeUser(), b = await makeUser();
    const p = await makePayment(a.id);
    const fakeAuth = (u: typeof a) => ({ user: u, session: {} as never });
    await expect(getOwnedPayment(fakeAuth(b), p.id)).rejects.toThrow(/tidak ditemukan/);
    expect((await getOwnedPayment(fakeAuth(a), p.id)).id).toBe(p.id);
    await payViaNotify(p);
    await expect(requestRefund(actor(b.id), { paymentId: p.id, ownerUserId: b.id, amount: 1000n, reason: "coba curi" })).rejects.toThrow(/tidak ditemukan/);
  });

  it("API key hanya melihat data pemiliknya dan env-nya", async () => {
    const a = await makeUser(), b = await makeUser();
    const pa = await makePayment(a.id);
    await payViaNotify(pa);
    const kb = await createApiKey(actor(b.id), b.id, "sandbox", { name: "b", scopes: ["payments:read", "balance:read"], expiresInDays: null });
    const ka = await createApiKey(actor(a.id), a.id, "sandbox", { name: "a", scopes: ["payments:read", "balance:read"], expiresInDays: null });
    expect((await getPay(req(`/api/v1/payments/${pa.publicId}`, kb.secret), ctx({ id: pa.publicId }))).status).toBe(404);
    expect((await getPay(req(`/api/v1/payments/${pa.publicId}`, ka.secret), ctx({ id: pa.publicId }))).status).toBe(200);
    const list = await (await listPay(req("/api/v1/payments", kb.secret), ctx())).json();
    expect(list.total).toBe(0);
    const balB = await (await getBalance(req("/api/v1/balance", kb.secret), ctx())).json();
    expect(balB.held).toBe(0);
    const balA = await (await getBalance(req("/api/v1/balance", ka.secret), ctx())).json();
    expect(balA.held).toBe(Number(pa.net));
  });
});

describe("merchant API", () => {
  it("scope, pencabutan, dan idempotency", async () => {
    const u = await makeUser();
    const ro = await createApiKey(actor(u.id), u.id, "sandbox", { name: "ro", scopes: ["payments:read"], expiresInDays: 30 });
    const rw = await createApiKey(actor(u.id), u.id, "sandbox", { name: "rw", scopes: ["payments:write", "payments:read"], expiresInDays: 30 });
    const body = { amount: 25000, description: "API test", expires_in_minutes: 30 };
    expect((await createPay(req("/api/v1/payments", ro.secret, { method: "POST", body, idem: "idem-key-0001" }), ctx())).status).toBe(403);
    expect((await createPay(req("/api/v1/payments", rw.secret, { method: "POST", body }), ctx())).status).toBe(400);
    const r1 = await createPay(req("/api/v1/payments", rw.secret, { method: "POST", body, idem: "idem-key-0001" }), ctx());
    expect(r1.status).toBe(201);
    const j1 = await r1.json();
    expect(j1.demo).toBe(true);
    const r2 = await createPay(req("/api/v1/payments", rw.secret, { method: "POST", body, idem: "idem-key-0001" }), ctx());
    expect(r2.headers.get("idempotent-replayed")).toBe("true");
    expect((await r2.json()).id).toBe(j1.id);
    const r3 = await createPay(req("/api/v1/payments", rw.secret, { method: "POST", body: { ...body, amount: 30000 }, idem: "idem-key-0001" }), ctx());
    expect(r3.status).toBe(422);
    await revokeApiKey(actor(u.id), u.id, rw.key.id);
    expect((await createPay(req("/api/v1/payments", rw.secret, { method: "POST", body, idem: "idem-key-0002" }), ctx())).status).toBe(401);
    expect((await listPay(req("/api/v1/payments", "fxb_test_bukan_key_yang_valid_sama_sekali"), ctx())).status).toBe(401);
  });

  it("production tidak bisa dipakai sebelum diaktifkan admin", async () => {
    const u = await makeUser();
    const k = await createApiKey(actor(u.id), u.id, "production", { name: "live", scopes: ["payments:write"], expiresInDays: null });
    const r = await createPay(req("/api/v1/payments", k.secret, { method: "POST", body: { amount: 25000, description: "Live", expires_in_minutes: 30 }, idem: "live-0001" }), ctx());
    expect(r.status).toBe(403);
  });

  it("signature webhook keluar dapat diverifikasi merchant", () => {
    const body = JSON.stringify({ id: "evt_1" });
    const s = signPayload("whsec_test", body, 1700000000);
    expect(s.header).toBe(`t=1700000000,v1=${hmacHex("whsec_test", `1700000000.${body}`)}`);
  });
});
