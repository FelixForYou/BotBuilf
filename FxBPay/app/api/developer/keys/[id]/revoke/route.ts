import { authed } from "@/lib/api-helpers";
import { revokeApiKey } from "@/lib/apikeys";
export const POST = authed<Record<string, never>, { id: string }>({}, async ({ auth, actor, params }) => {
  await revokeApiKey(actor, auth.user.id, params.id);
  return { message: "API key dicabut" };
});
