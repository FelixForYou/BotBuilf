import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { ConfigError } from "@/components/ConfigError";
import { ServersView } from "@/components/views/ServersView";
import { requireSession } from "@/lib/guard";

export const metadata: Metadata = { title: "Server · FELIXIORITY" };

export default async function ServersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const g = await requireSession();
  if (!g.ok) return <ConfigError message={g.configError} />;
  const sp = await searchParams;
  const raw = typeof sp.owner === "string" ? Number(sp.owner) : NaN;
  return (
    <AppShell panelHost={g.session.panelHost}>
      <ServersView initialOwner={Number.isInteger(raw) ? raw : null} />
    </AppShell>
  );
}
