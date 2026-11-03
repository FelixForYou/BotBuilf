import "server-only";
import { ZodError } from "zod";
import { requireAdminApi, type AdminSession } from "./auth";

export function errorResponse(err: unknown, fallback = "Terjadi kesalahan di server.") {
  if (err instanceof ZodError) {
    const i = err.issues[0];
    return Response.json({ error: i.message, field: i.path.join(".") }, { status: 422 });
  }
  if (err instanceof Error && err.message && !/SQLITE|sqlite/.test(err.message)) {
    return Response.json({ error: err.message }, { status: 400 });
  }
  console.error(err);
  return Response.json({ error: fallback }, { status: 500 });
}

export async function readJson(req: Request, limit = 2 * 1024 * 1024): Promise<unknown> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > limit) throw new Error("Data terlalu besar.");
  const text = await req.text();
  if (text.length > limit) throw new Error("Data terlalu besar.");
  try { return JSON.parse(text); } catch { throw new Error("Format JSON tidak valid."); }
}

type Handler<C> = (req: Request, session: AdminSession, ctx: C) => Promise<Response>;

/** Bungkus handler admin dengan cek sesi + CSRF + penanganan error yang konsisten. */
export function adminRoute<C>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    const s = await requireAdminApi(req);
    if (s instanceof Response) return s;
    try {
      return await fn(req, s, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function parseId(v: string) {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new Error("ID tidak valid.");
  return n;
}
