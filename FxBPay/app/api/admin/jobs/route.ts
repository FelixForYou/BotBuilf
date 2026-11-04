import { authed } from "@/lib/api-helpers";
import { runDueJobs, scheduleRecurring } from "@/lib/jobs";
export const POST = authed({ admin: true, limit: 10 }, async () => {
  await scheduleRecurring();
  const r = await runDueJobs(50);
  return { message: `${r.ran} job diproses, ${r.failed} gagal` };
});
