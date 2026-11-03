import { destroySession, requireUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { one, tx, run } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route, str } from "@/lib/http";

export const PATCH = route(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireUser();
  const b = await readJson(req);
  const name = str(b.name, "Nama", { min: 2, max: 60 });
  await run("UPDATE users SET name=? WHERE id=?", [name, u.id]);
  return ok({ name });
});

export const DELETE = route(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireUser();
  const b = await readJson(req);
  const row = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id=?", [u.id]);
  if (!row || !(await verifyPassword(str(b.password, "Password", { max: 128 }), row.password_hash))) throw new AppError("INVALID_CREDENTIALS", "Password salah.", 401);
  if (u.role === "admin") {
    const admins = await one<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE role='admin'");
    if (Number(admins?.n) <= 1) throw new AppError("LAST_ADMIN", "Tidak bisa menghapus satu-satunya admin.", 400);
  }
  await tx([
    { sql: "DELETE FROM api_keys WHERE user_id=?", args: [u.id] },
    { sql: "DELETE FROM sessions WHERE user_id=?", args: [u.id] },
    { sql: "DELETE FROM users WHERE id=?", args: [u.id] },
  ]);
  await destroySession();
  return ok(true);
});
