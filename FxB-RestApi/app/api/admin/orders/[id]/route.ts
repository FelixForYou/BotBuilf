import { requireAdmin } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import { assertSameOrigin, ok, readJson, route } from "@/lib/http";
import { markPaid, setOrderStatus } from "@/lib/payments";

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const b = await readJson(req);
  if (b.action === "mark_paid") {
    const done = await markPaid(id, { note: `Diverifikasi manual oleh ${admin.email}` });
    if (!done) throw Errors.bad("Order sudah diproses sebelumnya.");
    return ok(true);
  }
  if (b.action === "cancel") {
    await setOrderStatus(id, "cancelled");
    return ok(true);
  }
  throw Errors.bad("Aksi tidak dikenal.");
});
