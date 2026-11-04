import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { payments, users } from "./db/schema";

/** Data checkout publik — hanya field yang aman untuk pembeli. */
export async function getCheckout(publicId: string) {
  if (!/^pl_[0-9a-z]{16}$/.test(publicId)) return null;
  const [row] = await db
    .select({ p: payments, store: users.storeName, merchantName: users.name, merchantStatus: users.status })
    .from(payments)
    .innerJoin(users, eq(users.id, payments.userId))
    .where(eq(payments.publicId, publicId));
  return row ?? null;
}
