import { adminRoute, parseId, readJson } from "@/lib/api";
import {
  archiveProject, deleteProject, projectById, projectInputSchema, restoreProject,
  setFeatured, setPublished, updateProject,
} from "@/lib/projects";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = adminRoute<Ctx>(async (req, _s, { params }) => {
  const id = parseId((await params).id);
  const input = projectInputSchema.parse(await readJson(req));
  const project = updateProject(id, input);
  if (!project) return Response.json({ error: "Project tidak ditemukan." }, { status: 404 });
  return Response.json({ project });
});

const ACTIONS = ["publish", "unpublish", "archive", "restore", "feature", "unfeature"] as const;

export const PATCH = adminRoute<Ctx>(async (req, _s, { params }) => {
  const id = parseId((await params).id);
  if (!projectById(id)) return Response.json({ error: "Project tidak ditemukan." }, { status: 404 });
  const { action } = (await readJson(req, 1024)) as { action?: string };
  if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) return Response.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  if (action === "publish") {
    if (projectById(id)!.status === "archived") return Response.json({ error: "Pulihkan project dari arsip sebelum dipublikasikan." }, { status: 409 });
    setPublished(id, true);
  }
  if (action === "unpublish") setPublished(id, false);
  if (action === "archive") archiveProject(id);
  if (action === "restore") restoreProject(id);
  if (action === "feature") setFeatured(id, true);
  if (action === "unfeature") setFeatured(id, false);
  return Response.json({ project: projectById(id) });
});

export const DELETE = adminRoute<Ctx>(async (_req, _s, { params }) => {
  const id = parseId((await params).id);
  if (!projectById(id)) return Response.json({ error: "Project tidak ditemukan." }, { status: 404 });
  deleteProject(id);
  return Response.json({ ok: true });
});
