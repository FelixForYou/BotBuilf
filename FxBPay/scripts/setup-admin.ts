/**
 * Membuat akun admin pertama secara aman dari terminal server (bukan dari web).
 * Password dibaca dari stdin tersembunyi atau env ADMIN_PASSWORD. 2FA wajib diaktifkan saat login pertama.
 *   npm run setup:admin -- admin@domain.com "Nama Admin"
 */
import { createInterface } from "node:readline";
import { eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { hashPassword, passwordProblem } from "../lib/password";
import { audit } from "../lib/audit";

const [email, name = "Administrator"] = process.argv.slice(2);
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Pemakaian: npm run setup:admin -- email@domain.com "Nama"');
  process.exit(1);
}
async function ask(q: string): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
    if (s.includes(q)) process.stdout.write(s);
  };
  return new Promise((res) => rl.question(q, (a) => (rl.close(), process.stdout.write("\n"), res(a))));
}
const pw = await ask("Password admin (min 10, huruf+angka): ");
const problem = passwordProblem(pw);
if (problem) {
  console.error(problem);
  process.exit(1);
}
const existing = await db.select().from(users).where(eq(sql`lower(${users.email})`, email.toLowerCase()));
if (existing[0]) {
  await db.update(users).set({ role: "admin", passwordHash: await hashPassword(pw), passwordChangedAt: new Date(), emailVerifiedAt: existing[0].emailVerifiedAt ?? new Date() }).where(eq(users.id, existing[0].id));
  await audit({ id: null, email: "cli:setup-admin" }, "user.promote_admin", { type: "user", id: existing[0].id }, { email });
  console.log(`Akun ${email} dijadikan admin. Aktifkan 2FA saat login pertama.`);
} else {
  const [u] = await db.insert(users).values({ email: email.toLowerCase(), name, passwordHash: await hashPassword(pw), role: "admin", emailVerifiedAt: new Date(), storeName: "FxB Pay" }).returning();
  await audit({ id: null, email: "cli:setup-admin" }, "user.create_admin", { type: "user", id: u.id }, { email });
  console.log(`Admin ${email} dibuat. Masuk lalu aktifkan 2FA (wajib untuk admin).`);
}
process.exit(0);
