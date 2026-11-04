import Link from "next/link";
import { getAuth } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { Icon, Logo, type IconName } from "@/components/icons";
import { LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const [auth, b] = await Promise.all([getAuth(), getSetting("branding")]);
  const features: [IconName, string, string][] = [
    ["link", "Link pembayaran", "Buat, bagikan, dan pantau tagihan dengan countdown & status real-time."],
    ["shieldCheck", "Terverifikasi server", "Saldo hanya bertambah setelah notifikasi DANA bertanda tangan valid atau pengecekan resmi."],
    ["book", "Ledger double-entry", "Setiap rupiah tercatat immutable, idempoten, dan bisa direkonsiliasi."],
    ["code", "API & webhook", "API key sandbox/production, idempotency key, dan webhook bertanda tangan."],
  ];
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-20 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Logo size={34} />
        <div className="flex-1">
          <div className="font-extrabold leading-none">{b.siteName}</div>
          <div className="mt-1 text-[10px] font-bold tracking-[0.18em] text-mint">BY FELIXIORITY</div>
        </div>
        {auth ? <LinkButton href="/app" size="sm">Dashboard</LinkButton> : <LinkButton href="/masuk" variant="secondary" size="sm">Masuk</LinkButton>}
      </header>
      <main className="animate-enter mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint/10 px-3 py-1.5 text-xs font-bold text-mint"><Icon name="zap" size={14} /> Terintegrasi DANA Payment Gateway</span>
          <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Terima pembayaran DANA, saldo tercatat rapi.</h1>
          <p className="mt-5 text-lg text-muted">{b.tagline}. Dompet internal per akun, dashboard admin, dan pusat pengujian integrasi DANA dalam satu tempat.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={auth ? "/app" : "/daftar"} size="lg">{auth ? "Buka dashboard" : "Daftar gratis"}</LinkButton>
            {!auth && <LinkButton href="/masuk" variant="secondary" size="lg">Saya sudah punya akun</LinkButton>}
          </div>
        </div>
        <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([icon, t, d]) => (
            <div key={t} className="card p-6">
              <span className="icon-box text-mint"><Icon name={icon} /></span>
              <div className="mt-4 font-bold">{t}</div>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-sm text-subtle">{b.footerNote}{b.supportEmail && <> · Bantuan: <a className="text-muted underline" href={`mailto:${b.supportEmail}`}>{b.supportEmail}</a></>}</p>
        <p className="mt-2 text-xs text-subtle">Pembayaran diproses melalui alur resmi DANA. FxB Pay tidak pernah meminta PIN atau OTP DANA. <Link href="/docs" className="underline">Dokumentasi API</Link></p>
      </main>
    </div>
  );
}
