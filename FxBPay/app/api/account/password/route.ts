import { z } from "zod";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { createSession } from "@/lib/auth/session";
import { userAgent } from "@/lib/http";

const S = z.object({ current: z.string().min(1), next: z.string().min(1).max(200) });
export const POST = authed({ schema: S, limit: 10 }, async ({ auth, actor, input, req, ip }) => {
  if (!(await verifyPassword(input.current, auth.user.passwordHash))) throw new AppError("invalid_password", "Password saat ini salah", 400);
  const p = passwordProblem(input.next);
  if (p) throw new AppError("weak_password", p);
  await db.update(users).set({ passwordHash: await hashPassword(input.next), passwordChangedAt: sql`now()` }).where(eq(users.id, auth.user.id));
  await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, auth.user.id), isNull(sessions.revokedAt), ne(sessions.id, auth.session.id)));
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, auth.session.id));
  const [fresh] = await db.select().from(users).where(eq(users.id, auth.user.id));
  // Sesi baru untuk perangkat ini; 2FA sudah dibuktikan di sesi sebelumnya.
  await createSession({ ...fresh, totpEnabled: false }, { ip, userAgent: userAgent(req) });
  await audit(actor, "account.password_change", { type: "user", id: auth.user.id });
  await notifyUser(auth.user.id, "security", "Password diubah", "Semua sesi lain telah dikeluarkan.");
  return { message: "Password diperbarui. Sesi lain telah dikeluarkan." };
});
