import { requireUser } from "@/lib/auth/session";
import { effectiveEnv } from "@/lib/views";
import { ListGroup, ListRow, PageHeader, SectionTitle } from "@/components/ui";
import { LogoutButton } from "@/components/shell-client";

export const metadata = { title: "Pengaturan" };

export default async function Settings() {
  const { user } = await requireUser();
  const env = await effectiveEnv();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Pengaturan" />
      <SectionTitle>Akun</SectionTitle>
      <ListGroup>
        <ListRow href="/app/pengaturan/profil" icon="user" title="Profil" value={user.name} />
        <ListRow href="/app/pengaturan/profil" icon="store" title="Nama toko" value={user.storeName || "—"} />
        <ListRow href="/app/pengaturan/profil" icon="mail" title="Email" value={user.emailVerifiedAt ? user.email : "Belum terverifikasi"} />
        <ListRow href="/app/pengaturan/profil" icon="phone" title="Telepon" value={user.phone || "—"} />
      </ListGroup>
      <SectionTitle>Keamanan</SectionTitle>
      <ListGroup>
        <ListRow href="/app/pengaturan/keamanan" icon="lock" title="Password" value="Ubah" />
        <ListRow href="/app/pengaturan/keamanan" icon="shieldCheck" title="Autentikasi dua faktor" value={user.totpEnabled ? "Aktif" : "Nonaktif"} />
        <ListRow href="/app/pengaturan/keamanan#sesi" icon="phone" title="Sesi & riwayat login" />
      </ListGroup>
      <SectionTitle>Integrasi</SectionTitle>
      <ListGroup>
        <ListRow href="/app/developer" icon="key" title="API key" value={env === "production" ? "Production" : "Sandbox"} />
        <ListRow href="/app/developer/webhook" icon="webhook" title="Webhook" />
        <ListRow href="/docs" icon="file" title="Dokumentasi API" />
        <ListRow href="/app/notifikasi" icon="bell" title="Notifikasi" />
      </ListGroup>
      <div className="card mt-8 p-2"><LogoutButton /></div>
    </div>
  );
}
