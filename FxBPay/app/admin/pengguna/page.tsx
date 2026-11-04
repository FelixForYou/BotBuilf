import { desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { fmtDate } from "@/lib/format";
import { Badge, ListGroup, ListRow, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 64);
  const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const list = await db.select({ u: users, paid: sql<string>`(SELECT count(*) FROM payments p WHERE p.user_id = ${users.id} AND p.captured_journal_id IS NOT NULL)::text` }).from(users)
    .where(q ? or(ilike(users.email, like), ilike(users.name, like), ilike(users.storeName, like), ilike(users.phone, like)) : undefined)
    .orderBy(desc(users.createdAt)).limit(100);
  return (
    <>
      <PageHeader title="Pengguna & toko" subtitle={`${list.length} ditampilkan`} />
      <form className="relative mb-4">
        <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
        <input name="q" defaultValue={q} placeholder="Cari email, nama, toko, telepon" className="input pl-11" />
      </form>
      <ListGroup>
        {list.map(({ u, paid }) => (
          <ListRow key={u.id} href={`/admin/pengguna/${u.id}`} icon={u.role === "admin" ? "shield" : "store"} title={<span className="flex flex-wrap items-center gap-2">{u.storeName || u.name}{u.role === "admin" && <Badge tone="blue">Admin</Badge>}{u.status === "frozen" && <Badge tone="red">Dibekukan</Badge>}{!u.emailVerifiedAt && <Badge tone="amber">Email belum verifikasi</Badge>}</span>} subtitle={`${u.email} · ${u.phone || "-"} · daftar ${fmtDate(u.createdAt, false)}`} value={`${paid} lunas`} />
        ))}
      </ListGroup>
    </>
  );
}
