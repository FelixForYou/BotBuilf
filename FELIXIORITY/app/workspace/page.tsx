import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { ConfigError } from "@/components/ConfigError";
import { WorkspaceView } from "@/components/views/WorkspaceView";
import { requireSession } from "@/lib/guard";

export const metadata: Metadata = { title: "Workspace · FELIXIORITY" };

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const g = await requireSession();
  if (!g.ok) return <ConfigError message={g.configError} />;
  const sp = await searchParams;
  const raw = typeof sp.user === "string" ? Number(sp.user) : NaN;
  return (
    <AppShell panelHost={g.session.panelHost}>
      <WorkspaceView initialUserId={Number.isInteger(raw) ? raw : null} />
    </AppShell>
  );
}
