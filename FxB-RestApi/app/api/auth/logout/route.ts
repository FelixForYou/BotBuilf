import { destroySession } from "@/lib/auth";
import { assertSameOrigin, ok, route } from "@/lib/http";

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  await destroySession();
  return ok(true);
});
