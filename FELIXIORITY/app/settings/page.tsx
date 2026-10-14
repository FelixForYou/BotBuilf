import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { ConfigError } from "@/components/ConfigError";
import { SettingsView } from "@/components/views/SettingsView";
import { requireSession } from "@/lib/guard";

export const metadata: Metadata = { title: "Pengaturan · FELIXIORITY" };

export default async function SettingsPage() {
  const g = await requireSession();
  if (!g.ok) return <ConfigError message={g.configError} />;
  return (
    <AppShell panelHost={g.session.panelHost} requireData={false}>
      <SettingsView session={g.session} />
    </AppShell>
  );
}
