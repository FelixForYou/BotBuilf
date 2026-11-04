/**
 * Data contoh KHUSUS DEVELOPMENT. Menolak berjalan bila NODE_ENV=production.
 * Semua transaksi contoh berada di env SANDBOX dengan provider DEMO dan melewati jalur ledger yang sama.
 */
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { hashPassword } from "../lib/password";
import { createPayment, releaseHeldFunds } from "../lib/payments/service";
import { buildFinishNotify, sendHarnessNotify } from "../lib/uat/harness";

if (process.env.NODE_ENV === "production") {
  console.error("Seed development tidak boleh dijalankan di production.");
  process.exit(1);
}
const email = "demo@fxbpay.test";
let [u] = await db.select().from(users).where(eq(users.email, email));
if (!u) {
  [u] = await db.insert(users).values({ email, name: "Demo Merchant", storeName: "Toko Demo", phone: "081200000000", passwordHash: await hashPassword("demopassword123"), emailVerifiedAt: new Date(), onboardedAt: new Date() }).returning();
}
const items = [
  ["Kaos FELIXIORITY", 125_000n],
  ["Topi hitam", 85_000n],
  ["Stiker pack", 15_000n],
  ["Hoodie mint", 275_000n],
  ["Totebag", 60_000n],
] as const;
for (const [desc, amount] of items) {
  const p = await createPayment(u.id, "sandbox", { amount, description: desc, orderRef: `INV-${Math.floor(Math.random() * 9000 + 1000)}`, expiresInMinutes: 60, providerOverride: "demo" });
  if (desc !== "Totebag") await sendHarnessNotify(buildFinishNotify({ partnerReferenceNo: p.partnerReferenceNo, amount: p.amount, status: "00" }));
}
await db.execute(`UPDATE payments SET held_until = now() - interval '1 second' WHERE user_id = '${u.id}' AND released_at IS NULL AND held_until IS NOT NULL AND description <> 'Hoodie mint'`);
await releaseHeldFunds();
console.log(`Seed selesai. Masuk sebagai ${email} / demopassword123 (mode Sandbox).`);
process.exit(0);
