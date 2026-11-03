"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project, ProjectLink } from "@/lib/types";
import { CATEGORIES, LINK_KINDS, PREVIEW_KINDS, STATUSES, mediaUrl } from "@/lib/types";
import { useAdmin } from "./AdminKit";

type Form = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  categories: string[];
  tech: string;
  status: string;
  previewKind: string;
  featured: boolean;
  links: ProjectLink[];
};

const fromProject = (p: Project | null): Form => ({
  title: p?.title ?? "",
  slug: p?.slug ?? "",
  summary: p?.summary ?? "",
  description: p?.description ?? "",
  categories: p?.categories ?? [],
  tech: p?.tech.join(", ") ?? "",
  status: p?.status ?? "development",
  previewKind: p?.previewKind ?? "api",
  featured: p?.featured ?? false,
  links: p?.links.map(({ kind, label, url }) => ({ kind, label, url })) ?? [],
});

export function ProjectEditor({ project: initial }: { project: Project | null }) {
  const { api, toast, confirm } = useAdmin();
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [form, setForm] = useState<Form>(() => fromProject(initial));
  const [saved, setSaved] = useState(() => JSON.stringify(fromProject(initial)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field?: string; text: string } | null>(null);
  const dirty = JSON.stringify(form) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save(publish: boolean | null) {
    setBusy(true);
    setError(null);
    const payload = {
      ...form,
      tech: form.tech.split(",").map((t) => t.trim()).filter(Boolean),
      links: form.links.filter((l) => l.url.trim() !== "").map((l) => ({ ...l, url: l.url.trim(), label: l.label.trim() })),
      published: publish ?? project?.published ?? false,
    };
    try {
      const { project: p } = project
        ? await api<{ project: Project }>(`/api/admin/projects/${project.id}`, { method: "PUT", json: payload })
        : await api<{ project: Project }>("/api/admin/projects", { method: "POST", json: payload });
      setProject(p);
      const f = fromProject(p);
      setForm(f);
      setSaved(JSON.stringify(f));
      toast("ok", publish === true ? "Disimpan dan dipublikasikan." : publish === false ? "Disimpan sebagai draft." : "Perubahan disimpan.");
      if (!project) router.replace(`/admin/projects/${p.id}`);
    } catch (e) {
      const text = e instanceof Error ? e.message : "Gagal menyimpan.";
      setError({ text });
      toast("err", text);
    } finally {
      setBusy(false);
    }
  }

  async function action(a: "archive" | "restore") {
    if (!project) return;
    if (a === "archive" && !(await confirm({ title: "Arsipkan project ini?", body: "Project disembunyikan dari situs. Kamu bisa memulihkannya kapan saja dari tab Arsip.", confirm: "Arsipkan" }))) return;
    try {
      const { project: p } = await api<{ project: Project }>(`/api/admin/projects/${project.id}`, { method: "PATCH", json: { action: a } });
      setProject(p);
      const f = fromProject(p);
      setForm(f);
      setSaved(JSON.stringify(f));
      toast("ok", a === "archive" ? "Project diarsipkan." : "Project dipulihkan sebagai draft.");
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Aksi gagal.");
    }
  }

  async function remove() {
    if (!project) return;
    const ok = await confirm({ title: `Hapus "${project.title}" permanen?`, body: "Tindakan ini tidak bisa dibatalkan. Gambar yang diunggah untuk project ini ikut dihapus.", confirm: "Hapus permanen", danger: true });
    if (!ok) return;
    try {
      await api(`/api/admin/projects/${project.id}`, { method: "DELETE" });
      toast("ok", "Project dihapus.");
      setSaved(JSON.stringify(form));
      router.push("/admin");
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Gagal menghapus.");
    }
  }

  const archived = project?.status === "archived";

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow"><Link href="/admin">Project</Link> / {project ? "Edit" : "Baru"}</p>
          <h1>{form.title || "Project baru"}</h1>
          {project && (
            <p className="page__sub">
              {archived ? "Diarsipkan" : project.published ? "Terbit di situs" : "Draft, belum terlihat publik"}
              {dirty && <b className="dirty"> · ada perubahan belum disimpan</b>}
            </p>
          )}
        </div>
        <div className="page__actions">
          {project && <a className="abtn" href={`/preview/${project.id}`} target="_blank" rel="noopener">Preview{dirty ? " (versi tersimpan)" : ""}</a>}
          {!archived && (
            <>
              <button className="abtn" onClick={() => save(false)} disabled={busy}>Simpan draft</button>
              <button className="abtn abtn--primary" onClick={() => save(true)} disabled={busy}>{project?.published ? "Simpan" : "Simpan & publikasikan"}</button>
            </>
          )}
        </div>
      </header>

      {error && <p className="form-error" role="alert">{error.text}</p>}

      <form className="editor" onSubmit={(e) => { e.preventDefault(); save(null); }}>
        <section className="card">
          <h2>Informasi utama</h2>
          <label className="field">
            <span>Judul *</span>
            <input className="input" value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} required />
          </label>
          <label className="field">
            <span>Slug (alamat URL)</span>
            <div className="input-prefix"><em>/project/</em><input className="input" value={form.slug} maxLength={80} placeholder="otomatis dari judul" onChange={(e) => set("slug", e.target.value.toLowerCase())} /></div>
          </label>
          <label className="field">
            <span>Deskripsi singkat <small>{form.summary.length}/240</small></span>
            <textarea className="input" rows={2} maxLength={240} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
          </label>
          <label className="field">
            <span>Deskripsi lengkap <small>pisahkan paragraf dengan baris kosong</small></span>
            <textarea className="input" rows={9} maxLength={8000} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
        </section>

        <section className="card">
          <h2>Klasifikasi</h2>
          <fieldset className="field">
            <legend>Kategori *</legend>
            <div className="checks">
              {CATEGORIES.map((c) => (
                <label key={c.id} className="check">
                  <input
                    type="checkbox"
                    checked={form.categories.includes(c.id)}
                    onChange={(e) => set("categories", e.target.checked ? [...form.categories, c.id] : form.categories.filter((x) => x !== c.id))}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="row2">
            <label className="field">
              <span>Status</span>
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)} disabled={archived}>
                {STATUSES.filter((s) => archived || s.id !== "archived").map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Ilustrasi pengganti cover</span>
              <select className="input" value={form.previewKind} onChange={(e) => set("previewKind", e.target.value)}>
                {PREVIEW_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Teknologi <small>pisahkan dengan koma</small></span>
            <input className="input" value={form.tech} onChange={(e) => set("tech", e.target.value)} placeholder="Next.js, Node.js, Pterodactyl API" />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
            Tampilkan di showcase Project Pilihan
          </label>
        </section>

        <section className="card">
          <h2>Tautan</h2>
          <p className="hint">Tombol kunjungan hanya muncul untuk tautan yang terisi. Baris dengan URL kosong tidak disimpan.</p>
          {form.links.length === 0 && <p className="empty empty--sm">Belum ada tautan.</p>}
          {form.links.map((l, i) => (
            <div className="linkrow" key={i}>
              <select className="input" value={l.kind} aria-label="Jenis tautan" onChange={(e) => set("links", form.links.map((x, j) => (j === i ? { ...x, kind: e.target.value as ProjectLink["kind"] } : x)))}>
                {LINK_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
              <input className="input" placeholder="Label (opsional)" aria-label="Label tautan" maxLength={40} value={l.label} onChange={(e) => set("links", form.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="input" type="url" placeholder="https://" aria-label="URL" value={l.url} onChange={(e) => set("links", form.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button type="button" className="abtn abtn--icon" aria-label="Hapus tautan" onClick={() => set("links", form.links.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {form.links.length < 12 && (
            <button type="button" className="abtn" onClick={() => set("links", [...form.links, { kind: "website", label: "", url: "" }])}>+ Tambah tautan</button>
          )}
        </section>

        {project ? <ImageManager project={project} onChange={setProject} /> : (
          <section className="card"><h2>Gambar</h2><p className="hint">Simpan project sebagai draft dulu, lalu cover dan screenshot bisa diunggah.</p></section>
        )}

        {project && (
          <section className="card card--danger">
            <h2>Zona hati-hati</h2>
            <div className="page__actions">
              {archived ? (
                <button type="button" className="abtn abtn--primary" onClick={() => action("restore")}>Pulihkan dari arsip</button>
              ) : (
                <button type="button" className="abtn" onClick={() => action("archive")}>Arsipkan</button>
              )}
              <button type="button" className="abtn abtn--danger" onClick={remove}>Hapus permanen</button>
            </div>
          </section>
        )}
        <button type="submit" hidden>Simpan</button>
      </form>
    </div>
  );
}

function ImageManager({ project, onChange }: { project: Project; onChange: (p: Project) => void }) {
  const { api, toast, confirm } = useAdmin();
  const [busy, setBusy] = useState(false);

  async function upload(role: "cover" | "gallery", file: File, alt: string, reset: () => void) {
    if (!alt.trim()) { toast("err", "Isi teks alternatif dulu: jelaskan isi gambar secara singkat."); return; }
    if (file.size > 6 * 1024 * 1024) { toast("err", "Ukuran gambar maksimal 6 MB."); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast("err", "Gunakan PNG, JPG, atau WebP."); return; }
    const fd = new FormData();
    fd.set("file", file);
    fd.set("role", role);
    fd.set("alt", alt.trim());
    setBusy(true);
    try {
      const { project: p } = await api<{ project: Project }>(`/api/admin/projects/${project.id}/images`, { method: "POST", body: fd });
      onChange(p);
      reset();
      toast("ok", role === "cover" ? "Cover diperbarui." : "Screenshot ditambahkan.");
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAlt(imageId: number, alt: string) {
    try {
      const { project: p } = await api<{ project: Project }>(`/api/admin/projects/${project.id}/images`, { method: "PATCH", json: { imageId, alt } });
      onChange(p);
      toast("ok", "Teks alternatif disimpan.");
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Gagal menyimpan.");
    }
  }

  async function del(imageId: number, isCover: boolean) {
    if (!(await confirm({ title: isCover ? "Hapus cover?" : "Hapus screenshot ini?", body: isCover ? "Situs akan kembali memakai ilustrasi project." : undefined, confirm: "Hapus", danger: true }))) return;
    try {
      const { project: p } = await api<{ project: Project }>(`/api/admin/projects/${project.id}/images?imageId=${imageId}`, { method: "DELETE" });
      onChange(p);
      toast("ok", "Gambar dihapus.");
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Gagal menghapus.");
    }
  }

  return (
    <section className="card">
      <h2>Gambar</h2>
      <p className="hint">PNG, JPG, atau WebP, maksimal 6 MB. Tanpa cover, situs memakai ilustrasi antarmuka bertanda &quot;Ilustrasi project&quot;.</p>

      <h3>Cover</h3>
      {project.cover ? (
        <ImageItem key={project.cover.id} img={project.cover} onAlt={saveAlt} onDelete={() => del(project.cover!.id, true)} />
      ) : (
        <p className="empty empty--sm">Belum ada cover. Saat ini memakai ilustrasi.</p>
      )}
      <Uploader label={project.cover ? "Ganti cover" : "Unggah cover"} busy={busy} onUpload={(f, alt, reset) => upload("cover", f, alt, reset)} />

      <h3>Screenshot <small>{project.gallery.length}/20</small></h3>
      <div className="gallery">
        {project.gallery.map((g) => <ImageItem key={g.id} img={g} onAlt={saveAlt} onDelete={() => del(g.id, false)} />)}
      </div>
      {project.gallery.length < 20 && <Uploader label="Tambah screenshot" busy={busy} onUpload={(f, alt, reset) => upload("gallery", f, alt, reset)} />}
    </section>
  );
}

function ImageItem({ img, onAlt, onDelete }: { img: NonNullable<Project["cover"]>; onAlt: (id: number, alt: string) => void; onDelete: () => void }) {
  const [alt, setAlt] = useState(img.alt);
  return (
    <div className="imgitem">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl(img.file)} alt={img.alt} />
      <div className="imgitem__body">
        <label className="field">
          <span>Teks alternatif</span>
          <input className="input" value={alt} maxLength={200} onChange={(e) => setAlt(e.target.value)} />
        </label>
        <p className="hint">{img.width}×{img.height}px</p>
        <div className="page__actions">
          <button type="button" className="abtn" disabled={alt.trim() === img.alt || !alt.trim()} onClick={() => onAlt(img.id, alt)}>Simpan alt</button>
          <button type="button" className="abtn abtn--danger" onClick={onDelete}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

function Uploader({ label, busy, onUpload }: { label: string; busy: boolean; onUpload: (f: File, alt: string, reset: () => void) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const reset = () => { setFile(null); setAlt(""); setUrl(null); if (fileRef.current) fileRef.current.value = ""; };
  return (
    <div className="uploader">
      <label className="field">
        <span>{label}</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setUrl(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>
      {file && (
        <div className="uploader__confirm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url && <img src={url} alt="Pratinjau file yang dipilih" />}
          <label className="field">
            <span>Teks alternatif *</span>
            <input className="input" value={alt} maxLength={200} placeholder="Contoh: Halaman dashboard FELIX PANEL berisi daftar paket" onChange={(e) => setAlt(e.target.value)} />
          </label>
          <div className="page__actions">
            <button type="button" className="abtn abtn--primary" disabled={busy || !alt.trim()} onClick={() => onUpload(file, alt, reset)}>{busy ? "Mengunggah…" : "Unggah"}</button>
            <button type="button" className="abtn" onClick={reset}>Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}
