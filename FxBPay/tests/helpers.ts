import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createPayment } from "@/lib/payments/service";
import { buildFinishNotify, sendHarnessNotify } from "@/lib/uat/harness";
import { randomUUID } from "node:crypto";

export async function makeUser(role: "user" | "admin" = "user") {
  const [u] = await db.insert(users).values({ email: `u-${randomUUID()}@test.local`, name: "Tester", passwordHash: "x", role, emailVerifiedAt: new Date() }).returning();
  return u;
}
export async function makePayment(userId: string, amount = 100_000n) {
  return createPayment(userId, "sandbox", { amount, description: "Tes", expiresInMinutes: 30, providerOverride: "demo" });
}
export async function payViaNotify(p: { partnerReferenceNo: string; amount: bigint }, opts: { amount?: bigint; status?: "00" | "05" } = {}) {
  return sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: opts.amount ?? p.amount, status: opts.status ?? "00" }));
}
