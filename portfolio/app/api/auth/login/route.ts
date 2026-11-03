import { login, sameOrigin } from "@/lib/auth";
import { readJson } from "@/lib/api";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Asal request tidak diizinkan." }, { status: 403 });
  let body: { username?: string; password?: string };
  try {
    body = (await readJson(req, 4096)) as typeof body;
  } catch {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }
  const res = await login(String(body?.username ?? ""), String(body?.password ?? ""));
  if (!res.ok) return Response.json({ error: res.error }, { status: res.status });
  return Response.json({ ok: true });
}
