import { requireAdmin } from "@/lib/auth";
import { ENDPOINTS } from "@/lib/endpoints/registry";
import { assertSameOrigin, ok, readJson, route } from "@/lib/http";
import { aiConfigured, availableModels } from "@/lib/providers/ai";
import { getSettings, saveSettings, type SiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

function providers() {
  const has = (k: string) => !!process.env[k];
  return [
    { name: "Database (Turso)", ok: has("TURSO_DATABASE_URL") || !process.env.VERCEL, detail: has("TURSO_DATABASE_URL") ? "Turso/libSQL" : "File SQLite lokal" },
    { name: "AI (Claude / OpenAI-compatible)", ok: aiConfigured(), detail: availableModels().map((m) => m.id).join(", ") || "ANTHROPIC_API_KEY atau OPENAI_COMPAT_*" },
    { name: "Downloader (Cobalt)", ok: has("COBALT_API_URL"), detail: "COBALT_API_URL" },
    { name: "Replicate (img2img/upscale/enhance)", ok: has("REPLICATE_API_TOKEN"), detail: "REPLICATE_API_TOKEN + REPLICATE_*_MODEL" },
    { name: "remove.bg", ok: has("REMOVEBG_API_KEY"), detail: "REMOVEBG_API_KEY" },
    { name: "Midtrans", ok: has("MIDTRANS_SERVER_KEY"), detail: process.env.MIDTRANS_IS_PRODUCTION === "true" ? "Production" : "Sandbox" },
    { name: "Xendit", ok: has("XENDIT_SECRET_KEY") && has("XENDIT_CALLBACK_TOKEN"), detail: "XENDIT_SECRET_KEY + XENDIT_CALLBACK_TOKEN" },
    { name: "Session secret", ok: (process.env.SESSION_SECRET ?? "").length >= 32, detail: "SESSION_SECRET ≥ 32 karakter" },
  ];
}

export const GET = route(async () => {
  await requireAdmin();
  return ok({ settings: await getSettings(), providers: providers(), endpoints: ENDPOINTS.length });
});

export const PATCH = route(async (req: Request) => {
  assertSameOrigin(req);
  await requireAdmin();
  const b = (await readJson(req)) as Partial<SiteSettings>;
  return ok({ settings: await saveSettings(b) });
});
