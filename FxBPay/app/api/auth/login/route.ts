import { z } from "zod";
import { login } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import { assertSameOrigin, body, clientIp, json, route, userAgent } from "@/lib/http";

const S = z.object({ email: z.string().trim().min(3).max(160), password: z.string().min(1).max(200) });

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const { email, password } = await body(req, S);
  const meta = { ip: clientIp(req), userAgent: userAgent(req) };
  const u = await login(email, password, meta);
  await createSession(u, meta);
  const redirect = u.totpEnabled ? "/masuk/2fa" : u.role === "admin" ? "/app/pengaturan/keamanan?wajib2fa=1" : u.onboardedAt ? "/app" : "/onboarding";
  return json({ ok: true, redirect });
});
