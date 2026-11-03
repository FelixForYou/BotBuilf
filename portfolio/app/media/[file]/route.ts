import fs from "node:fs/promises";
import path from "node:path";
import { uploadsDir } from "@/db/open.mjs";
import { MIME } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^[a-f0-9]{32}\.(png|jpg|webp)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const buf = await fs.readFile(path.join(/* turbopackIgnore: true */ uploadsDir(), file));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[m[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
