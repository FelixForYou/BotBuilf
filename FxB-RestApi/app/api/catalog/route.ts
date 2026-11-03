import { catalog, CATEGORIES } from "@/lib/endpoints/registry";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => ok({ categories: CATEGORIES, endpoints: await catalog() }));
