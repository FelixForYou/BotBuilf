"use client";
import { useState } from "react";
import type { Settings } from "@/lib/types";
import { useAdmin } from "./AdminKit";

export function SettingsForm({ initial }: { initial: Settings }) {
  const { api, toast } = useAdmin();
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const up = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload: Settings = {
      ...s,
      about: { ...s.about, paragraphs: s.about.paragraphs.map((p) => p.trim()).filter(Boolean), focus: s.about.focus.map((f) => f.trim()).filter(Boolean) },
      services: s.services.filter((x) => x.title.trim()),
      socials: s.socials.filter((x) => x.label.trim() || x.url.trim()),
    };
    try {
      const { settings } = await api<{ settings: Settings }>("/api/admin/settings", { method: "PUT", json: payload });
      setS(settings);
      toast("ok", "Pengaturan disimpan.");
    } catch (err) {
      const t = err instanceof Error ? err.message : "Gagal menyimpan.";
      setError(t);
      toast("err", t);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="page" onSubmit={save}>
      <header className="page__head">
        <div>
          <p className="eyebrow">Pengaturan</p>
          <h1>Konten &amp; SEO</h1>
        </div>
        <button className="abtn abtn--primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan semua"}</button>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="editor">
        <section className="card">
          <h2>Animasi</h2>
          <p className="hint">Pengunjung yang mengaktifkan &quot;kurangi gerakan&quot; di perangkatnya selalu mendapat mode minimal.</p>
          <div className="checks">
            {([["full", "Penuh", "Pin hero, kamera 2.5D di showcase, transisi halaman."], ["light", "Ringan", "Tanpa 3D; showcase geser horizontal, reveal sederhana."], ["minimal", "Minimal", "Hampir tanpa gerak. Konten langsung tampil."]] as const).map(([v, l, d]) => (
              <label key={v} className="radio">
                <input type="radio" name="motion" checked={s.motion === v} onChange={() => up("motion", v)} />
                <span><b>{l}</b><small>{d}</small></span>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Hero</h2>
          <Field label="Label kecil" value={s.hero.eyebrow} max={80} onChange={(v) => up("hero", { ...s.hero, eyebrow: v })} />
          <Field label="Headline" value={s.hero.headline} max={180} area onChange={(v) => up("hero", { ...s.hero, headline: v })} />
          <Field label="Paragraf pendek" value={s.hero.sub} max={400} area onChange={(v) => up("hero", { ...s.hero, sub: v })} />
        </section>

        <section className="card">
          <h2>Profil brand (Tentang)</h2>
          <Field label="Judul" value={s.about.title} max={140} onChange={(v) => up("about", { ...s.about, title: v })} />
          {s.about.paragraphs.map((p, i) => (
            <div key={i} className="stack-row">
              <Field label={`Paragraf ${i + 1}`} value={p} max={1200} area onChange={(v) => up("about", { ...s.about, paragraphs: s.about.paragraphs.map((x, j) => (j === i ? v : x)) })} />
              <button type="button" className="abtn abtn--icon" aria-label="Hapus paragraf" onClick={() => up("about", { ...s.about, paragraphs: s.about.paragraphs.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          {s.about.paragraphs.length < 6 && <button type="button" className="abtn" onClick={() => up("about", { ...s.about, paragraphs: [...s.about.paragraphs, ""] })}>+ Paragraf</button>}
          <label className="field">
            <span>Daftar fokus <small>satu per baris</small></span>
            <textarea className="input" rows={4} value={s.about.focus.join("\n")} onChange={(e) => up("about", { ...s.about, focus: e.target.value.split("\n").slice(0, 8) })} />
          </label>
        </section>

        <section className="card">
          <h2>Layanan / fokus</h2>
          {s.services.map((sv, i) => (
            <div key={i} className="stack-row">
              <div className="grow">
                <Field label={`Layanan ${i + 1}`} value={sv.title} max={60} onChange={(v) => up("services", s.services.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
                <Field label="Deskripsi" value={sv.body} max={400} area onChange={(v) => up("services", s.services.map((x, j) => (j === i ? { ...x, body: v } : x)))} />
              </div>
              <button type="button" className="abtn abtn--icon" aria-label="Hapus layanan" onClick={() => up("services", s.services.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {s.services.length < 8 && <button type="button" className="abtn" onClick={() => up("services", [...s.services, { title: "", body: "" }])}>+ Layanan</button>}
        </section>

        <section className="card">
          <h2>Kontak</h2>
          <p className="hint">Kolom kosong tidak ditampilkan di situs.</p>
          <Field label="Judul bagian kontak" value={s.contact.title} max={200} onChange={(v) => up("contact", { ...s.contact, title: v })} />
          <Field label="Catatan" value={s.contact.note} max={400} area onChange={(v) => up("contact", { ...s.contact, note: v })} />
          <div className="row2">
            <Field label="Email" type="email" value={s.contact.email} max={120} onChange={(v) => up("contact", { ...s.contact, email: v })} />
            <Field label="Username Telegram" value={s.contact.telegram} max={64} placeholder="@username" onChange={(v) => up("contact", { ...s.contact, telegram: v })} />
            <Field label="WhatsApp" value={s.contact.whatsapp} max={20} placeholder="+62…" onChange={(v) => up("contact", { ...s.contact, whatsapp: v })} />
            <Field label="Lokasi" value={s.contact.location} max={80} onChange={(v) => up("contact", { ...s.contact, location: v })} />
          </div>
        </section>

        <section className="card">
          <h2>Sosial media</h2>
          {s.socials.length === 0 && <p className="empty empty--sm">Belum ada tautan sosial.</p>}
          {s.socials.map((so, i) => (
            <div key={i} className="linkrow linkrow--2">
              <input className="input" placeholder="Label, mis. GitHub" aria-label="Label" maxLength={30} value={so.label} onChange={(e) => up("socials", s.socials.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="input" type="url" placeholder="https://" aria-label="URL" value={so.url} onChange={(e) => up("socials", s.socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button type="button" className="abtn abtn--icon" aria-label="Hapus" onClick={() => up("socials", s.socials.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {s.socials.length < 10 && <button type="button" className="abtn" onClick={() => up("socials", [...s.socials, { label: "", url: "" }])}>+ Tautan sosial</button>}
        </section>

        <section className="card">
          <h2>SEO</h2>
          <Field label="Judul halaman" value={s.seo.title} max={90} onChange={(v) => up("seo", { ...s.seo, title: v })} />
          <Field label="Deskripsi meta" value={s.seo.description} max={300} area onChange={(v) => up("seo", { ...s.seo, description: v })} />
        </section>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, max, area, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; max: number; area?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label} <small>{value.length}/{max}</small></span>
      {area ? (
        <textarea className="input" rows={3} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input className="input" type={type} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}
