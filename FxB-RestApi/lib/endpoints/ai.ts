import { AppError } from "../errors";
import { availableModels, complete, pickModel, type ChatMessage } from "../providers/ai";
import { providerJson } from "../net";
import { json, type EndpointDef, type HandlerCtx } from "./types";

const AI_REQUIRES = ["AI_PROVIDER"]; // virtual: dicek lewat aiConfigured() di registry
const modelParam = { name: "model", type: "string" as const, description: "ID model (opsional, premium). Lihat /ai/models.", example: "" };

async function run(ctx: HandlerCtx, system: string, prompt: string, maxTokens = 2048, history: ChatMessage[] = []) {
  const model = pickModel(ctx.params.model || undefined, ctx.tier === "premium");
  const r = await complete({ model, system, messages: [...history, { role: "user", content: prompt }], maxTokens });
  return { model: r.model, provider: model.provider, answer: r.text, usage: r.usage ?? null };
}

const aiExample = { model: "claude-opus-5-5", provider: "anthropic", answer: "Halo! Ada yang bisa saya bantu?", usage: { input: 24, output: 12 } };

const LANGS: Record<string, string> = {
  id: "Indonesian", en: "English", ja: "Japanese", ko: "Korean", zh: "Chinese", ar: "Arabic", es: "Spanish", fr: "French",
  de: "German", ru: "Russian", pt: "Portuguese", it: "Italian", th: "Thai", vi: "Vietnamese", ms: "Malay", jv: "Javanese", su: "Sundanese", hi: "Hindi", tr: "Turkish", nl: "Dutch",
};

function ai(def: Omit<EndpointDef, "category" | "requires" | "provider" | "response" | "method"> & { method?: "GET" | "POST" }): EndpointDef {
  return { method: "GET", ...def, category: "ai", requires: AI_REQUIRES, provider: "Anthropic Claude / OpenAI-compatible", response: "json" };
}

export const aiEndpoints: EndpointDef[] = [
  {
    id: "ai/models",
    category: "ai",
    group: "AI",
    name: "Daftar Model AI",
    description: "Daftar model AI yang aktif di server ini (multi-model).",
    method: "GET",
    tier: "free",
    response: "json",
    params: [],
    example: { default: "claude-opus-5-5", models: [{ id: "claude-opus-5-5", provider: "anthropic" }] },
    handler: async () => {
      const models = availableModels();
      return json({ default: process.env.AI_DEFAULT_MODEL && models.some((m) => m.id === process.env.AI_DEFAULT_MODEL) ? process.env.AI_DEFAULT_MODEL : models[0]?.id ?? null, models });
    },
  },
  ai({
    id: "ai/chat",
    group: "AI",
    name: "AI Chat",
    description: "Chat dengan AI. Jawaban ringkas dan membantu dalam bahasa pengguna.",
    tier: "free",
    params: [
      { name: "text", type: "string", required: true, description: "Pesan pengguna.", example: "Halo, siapa kamu?", max: 4000 },
      { name: "system", type: "string", description: "Instruksi sistem/persona (opsional).", example: "Kamu adalah asisten bot WhatsApp yang ramah.", max: 2000 },
      modelParam,
    ],
    example: aiExample,
    handler: async (ctx) =>
      json(
        await run(
          ctx,
          ctx.params.system || "You are FxB AI by FELIXIORITY, a helpful assistant inside chat bots. Reply in the user's language. Be concise; use plain text suitable for Telegram/WhatsApp.",
          ctx.params.text,
        ),
      ),
  }),
  ai({
    id: "ai/assistant",
    method: "POST",
    group: "AI",
    name: "AI Assistant (multi-turn)",
    description: "Asisten dengan riwayat percakapan. Kirim array messages berisi role user/assistant.",
    tier: "premium",
    params: [
      { name: "messages", type: "json", required: true, description: "Array [{role:'user'|'assistant', content:string}] — terakhir harus user.", example: '[{"role":"user","content":"Buatkan rencana belajar Python 7 hari"}]', max: 30000 },
      { name: "system", type: "string", description: "Instruksi sistem (opsional).", max: 4000 },
      modelParam,
    ],
    example: aiExample,
    handler: async (ctx) => {
      let msgs: unknown;
      try {
        msgs = JSON.parse(ctx.params.messages);
      } catch {
        throw new AppError("BAD_REQUEST", "messages harus JSON array.");
      }
      if (!Array.isArray(msgs) || !msgs.length || msgs.length > 40) throw new AppError("BAD_REQUEST", "messages harus array berisi 1–40 item.");
      const clean: ChatMessage[] = msgs.map((m) => {
        const r = (m as { role?: string }).role;
        const c = (m as { content?: unknown }).content;
        if ((r !== "user" && r !== "assistant") || typeof c !== "string" || !c.trim()) throw new AppError("BAD_REQUEST", "Setiap message wajib {role, content}.");
        return { role: r, content: c.slice(0, 8000) };
      });
      if (clean[clean.length - 1].role !== "user") throw new AppError("BAD_REQUEST", "Message terakhir harus dari user.");
      const last = clean.pop()!;
      return json(await run(ctx, ctx.params.system || "You are FxB Assistant by FELIXIORITY. Be accurate, structured and helpful. Reply in the user's language.", last.content, 4096, clean));
    },
  }),
  ai({
    id: "ai/code",
    group: "AI",
    name: "AI Coding",
    description: "Tulis, jelaskan, atau perbaiki kode. Hasil dalam format Markdown.",
    tier: "premium",
    params: [
      { name: "text", type: "string", required: true, description: "Permintaan coding atau potongan kode.", example: "Buat fungsi JavaScript untuk validasi email", max: 12000 },
      { name: "language", type: "string", description: "Bahasa pemrograman target (opsional).", example: "javascript", max: 40 },
      modelParam,
    ],
    example: { ...aiExample, answer: "```javascript\nfunction isEmail(s) { ... }\n```" },
    handler: async (ctx) =>
      json(
        await run(
          ctx,
          `You are an expert software engineer. Produce correct, secure, idiomatic code${ctx.params.language ? ` in ${ctx.params.language}` : ""}. Use Markdown code blocks and keep explanations brief, in the user's language.`,
          ctx.params.text,
          4096,
        ),
      ),
  }),
  ai({
    id: "ai/translate",
    group: "AI",
    name: "AI Translate",
    description: "Terjemahan natural berbasis AI (mempertahankan nada & konteks).",
    tier: "free",
    params: [
      { name: "text", type: "string", required: true, description: "Teks yang diterjemahkan.", example: "Selamat pagi, apa kabar?", max: 5000 },
      { name: "to", type: "enum", required: true, options: Object.keys(LANGS), description: "Bahasa tujuan.", example: "en" },
      modelParam,
    ],
    example: { ...aiExample, answer: "Good morning, how are you?" },
    handler: async (ctx) =>
      json(
        await run(ctx, `Translate the user's text into ${LANGS[ctx.params.to]}. Output ONLY the translation, preserving formatting, tone and emojis.`, ctx.params.text, 2048),
      ),
  }),
  ai({
    id: "ai/summarize",
    method: "POST",
    group: "AI",
    name: "AI Summarizer",
    description: "Ringkas teks panjang menjadi poin-poin penting.",
    tier: "free",
    params: [
      { name: "text", type: "string", required: true, description: "Teks yang diringkas (maks 30.000 karakter).", example: "Artikel panjang...", max: 30000 },
      { name: "length", type: "enum", options: ["short", "medium", "long"], default: "medium", description: "Panjang ringkasan." },
      modelParam,
    ],
    example: { ...aiExample, answer: "• Poin 1\n• Poin 2\n• Poin 3" },
    handler: async (ctx) => {
      const len = { short: "3 bullet points", medium: "5-7 bullet points", long: "a detailed summary with headings" }[ctx.params.length || "medium"];
      return json(await run(ctx, `Summarize the user's text as ${len}, in the same language as the text. Output only the summary.`, ctx.params.text, 2048));
    },
  }),
  ai({
    id: "ai/generate",
    group: "AI",
    name: "AI Text Generator",
    description: "Buat artikel, caption, email, cerita, deskripsi produk, dan lainnya.",
    tier: "premium",
    params: [
      { name: "prompt", type: "string", required: true, description: "Topik atau instruksi.", example: "Kopi susu gula aren untuk kafe kekinian", max: 4000 },
      { name: "type", type: "enum", options: ["article", "caption", "email", "story", "product", "poem"], default: "caption", description: "Jenis tulisan." },
      { name: "lang", type: "enum", options: Object.keys(LANGS), default: "id", description: "Bahasa hasil." },
      modelParam,
    ],
    example: { ...aiExample, answer: "☕ Manisnya gula aren, lembutnya susu..." },
    handler: async (ctx) =>
      json(
        await run(
          ctx,
          `You are a professional copywriter. Write a ${ctx.params.type || "caption"} in ${LANGS[ctx.params.lang || "id"]}. Output only the final text.`,
          ctx.params.prompt,
          3000,
        ),
      ),
  }),
  {
    id: "ai/translate-basic",
    category: "ai",
    group: "Translate",
    name: "Translate (MyMemory)",
    description: "Terjemahan cepat tanpa AI menggunakan MyMemory Translation API.",
    method: "GET",
    tier: "free",
    provider: "MyMemory",
    response: "json",
    params: [
      { name: "text", type: "string", required: true, description: "Teks (maks 500 karakter).", example: "Terima kasih banyak", max: 500 },
      { name: "from", type: "enum", options: Object.keys(LANGS), default: "id", description: "Bahasa asal." },
      { name: "to", type: "enum", required: true, options: Object.keys(LANGS), description: "Bahasa tujuan.", example: "en" },
    ],
    example: { text: "Terima kasih banyak", translated: "Thank you very much", from: "id", to: "en", match: 1 },
    handler: async ({ params }) => {
      const from = params.from || "id";
      const r = await providerJson<{ responseStatus: number | string; responseData?: { translatedText?: string; match?: number }; responseDetails?: string }>(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(params.text)}&langpair=${from}|${params.to}`,
      );
      if (Number(r.responseStatus) !== 200 || !r.responseData?.translatedText) throw new AppError("PROVIDER_ERROR", r.responseDetails || "Terjemahan gagal.", 502);
      return json({ text: params.text, translated: r.responseData.translatedText, from, to: params.to, match: r.responseData.match ?? null });
    },
  },
];
