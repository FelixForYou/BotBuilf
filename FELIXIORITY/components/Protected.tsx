"use client";
// Gerbang sesi di sisi klien. Dipakai di Vercel maupun GitHub Pages (ekspor statis),
// karena halaman statis tidak bisa membaca cookie di server.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { checkSession, type SessionCheck } from "@/lib/api";
import { AppShell } from "./AppShell";
import { ConfigError } from "./ConfigError";
import { IconAlert } from "./icons";
import { ServersView } from "./views/ServersView";
import { SettingsView } from "./views/SettingsView";
import { UsersView } from "./views/UsersView";
import { WorkspaceView } from "./views/WorkspaceView";

type Page = "workspace" | "users" | "servers" | "settings";

function intParam(name: string): number | null {
  const v = Number(new URLSearchParams(window.location.search).get(name));
  return Number.isInteger(v) && v > 0 ? v : null;
}

export function Protected({ page }: { page: Page }) {
  const router = useRouter();
  const [check, setCheck] = useState<SessionCheck | null>(null);
  const [param, setParam] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setParam(intParam(page === "servers" ? "owner" : "user"));
    checkSession().then((r) => {
      if (!alive) return;
      if (r.state === "disconnected") router.replace("/");
      else setCheck(r);
    });
    return () => {
      alive = false;
    };
  }, [page, router]);

  if (!check) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-ink-soft">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          Memeriksa sesi…
        </div>
      </div>
    );
  }
  if (check.state === "config") return <ConfigError message={check.message} />;
  if (check.state === "unreachable") return <Unreachable message={check.message} />;
  if (check.state !== "connected") return null;

  const { session } = check;
  return (
    <AppShell panelHost={session.panelHost} requireData={page !== "settings"}>
      {page === "workspace" && <WorkspaceView initialUserId={param} />}
      {page === "users" && <UsersView />}
      {page === "servers" && <ServersView initialOwner={param} />}
      {page === "settings" && <SettingsView session={session} />}
    </AppShell>
  );
}

export function Unreachable({ message }: { message: string }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card max-w-md p-6 text-center">
        <IconAlert className="mx-auto text-amber-300" size={26} />
        <h1 className="mt-3 font-semibold">Backend tidak dapat dihubungi</h1>
        <p className="mt-1 text-sm text-ink-soft">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}
