import { z } from "zod";
import { adminRoute, readJson } from "@/lib/api";
import { allProjects, reorderProjects } from "@/lib/projects";

const schema = z.object({ order: z.array(z.number().int().positive()).max(1000) });

export const POST = adminRoute(async (req) => {
  const { order } = schema.parse(await readJson(req, 32 * 1024));
  const known = new Set(allProjects().map((p) => p.id));
  if (order.some((id) => !known.has(id))) return Response.json({ error: "Urutan berisi project yang tidak dikenal." }, { status: 422 });
  reorderProjects(order);
  return Response.json({ ok: true });
});
