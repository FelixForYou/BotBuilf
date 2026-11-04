import { requireUser } from "@/lib/auth/session";
import { PageHeader, Notice } from "@/components/ui";
import { Playground } from "./playground";

export default async function Page() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="API Playground" back="/app/developer" subtitle="Kirim permintaan nyata ke API FxB Pay memakai API key Sandbox Anda." />
      <Notice tone="info">Playground hanya menerima key <span className="mono">fxb_test_</span>. Key tidak disimpan dan hanya dikirim dari browser Anda ke server FxB Pay.</Notice>
      <div className="mt-4"><Playground /></div>
    </div>
  );
}
