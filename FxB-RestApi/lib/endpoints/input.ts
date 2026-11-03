import "server-only";
import sharp, { type Metadata } from "sharp";
import { AppError } from "../errors";
import { safeFetch } from "../net";
import type { HandlerCtx } from "./types";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Ambil gambar dari parameter `image` (file upload) atau `url`. Divalidasi dengan sharp. */
export async function loadImage(ctx: HandlerCtx): Promise<{ buf: Buffer; meta: Metadata }> {
  let buf: Buffer;
  const file = ctx.files.image;
  if (file) {
    if (file.size > MAX_IMAGE_BYTES) throw new AppError("TOO_LARGE", "Gambar maksimal 8 MB.", 413);
    buf = Buffer.from(await file.arrayBuffer());
  } else if (ctx.params.url) {
    const r = await safeFetch(ctx.params.url, { maxBytes: MAX_IMAGE_BYTES });
    if (r.status !== 200) throw new AppError("BAD_REQUEST", `URL gambar mengembalikan HTTP ${r.status}.`);
    buf = r.body;
  } else {
    throw new AppError("BAD_REQUEST", "Kirim parameter `url` atau upload file `image`.");
  }
  try {
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) throw new Error();
    if (meta.width * meta.height > 40_000_000) throw new AppError("TOO_LARGE", "Resolusi gambar terlalu besar.", 413);
    return { buf, meta };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("BAD_REQUEST", "File bukan gambar yang valid.");
  }
}

export function toDataUri(buf: Buffer, mime = "image/png"): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function clampInt(v: string | undefined, def: number, min: number, max: number): number {
  const n = Number(v);
  if (!v || !Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.round(n)));
}
