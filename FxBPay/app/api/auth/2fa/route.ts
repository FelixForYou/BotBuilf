import { z } from "zod";
import { completeMfa } from "@/lib/auth/service";
import { apiAuth } from "@/lib/auth/session";
import { assertSameOrigin, body, clientIp, json, route, userAgent } from "@/lib/http";

const S = z.object({ code: z.string().trim().min(6).max(8) });

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const a = await apiAuth({ allowPendingMfa: true });
  const { code } = await body(req, S);
  await completeMfa(a.session.id, a.user, code, { ip: clientIp(req), userAgent: userAgent(req) });
  return json({ ok: true, redirect: a.user.role === "admin" ? "/admin" : "/app" });
});
