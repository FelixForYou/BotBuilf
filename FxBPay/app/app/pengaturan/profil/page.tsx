import { requireUser } from "@/lib/auth/session";
import { Card, Notice, PageHeader } from "@/components/ui";
import { ActionButton, ActionForm } from "@/components/client";

export default async function Profile() {
  const { user } = await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Profil" back="/app/pengaturan" />
      <Card>
        <ActionForm action="/api/account/profile" submit="Simpan" success="Profil disimpan">
          <div><label className="label" htmlFor="name">Nama</label><input id="name" name="name" className="input" defaultValue={user.name} /></div>
          <div><label className="label" htmlFor="storeName">Nama toko</label><input id="storeName" name="storeName" className="input" defaultValue={user.storeName} /></div>
          <div><label className="label" htmlFor="phone">Telepon</label><input id="phone" name="phone" className="input" defaultValue={user.phone} /></div>
          <div><label className="label">Email</label><input className="input opacity-60" value={user.email} disabled readOnly /></div>
        </ActionForm>
      </Card>
      {user.emailVerifiedAt ? <Notice tone="ok">Email terverifikasi.</Notice> : (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="font-semibold">Email belum terverifikasi</div><div className="text-sm text-muted">Diperlukan untuk Production & API key live.</div></div>
          <ActionButton action="/api/auth/resend-verification" icon="mail">Kirim ulang</ActionButton>
        </Card>
      )}
    </div>
  );
}
