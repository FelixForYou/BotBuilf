import { requireAdmin } from "@/lib/auth/session";
import { unreadCount } from "@/lib/views";
import { Shell } from "@/components/shell";
import type { NavItem } from "@/components/shell-client";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  const unread = await unreadCount(user.id, true);
  const items: NavItem[] = [
    { href: "/admin", label: "Ringkasan", icon: "chart", exact: true, group: "Operasional" },
    { href: "/admin/pengguna", label: "Pengguna & toko", icon: "users", group: "Operasional" },
    { href: "/admin/transaksi", label: "Transaksi", icon: "receipt", group: "Operasional" },
    { href: "/admin/penarikan", label: "Penarikan", icon: "arrowUpRight", group: "Operasional" },
    { href: "/admin/refund", label: "Refund", icon: "arrowLeft", group: "Operasional" },
    { href: "/admin/ledger", label: "Saldo & ledger", icon: "book", group: "Keuangan" },
    { href: "/admin/settlement", label: "Settlement & rekonsiliasi", icon: "scale", group: "Keuangan" },
    { href: "/admin/biaya", label: "Biaya & limit", icon: "sliders", group: "Keuangan" },
    { href: "/admin/dana", label: "Pengaturan DANA", icon: "zap", group: "Integrasi" },
    { href: "/admin/uat", label: "Sandbox & UAT", icon: "flask", group: "Integrasi" },
    { href: "/admin/api", label: "API key & webhook", icon: "webhook", group: "Integrasi" },
    { href: "/admin/notifikasi", label: "Notifikasi", icon: "bell", group: "Sistem" },
    { href: "/admin/audit", label: "Audit log", icon: "activity", group: "Sistem" },
    { href: "/admin/website", label: "Website & branding", icon: "palette", group: "Sistem" },
    { href: "/app", label: "Ke dashboard merchant", icon: "home", group: "Sistem" },
  ];
  return (
    <Shell admin items={items} title="Admin" unread={unread} notifHref="/admin/notifikasi" userLabel={user.email}>
      {children}
    </Shell>
  );
}
