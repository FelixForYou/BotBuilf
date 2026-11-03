import { openapi } from "@/lib/endpoints/openapi";
import { baseUrl } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return Response.json(await openapi(baseUrl(req)), { headers: { "Access-Control-Allow-Origin": "*" } });
}
