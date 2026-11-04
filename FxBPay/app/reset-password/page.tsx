import { AuthFrame } from "@/components/auth-frame";
import { ActionForm } from "@/components/client";
import { Notice } from "@/components/ui";

export default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthFrame title="Atur ulang password" subtitle="Semua sesi lain akan dikeluarkan setelah password diganti.">
      {!token ? <Notice tone="danger">Tautan tidak valid.</Notice> : (
        <ActionForm action="/api/auth/reset" submit="Simpan password" extra={{ token }}>
          <div><label className="label" htmlFor="password">Password baru</label><input id="password" name="password" type="password" autoComplete="new-password" className="input" /></div>
        </ActionForm>
      )}
    </AuthFrame>
  );
}
