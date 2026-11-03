import "server-only";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { db, tx } from "./db";
import { uploadsDir } from "@/db/open.mjs";
import {
  CATEGORIES, LINK_KINDS, PREVIEW_KINDS, STATUSES,
  type Project, type ProjectImage, type ProjectLink, type StatusId,
} from "./types";

type Row = Record<string, unknown>;

const parseJson = <T,>(v: unknown, fallback: T): T => {
  try { return JSON.parse(String(v)) as T; } catch { return fallback; }
};

function hydrate(rows: Row[]): Project[] {
  if (!rows.length) return [];
  const ids = rows.map((r) => Number(r.id));
  const ph = ids.map(() => "?").join(",");
  const links = db().prepare(`SELECT * FROM project_links WHERE project_id IN (${ph}) ORDER BY sort, id`).all(...ids) as Row[];
  const images = db().prepare(`SELECT * FROM project_images WHERE project_id IN (${ph}) ORDER BY sort, id`).all(...ids) as Row[];
  return rows.map((r) => {
    const id = Number(r.id);
    const imgs: (ProjectImage & { pid: number })[] = images
      .filter((i) => Number(i.project_id) === id)
      .map((i) => ({
        pid: id, id: Number(i.id), role: i.role as "cover" | "gallery", file: String(i.file),
        alt: String(i.alt), width: Number(i.width), height: Number(i.height),
      }));
    const strip = ({ pid: _pid, ...rest }: ProjectImage & { pid: number }) => rest;
    const cover = imgs.find((i) => i.role === "cover");
    return {
      id,
      slug: String(r.slug),
      title: String(r.title),
      summary: String(r.summary),
      description: String(r.description),
      categories: parseJson(r.categories, []),
      tech: parseJson(r.tech, []),
      status: r.status as StatusId,
      prevStatus: (r.prev_status as StatusId) ?? null,
      previewKind: r.preview_kind as Project["previewKind"],
      featured: Number(r.featured) === 1,
      sortOrder: Number(r.sort_order),
      published: Number(r.published) === 1,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      links: links
        .filter((l) => Number(l.project_id) === id)
        .map((l) => ({ id: Number(l.id), kind: l.kind as ProjectLink["kind"], label: String(l.label), url: String(l.url) })),
      cover: cover ? strip(cover) : null,
      gallery: imgs.filter((i) => i.role === "gallery").map(strip),
    };
  });
}

const ORDER = "ORDER BY sort_order ASC, id ASC";

export function publicProjects(): Project[] {
  return hydrate(db().prepare(`SELECT * FROM projects WHERE published = 1 AND status != 'archived' ${ORDER}`).all() as Row[]);
}

export function publicProjectBySlug(slug: string): Project | null {
  const row = db().prepare("SELECT * FROM projects WHERE slug = ? AND published = 1 AND status != 'archived'").get(slug) as Row | undefined;
  return row ? hydrate([row])[0] : null;
}

export function allProjects(): Project[] {
  return hydrate(db().prepare(`SELECT * FROM projects ORDER BY sort_order ASC, id ASC`).all() as Row[]);
}

export function projectById(id: number): Project | null {
  const row = db().prepare("SELECT * FROM projects WHERE id = ?").get(id) as Row | undefined;
  return row ? hydrate([row])[0] : null;
}

// ---------- Validasi ----------

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    try { const u = new URL(v); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
  }, "URL harus diawali http:// atau https://");

export const linkSchema = z.object({
  kind: z.enum(LINK_KINDS.map((k) => k.id) as [string, ...string[]]),
  label: z.string().trim().max(40).default(""),
  url: httpUrl,
});

const ids = <T extends readonly { id: string }[]>(list: T) => list.map((x) => x.id) as [string, ...string[]];

export const projectInputSchema = z.object({
  title: z.string().trim().min(2, "Judul minimal 2 karakter.").max(120),
  slug: z.string().trim().toLowerCase().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan strip.").optional().or(z.literal("")),
  summary: z.string().trim().max(240).default(""),
  description: z.string().trim().max(8000).default(""),
  categories: z.array(z.enum(ids(CATEGORIES))).min(1, "Pilih minimal satu kategori.").max(6),
  tech: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  status: z.enum(ids(STATUSES)),
  previewKind: z.enum(ids(PREVIEW_KINDS)),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  links: z.array(linkSchema).max(12).default([]),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "project";
}

function uniqueSlug(base: string, exceptId?: number) {
  let slug = base;
  for (let i = 2; ; i++) {
    const hit = db().prepare("SELECT id FROM projects WHERE slug = ?").get(slug) as Row | undefined;
    if (!hit || Number(hit.id) === exceptId) return slug;
    slug = `${base}-${i}`;
  }
}

function writeLinks(projectId: number, links: ProjectInput["links"]) {
  db().prepare("DELETE FROM project_links WHERE project_id = ?").run(projectId);
  const ins = db().prepare("INSERT INTO project_links (project_id, kind, label, url, sort) VALUES (?, ?, ?, ?, ?)");
  links.forEach((l, i) => ins.run(projectId, l.kind, l.label ?? "", l.url, i));
}

export function createProject(input: ProjectInput): Project {
  return tx(() => {
    const slug = uniqueSlug(input.slug || slugify(input.title));
    const max = (db().prepare("SELECT COALESCE(MAX(sort_order), 0) AS m FROM projects").get() as Row).m;
    const res = db()
      .prepare(
        `INSERT INTO projects (slug, title, summary, description, categories, tech, status, preview_kind, featured, sort_order, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        slug, input.title, input.summary, input.description, JSON.stringify(input.categories), JSON.stringify(input.tech),
        input.status, input.previewKind, input.featured ? 1 : 0, Number(max) + 1,
        input.published && input.status !== "archived" ? 1 : 0
      );
    const id = Number(res.lastInsertRowid);
    writeLinks(id, input.links);
    return projectById(id)!;
  });
}

export function updateProject(id: number, input: ProjectInput): Project | null {
  return tx(() => {
    const existing = projectById(id);
    if (!existing) return null;
    const slug = uniqueSlug(input.slug || slugify(input.title), id);
    db()
      .prepare(
        `UPDATE projects SET slug=?, title=?, summary=?, description=?, categories=?, tech=?, status=?, preview_kind=?,
         featured=?, published=?, updated_at=datetime('now') WHERE id=?`
      )
      .run(
        slug, input.title, input.summary, input.description, JSON.stringify(input.categories), JSON.stringify(input.tech),
        input.status, input.previewKind, input.featured ? 1 : 0, input.published ? 1 : 0, id
      );
    writeLinks(id, input.links);
    return projectById(id);
  });
}

export function setPublished(id: number, published: boolean) {
  db().prepare("UPDATE projects SET published=?, updated_at=datetime('now') WHERE id=?").run(published ? 1 : 0, id);
}

export function setFeatured(id: number, featured: boolean) {
  db().prepare("UPDATE projects SET featured=?, updated_at=datetime('now') WHERE id=?").run(featured ? 1 : 0, id);
}

export function archiveProject(id: number) {
  db()
    .prepare("UPDATE projects SET prev_status = CASE WHEN status='archived' THEN prev_status ELSE status END, status='archived', updated_at=datetime('now') WHERE id=?")
    .run(id);
}

export function restoreProject(id: number) {
  db()
    .prepare("UPDATE projects SET status = COALESCE(NULLIF(prev_status,'archived'), 'development'), prev_status=NULL, published=0, updated_at=datetime('now') WHERE id=?")
    .run(id);
}

export function deleteProject(id: number) {
  const files = db().prepare("SELECT file FROM project_images WHERE project_id=?").all(id) as Row[];
  db().prepare("DELETE FROM projects WHERE id=?").run(id);
  for (const f of files) removeUploadIfUnused(String(f.file));
}

export function reorderProjects(order: number[]) {
  tx(() => {
    const st = db().prepare("UPDATE projects SET sort_order=? WHERE id=?");
    order.forEach((id, i) => st.run(i + 1, id));
  });
}

// ---------- Gambar ----------

export function addImage(projectId: number, role: "cover" | "gallery", file: string, alt: string, width: number, height: number) {
  return tx(() => {
    if (role === "cover") {
      const old = db().prepare("SELECT id, file FROM project_images WHERE project_id=? AND role='cover'").all(projectId) as Row[];
      db().prepare("DELETE FROM project_images WHERE project_id=? AND role='cover'").run(projectId);
      for (const o of old) removeUploadIfUnused(String(o.file));
    }
    const max = (db().prepare("SELECT COALESCE(MAX(sort),0) AS m FROM project_images WHERE project_id=?").get(projectId) as Row).m;
    db()
      .prepare("INSERT INTO project_images (project_id, role, file, alt, width, height, sort) VALUES (?,?,?,?,?,?,?)")
      .run(projectId, role, file, alt, width, height, Number(max) + 1);
    db().prepare("UPDATE projects SET updated_at=datetime('now') WHERE id=?").run(projectId);
  });
}

export function updateImageAlt(projectId: number, imageId: number, alt: string) {
  db().prepare("UPDATE project_images SET alt=? WHERE id=? AND project_id=?").run(alt, imageId, projectId);
}

export function deleteImage(projectId: number, imageId: number) {
  const row = db().prepare("SELECT file FROM project_images WHERE id=? AND project_id=?").get(imageId, projectId) as Row | undefined;
  if (!row) return false;
  db().prepare("DELETE FROM project_images WHERE id=?").run(imageId);
  removeUploadIfUnused(String(row.file));
  return true;
}

function removeUploadIfUnused(file: string) {
  const used = db().prepare("SELECT 1 FROM project_images WHERE file=? LIMIT 1").get(file);
  if (used || !/^[a-f0-9]{32}\.(png|jpg|webp)$/.test(file)) return;
  fs.rm(path.join(uploadsDir(), file), { force: true }, () => {});
}

// ---------- Ekspor / impor ----------

export function exportData() {
  return {
    format: "felixiority-projects",
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: allProjects().map((p) => ({
      slug: p.slug, title: p.title, summary: p.summary, description: p.description,
      categories: p.categories, tech: p.tech, status: p.status, previewKind: p.previewKind,
      featured: p.featured, published: p.published, sortOrder: p.sortOrder,
      links: p.links.map(({ kind, label, url }) => ({ kind, label, url })),
      images: [...(p.cover ? [p.cover] : []), ...p.gallery].map(({ role, file, alt, width, height }) => ({ role, file, alt, width, height })),
    })),
  };
}

const importSchema = z.object({
  format: z.literal("felixiority-projects"),
  version: z.literal(1),
  projects: z
    .array(
      projectInputSchema.extend({
        slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
        sortOrder: z.number().int().optional(),
        images: z
          .array(z.object({
            role: z.enum(["cover", "gallery"]),
            file: z.string().regex(/^[a-f0-9]{32}\.(png|jpg|webp)$/),
            alt: z.string().max(200).default(""),
            width: z.number().int().min(0).default(0),
            height: z.number().int().min(0).default(0),
          }))
          .max(30)
          .default([]),
      })
    )
    .max(500),
});

export function importData(raw: unknown, mode: "merge" | "replace") {
  const parsed = importSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`File JSON tidak valid: ${issue.path.join(".") || "root"} ${issue.message}`);
  }
  let created = 0, updated = 0, skippedImages = 0;
  tx(() => {
    if (mode === "replace") db().exec("DELETE FROM projects");
    parsed.data.projects.forEach((p, i) => {
      const hit = db().prepare("SELECT id FROM projects WHERE slug=?").get(p.slug) as Row | undefined;
      let id: number;
      const vals = [p.title, p.summary, p.description, JSON.stringify(p.categories), JSON.stringify(p.tech), p.status, p.previewKind, p.featured ? 1 : 0, p.published ? 1 : 0, p.sortOrder ?? i + 1];
      if (hit) {
        id = Number(hit.id);
        db().prepare(`UPDATE projects SET title=?, summary=?, description=?, categories=?, tech=?, status=?, preview_kind=?, featured=?, published=?, sort_order=?, updated_at=datetime('now') WHERE id=?`).run(...vals, id);
        updated++;
      } else {
        const r = db().prepare(`INSERT INTO projects (title, summary, description, categories, tech, status, preview_kind, featured, published, sort_order, slug) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(...vals, p.slug);
        id = Number(r.lastInsertRowid);
        created++;
      }
      writeLinks(id, p.links);
      if (p.images.length) {
        db().prepare("DELETE FROM project_images WHERE project_id=?").run(id);
        const ins = db().prepare("INSERT INTO project_images (project_id, role, file, alt, width, height, sort) VALUES (?,?,?,?,?,?,?)");
        let hasCover = false;
        p.images.forEach((img, j) => {
          if (!fs.existsSync(path.join(uploadsDir(), img.file))) { skippedImages++; return; }
          if (img.role === "cover") { if (hasCover) return; hasCover = true; }
          ins.run(id, img.role, img.file, img.alt, img.width, img.height, j);
        });
      }
    });
  });
  return { created, updated, skippedImages };
}
