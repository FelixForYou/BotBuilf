"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "./AdminKit";

const ITEMS = [
  { href: "/admin", label: "Project", match: (p: string) => p === "/admin" || p.startsWith("/admin/projects") },
  { href: "/admin/settings", label: "Konten & SEO", match: (p: string) => p.startsWith("/admin/settings") },
  { href: "/admin/data", label: "Ekspor / Impor", match: (p: string) => p.startsWith("/admin/data") },
];

export function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();
  const { api, toast } = useAdmin();

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "Gagal logout.");
    }
  }

  return (
    <aside className="adm__side">
      <Link href="/admin" className="adm__logo">FELIXIORITY<span>admin</span></Link>
      <nav aria-label="Navigasi admin">
        {ITEMS.map((i) => (
          <Link key={i.href} href={i.href} className="adm__link" aria-current={i.match(pathname) ? "page" : undefined}>{i.label}</Link>
        ))}
        <a href="/" className="adm__link" target="_blank" rel="noopener">Lihat situs ↗</a>
      </nav>
      <div className="adm__user">
        <span>Masuk sebagai <b>{username}</b></span>
        <button type="button" className="abtn abtn--ghost" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
