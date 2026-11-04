import "server-only";
import { db, type DbOrTx } from "./db";
import { auditLogs } from "./db/schema";
import { redact } from "./redact";

export type Actor = { id: string | null; email: string; ip?: string };
export const SYSTEM: Actor = { id: null, email: "system" };

export async function audit(actor: Actor, action: string, target: { type?: string; id?: string } = {}, detail: Record<string, unknown> = {}, tx: DbOrTx = db) {
  await tx.insert(auditLogs).values({
    actorId: actor.id,
    actorEmail: actor.email,
    action,
    targetType: target.type ?? "",
    targetId: target.id ?? "",
    detail: redact(JSON.parse(JSON.stringify(detail, (_k, v) => (typeof v === "bigint" ? v.toString() : v)))) as object,
    ip: actor.ip ?? "",
  });
}
