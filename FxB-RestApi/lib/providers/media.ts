import "server-only";
import { AppError } from "../errors";
import { providerFetch, providerJson, safeFetch } from "../net";

// ---------------------------------------------------------------------------
// Cobalt (open-source media downloader, https://github.com/imputnet/cobalt)
// Gunakan instance milik sendiri: COBALT_API_URL (+ COBALT_API_KEY bila diwajibkan).
// ---------------------------------------------------------------------------
export interface CobaltResult {
  status: "tunnel" | "redirect" | "picker" | "local-processing" | "error";
  url?: string;
  filename?: string;
  picker?: { type: string; url: string; thumb?: string }[];
  audio?: string;
  error?: { code: string };
}

export async function cobalt(url: string, opts: { audioOnly?: boolean; quality?: string } = {}) {
  const api = process.env.COBALT_API_URL;
  if (!api) throw new AppError("PROVIDER_UNAVAILABLE", "Provider downloader belum dikonfigurasi.", 503);
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (process.env.COBALT_API_KEY) headers.Authorization = `Api-Key ${process.env.COBALT_API_KEY}`;
  const r = await providerFetch(api.replace(/\/+$/, "") + "/", {
    method: "POST",
    headers,
    timeoutMs: 30_000,
    body: JSON.stringify({
      url,
      downloadMode: opts.audioOnly ? "audio" : "auto",
      videoQuality: opts.quality ?? "720",
      audioFormat: "mp3",
      filenameStyle: "basic",
    }),
  });
  const body = (await r.json().catch(() => null)) as CobaltResult | null;
  if (!body) throw new AppError("PROVIDER_ERROR", "Respons downloader tidak valid.", 502);
  if (body.status === "error") {
    const code = body.error?.code ?? "unknown";
    if (code.includes("link") || code.includes("unsupported")) throw new AppError("BAD_REQUEST", "Link tidak didukung atau tidak valid.", 400);
    if (code.includes("content")) throw new AppError("NOT_FOUND", "Konten tidak ditemukan, privat, atau dibatasi usia.", 404);
    if (code.includes("rate")) throw new AppError("PROVIDER_RATE_LIMITED", "Downloader sedang sibuk. Coba lagi nanti.", 503);
    throw new AppError("PROVIDER_ERROR", `Downloader gagal (${code}).`, 502);
  }
  return {
    type: body.status === "picker" ? "multiple" : "single",
    filename: body.filename ?? null,
    url: body.url ?? null,
    audio: body.audio ?? null,
    items: (body.picker ?? []).map((p) => ({ type: p.type, url: p.url, thumbnail: p.thumb ?? null })),
  };
}

export function hostMatches(url: string, hosts: string[]): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return hosts.some((x) => h === x || h.endsWith("." + x));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Replicate — img2img, upscale, enhance. REPLICATE_API_TOKEN + model per fitur.
// Format model: "owner/name" (model resmi) atau "owner/name:versionhash".
// ---------------------------------------------------------------------------
export async function replicate(model: string, input: Record<string, unknown>): Promise<string[]> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new AppError("PROVIDER_UNAVAILABLE", "Provider AI image belum dikonfigurasi.", 503);
  const [ref, version] = model.split(":");
  const url = version ? "https://api.replicate.com/v1/predictions" : `https://api.replicate.com/v1/models/${ref}/predictions`;
  type Pred = { id: string; status: string; output?: unknown; error?: string; urls?: { get: string } };
  let pred = await providerJson<Pred>(url, {
    method: "POST",
    timeoutMs: 60_000,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait=50" },
    body: JSON.stringify(version ? { version, input } : { input }),
  });
  const started = Date.now();
  while ((pred.status === "starting" || pred.status === "processing") && Date.now() - started < 50_000) {
    await new Promise((r) => setTimeout(r, 1500));
    pred = await providerJson<Pred>(pred.urls?.get ?? `https://api.replicate.com/v1/predictions/${pred.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  if (pred.status !== "succeeded") {
    if (pred.status === "failed") throw new AppError("PROVIDER_ERROR", "Proses AI gagal di penyedia.", 502);
    throw new AppError("PROVIDER_TIMEOUT", "Proses AI terlalu lama. Coba gambar yang lebih kecil.", 504);
  }
  const out = pred.output;
  const urls = (Array.isArray(out) ? out : [out]).filter((x): x is string => typeof x === "string");
  if (!urls.length) throw new AppError("PROVIDER_ERROR", "Penyedia tidak mengembalikan gambar.", 502);
  return urls;
}

/** Unduh hasil dari penyedia (URL dari respons provider — tetap divalidasi publik). */
export async function downloadResult(url: string): Promise<{ body: Uint8Array; type: string }> {
  const r = await safeFetch(url, { maxBytes: 20 * 1024 * 1024, timeoutMs: 30_000 });
  if (r.status !== 200) throw new AppError("PROVIDER_ERROR", "Gagal mengambil hasil dari penyedia.", 502);
  return { body: new Uint8Array(r.body), type: String(r.headers["content-type"] ?? "image/png") };
}
