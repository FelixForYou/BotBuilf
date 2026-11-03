import { adminRoute, readJson } from "@/lib/api";
import { saveSettings } from "@/lib/settings";

export const PUT = adminRoute(async (req) => {
  const settings = saveSettings(await readJson(req, 128 * 1024));
  return Response.json({ settings });
});
