import { adminRoute, readJson } from "@/lib/api";
import { importData } from "@/lib/projects";

export const POST = adminRoute(async (req) => {
  const body = (await readJson(req, 4 * 1024 * 1024)) as { mode?: string; data?: unknown };
  const mode = body?.mode === "replace" ? "replace" : "merge";
  const result = importData(body?.data, mode);
  return Response.json({ ok: true, ...result });
});
