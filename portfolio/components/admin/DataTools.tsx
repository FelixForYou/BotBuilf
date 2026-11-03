"use client";
import { useState } from "react";
import { useAdmin } from "./AdminKit";

export function DataTools() {
  const { api, toast, confirm } = useAdmin();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function doImport() {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast("err", "File JSON maksimal 4 MB."); return; }
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      toast("err", "File bukan JSON yang valid.");
      return;
    }
    const ok = await confirm({
      title: mode === "replace" ? "Ganti semua project dengan isi file?" : "Gabungkan project dari file?",
      body: mode === "replace"
        ? "Semua project yang ada sekarang akan dihapus lalu diganti isi file. Ekspor dulu kalau perlu cadangan."
        : "Project dengan slug yang sama akan ditimpa, sisanya ditambahkan.",
      confirm: mode === "replace" ? "Ganti semua" : "Impor",
      danger: mode === "replace",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await api<{ created: number; updated: number; skippedImages: number }>("/api/admin/import", { method: "POST", json: { mode, data } });
      const msg = `${r.created} project baru, ${r.updated} diperbarui${r.skippedImages ? `, ${r.skippedImages} gambar dilewati karena file-nya tidak ada di server` : ""}.`;
      setResult(msg);
      toast("ok", `Impor selesai: ${msg}`);
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Impor gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Data</p>
          <h1>Ekspor &amp; impor</h1>
        </div>
      </header>
      <div className="editor">
        <section className="card">
          <h2>Ekspor</h2>
          <p className="hint">Mengunduh semua project (termasuk draft dan arsip), tautan, serta metadata gambar dalam format JSON. File gambar tetap ada di folder <code>data/uploads</code>.</p>
          <a className="abtn abtn--primary" href="/api/admin/export" download>Unduh JSON</a>
        </section>
        <section className="card">
          <h2>Impor</h2>
          <label className="field">
            <span>File JSON hasil ekspor</span>
            <input type="file" accept="application/json,.json" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(""); }} />
          </label>
          <div className="checks">
            <label className="radio"><input type="radio" name="mode" checked={mode === "merge"} onChange={() => setMode("merge")} /><span><b>Gabungkan</b><small>Timpa project dengan slug sama, tambahkan yang baru.</small></span></label>
            <label className="radio"><input type="radio" name="mode" checked={mode === "replace"} onChange={() => setMode("replace")} /><span><b>Ganti semua</b><small>Hapus semua project lalu isi ulang dari file.</small></span></label>
          </div>
          <button className="abtn abtn--primary" disabled={!file || busy} onClick={doImport}>{busy ? "Mengimpor…" : "Impor"}</button>
          {result && <p className="hint" role="status">{result}</p>}
        </section>
      </div>
    </div>
  );
}
