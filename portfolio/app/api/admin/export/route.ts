import { adminRoute } from "@/lib/api";
import { exportData } from "@/lib/projects";

export const GET = adminRoute(async () => {
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(exportData(), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="felixiority-projects-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
