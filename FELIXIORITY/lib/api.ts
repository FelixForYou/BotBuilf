"use client";
// Klien API frontend. Pada Vercel, API berada di origin yang sama (API_BASE kosong).
// Pada GitHub Pages, API berada di backend Vercel (NEXT_PUBLIC_API_BASE).
import type { SessionInfo } from "@/types/panel";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/+$/, "");
/** Prefiks path situs (mis. "/BotBuilf" di GitHub Pages). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * Token sesi terenkripsi — hanya dipakai bila browser memblokir cookie lintas situs.
 * Disimpan di memori tab saja (bukan localStorage/sessionStorage/URL); hilang saat halaman dimuat ulang.
 * Token tidak bisa didekripsi di browser, jadi PTLA tetap tidak terbaca.
 */
let memoryToken: string | null = null;

export function setMemoryToken(token: string | null) {
  memoryToken = token;
}

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (memoryToken) headers.set("Authorization", `Bearer ${memoryToken}`);
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: API_BASE ? "include" : "same-origin",
    cache: "no-store",
  });
}

export type SessionCheck =
  | { state: "connected"; session: SessionInfo }
  | { state: "disconnected" }
  | { state: "config"; message: string }
  | { state: "unreachable"; message: string };

let cached: Promise<SessionCheck> | null = null;

/** Cek sesi sekali per pemuatan aplikasi (dibagi antar halaman). */
export function checkSession(force = false): Promise<SessionCheck> {
  if (!cached || force) {
    cached = (async (): Promise<SessionCheck> => {
      try {
        const res = await apiFetch("/api/session");
        const body = await res.json().catch(() => ({}));
        if (res.ok) return { state: "connected", session: body as SessionInfo };
        if (res.status === 401) return { state: "disconnected" };
        if (body?.code === "CONFIG") return { state: "config", message: body.error };
        return { state: "unreachable", message: body?.error ?? `Backend merespons HTTP ${res.status}.` };
      } catch {
        return {
          state: "unreachable",
          message: API_BASE
            ? `Backend ${API_BASE} tidak dapat dihubungi. Pastikan backend Vercel aktif dan ALLOWED_ORIGINS berisi alamat situs ini.`
            : "Server aplikasi tidak dapat dihubungi.",
        };
      }
    })();
    cached.then((r) => {
      if (r.state !== "connected") cached = null;
    });
  }
  return cached;
}

export function forgetSession() {
  cached = null;
  memoryToken = null;
}

/** Pindah halaman penuh dengan memperhitungkan BASE_PATH. */
export function hardNavigate(path: string) {
  window.location.replace(`${BASE_PATH}${path}`);
}
