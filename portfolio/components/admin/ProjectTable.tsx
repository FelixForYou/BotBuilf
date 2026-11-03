"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { CATEGORIES, STATUSES, categoryLabel, mediaUrl, statusLabel } from "@/lib/types";
import { useAdmin } from "./AdminKit";

type View = "aktif" | "draft" | "terbit" | "arsip";

export function ProjectTable({ initial }: { initial: Project[] }) {
  const { api, toast, confirm } = useAdmin();
  const [items, setItems] = useState(initial);
  const [view, setView] = useState<View>("aktif");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const counts = {
    aktif: items.filter((p) => p.status !== "archived").length,
    terbit: items.filter((p) => p.status !== "archived" && p.published).length,
    draft: items.filter((p) => p.status !== "archived" && !p.published).length,
    arsip: items.filter((p) => p.status === "archived").length,
  };

  const list = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return items.filter((p) => {
      if (view === "arsip" ? p.status !== "archived" : p.status === "archived") return false;
      if (view === "draft" && p.published) return false;
      if (view === "terbit" && !p.published) return false;
      if (cat && !p.categories.includes(cat as Project["categories"][number])) return false;
      if (status && p.status !== status) return false;
      if (qn && !`${p.title} ${p.slug} ${p.summary} ${p.tech.join(" ")}`.toLowerCase().includes(qn)) return false;
      return true;
    });
  }, [items, view, q, cat, status]);

  const replace = (p: Project) => setItems((all) => all.map((x) => (x.id === p.id ? p : x)));

  async function act(p: Project, action: string, okText: string) {
    setBusy(p.id);
    try {
      const { project } = await api<{ project: Project }>(`/api/admin/projects/${p.id}`, { method: "PATCH", json: { action } });
      replace(project);
      toast("ok", okText);
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Aksi gagal.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: Project) {
    const ok = await confirm({
      title: `Hapus "${p.title}" secara permanen?`,
      body: "Project, tautan, dan gambarnya akan dihapus dari database. Kalau masih ragu, pilih Arsipkan saja; project arsip bisa dipulihkan.",
      confirm: "Hapus permanen",
      danger: true,
    });
    if (!ok) return;
    setBusy(p.id);
    try {
      await api(`/api/admin/projects/${p.id}`, { method: "DELETE" });
      setItems((all) => all.filter((x) => x.id !== p.id));
      toast("ok", `"${p.title}" dihapus.`);
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Gagal menghapus.");
    } finally {
      setBusy(null);
    }
  }

  async function move(p: Project, dir: -1 | 1) {
    // urutan global berdasarkan sort_order; tukar dengan tetangga yang terlihat di daftar
    const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    const visibleIds = list.map((x) => x.id);
    const vi = visibleIds.indexOf(p.id);
    const neighborId = visibleIds[vi + dir];
    if (neighborId === undefined) return;
    const a = ordered.findIndex((x) => x.id === p.id);
    const b = ordered.findIndex((x) => x.id === neighborId);
    [ordered[a], ordered[b]] = [ordered[b], ordered[a]];
    const order = ordered.map((x) => x.id);
    const prev = items;
    setItems(ordered.map((x, i) => ({ ...x, sortOrder: i + 1 })));
    try {
      await api("/api/admin/projects/reorder", { method: "POST", json: { order } });
      toast("ok", "Urutan disimpan.");
    } catch (e) {
      setItems(prev);
      toast("err", e instanceof Error ? e.message : "Gagal menyimpan urutan.");
    }
  }

  const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Project</h1>
        </div>
        <Link href="/admin/projects/new" className="abtn abtn--primary">+ Project baru</Link>
      </header>

      <div className="tabs" role="tablist" aria-label="Kelompok project">
        {([["aktif", "Semua aktif"], ["terbit", "Terbit"], ["draft", "Draft"], ["arsip", "Arsip"]] as [View, string][]).map(([v, label]) => (
          <button key={v} role="tab" aria-selected={view === v} className="tab" onClick={() => setView(v)}>
            {label} <span>{counts[v]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input type="search" className="input" placeholder="Cari judul, slug, teknologi…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari project" />
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter kategori">
          <option value="">Semua kategori</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {view !== "arsip" && (
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            <option value="">Semua status</option>
            {STATUSES.filter((s) => s.id !== "archived").map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="empty">{view === "arsip" ? "Arsip kosong." : "Tidak ada project yang cocok."}</p>
      ) : (
        <ul className="plist">
          {sorted.map((p, i) => (
            <li key={p.id} className={`prow${busy === p.id ? " is-busy" : ""}`}>
              <div className="prow__thumb">
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(p.cover.file)} alt="" />
                ) : (
                  <span title="Belum ada cover; situs memakai ilustrasi">Ilustrasi</span>
                )}
              </div>
              <div className="prow__main">
                <Link href={`/admin/projects/${p.id}`} className="prow__title">{p.title}</Link>
                <p className="prow__meta">
                  <span>/{p.slug}</span>
                  <span>{p.categories.map(categoryLabel).join(", ")}</span>
                </p>
                <p className="prow__badges">
                  <span className={`badge badge--${p.status}`}>{statusLabel(p.status)}</span>
                  {p.status !== "archived" && <span className={`badge ${p.published ? "badge--pub" : "badge--draft"}`}>{p.published ? "Terbit" : "Draft"}</span>}
                  {p.featured && <span className="badge badge--feat">Unggulan</span>}
                </p>
              </div>
              <div className="prow__actions">
                {view !== "arsip" ? (
                  <>
                    <div className="prow__order" aria-label="Urutan">
                      <button className="abtn abtn--icon" onClick={() => move(p, -1)} disabled={i === 0 || busy !== null} aria-label={`Naikkan ${p.title}`}>↑</button>
                      <button className="abtn abtn--icon" onClick={() => move(p, 1)} disabled={i === sorted.length - 1 || busy !== null} aria-label={`Turunkan ${p.title}`}>↓</button>
                    </div>
                    <button className="abtn" onClick={() => act(p, p.featured ? "unfeature" : "feature", p.featured ? "Dihapus dari unggulan." : "Ditandai unggulan.")} disabled={busy !== null}>
                      {p.featured ? "★ Unggulan" : "☆ Unggulan"}
                    </button>
                    <button className="abtn" onClick={() => act(p, p.published ? "unpublish" : "publish", p.published ? "Dijadikan draft." : "Dipublikasikan.")} disabled={busy !== null}>
                      {p.published ? "Jadikan draft" : "Publikasikan"}
                    </button>
                    <a className="abtn" href={`/preview/${p.id}`} target="_blank" rel="noopener">Preview</a>
                    <Link className="abtn" href={`/admin/projects/${p.id}`}>Edit</Link>
                    <button className="abtn" onClick={() => act(p, "archive", "Dipindahkan ke arsip.")} disabled={busy !== null}>Arsipkan</button>
                  </>
                ) : (
                  <>
                    <button className="abtn abtn--primary" onClick={() => act(p, "restore", "Dipulihkan sebagai draft.")} disabled={busy !== null}>Pulihkan</button>
                    <button className="abtn abtn--danger" onClick={() => remove(p)} disabled={busy !== null}>Hapus permanen</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="hint">Urutan di daftar ini dipakai di situs. Project unggulan tampil di showcase atas, sisanya tetap muncul di bagian Semua Project.</p>
    </div>
  );
}
