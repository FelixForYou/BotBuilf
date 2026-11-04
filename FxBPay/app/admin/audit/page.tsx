import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { fmtDate } from "@/lib/format";
import { PageHeader, TableWrap } from "@/components/ui";
import { Icon } from "@/components/icons";

export default async function Audit({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 64);
  const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const rows = await db.select().from(auditLogs).where(q ? or(ilike(auditLogs.action, like), ilike(auditLogs.actorEmail, like), ilike(auditLogs.targetId, like)) : undefined).orderBy(desc(auditLogs.id)).limit(200);
  return (
    <>
      <PageHeader title="Audit log" subtitle="Append-only: tidak dapat diubah atau dihapus (dijaga trigger database)." />
      <form className="relative mb-4"><Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" /><input name="q" defaultValue={q} className="input pl-11" placeholder="Cari aksi, email, target" /></form>
      <TableWrap><table className="table"><thead><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Target</th><th>Detail</th><th>IP</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r.id}><td className="whitespace-nowrap">{fmtDate(r.createdAt)}</td><td>{r.actorEmail}</td><td className="mono text-xs">{r.action}</td><td className="text-xs">{r.targetType} <span className="mono text-subtle">{r.targetId}</span></td><td><pre className="mono max-w-md overflow-x-auto whitespace-pre-wrap text-[11px] text-muted">{JSON.stringify(r.detail)}</pre></td><td className="text-xs">{r.ip}</td></tr>)}
      </tbody></table></TableWrap>
    </>
  );
}
