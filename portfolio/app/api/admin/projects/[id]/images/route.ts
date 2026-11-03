import { adminRoute, parseId, readJson } from "@/lib/api";
import { addImage, deleteImage, projectById, updateImageAlt } from "@/lib/projects";
import { MAX_UPLOAD, saveUpload } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

export const POST = adminRoute<Ctx>(async (req, _s, { params }) => {
  const id = parseId((await params).id);
  if (!projectById(id)) return Response.json({ error: "Project tidak ditemukan." }, { status: 404 });
  if (Number(req.headers.get("content-length") || 0) > MAX_UPLOAD + 64 * 1024) {
    return Response.json({ error: "Ukuran gambar maksimal 6 MB." }, { status: 413 });
  }
  const form = await req.formData();
  const file = form.get("file");
  const role = form.get("role") === "cover" ? "cover" : "gallery";
  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  if (!(file instanceof File)) return Response.json({ error: "Pilih file gambar." }, { status: 400 });
  if (!alt) return Response.json({ error: "Teks alternatif wajib diisi agar gambar bisa dipahami pembaca layar." }, { status: 422 });
  const project = projectById(id)!;
  if (role === "gallery" && project.gallery.length >= 20) return Response.json({ error: "Maksimal 20 screenshot per project." }, { status: 422 });
  const saved = await saveUpload(file);
  addImage(id, role, saved.file, alt, saved.width, saved.height);
  return Response.json({ project: projectById(id) }, { status: 201 });
});

export const PATCH = adminRoute<Ctx>(async (req, _s, { params }) => {
  const id = parseId((await params).id);
  const body = (await readJson(req, 4096)) as { imageId?: number; alt?: string };
  const alt = String(body.alt ?? "").trim().slice(0, 200);
  if (!alt) return Response.json({ error: "Teks alternatif tidak boleh kosong." }, { status: 422 });
  updateImageAlt(id, parseId(String(body.imageId)), alt);
  return Response.json({ project: projectById(id) });
});

export const DELETE = adminRoute<Ctx>(async (req, _s, { params }) => {
  const id = parseId((await params).id);
  const imageId = parseId(new URL(req.url).searchParams.get("imageId") ?? "");
  if (!deleteImage(id, imageId)) return Response.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  return Response.json({ project: projectById(id) });
});
