import { one } from "@/lib/db";

export const dynamic = "force-dynamic";

const INLINE = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "audio/mpeg", "audio/ogg", "audio/mp4", "video/mp4", "video/webm", "text/plain"]);

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return new Response("Not found", { status: 404 });
  const f = await one<{ name: string; mime: string; size: number; data: ArrayBuffer }>("SELECT name,mime,size,data FROM files WHERE id=?", [id]);
  if (!f) return new Response("File tidak ditemukan.", { status: 404 });
  const safeName = f.name.replace(/[^\w.\- ]+/g, "_").slice(0, 100) || "file";
  const inline = INLINE.has(f.mime);
  return new Response(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.mime === "text/plain" ? "text/plain; charset=utf-8" : f.mime,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
