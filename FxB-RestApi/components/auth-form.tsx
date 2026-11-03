"use client";

import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mascot } from "./brand";
import { KeyReveal } from "./key-reveal";
import { useApp } from "./providers";
import { Button, Field, Input, PageTransition, Segmented } from "./ui";
import { api } from "@/lib/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const { refreshMe, lang } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const id = lang === "id";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") {
        const r = await api<{ apiKey: string }>("/api/auth/register", { body: { name, email, password } });
        await refreshMe();
        setSecret(r.apiKey);
      } else {
        await api("/api/auth/login", { body: { email, password } });
        await refreshMe();
        router.push(safeNext);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (secret) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-md rounded-[30px] bg-card px-5 pb-7 pt-7">
          <h1 className="text-[26px] font-bold">{id ? "Akun siap 🎉" : "You're all set 🎉"}</h1>
          <p className="mt-1 text-[14.5px] text-muted">{id ? "Kami sudah membuatkan API key gratis pertamamu." : "We created your first free API key."}</p>
          <div className="mt-5"><KeyReveal secret={secret} /></div>
          <Button size="lg" className="mt-6 w-full" onClick={() => router.push(safeNext === "/dashboard" ? "/dashboard" : safeNext)}>{id ? "Lanjut ke dashboard" : "Continue to dashboard"}</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Mascot className="size-16" />
          <h1 className="mt-3 text-[28px] font-extrabold">{mode === "login" ? (id ? "Selamat datang kembali" : "Welcome back") : id ? "Buat akun gratis" : "Create a free account"}</h1>
          <p className="mt-1 text-[14.5px] text-muted">FxB RestApi · FELIXIORITY</p>
        </div>
        <div className="rounded-[30px] bg-card px-5 pb-7 pt-5">
          <Segmented value={mode} onChange={(v) => router.replace(`/${v}${next ? `?next=${encodeURIComponent(next)}` : ""}`)} options={[{ value: "login", label: id ? "Masuk" : "Log in" }, { value: "register", label: id ? "Daftar" : "Sign up" }]} />
          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "register" && (
              <Field label={id ? "Nama" : "Name"}>
                <Input value={name} onChange={(e) => setName(e.target.value)} onClear={() => setName("")} placeholder="Felix" required minLength={2} maxLength={60} autoComplete="name" />
              </Field>
            )}
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onClear={() => setEmail("")} placeholder="kamu@email.com" required autoComplete="email" />
            </Field>
            <Field label="Password" hint={mode === "register" ? (id ? "Minimal 8 karakter." : "At least 8 characters.") : undefined}>
              <div className="relative">
                <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "register" ? 8 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} className="pr-12" />
                <button type="button" aria-label="Tampilkan password" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-muted">
                  {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </Field>
            {error && <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger">{error}</p>}
            <Button size="lg" className="w-full" loading={busy} icon={mode === "login" ? LogIn : UserPlus}>
              {mode === "login" ? (id ? "Masuk" : "Log in") : id ? "Daftar & buat key" : "Sign up & create key"}
            </Button>
          </form>
          {mode === "register" && (
            <p className="mt-4 text-center text-[12.5px] text-subtle">
              {id ? "Dengan mendaftar kamu menyetujui " : "By signing up you agree to the "}
              <Link href="/legal/terms" className="underline">{id ? "Syarat Layanan" : "Terms"}</Link> &{" "}
              <Link href="/legal/privacy" className="underline">{id ? "Kebijakan Privasi" : "Privacy Policy"}</Link>.
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
