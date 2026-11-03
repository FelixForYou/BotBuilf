"use client";

import { useEffect, useState } from "react";
import type { CategoryPublic, EndpointPublic } from "@/lib/catalog-types";
import { api } from "@/lib/client";

type Catalog = { categories: CategoryPublic[]; endpoints: EndpointPublic[] };
let cache: { at: number; data: Catalog } | null = null;
let inflight: Promise<Catalog> | null = null;

export function useCatalog() {
  const [data, setData] = useState<Catalog | null>(cache?.data ?? null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (cache && Date.now() - cache.at < 30_000) return;
    inflight ??= api<Catalog>("/api/catalog").finally(() => (inflight = null));
    inflight
      .then((d) => {
        cache = { at: Date.now(), data: d };
        setData(d);
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  return { data, error };
}
