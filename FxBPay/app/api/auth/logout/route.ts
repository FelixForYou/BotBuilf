import { destroySession } from "@/lib/auth/session";
import { assertSameOrigin, json, route } from "@/lib/http";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  await destroySession();
  return json({ ok: true, redirect: "/masuk" });
});
