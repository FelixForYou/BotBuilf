import "server-only";
import { redirect } from "next/navigation";
import { readSession, publicSessionInfo } from "./server-session";
import { getSessionSecretStatus } from "./session";
import type { SessionInfo } from "@/types/panel";

export type GuardResult = { ok: true; session: SessionInfo } | { ok: false; configError: string };

/** Untuk halaman yang butuh koneksi: cek konfigurasi lalu sesi; tanpa sesi → ke halaman koneksi. */
export async function requireSession(): Promise<GuardResult> {
  const cfg = getSessionSecretStatus();
  if (!cfg.ok) return { ok: false, configError: cfg.message };
  const s = await readSession();
  if (!s) redirect("/");
  return { ok: true, session: publicSessionInfo(s) };
}
