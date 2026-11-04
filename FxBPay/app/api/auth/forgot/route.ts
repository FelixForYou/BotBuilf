import { z } from "zod";
import { requestPasswordReset } from "@/lib/auth/service";
import { assertSameOrigin, body, clientIp, json, route } from "@/lib/http";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const { email } = await body(req, z.object({ email: z.string().trim().email("Email tidak valid") }));
  await requestPasswordReset(email, clientIp(req));
  return json({ ok: true, message: "Jika email terdaftar, tautan atur ulang sudah dikirim." });
});
