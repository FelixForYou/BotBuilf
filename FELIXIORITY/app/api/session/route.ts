import { NextResponse, type NextRequest } from "next/server";
import { toPublicError } from "@/lib/errors";
import { publicSessionInfo, sessionFromRequest } from "@/lib/request-session";
import { applyCors, assertNotCrossSite, preflight } from "@/lib/security";
import { ConfigError, cookieOptions, getSessionSecretStatus, sessionCookieName } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return preflight(req);
}

/** Status sesi untuk frontend: info panel (tanpa API key) atau 401. */
export async function GET(req: NextRequest) {
  try {
    assertNotCrossSite(req);
    const cfg = getSessionSecretStatus();
    if (!cfg.ok) throw new ConfigError(cfg.message);
    const { session, hadCookie } = sessionFromRequest(req);
    if (!session) {
      const res = NextResponse.json({ error: "Belum terhubung.", code: "NOT_CONNECTED" }, { status: 401 });
      if (hadCookie) res.cookies.set(sessionCookieName(), "", cookieOptions(0));
      return applyCors(req, res);
    }
    return applyCors(req, NextResponse.json(publicSessionInfo(session)));
  } catch (err) {
    const { status, body } = toPublicError(err);
    return applyCors(req, NextResponse.json(body, { status }));
  }
}
