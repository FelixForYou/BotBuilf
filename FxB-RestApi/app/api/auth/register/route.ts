import { createSession } from "@/lib/auth";
import { hashPassword, id, newApiKey } from "@/lib/crypto";
import { one, tx } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, clientIp, memLimit, ok, readJson, route, str } from "@/lib/http";
import { getSettings } from "@/lib/settings";

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  memLimit(`reg:${clientIp(req)}`, 5, 1 / 120);
  const s = await getSettings();
  if (!s.registration_open) throw new AppError("REGISTRATION_CLOSED", "Pendaftaran sedang ditutup.", 403);
  const b = await readJson(req);
  const name = str(b.name, "Nama", { min: 2, max: 60 });
  const email = str(b.email, "Email", { max: 120 }).toLowerCase();
  const password = str(b.password, "Password", { min: 8, max: 128 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new AppError("BAD_REQUEST", "Format email tidak valid.");
  if (await one("SELECT id FROM users WHERE email=?", [email])) throw new AppError("EMAIL_TAKEN", "Email sudah terdaftar. Silakan login.", 409);
  const count = await one<{ n: number }>("SELECT COUNT(*) AS n FROM users");
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const role = (adminEmail && email === adminEmail) || (!adminEmail && Number(count?.n) === 0) ? "admin" : "user";
  const userId = id("usr_");
  const key = newApiKey();
  const now = Date.now();
  await tx([
    { sql: "INSERT INTO users (id,email,name,password_hash,role,status,created_at) VALUES (?,?,?,?,?,'active',?)", args: [userId, email, name, await hashPassword(password), role, now] },
    { sql: "INSERT INTO api_keys (id,user_id,name,prefix,key_hash,tier,status,created_at) VALUES (?,?,?,?,?,'free','active',?)", args: [id("key_"), userId, "Default key", key.prefix, key.hash, now] },
  ]);
  await createSession(userId);
  return ok({ user: { id: userId, name, email, role }, apiKey: key.key });
});
