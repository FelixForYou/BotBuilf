import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { uploadsDir } from "@/db/open.mjs";

export const MAX_UPLOAD = 6 * 1024 * 1024; // 6 MB
const MAX_DIM = 8000;

type Kind = { ext: "png" | "jpg" | "webp"; mime: string; width: number; height: number };

/** Deteksi jenis gambar dari isi file (bukan dari nama/MIME kiriman browser) dan baca dimensinya. */
export function sniffImage(buf: Buffer): Kind | null {
  if (buf.length < 32) return null;
  // PNG
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) && buf.toString("ascii", 12, 16) === "IHDR") {
    return { ext: "png", mime: "image/png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { ext: "jpg", mime: "image/jpeg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }
  // WebP
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { ext: "webp", mime: "image/webp", width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { ext: "webp", mime: "image/webp", width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { ext: "webp", mime: "image/webp", width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

export async function saveUpload(file: File) {
  if (file.size === 0) throw new Error("File kosong.");
  if (file.size > MAX_UPLOAD) throw new Error("Ukuran gambar maksimal 6 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(buf);
  if (!kind) throw new Error("Format tidak didukung. Gunakan PNG, JPG, atau WebP.");
  if (!kind.width || !kind.height || kind.width > MAX_DIM || kind.height > MAX_DIM) throw new Error("Dimensi gambar tidak valid (maks. 8000 px).");
  const name = `${crypto.randomBytes(16).toString("hex")}.${kind.ext}`;
  await fs.writeFile(path.join(/* turbopackIgnore: true */ uploadsDir(), name), buf, { flag: "wx" });
  return { file: name, width: kind.width, height: kind.height };
}

export const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
