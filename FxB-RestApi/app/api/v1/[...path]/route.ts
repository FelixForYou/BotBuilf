import { handleGateway, preflight } from "@/lib/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  return handleGateway(req, (await ctx.params).path);
}
export async function POST(req: Request, ctx: Ctx) {
  return handleGateway(req, (await ctx.params).path);
}
export function OPTIONS() {
  return preflight();
}
