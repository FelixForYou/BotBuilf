import { IconAlert, LogoMark } from "./icons";

export function ConfigError({ message }: { message: string }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card w-full max-w-lg p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <LogoMark />
          <span className="text-lg font-black tracking-[0.18em]">FELIXIORITY</span>
        </div>
        <div className="flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
          <IconAlert className="mt-0.5 shrink-0 text-amber-300" />
          <div>
            <h1 className="font-semibold text-amber-100">Kesalahan konfigurasi server</h1>
            <p className="mt-1 text-sm text-amber-100/80">{message}</p>
          </div>
        </div>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
          <li>
            Jalankan <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-ink">openssl rand -hex 32</code>
          </li>
          <li>
            Simpan hasilnya sebagai <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-ink">SESSION_SECRET</code>{" "}
            di <code className="font-mono">.env.local</code> (lokal) atau Environment Variables (Vercel).
          </li>
          <li>Mulai ulang server atau deploy ulang.</li>
        </ol>
      </div>
    </main>
  );
}
