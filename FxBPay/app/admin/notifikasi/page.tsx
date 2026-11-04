import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOutbox, notifications } from "@/lib/db/schema";
import { relTime, fmtDate } from "@/lib/format";
import { Badge, ListGroup, ListRow, PageHeader, SectionTitle, TableWrap } from "@/components/ui";
import { ActionButton } from "@/components/client";

export default async function AdminNotifs() {
  const [list, mails] = await Promise.all([
    db.select().from(notifications).where(eq(notifications.audience, "admin")).orderBy(desc(notifications.createdAt)).limit(100),
    db.select({ id: emailOutbox.id, to: emailOutbox.to, subject: emailOutbox.subject, status: emailOutbox.status, createdAt: emailOutbox.createdAt, error: emailOutbox.error }).from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(30),
  ]);
  return (
    <>
      <PageHeader title="Notifikasi admin" action={<ActionButton action="/api/notifications/read" body={{ admin: true }} icon="check">Tandai dibaca</ActionButton>} />
      <ListGroup>
        {list.length === 0 && <ListRow icon="bell" title="Belum ada notifikasi" />}
        {list.map((n) => <ListRow key={n.id} href={n.href ?? undefined} icon={n.type === "integration" ? "alert" : n.type === "withdrawal" ? "arrowUpRight" : n.type === "refund" ? "arrowLeft" : "bell"} title={<span className="flex items-center gap-2">{!n.readAt && <span className="h-2 w-2 rounded-full bg-mint" />}{n.title}{n.env && <Badge>{n.env}</Badge>}</span>} subtitle={`${relTime(n.createdAt)} · ${n.body}`} />)}
      </ListGroup>
      <SectionTitle>Outbox email</SectionTitle>
      <TableWrap><table className="table"><thead><tr><th>Waktu</th><th>Kepada</th><th>Subjek</th><th>Status</th></tr></thead><tbody>
        {mails.map((m) => <tr key={m.id}><td>{fmtDate(m.createdAt)}</td><td>{m.to}</td><td>{m.subject}</td><td><Badge tone={m.status === "sent" ? "mint" : m.status === "failed" ? "red" : m.status === "logged" ? "blue" : "amber"}>{{ sent: "Terkirim", logged: "Log (dev, tanpa SMTP)", queued: "Antre", failed: "Gagal" }[m.status]}</Badge></td></tr>)}
      </tbody></table></TableWrap>
    </>
  );
}
