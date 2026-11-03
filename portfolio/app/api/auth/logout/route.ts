import { logout, sameOrigin } from "@/lib/auth";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Asal request tidak diizinkan." }, { status: 403 });
  await logout();
  return Response.json({ ok: true });
}
