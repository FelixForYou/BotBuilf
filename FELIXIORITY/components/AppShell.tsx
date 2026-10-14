"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { startPolling, syncNow, useStore } from "@/lib/client-store";
import { IconAlert, IconGrid, IconServer, IconSettings, IconUsers, LogoMark } from "./icons";
import { SyncStatus } from "./SyncStatus";

const NAV = [
  { href: "/workspace", label: "Workspace", icon: IconGrid },
  { href: "/users", label: "Pengguna", icon: IconUsers },
  { href: "/servers", label: "Server", icon: IconServer },
  { href: "/settings", label: "Pengaturan", icon: IconSettings },
];

export function AppShell({
  panelHost,
  requireData = true,
  children,
}: {
  panelHost: string;
  /** false untuk halaman yang tetap bisa dibuka walau data panel gagal dimuat (Pengaturan). */
  requireData?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  useEffect(() => startPolling(), []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-3 sm:px-5">
          <Link href="/workspace" className="flex items-center gap-2.5 rounded-lg" aria-label="FELIXIORITY — Workspace">
            <LogoMark />
            <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-violet-300 bg-clip-text text-[15px] font-black tracking-[0.2em] text-transparent sm:text-base">
              FELIXIORITY
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
                    active ? "bg-accent/15 text-ink ring-1 ring-accent/40" : "text-ink-soft hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="hidden max-w-[220px] truncate rounded-lg border border-line bg-panel/60 px-2.5 py-1.5 text-xs text-ink-soft xl:inline"
              title={`Panel: ${panelHost}`}
            >
              {panelHost}
            </span>
            <div className="hidden sm:block">
              <SyncStatus />
            </div>
            <div className="sm:hidden">
              <SyncStatus compact />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 pb-24 pt-4 sm:px-5 md:pb-8">
        {requireData ? <DataGate>{children}</DataGate> : children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Navigasi utama"
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                active ? "text-blue-200" : "text-ink-mute"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
      <ChangeToast />
    </div>
  );
}

/** Tampilkan anak hanya setelah snapshot pertama tersedia. */
function DataGate({ children }: { children: React.ReactNode }) {
  const { snapshot, status, error } = useStore();
  if (snapshot) return <>{children}</>;
  if (status === "error") {
    return (
      <div className="card mx-auto mt-10 max-w-md p-6 text-center">
        <IconAlert className="mx-auto text-amber-300" size={26} />
        <h2 className="mt-3 font-semibold">Gagal memuat data panel</h2>
        <p className="mt-1 text-sm text-ink-soft">{error}</p>
        <p className="mt-1 text-xs text-ink-mute">
          Akan dicoba lagi otomatis. Untuk mengganti panel atau API key, buka{" "}
          <Link href="/settings" className="text-blue-200 underline">
            Pengaturan
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => void syncNow()}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Coba lagi
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-24 animate-pulse" />
        ))}
      </div>
      <div className="card grid h-[60vh] place-items-center text-sm text-ink-soft">
        Mengambil seluruh user dan server dari panel…
      </div>
    </div>
  );
}

function ChangeToast() {
  const { lastChange } = useStore();
  const [visible, setVisible] = useState<number | null>(null);
  useEffect(() => {
    if (!lastChange) return;
    setVisible(lastChange.at);
    const t = setTimeout(() => setVisible(null), 6000);
    return () => clearTimeout(t);
  }, [lastChange]);
  if (!lastChange || visible !== lastChange.at) return null;
  const parts = [
    lastChange.added && `${lastChange.added} user baru`,
    lastChange.removed && `${lastChange.removed} user dihapus`,
    lastChange.changed && `${lastChange.changed} user berubah`,
  ].filter(Boolean);
  return (
    <div
      className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-violet-400/40 bg-[#1c1650]/95 px-4 py-2.5 text-sm shadow-xl md:bottom-6"
      role="status"
    >
      <span className="font-semibold text-violet-100">Sinkronisasi: </span>
      <span className="text-ink-soft">{parts.join(" · ")}</span>
    </div>
  );
}
