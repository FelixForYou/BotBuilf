import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { payments } from "../db/schema";
import { notFound } from "../errors";
import type { Auth } from "../auth/session";

/** Isolasi data: pemilik saja, atau admin. Selain itu 404 (tidak membocorkan keberadaan). */
export async function getOwnedPayment(auth: Auth, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw notFound("Pembayaran");
  const cond = auth.user.role === "admin" ? eq(payments.id, id) : and(eq(payments.id, id), eq(payments.userId, auth.user.id));
  const [p] = await db.select().from(payments).where(cond);
  if (!p) throw notFound("Pembayaran");
  return p;
}
