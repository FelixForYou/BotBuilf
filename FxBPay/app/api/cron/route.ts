import type { NextRequest } from "next/server";
import { runDueJobs, scheduleRecurring } from "@/lib/jobs";
import { safeEqual } from "@/lib/crypto";
import { config } from "@/lib/env";

/** Untuk platform serverless: panggil tiap menit dengan header Authorization: Bearer <CRON_SECRET>. */
async function handle(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!config.cronSecret || !safeEqual(token, config.cronSecret)) return Response.json({ error: "unauthorized" }, { status: 401 });
  await scheduleRecurring();
  const r = await runDueJobs(50);
  return Response.json({ ok: true, ...r });
}
export const GET = handle;
export const POST = handle;
