import { requireAdminPage } from "@/lib/auth";
import { AdminKit } from "@/components/admin/AdminKit";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  return (
    <AdminKit csrf={session.csrf}>
      <div className="adm">
        <AdminNav username={session.username} />
        <main className="adm__main">{children}</main>
      </div>
    </AdminKit>
  );
}
