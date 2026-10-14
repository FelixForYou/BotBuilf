import type { NextRequest } from "next/server";
import { openSession, sessionCookieName, type SessionPayload } from "./session";
import type { SessionInfo } from "@/types/panel";

/**
 * Sesi dari cookie HttpOnly, atau dari header `Authorization: Bearer v1.…`
 * (cadangan untuk frontend GitHub Pages di browser yang memblokir cookie lintas situs;
 * token itu terenkripsi — isinya, termasuk PTLA, tidak dapat dibaca browser).
 */
export function sessionFromRequest(req: NextRequest): { session: SessionPayload | null; hadCookie: boolean } {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer v1.")) {
    const s = openSession(auth.slice("Bearer ".length));
    if (s) return { session: s, hadCookie: false };
  }
  const cookie = req.cookies.get(sessionCookieName())?.value;
  return { session: openSession(cookie), hadCookie: !!cookie };
}

/** Informasi sesi yang aman untuk frontend (tanpa API key). */
export function publicSessionInfo(s: SessionPayload): SessionInfo {
  return { panelHost: s.host, panelOrigin: s.origin, connectedAt: s.iat, expiresAt: s.exp };
}
