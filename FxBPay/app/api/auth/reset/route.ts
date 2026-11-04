import { z } from "zod";
import { resetPassword } from "@/lib/auth/service";
import { assertSameOrigin, body, clientIp, json, route } from "@/lib/http";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const { token, password } = await body(req, z.object({ token: z.string().min(20), password: z.string().min(1).max(200) }));
  await resetPassword(token, password, clientIp(req));
  return json({ ok: true, redirect: "/masuk", message: "Password diperbarui. Silakan masuk." });
});
