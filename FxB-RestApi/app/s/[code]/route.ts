import { one, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(code)) return new Response("Not found", { status: 404 });
  const l = await one<{ url: string }>("SELECT url FROM short_links WHERE code=?", [code]);
  if (!l) return new Response("Link tidak ditemukan.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  await run("UPDATE short_links SET hits=hits+1 WHERE code=?", [code]);
  return new Response(null, { status: 302, headers: { Location: l.url, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
