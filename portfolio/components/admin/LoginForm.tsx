"use client";
import { useState } from "react";
import Link from "next/link";

export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login gagal.");
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
      setBusy(false);
    }
  }

  return (
    <form className="login__form" onSubmit={onSubmit} noValidate>
      <h1>Login admin</h1>
      <label className="field">
        <span>Username</span>
        <input name="username" autoComplete="username" required maxLength={64} autoFocus />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="abtn abtn--primary abtn--block" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
      <p className="login__hint">Lupa password? Jalankan <code>npm run reset-password</code> di terminal server.</p>
      <Link href="/" className="login__back">← Kembali ke situs</Link>
    </form>
  );
}
