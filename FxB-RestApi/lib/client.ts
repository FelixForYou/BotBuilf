"use client";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

/** Panggil API internal (dashboard/admin). Mengembalikan `data` atau melempar ApiError. */
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(path, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("NETWORK", "Tidak dapat terhubung ke server. Periksa koneksi internet.", 0);
  }
  const j = (await r.json().catch(() => null)) as { ok?: boolean; data?: T; error?: { code: string; message: string; details?: unknown } } | null;
  if (!r.ok || !j?.ok) throw new ApiError(j?.error?.code ?? "ERROR", j?.error?.message ?? `Permintaan gagal (HTTP ${r.status}).`, r.status, j?.error?.details);
  return j.data as T;
}

export const fmtIDR = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
export const fmtNum = (n: number) => new Intl.NumberFormat("id-ID").format(n);
export const fmtDate = (ms: number | null | undefined, withTime = false) =>
  ms ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", ...(withTime ? { timeStyle: "short" } : {}) }).format(new Date(Number(ms))) : "—";
export const fmtRel = (ms: number | null | undefined) => {
  if (!ms) return "—";
  const d = Date.now() - Number(ms);
  if (d < 60_000) return "baru saja";
  if (d < 3600_000) return `${Math.floor(d / 60_000)} mnt lalu`;
  if (d < 86400_000) return `${Math.floor(d / 3600_000)} jam lalu`;
  return `${Math.floor(d / 86400_000)} hari lalu`;
};
