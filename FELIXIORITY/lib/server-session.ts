import "server-only";
import { cookies } from "next/headers";
import { openSession, SESSION_COOKIE, type SessionPayload } from "./session";
import type { SessionInfo } from "@/types/panel";

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return openSession(store.get(SESSION_COOKIE)?.value);
}

/** Informasi sesi yang aman untuk frontend (tanpa API key). */
export function publicSessionInfo(s: SessionPayload): SessionInfo {
  return { panelHost: s.host, panelOrigin: s.origin, connectedAt: s.iat, expiresAt: s.exp };
}
