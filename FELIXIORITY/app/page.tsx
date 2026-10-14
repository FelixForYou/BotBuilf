import { redirect } from "next/navigation";
import { ConfigError } from "@/components/ConfigError";
import { ConnectForm } from "@/components/views/ConnectForm";
import { readSession } from "@/lib/server-session";
import { getSessionSecretStatus } from "@/lib/session";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const cfg = getSessionSecretStatus();
  if (!cfg.ok) return <ConfigError message={cfg.message} />;
  if (await readSession()) redirect("/workspace");
  const sp = await searchParams;
  return <ConnectForm expired={sp.expired === "1"} />;
}
