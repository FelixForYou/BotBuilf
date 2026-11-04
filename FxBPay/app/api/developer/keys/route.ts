import { z } from "zod";
import { authed } from "@/lib/api-helpers";
import { currentEnv } from "@/lib/auth/session";
import { API_SCOPES, createApiKey } from "@/lib/apikeys";
import { AppError } from "@/lib/errors";

const S = z.object({
  name: z.string().trim().min(2).max(60),
  scopes: z.array(z.enum(API_SCOPES)).min(1, "Pilih minimal satu scope"),
  expiresInDays: z.coerce.number().int().min(0).max(730),
});
export const POST = authed({ schema: S, limit: 10 }, async ({ auth, actor, input }) => {
  const env = await currentEnv();
  if (env === "production" && !auth.user.emailVerifiedAt) throw new AppError("email_unverified", "Verifikasi email sebelum membuat API key Production", 403);
  const { key, secret } = await createApiKey(actor, auth.user.id, env, { name: input.name, scopes: input.scopes, expiresInDays: input.expiresInDays || null });
  return { id: key.id, secret, message: "API key dibuat. Simpan sekarang — tidak akan ditampilkan lagi." };
});
