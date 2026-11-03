"use client";

import { Globe, LogOut, Moon, Sun, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Button, Card, Field, Input, ListGroup, ListRow, PageTransition, SectionLabel, Sheet, toast } from "@/components/ui";
import { api, fmtDate } from "@/lib/client";

export default function SettingsPage() {
  const { me, refreshMe, lang, setLang, theme, setTheme } = useApp();
  const router = useRouter();
  const [name, setName] = useState(me?.name ?? "");
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [del, setDel] = useState(false);
  const [delPw, setDelPw] = useState("");
  useEffect(() => setName(me?.name ?? ""), [me?.name]);

  async function wrap(k: string, fn: () => Promise<void>) {
    setBusy(k);
    try {
      await fn();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageTransition>
      <h1 className="text-[28px] font-extrabold">Pengaturan</h1>
      <p className="text-[14.5px] text-muted">Akun dibuat {fmtDate(me?.created_at)} · {me?.role === "admin" ? "Admin" : "User"}</p>

      <SectionLabel>Profil</SectionLabel>
      <Card className="space-y-4">
        <Field label="Nama"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Field>
        <Field label="Email" hint="Email tidak dapat diubah."><Input value={me?.email ?? ""} disabled /></Field>
        <Button loading={busy === "name"} onClick={() => wrap("name", async () => { await api("/api/account", { method: "PATCH", body: { name } }); await refreshMe(); toast("Profil disimpan."); })}>Simpan profil</Button>
      </Card>

      <SectionLabel>Keamanan</SectionLabel>
      <Card className="space-y-4">
        <Field label="Password lama"><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></Field>
        <Field label="Password baru" hint="Minimal 8 karakter. Semua sesi lain akan keluar."><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></Field>
        <Button loading={busy === "pw"} disabled={!cur || next.length < 8} onClick={() => wrap("pw", async () => { await api("/api/account/password", { body: { current: cur, next } }); setCur(""); setNext(""); toast("Password diganti."); })}>Ganti password</Button>
      </Card>

      <SectionLabel>Preferensi</SectionLabel>
      <ListGroup>
        <ListRow icon={Globe} label="Bahasa" value={lang === "id" ? "Indonesia" : "English"} onClick={() => setLang(lang === "id" ? "en" : "id")} />
        <ListRow icon={theme === "dark" ? Moon : Sun} label="Tampilan" value={theme === "dark" ? "Gelap" : "Terang"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
      </ListGroup>

      <SectionLabel>Zona berbahaya</SectionLabel>
      <ListGroup>
        <ListRow icon={LogOut} label="Keluar dari perangkat ini" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); await refreshMe(); router.push("/"); }} />
        <ListRow icon={Trash2} label="Hapus akun" sub="Semua API key ikut dihapus permanen" danger onClick={() => setDel(true)} />
      </ListGroup>

      <Sheet open={del} onClose={() => setDel(false)} title="Hapus akun?" subtitle="Tindakan ini tidak bisa dibatalkan.">
        <Field label="Konfirmasi dengan password"><Input type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} /></Field>
        <Button size="lg" variant="danger" className="mt-5 w-full" loading={busy === "del"} disabled={!delPw} onClick={() => wrap("del", async () => { await api("/api/account", { method: "DELETE", body: { password: delPw } }); await refreshMe(); toast("Akun dihapus.", "info"); router.push("/"); })}>Hapus akun permanen</Button>
      </Sheet>
    </PageTransition>
  );
}
