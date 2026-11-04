import "server-only";
import type { NextRequest } from "next/server";
import type { ZodType } from "zod";
import { apiAuth, actorOf, type Auth } from "./auth/session";
import { assertSameOrigin, body, clientIp, json, route } from "./http";
import type { Actor } from "./audit";
import { rateLimit } from "./ratelimit";

type Ctx<S, P> = { auth: Auth; actor: Actor; input: S; req: NextRequest; params: P; ip: string };

/** Route Handler ber-sesi: CSRF + autentikasi (+admin/2FA) + validasi zod + rate limit per pengguna. */
export function authed<S = Record<string, never>, P = Record<string, string>>(
  opts: { admin?: boolean; schema?: ZodType<S>; limit?: number },
  fn: (ctx: Ctx<S, P>) => Promise<unknown>,
) {
  return route(async (req: NextRequest, context: { params: Promise<P> }) => {
    assertSameOrigin(req);
    const auth = await apiAuth({ admin: opts.admin });
    await rateLimit(`u:${auth.user.id}:${req.nextUrl.pathname.split("/").slice(0, 4).join("/")}`, opts.limit ?? 60, 60);
    const input = opts.schema ? await body(req, opts.schema) : ({} as S);
    const ip = clientIp(req);
    const out = await fn({ auth, actor: actorOf(auth, ip), input, req, params: (await context?.params) ?? ({} as P), ip });
    return out instanceof Response ? out : json(out ?? { ok: true });
  });
}
