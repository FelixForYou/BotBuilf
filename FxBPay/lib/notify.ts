import "server-only";
import { db, type DbOrTx } from "./db";
import { emailOutbox, notifications } from "./db/schema";
import { enqueueJob } from "./jobs";

type Kind = "payment" | "withdrawal" | "refund" | "integration" | "security" | "system";

export async function notifyUser(userId: string, kind: Kind, title: string, body: string, opts: { href?: string; env?: string } = {}, tx: DbOrTx = db) {
  await tx.insert(notifications).values({ userId, audience: "user", type: kind, title, body, href: opts.href, env: opts.env });
}

export async function notifyAdmins(kind: Kind, title: string, body: string, opts: { href?: string; env?: string } = {}, tx: DbOrTx = db) {
  await tx.insert(notifications).values({ userId: null, audience: "admin", type: kind, title, body, href: opts.href, env: opts.env });
}

/** Email dimasukkan ke outbox (persisten) lalu dikirim oleh job `email.send`. */
export async function queueEmail(to: string, subject: string, body: string, tx: DbOrTx = db) {
  const [row] = await tx.insert(emailOutbox).values({ to, subject, body }).returning({ id: emailOutbox.id });
  await enqueueJob("email.send", { id: row.id }, { tx });
}
