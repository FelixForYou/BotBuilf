import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AppError } from "../errors";
import { providerFetch } from "../net";

/**
 * Multi-provider AI:
 *  - Anthropic (Claude) lewat SDK resmi — ANTHROPIC_API_KEY, ANTHROPIC_MODELS.
 *  - Provider OpenAI-compatible (OpenAI, Groq, OpenRouter, Together, dll) — OPENAI_COMPAT_*.
 * Endpoint AI hanya aktif bila minimal satu provider dikonfigurasi.
 */
export interface ModelInfo {
  id: string;
  provider: "anthropic" | "openai-compatible";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function availableModels(): ModelInfo[] {
  const out: ModelInfo[] = [];
  if (process.env.ANTHROPIC_API_KEY) {
    const models = list(process.env.ANTHROPIC_MODELS);
    for (const id of models.length ? models : ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"]) out.push({ id, provider: "anthropic" });
  }
  if (process.env.OPENAI_COMPAT_BASE_URL && process.env.OPENAI_COMPAT_API_KEY) {
    for (const id of list(process.env.OPENAI_COMPAT_MODELS)) out.push({ id, provider: "openai-compatible" });
  }
  return out;
}

export function aiConfigured(): boolean {
  return availableModels().length > 0;
}

export function defaultModel(): ModelInfo {
  const models = availableModels();
  if (!models.length) throw new AppError("PROVIDER_UNAVAILABLE", "Provider AI belum dikonfigurasi oleh admin.", 503);
  const pref = process.env.AI_DEFAULT_MODEL;
  return models.find((m) => m.id === pref) ?? models[0];
}

/** Pilih model. Key free hanya boleh memakai model default. */
export function pickModel(requested: string | undefined, premium: boolean): ModelInfo {
  const def = defaultModel();
  if (!requested) return def;
  const m = availableModels().find((x) => x.id === requested);
  if (!m) throw new AppError("BAD_REQUEST", `Model "${requested}" tidak tersedia. Lihat /api/v1/ai/models.`);
  if (!premium && m.id !== def.id) throw new AppError("PREMIUM_REQUIRED", "Pemilihan model khusus untuk API key premium.", 403);
  return m;
}

let anthropic: Anthropic | null = null;
// Model yang mendukung parameter server-side fallbacks ("default").
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);

export async function complete(opts: {
  model: ModelInfo;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<{ text: string; model: string; usage?: { input: number; output: number } }> {
  const maxTokens = opts.maxTokens ?? 4096;
  if (opts.model.provider === "anthropic") {
    anthropic ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 55_000, maxRetries: 1 });
    try {
      const useFallback = FALLBACK_MODELS.has(opts.model.id);
      const res = await anthropic.beta.messages.create({
        model: opts.model.id,
        max_tokens: maxTokens,
        system: opts.system,
        messages: opts.messages,
        output_config: { effort: "low" },
        ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      });
      if (res.stop_reason === "refusal") {
        throw new AppError("AI_REFUSED", "AI menolak memproses permintaan ini.", 422);
      }
      const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
      return { text, model: res.model, usage: { input: res.usage.input_tokens, output: res.usage.output_tokens } };
    } catch (e) {
      if (e instanceof AppError) throw e;
      if (e instanceof Anthropic.RateLimitError) throw new AppError("PROVIDER_RATE_LIMITED", "Provider AI sedang sibuk. Coba lagi sebentar.", 503);
      if (e instanceof Anthropic.AuthenticationError) throw new AppError("PROVIDER_UNAVAILABLE", "Kredensial provider AI tidak valid. Hubungi admin.", 503);
      if (e instanceof Anthropic.BadRequestError) throw new AppError("BAD_REQUEST", "Permintaan ditolak provider AI (input tidak valid atau terlalu panjang).", 400);
      if (e instanceof Anthropic.APIError) throw new AppError("PROVIDER_ERROR", `Provider AI error (${e.status ?? "?"}).`, 502);
      throw new AppError("PROVIDER_ERROR", "Gagal menghubungi provider AI.", 502);
    }
  }
  const base = process.env.OPENAI_COMPAT_BASE_URL!.replace(/\/+$/, "");
  const r = await providerFetch(`${base}/chat/completions`, {
    method: "POST",
    timeoutMs: 55_000,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_COMPAT_API_KEY}` },
    body: JSON.stringify({
      model: opts.model.id,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: opts.system }, ...opts.messages],
    }),
  });
  if (r.status === 429) throw new AppError("PROVIDER_RATE_LIMITED", "Provider AI sedang sibuk. Coba lagi sebentar.", 503);
  if (r.status === 401 || r.status === 403) throw new AppError("PROVIDER_UNAVAILABLE", "Kredensial provider AI tidak valid. Hubungi admin.", 503);
  if (!r.ok) throw new AppError("PROVIDER_ERROR", `Provider AI error (${r.status}).`, 502);
  const body = (await r.json().catch(() => null)) as {
    model?: string;
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  } | null;
  const text = body?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AppError("PROVIDER_ERROR", "Provider AI tidak mengembalikan jawaban.", 502);
  return {
    text,
    model: body?.model ?? opts.model.id,
    usage: body?.usage ? { input: body.usage.prompt_tokens ?? 0, output: body.usage.completion_tokens ?? 0 } : undefined,
  };
}
