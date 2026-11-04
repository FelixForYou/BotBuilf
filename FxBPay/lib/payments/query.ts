import "server-only";
import { and, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "../db";
import { payments, PAYMENT_STATUSES, type PaymentStatus } from "../db/schema";
import type { Env } from "../ledger";

export type PaymentFilters = { status?: PaymentStatus; q?: string; from?: Date; to?: Date };

export function parseFilters(sp: Record<string, string | string[] | undefined>): PaymentFilters {
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const status = PAYMENT_STATUSES.includes(g("status") as PaymentStatus) ? (g("status") as PaymentStatus) : undefined;
  const d = (v: string, end = false) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T${end ? "23:59:59" : "00:00:00"}+07:00`) : undefined);
  return { status, q: g("q").trim().slice(0, 64) || undefined, from: d(g("from")), to: d(g("to"), true) };
}

export async function listPayments(o: PaymentFilters & { userId?: string; env?: Env; limit: number; offset: number }) {
  const conds: SQL[] = [];
  if (o.userId) conds.push(eq(payments.userId, o.userId));
  if (o.env) conds.push(eq(payments.env, o.env));
  if (o.status) conds.push(eq(payments.status, o.status));
  if (o.from) conds.push(gte(payments.createdAt, o.from));
  if (o.to) conds.push(lte(payments.createdAt, o.to));
  if (o.q) {
    const like = `%${o.q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    conds.push(or(ilike(payments.partnerReferenceNo, like), ilike(payments.orderRef, like), ilike(payments.description, like), ilike(payments.publicId, like))!);
  }
  const where = conds.length ? and(...conds) : undefined;
  const [items, [{ total }]] = await Promise.all([
    db.select().from(payments).where(where).orderBy(desc(payments.createdAt)).limit(o.limit).offset(o.offset),
    db.select({ total: count() }).from(payments).where(where),
  ]);
  return { items, total };
}
