import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { one } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, clientIp, memLimit, ok, readJson, route, str } from "@/lib/http";

const DUMMY = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  const b = await readJson(req);
  const email = str(b.email, "Email", { max: 120 }).toLowerCase();
  const password = str(b.password, "Password", { max: 128 });
  memLimit(`login:${clientIp(req)}`, 10, 1 / 30);
  memLimit(`login-acct:${email}`, 6, 1 / 60);
  const u = await one<{ id: string; name: string; email: string; role: string; status: string; password_hash: string }>(
    "SELECT id,name,email,role,status,password_hash FROM users WHERE email=?",
    [email],
  );
  const valid = await verifyPassword(password, u?.password_hash ?? DUMMY);
  if (!u || !valid) throw new AppError("INVALID_CREDENTIALS", "Email atau password salah.", 401);
  if (u.status !== "active") throw new AppError("ACCOUNT_SUSPENDED", "Akun ditangguhkan. Hubungi admin.", 403);
  await createSession(u.id);
  return ok({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});
