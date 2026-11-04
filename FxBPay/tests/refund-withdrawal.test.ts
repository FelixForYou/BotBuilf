import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { getUserBalances, getSystemBalances, verifyLedgerIntegrity } from "@/lib/ledger";
import { releaseHeldFunds } from "@/lib/payments/service";
import { requestRefund } from "@/lib/refunds";
import { requestWithdrawal, reviewWithdrawal } from "@/lib/withdrawals";
import { adjustBalance, reverseJournal } from "@/lib/admin-ledger";
import { SYSTEM } from "@/lib/audit";
import { makePayment, makeUser, payViaNotify } from "./helpers";

async function fundedUser(amount = 500_000n) {
  const u = await makeUser();
  const p = await makePayment(u.id, amount);
  await payViaNotify(p);
  await db.update(payments).set({ heldUntil: new Date(Date.now() - 1000) }).where(eq(payments.id, p.id));
  await releaseHeldFunds();
  return { u, p };
}
const actor = (id: string) => ({ id, email: "t@test" });
const dest = { destinationType: "bank" as const, destinationBank: "BCA", destinationAccount: "1234567890", destinationName: "Penguji" };

describe("refund", () => {
  it("refund sebagian & penuh membuat entri ledger baru", async () => {
    const { u, p } = await fundedUser();
    const before = await getUserBalances(db, u.id, "sandbox");
    const r1 = await requestRefund(actor(u.id), { paymentId: p.id, ownerUserId: u.id, amount: 100_000n, reason: "Barang rusak" });
    expect(r1.status).toBe("SUCCEEDED");
    expect((await db.select().from(payments).where(eq(payments.id, p.id)))[0].status).toBe("PARTIALLY_REFUNDED");
    await expect(requestRefund(actor(u.id), { paymentId: p.id, ownerUserId: u.id, amount: p.amount, reason: "Lebih" })).rejects.toThrow(/Maksimal/);
    const after = await getUserBalances(db, u.id, "sandbox");
    expect(before.available - after.available).toBe(100_000n);
    expect(after.reserved).toBe(0n);
    expect((await verifyLedgerIntegrity(db, "sandbox")).ok).toBe(true);
  });

  it("refund ditolak bila saldo tersedia tidak cukup", async () => {
    const u = await makeUser();
    const p = await makePayment(u.id);
    await payViaNotify(p); // masih tertahan
    await expect(requestRefund(actor(u.id), { paymentId: p.id, ownerUserId: u.id, amount: 10_000n, reason: "Coba" })).rejects.toThrow(/Saldo tidak mencukupi/);
    expect((await db.select().from(payments).where(eq(payments.id, p.id)))[0].status).toBe("PAID");
  });
});

describe("penarikan", () => {
  it("cadangan saat pengajuan, kembali saat ditolak, keluar saat dicairkan", async () => {
    const { u } = await fundedUser();
    const b0 = await getUserBalances(db, u.id, "sandbox");
    const w = await requestWithdrawal(actor(u.id), u.id, "sandbox", { amount: 100_000n, ...dest });
    let b = await getUserBalances(db, u.id, "sandbox");
    expect(b.available).toBe(b0.available - 100_000n);
    expect(b.reserved).toBe(100_000n);
    await reviewWithdrawal(SYSTEM, w.id, { action: "reject", reason: "Nama rekening tidak sesuai" });
    b = await getUserBalances(db, u.id, "sandbox");
    expect(b.available).toBe(b0.available);
    expect(b.reserved).toBe(0n);

    const w2 = await requestWithdrawal(actor(u.id), u.id, "sandbox", { amount: 50_000n, ...dest });
    await reviewWithdrawal(SYSTEM, w2.id, { action: "approve" });
    await expect(reviewWithdrawal(SYSTEM, w2.id, { action: "paid", proofReference: "" })).rejects.toThrow(/bukti/i);
    const paid = await reviewWithdrawal(SYSTEM, w2.id, { action: "paid", proofReference: "TRX-BCA-0001" });
    expect(paid.status).toBe("PAID");
    b = await getUserBalances(db, u.id, "sandbox");
    expect(b.available).toBe(b0.available - 50_000n);
    expect(b.reserved).toBe(0n);
    await expect(reviewWithdrawal(SYSTEM, w2.id, { action: "reject", reason: "terlambat" })).rejects.toThrow();
  });

  it("pengajuan paralel tidak bisa memakai saldo yang sama dua kali", async () => {
    const { u } = await fundedUser(300_000n);
    const avail = (await getUserBalances(db, u.id, "sandbox")).available;
    const each = avail / 2n + 1n;
    const res = await Promise.allSettled(Array.from({ length: 8 }, () => requestWithdrawal(actor(u.id), u.id, "sandbox", { amount: each, ...dest })));
    expect(res.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const b = await getUserBalances(db, u.id, "sandbox");
    expect(b.available).toBe(avail - each);
    expect(b.available >= 0n).toBe(true);
  });

  it("idempotency key mencegah pengajuan ganda", async () => {
    const { u } = await fundedUser();
    const a = await requestWithdrawal(actor(u.id), u.id, "sandbox", { amount: 20_000n, ...dest, idempotencyKey: "same-key-123" });
    const b = await requestWithdrawal(actor(u.id), u.id, "sandbox", { amount: 20_000n, ...dest, idempotencyKey: "same-key-123" });
    expect(b.id).toBe(a.id);
    expect((await getUserBalances(db, u.id, "sandbox")).reserved).toBe(20_000n);
  });

  it("status tidak pasti wajib dikonfirmasi sebelum ditandai gagal", async () => {
    const { u } = await fundedUser();
    const w = await requestWithdrawal(actor(u.id), u.id, "sandbox", { amount: 30_000n, ...dest });
    await reviewWithdrawal(SYSTEM, w.id, { action: "approve" });
    await reviewWithdrawal(SYSTEM, w.id, { action: "uncertain", reason: "Bank timeout" });
    await expect(reviewWithdrawal(SYSTEM, w.id, { action: "failed", reason: "coba lagi" })).rejects.toThrow(/konfirmasi/);
    const f = await reviewWithdrawal(SYSTEM, w.id, { action: "failed", reason: "Dikonfirmasi tidak terkirim oleh bank" });
    expect(f.status).toBe("FAILED");
    expect((await getUserBalances(db, u.id, "sandbox")).reserved).toBe(0n);
  });
});

describe("koreksi admin", () => {
  it("penyesuaian & reversal menjaga persamaan akuntansi", async () => {
    const u = await makeUser();
    const j = await adjustBalance(SYSTEM, { userId: u.id, env: "sandbox", direction: "credit", amount: 12_345n, reason: "Kompensasi gangguan layanan" });
    expect((await getUserBalances(db, u.id, "sandbox")).available).toBe(12_345n);
    await expect(adjustBalance(SYSTEM, { userId: u.id, env: "sandbox", direction: "debit", amount: 20_000n, reason: "Koreksi berlebih sekali" })).rejects.toThrow(/Saldo tidak mencukupi/);
    await reverseJournal(SYSTEM, j.journalId, "Salah input nominal koreksi");
    expect((await getUserBalances(db, u.id, "sandbox")).available).toBe(0n);
    await expect(reverseJournal(SYSTEM, j.journalId, "Salah input nominal koreksi")).rejects.toThrow(/sudah/);
    const s = await getSystemBalances(db, "sandbox");
    expect(s.providerClearing + s.settlementBank).toBe(s.userAvailable + s.userHeld + s.userReserved + s.platformFee + s.platformAdjustment);
  });
});
