import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { authed } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { AppError, notFound } from "@/lib/errors";
import { notifyUser } from "@/lib/notify";

const S = z.discriminatedUnion("action", [
  z.object({ action: z.literal("freeze"), reason: z.string().trim().min(5, "Alasan wajib diisi") }),
  z.object({ action: z.literal("unfreeze") }),
  z.object({ action: z.literal("role"), role: z.enum(["user", "admin"]) }),
  z.object({ action: z.literal("revoke_sessions") }),
]);

export const POST = authed<z.infer<typeof S>, { id: string }>({ admin: true, schema: S }, async ({ auth, actor, input, params }) => {
  const [u] = await db.select().from(users).where(eq(users.id, params.id));
  if (!u) throw notFound("Pengguna");
  if (u.id === auth.user.id && input.action !== "revoke_sessions") throw new AppError("self", "Tidak dapat mengubah akun sendiri", 400);
  if (input.action === "freeze") {
    await db.update(users).set({ status: "frozen", frozenReason: input.reason }).where(eq(users.id, u.id));
    await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, u.id), isNull(sessions.revokedAt)));
    await notifyUser(u.id, "security", "Akun dibekukan", `Alasan: ${input.reason}. Hubungi admin untuk informasi lebih lanjut.`);
  }
  if (input.action === "unfreeze") {
    await db.update(users).set({ status: "active", frozenReason: null }).where(eq(users.id, u.id));
    await notifyUser(u.id, "security", "Akun diaktifkan kembali", "Akun Anda dapat digunakan kembali.");
  }
  if (input.action === "role") await db.update(users).set({ role: input.role }).where(eq(users.id, u.id));
  if (input.action === "revoke_sessions") await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, u.id), isNull(sessions.revokedAt)));
  await audit(actor, `admin.user_${input.action}`, { type: "user", id: u.id }, input);
  return { message: "Perubahan disimpan" };
});
