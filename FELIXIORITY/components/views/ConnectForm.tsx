"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconAlert, IconGlobe, IconKey, IconPlug, LogoMark } from "@/components/icons";
import { resetStore } from "@/lib/client-store";

export function ConnectForm({ expired }: { expired: boolean }) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(expired ? "Sesi berakhir. Hubungkan panel lagi." : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ domain, apiKey }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Koneksi gagal. Coba lagi.");
        setBusy(false);
        return;
      }
      // Kosongkan API key dari memori komponen sebelum pindah halaman.
      setApiKey("");
      resetStore();
      router.replace("/workspace");
    } catch {
      setError("Tidak dapat menghubungi server aplikasi. Periksa koneksi internet Anda.");
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoMark size={48} />
          <div className="bg-gradient-to-r from-blue-300 via-indigo-200 to-violet-300 bg-clip-text text-2xl font-black tracking-[0.22em] text-transparent">
            FELIXIORITY
          </div>
          <p className="text-sm text-ink-soft">Hubungkan panel Pterodactyl untuk melihat user dan server dalam ruangan pixel.</p>
        </div>
        <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6" noValidate>
          <div>
            <label htmlFor="domain" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <IconGlobe size={15} className="text-blue-300" /> Domain panel
            </label>
            <input
              id="domain"
              name="domain"
              type="text"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="panel.contoh.com"
              className="h-11 w-full rounded-lg border border-line bg-bg/60 px-3 text-sm placeholder:text-ink-mute focus:border-accent/70 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="apikey" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <IconKey size={15} className="text-violet-300" /> Application API key
            </label>
            <input
              id="apikey"
              name="apikey"
              type="password"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ptla_…"
              className="h-11 w-full rounded-lg border border-line bg-bg/60 px-3 font-mono text-sm placeholder:text-ink-mute focus:border-accent/70 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-ink-mute">Gunakan Application API dengan izin baca Users dan Servers.</p>
          </div>
          {error && (
            <div role="alert" className="flex gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              <IconAlert size={16} className="mt-0.5 shrink-0 text-red-300" />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || !domain.trim() || !apiKey.trim()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-blue-900/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconPlug size={17} />
            {busy ? "Menghubungkan…" : "Hubungkan Panel"}
          </button>
        </form>
      </div>
    </main>
  );
}
