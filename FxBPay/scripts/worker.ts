/** Worker background: memproses antrean job (webhook, query status, rekonsiliasi, email, pelepasan saldo). */
import { runDueJobs, scheduleRecurring } from "../lib/jobs";

let stop = false;
process.on("SIGINT", () => (stop = true));
process.on("SIGTERM", () => (stop = true));
console.log("[worker] FxB Pay worker berjalan.");
let lastSchedule = 0;
while (!stop) {
  try {
    if (Date.now() - lastSchedule > 30_000) {
      await scheduleRecurring();
      lastSchedule = Date.now();
    }
    const r = await runDueJobs(25);
    if (r.ran) console.log(`[worker] ${r.ran} job diproses, ${r.failed} gagal`);
    if (r.ran === 0) await new Promise((res) => setTimeout(res, 2000));
  } catch (e) {
    console.error("[worker] error:", (e as Error).message);
    await new Promise((res) => setTimeout(res, 5000));
  }
}
process.exit(0);
