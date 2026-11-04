import { merchantRoute } from "@/lib/merchant-api";
import { db } from "@/lib/db";
import { getUserBalances } from "@/lib/ledger";

export const GET = merchantRoute("balance:read", async ({ caller }) => {
  const b = await getUserBalances(db, caller.userId, caller.env);
  return { body: { env: caller.env, currency: "IDR", available: Number(b.available), held: Number(b.held), reserved: Number(b.reserved) } };
});
