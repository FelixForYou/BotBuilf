import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ledgerJournals, payments } from "@/lib/db/schema";
import { getUserBalances, verifyLedgerIntegrity } from "@/lib/ledger";
import { releaseHeldFunds, startCheckout, sweepExpired } from "@/lib/payments/service";
import { canTransition } from "@/lib/payments/status";
import { sendHarnessNotify, buildFinishNotify } from "@/lib/uat/harness";
import { handleDanaNotify } from "@/lib/dana/notify";
import { generateKeyPairSync } from "node:crypto";
import { makePayment, makeUser, payViaNotify } from "./helpers";

const get = async (id: string) => (await db.select().from(payments).where(eq(payments.id, id)))[0];

describe("alur pembayaran", () => {
  it("CREATED → PENDING → PAID; saldo tertahan lalu dilepas", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    expect(p.status).toBe("CREATED");
    expect(p.net + p.fee).toBe(p.amount);
    const c = await startCheckout(p.publicId);
    expect(c.kind).toBe("redirect");
    expect((await get(p.id)).status).toBe("PENDING");
    const r = await payViaNotify(p);
    expect(r.response.outcome).toBe("credited");
    expect(r.response.body.responseCode).toBe("2005600");
    let b = await getUserBalances(db, u.id, "sandbox");
    expect(b.held).toBe(p.net);
    expect(b.available).toBe(0n);
    await db.update(payments).set({ heldUntil: new Date(Date.now() - 1000) }).where(eq(payments.id, p.id));
    await releaseHeldFunds();
    b = await getUserBalances(db, u.id, "sandbox");
    expect(b.available).toBe(p.net);
    expect(b.held).toBe(0n);
    expect((await verifyLedgerIntegrity(db, "sandbox")).ok).toBe(true);
  });

  it("callback duplikat tidak menggandakan saldo", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    const n = buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" });
    const outs = [];
    for (let i = 0; i < 4; i++) outs.push((await sendHarnessNotify(n)).response.outcome);
    expect(outs).toEqual(["credited", "duplicate", "duplicate", "duplicate"]);
    expect((await getUserBalances(db, u.id, "sandbox")).held).toBe(p.net);
    const j = await db.select().from(ledgerJournals).where(eq(ledgerJournals.referenceId, p.id));
    expect(j.filter((x) => x.type === "payment_capture")).toHaveLength(1);
  });

  it("callback paralel (race) → tepat satu kredit", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    const n = buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" });
    const outs = await Promise.all(Array.from({ length: 10 }, () => sendHarnessNotify(n).then((x) => x.response.outcome)));
    expect(outs.filter((o) => o === "credited")).toHaveLength(1);
    expect((await getUserBalances(db, u.id, "sandbox")).held).toBe(p.net);
  });

  it("nominal tidak cocok tidak dikreditkan", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    const r = await payViaNotify(p, { amount: p.amount + 1n });
    expect(r.response.outcome).toBe("amount_mismatch");
    const g = await get(p.id);
    expect(g.status).not.toBe("PAID");
    expect(g.needsReview).toBe(true);
    expect((await getUserBalances(db, u.id, "sandbox")).held).toBe(0n);
  });

  it("signature salah ditolak 401", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    const rogue = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } }).privateKey;
    const r = await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" }), { signWith: rogue });
    expect(r.response.httpStatus).toBe(401);
    const none = await handleDanaNotify("sandbox", "POST", "/api/webhooks/dana/sandbox", new Headers(), "{}");
    expect(none.httpStatus).toBe(401);
    expect((await get(p.id)).status).toBe("CREATED");
  });

  it("notifikasi harness ditolak di production", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    const body = JSON.stringify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" }));
    const r = await handleDanaNotify("production", "POST", "/api/webhooks/dana/production", new Headers({ "x-signature": "abc", "x-timestamp": new Date().toISOString() }), body);
    expect(r.httpStatus).toBe(401);
  });

  it("kedaluwarsa lalu callback terlambat tetap dicatat dan ditandai", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    await db.update(payments).set({ expiresAt: new Date(Date.now() - 10 * 60_000) }).where(eq(payments.id, p.id));
    await sweepExpired();
    expect((await get(p.id)).status).toBe("EXPIRED");
    const r = await payViaNotify(p);
    expect(r.response.outcome).toBe("credited");
    const g = await get(p.id);
    expect(g.status).toBe("PAID");
    expect(g.lateCallback).toBe(true);
  });

  it("status 05 setelah lunas diabaikan (tidak berurutan)", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    await payViaNotify(p);
    const r = await payViaNotify(p, { status: "05" });
    expect(r.response.outcome).toBe("ignored_out_of_order");
    expect((await get(p.id)).status).toBe("PAID");
  });

  it("transisi status yang tidak valid ditolak", () => {
    expect(canTransition("PAID", "PENDING")).toBe(false);
    expect(canTransition("EXPIRED", "PAID")).toBe(false);
    expect(canTransition("EXPIRED", "PAID", true)).toBe(true);
    expect(canTransition("REFUNDED", "PAID", true)).toBe(false);
  });

  it("nominal pembayaran tidak bisa diubah setelah dibuat", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    await expect(db.update(payments).set({ amount: 1n, net: 1n, fee: 0n }).where(eq(payments.id, p.id))).rejects.toThrow();
  });
});
