export type Tier = "free" | "premium";
export type CategoryId = "downloader" | "ai" | "ai-image" | "entertainment" | "tools";

export interface ParamDef {
  name: string;
  type: "string" | "number" | "boolean" | "enum" | "file" | "json";
  required?: boolean;
  description: string;
  example?: string;
  options?: string[];
  default?: string;
  max?: number;
}

export interface HandlerCtx {
  params: Record<string, string>;
  files: Record<string, File>;
  req: Request;
  base: string;
  tier: Tier;
  userId: string | null;
}

export type HandlerResult =
  | { kind: "json"; data: unknown }
  | { kind: "binary"; body: Uint8Array; contentType: string; filename?: string };

export interface EndpointDef {
  id: string;
  category: CategoryId;
  group: string;
  name: string;
  description: string;
  method: "GET" | "POST";
  tier: Tier;
  params: ParamDef[];
  /** Variabel env yang wajib ada agar endpoint aktif. */
  requires?: string[];
  /** Nama penyedia eksternal (ditampilkan di dokumentasi). */
  provider?: string;
  /** Jenis respons sukses. */
  response: "json" | "image" | "file";
  example: unknown;
  handler: (ctx: HandlerCtx) => Promise<HandlerResult>;
}

export const CATEGORIES: { id: CategoryId; name: string; description: string; icon: string }[] = [
  { id: "downloader", name: "Downloader", description: "TikTok, Instagram, YouTube, Facebook, Pinterest & lainnya.", icon: "download" },
  { id: "ai", name: "AI", description: "Chat, coding, asisten, terjemahan, ringkasan, generator teks.", icon: "sparkles" },
  { id: "ai-image", name: "AI Image", description: "Text to image, image to image, hapus background, upscale.", icon: "image" },
  { id: "entertainment", name: "Entertainment", description: "Fun, game, maker, komik, anime, musik, meme, quotes.", icon: "smile" },
  { id: "tools", name: "Stalker & Tools", description: "Profil publik, DNS, IP, shortener, QR, screenshot, upload.", icon: "wrench" },
];

export const json = (data: unknown): HandlerResult => ({ kind: "json", data });
export const binary = (body: Uint8Array, contentType: string, filename?: string): HandlerResult => ({ kind: "binary", body, contentType, filename });
