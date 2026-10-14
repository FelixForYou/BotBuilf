import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { ConfigError } from "@/components/ConfigError";
import { UsersView } from "@/components/views/UsersView";
import { requireSession } from "@/lib/guard";

export const metadata: Metadata = { title: "Pengguna · FELIXIORITY" };

export default async function UsersPage() {
  const g = await requireSession();
  if (!g.ok) return <ConfigError message={g.configError} />;
  return (
    <AppShell panelHost={g.session.panelHost}>
      <UsersView />
    </AppShell>
  );
}
