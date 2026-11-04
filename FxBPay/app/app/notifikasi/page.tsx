import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { relTime } from "@/lib/format";
import { EmptyState, ListGroup, ListRow, PageHeader } from "@/components/ui";
import { ActionButton } from "@/components/client";
import type { IconName } from "@/components/icons";

export const metadata = { title: "Notifikasi" };
const ICON: Record<string, IconName> = { payment: "receipt", withdrawal: "arrowUpRight", refund: "arrowLeft", integration: "alert", security: "shield", system: "bell" };

export default async function Notifs() {
  const { user } = await requireUser();
  const list = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(100);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notifikasi" action={<ActionButton action="/api/notifications/read" icon="check">Tandai dibaca</ActionButton>} />
      {list.length === 0 ? <EmptyState icon="bell" title="Belum ada notifikasi" /> : (
        <ListGroup>
          {list.map((n) => (
            <ListRow key={n.id} href={n.href ?? undefined} icon={ICON[n.type]} title={<span className="flex items-center gap-2">{!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-mint" />}{n.title}</span>} subtitle={`${relTime(n.createdAt)}${n.env ? ` · ${n.env}` : ""} · ${n.body}`} />
          ))}
        </ListGroup>
      )}
    </div>
  );
}
