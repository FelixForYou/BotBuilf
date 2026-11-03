import sharp from "sharp";
import { AppError } from "../errors";
import { providerFetch } from "../net";
import { downloadResult, replicate } from "../providers/media";
import { clampInt, loadImage, toDataUri } from "./input";
import { binary, type EndpointDef, type HandlerCtx } from "./types";

const imageParams = [
  { name: "url", type: "string" as const, description: "URL gambar publik (atau upload `image` via POST multipart).", example: "https://picsum.photos/id/237/600/400", max: 1000 },
  { name: "image", type: "file" as const, description: "File gambar (POST multipart/form-data, maks 8 MB)." },
];

const imgExample = "(binary image/png)";

async function pollinations(prompt: string, w: number, h: number, seed: number, model: string): Promise<Uint8Array> {
  const base = (process.env.POLLINATIONS_URL ?? "https://image.pollinations.ai").replace(/\/+$/, "");
  const qs = new URLSearchParams({ width: String(w), height: String(h), seed: String(seed), model, nologo: "true", private: "true" });
  const headers: Record<string, string> = {};
  if (process.env.POLLINATIONS_TOKEN) headers.Authorization = `Bearer ${process.env.POLLINATIONS_TOKEN}`;
  const r = await providerFetch(`${base}/prompt/${encodeURIComponent(prompt)}?${qs}`, { headers, timeoutMs: 55_000 });
  if (r.status === 429) throw new AppError("PROVIDER_RATE_LIMITED", "Generator gambar sedang sibuk. Coba lagi nanti.", 503);
  const type = r.headers.get("content-type") ?? "";
  if (!r.ok || !type.startsWith("image/")) throw new AppError("PROVIDER_ERROR", `Generator gambar gagal (HTTP ${r.status}).`, 502);
  const buf = Buffer.from(await r.arrayBuffer());
  return new Uint8Array(await sharp(buf).png().toBuffer());
}

const STYLES: Record<string, string> = {
  none: "",
  anime: "anime style, vibrant colors, detailed illustration",
  realistic: "photorealistic, 35mm photo, natural lighting, high detail",
  "3d": "3d render, octane, soft lighting, cute",
  pixel: "pixel art, 16-bit, retro game",
  cyberpunk: "cyberpunk, neon lights, futuristic city, cinematic",
  watercolor: "watercolor painting, soft pastel colors",
  logo: "minimal flat vector logo, clean, centered, white background",
};

async function viaReplicate(ctx: HandlerCtx, modelEnv: string, input: (dataUri: string) => Record<string, unknown>) {
  const model = process.env[modelEnv];
  if (!model) throw new AppError("PROVIDER_UNAVAILABLE", "Model untuk fitur ini belum dikonfigurasi.", 503);
  const { buf } = await loadImage(ctx);
  const png = await sharp(buf).rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  const [out] = await replicate(model, input(toDataUri(png)));
  const res = await downloadResult(out);
  return binary(res.body, res.type.startsWith("image/") ? res.type : "image/png");
}

const promptParam = { name: "prompt", type: "string" as const, required: true, description: "Deskripsi gambar (bahasa Inggris memberi hasil terbaik).", example: "a cute orange cat astronaut, studio lighting", max: 1000 };

export const aiImageEndpoints: EndpointDef[] = [
  {
    id: "ai-image/text2img",
    category: "ai-image",
    group: "Generate",
    name: "Text to Image",
    description: "Buat gambar dari teks (model Flux via Pollinations).",
    method: "GET",
    tier: "free",
    provider: "Pollinations.ai",
    response: "image",
    params: [
      promptParam,
      { name: "width", type: "number", default: "1024", description: "Lebar 256–1536." },
      { name: "height", type: "number", default: "1024", description: "Tinggi 256–1536." },
      { name: "seed", type: "number", description: "Seed (opsional) untuk hasil yang bisa diulang." },
    ],
    example: imgExample,
    handler: async ({ params }) => {
      const img = await pollinations(params.prompt, clampInt(params.width, 1024, 256, 1536), clampInt(params.height, 1024, 256, 1536), clampInt(params.seed, Math.floor(Math.random() * 1e9), 0, 2 ** 31), "flux");
      return binary(img, "image/png");
    },
  },
  {
    id: "ai-image/generator",
    category: "ai-image",
    group: "Generate",
    name: "Image Generator (Style)",
    description: "Generator gambar dengan preset gaya: anime, realistic, 3d, pixel, cyberpunk, watercolor, logo.",
    method: "GET",
    tier: "free",
    provider: "Pollinations.ai",
    response: "image",
    params: [
      promptParam,
      { name: "style", type: "enum", options: Object.keys(STYLES), default: "anime", description: "Preset gaya." },
      { name: "ratio", type: "enum", options: ["1:1", "16:9", "9:16", "4:3", "3:4"], default: "1:1", description: "Rasio aspek." },
    ],
    example: imgExample,
    handler: async ({ params }) => {
      const sizes: Record<string, [number, number]> = { "1:1": [1024, 1024], "16:9": [1344, 768], "9:16": [768, 1344], "4:3": [1152, 864], "3:4": [864, 1152] };
      const [w, h] = sizes[params.ratio || "1:1"];
      const style = STYLES[params.style || "anime"];
      const img = await pollinations(style ? `${params.prompt}, ${style}` : params.prompt, w, h, Math.floor(Math.random() * 1e9), "flux");
      return binary(img, "image/png");
    },
  },
  {
    id: "ai-image/img2img",
    category: "ai-image",
    group: "Edit",
    name: "Image to Image",
    description: "Ubah gambar berdasarkan prompt (style transfer / edit) memakai model di Replicate.",
    method: "POST",
    tier: "premium",
    provider: "Replicate",
    requires: ["REPLICATE_API_TOKEN", "REPLICATE_IMG2IMG_MODEL"],
    response: "image",
    params: [...imageParams, { ...promptParam, example: "turn into studio ghibli style" }, { name: "strength", type: "number", default: "0.7", description: "Kekuatan perubahan 0.1–1." }],
    example: imgExample,
    handler: (ctx) =>
      viaReplicate(ctx, "REPLICATE_IMG2IMG_MODEL", (img) => ({
        [process.env.REPLICATE_IMG2IMG_IMAGE_KEY || "image"]: img,
        prompt: ctx.params.prompt,
        prompt_strength: Math.max(0.1, Math.min(1, Number(ctx.params.strength) || 0.7)),
      })),
  },
  {
    id: "ai-image/removebg",
    category: "ai-image",
    group: "Edit",
    name: "Background Remover",
    description: "Hapus background gambar otomatis, hasil PNG transparan.",
    method: "POST",
    tier: "premium",
    provider: "remove.bg",
    requires: ["REMOVEBG_API_KEY"],
    response: "image",
    params: imageParams,
    example: imgExample,
    handler: async (ctx) => {
      const { buf } = await loadImage(ctx);
      const form = new FormData();
      form.append("image_file", new Blob([new Uint8Array(buf)]), "image");
      form.append("size", "auto");
      const r = await providerFetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": process.env.REMOVEBG_API_KEY! },
        body: form,
        timeoutMs: 45_000,
      });
      if (r.status === 402) throw new AppError("PROVIDER_UNAVAILABLE", "Kuota penyedia background remover habis.", 503);
      if (r.status === 400) throw new AppError("BAD_REQUEST", "Gambar tidak dapat diproses (objek tidak terdeteksi?).");
      if (!r.ok) throw new AppError("PROVIDER_ERROR", `Background remover gagal (HTTP ${r.status}).`, 502);
      return binary(new Uint8Array(await r.arrayBuffer()), "image/png");
    },
  },
  {
    id: "ai-image/upscale",
    category: "ai-image",
    group: "Enhance",
    name: "AI Image Upscaler",
    description: "Perbesar resolusi gambar 2x/4x dengan AI (Real-ESRGAN).",
    method: "POST",
    tier: "premium",
    provider: "Replicate",
    requires: ["REPLICATE_API_TOKEN", "REPLICATE_UPSCALE_MODEL"],
    response: "image",
    params: [...imageParams, { name: "scale", type: "enum", options: ["2", "4"], default: "2", description: "Faktor perbesaran." }, { name: "face", type: "boolean", default: "false", description: "Perbaiki wajah." }],
    example: imgExample,
    handler: (ctx) =>
      viaReplicate(ctx, "REPLICATE_UPSCALE_MODEL", (img) => ({ image: img, scale: Number(ctx.params.scale || 2), face_enhance: ctx.params.face === "true" })),
  },
  {
    id: "ai-image/enhance",
    category: "ai-image",
    group: "Enhance",
    name: "AI Image Enhancer",
    description: "Perbaiki foto buram / wajah (restorasi wajah GFPGAN/CodeFormer).",
    method: "POST",
    tier: "premium",
    provider: "Replicate",
    requires: ["REPLICATE_API_TOKEN", "REPLICATE_ENHANCE_MODEL"],
    response: "image",
    params: imageParams,
    example: imgExample,
    handler: (ctx) => viaReplicate(ctx, "REPLICATE_ENHANCE_MODEL", (img) => ({ [process.env.REPLICATE_ENHANCE_IMAGE_KEY || "img"]: img, scale: 2 })),
  },
];
