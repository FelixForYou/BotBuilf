import { authed } from "@/lib/api-helpers";
import { rotateApiKey } from "@/lib/apikeys";
export const POST = authed<Record<string, never>, { id: string }>({ limit: 10 }, async ({ auth, actor, params }) => {
  const { key, secret } = await rotateApiKey(actor, auth.user.id, params.id);
  return { id: key.id, secret, message: "Key lama dicabut, key baru dibuat" };
});
