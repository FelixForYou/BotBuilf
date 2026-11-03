import "server-only";
import { all } from "../db";
import { aiConfigured } from "../providers/ai";
import { aiEndpoints } from "./ai";
import { aiImageEndpoints } from "./ai-image";
import { downloaderEndpoints } from "./downloader";
import { entertainmentEndpoints } from "./entertainment";
import { makerEndpoints } from "./maker";
import { toolEndpoints } from "./tools";
import { CATEGORIES, type EndpointDef, type Tier } from "./types";

export const ENDPOINTS: EndpointDef[] = [
  ...downloaderEndpoints,
  ...aiEndpoints,
  ...aiImageEndpoints,
  ...entertainmentEndpoints,
  ...makerEndpoints,
  ...toolEndpoints,
];

const byId = new Map(ENDPOINTS.map((e) => [e.id, e]));
export function findEndpoint(id: string): EndpointDef | undefined {
  return byId.get(id);
}

export function missingRequirements(e: EndpointDef): string[] {
  return (e.requires ?? []).filter((v) => (v === "AI_PROVIDER" ? !aiConfigured() : !process.env[v]));
}

export interface Override {
  endpoint_id: string;
  enabled: number;
  tier: Tier | null;
  note: string | null;
}

let ovCache: { at: number; map: Map<string, Override> } | null = null;
export async function overrides(): Promise<Map<string, Override>> {
  if (ovCache && Date.now() - ovCache.at < 10_000) return ovCache.map;
  const rows = await all<Override>("SELECT endpoint_id, enabled, tier, note FROM endpoint_overrides");
  ovCache = { at: Date.now(), map: new Map(rows.map((r) => [r.endpoint_id, r])) };
  return ovCache.map;
}
export function clearOverrideCache() {
  ovCache = null;
}

export interface EndpointPublic {
  id: string;
  category: string;
  group: string;
  name: string;
  description: string;
  method: string;
  path: string;
  tier: Tier;
  provider: string | null;
  response: string;
  params: EndpointDef["params"];
  example: unknown;
  status: "online" | "maintenance" | "unconfigured";
  note: string | null;
}

export async function catalog(): Promise<EndpointPublic[]> {
  const ov = await overrides();
  return ENDPOINTS.map((e) => {
    const o = ov.get(e.id);
    const missing = missingRequirements(e);
    return {
      id: e.id,
      category: e.category,
      group: e.group,
      name: e.name,
      description: e.description,
      method: e.method,
      path: `/api/v1/${e.id}`,
      tier: (o?.tier as Tier) || e.tier,
      provider: e.provider ?? null,
      response: e.response,
      params: e.params,
      example: e.example,
      status: o && !o.enabled ? "maintenance" : missing.length ? "unconfigured" : "online",
      note: o?.note ?? null,
    };
  });
}

export { CATEGORIES };
