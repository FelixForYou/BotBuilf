import { createSession, requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { one, run } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, memLimit, ok, readJson, route, str } from "@/lib/http";

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireUser();
  memLimit(`pw:${u.id}`, 5, 1 / 60);
  const b = await readJson(req);
  const current = str(b.current, "Password lama", { max: 128 });
  const next = str(b.next, "Password baru", { min: 8, max: 128 });
  const row = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id=?", [u.id]);
  if (!row || !(await verifyPassword(current, row.password_hash))) throw new AppError("INVALID_CREDENTIALS", "Password lama salah.", 401);
  await run("UPDATE users SET password_hash=? WHERE id=?", [await hashPassword(next), u.id]);
  // Keluarkan semua sesi lain, buat sesi baru untuk perangkat ini.
  await run("DELETE FROM sessions WHERE user_id=?", [u.id]);
  await createSession(u.id);
  return ok(true);
});
