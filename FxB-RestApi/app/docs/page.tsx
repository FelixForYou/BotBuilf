"use client";

import { motion } from "motion/react";
import { FileJson, Search, SearchX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { EndpointRow } from "@/components/endpoint-row";
import { useApp } from "@/components/providers";
import { Badge, Button, EmptyState, Input, PageTransition, SectionLabel, Skeleton, cx } from "@/components/ui";
import { useCatalog } from "@/components/use-catalog";

export default function DocsPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-3xl" />}>
      <Docs />
    </Suspense>
  );
}

function Docs() {
  const { t, lang } = useApp();
  const { data, error } = useCatalog();
  const sp = useSearchParams();
  const router = useRouter();
  const cat = sp.get("category") ?? "all";
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    return data.endpoints.filter(
      (e) =>
        (cat === "all" || e.category === cat) &&
        (tier === "all" || e.tier === tier) &&
        (!s || e.name.toLowerCase().includes(s) || e.id.includes(s) || e.description.toLowerCase().includes(s) || e.group.toLowerCase().includes(s)),
    );
  }, [data, q, cat, tier]);

  const setCat = (c: string) => router.replace(c === "all" ? "/docs" : `/docs?category=${c}`, { scroll: false });

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-[30px] font-extrabold">{t("docs")}</h1>
        <p className="mt-1 text-[15px] text-muted">
          {lang === "id"
            ? "Semua endpoint memakai base URL /api/v1 dan API key lewat ?apikey= atau header X-API-Key."
            : "All endpoints use the /api/v1 base URL with ?apikey= or the X-API-Key header."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" href="/api/openapi.json" icon={FileJson}>OpenAPI JSON</Button>
          <Button size="sm" variant="secondary" href="/guide#how">{lang === "id" ? "Autentikasi & error" : "Auth & errors"}</Button>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} placeholder={t("search")} className="pl-12" />
        </div>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {[{ id: "all", name: t("all") }, ...(data?.categories ?? [])].map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={cx("relative h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold transition", cat === c.id ? "text-mint-ink" : "bg-card text-fg hover:bg-card-2")}>
              {cat === c.id && <motion.span layoutId="cat-pill" className="absolute inset-0 -z-0 rounded-full bg-mint" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {(["all", "free", "premium"] as const).map((x) => (
            <button key={x} onClick={() => setTier(x)} className={cx("h-8 rounded-full px-3 text-[13px] font-medium transition", tier === x ? "bg-card-3 text-fg" : "text-muted hover:text-fg")}>
              {x === "all" ? "Semua tier" : x === "free" ? "Free" : "Premium"}
            </button>
          ))}
        </div>

        {error && <p className="mt-6 text-danger">{error}</p>}
        {!data && !error && (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-[18px]" />)}
          </div>
        )}
        {data && filtered.length === 0 && (
          <div className="mt-6">
            <EmptyState icon={SearchX} title={lang === "id" ? "Tidak ada endpoint" : "No endpoints"} text={lang === "id" ? "Coba kata kunci atau kategori lain." : "Try another keyword or category."} />
          </div>
        )}
        {data &&
          data.categories
            .filter((c) => filtered.some((e) => e.category === c.id))
            .map((c) => {
              const eps = filtered.filter((e) => e.category === c.id);
              return (
                <section key={c.id}>
                  <SectionLabel right={<Badge>{eps.length} {t("endpoints")}</Badge>}>{c.name}</SectionLabel>
                  <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-card">
                    {eps.map((e) => <EndpointRow key={e.id} ep={e} />)}
                  </div>
                </section>
              );
            })}
      </div>
    </PageTransition>
  );
}
