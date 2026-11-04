import "server-only";
import type { NextRequest } from "next/server";
import { authenticateApiKey, type ApiScope, type ApiCaller } from "./apikeys";
import { json, route } from "./http";

/** Route merchant API v1: Bearer API key + scope + rate limit. Tanpa cookie → tidak butuh CSRF. */
export function merchantRoute<P = Record<string, string>>(scope: ApiScope, fn: (ctx: { req: NextRequest; caller: ApiCaller; params: P }) => Promise<{ status?: number; body: unknown } | Response>) {
  return route(async (req: NextRequest, context: { params: Promise<P> }) => {
    const caller = await authenticateApiKey(req, scope);
    const r = await fn({ req, caller, params: (await context?.params) ?? ({} as P) });
    if (r instanceof Response) return r;
    return json(r.body, r.status ?? 200, { "X-FxB-Env": caller.env });
  });
}
