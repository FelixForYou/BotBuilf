"use client";

import { motion } from "motion/react";
import { ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { CATEGORY_ICONS } from "@/components/category-icon";
import { useApp } from "@/components/providers";
import { Badge, PageTransition, Skeleton } from "@/components/ui";
import { useCatalog } from "@/components/use-catalog";

export default function CategoriesPage() {
  const { data } = useCatalog();
  const { t } = useApp();
  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-[30px] font-extrabold">{t("categories")}</h1>
        <p className="mt-1 text-[15px] text-muted">{data ? `${data.endpoints.length} endpoint dalam ${data.categories.length} kategori.` : "Memuat…"}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {!data && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-[26px]" />)}
          {data?.categories.map((c, i) => {
            const eps = data.endpoints.filter((e) => e.category === c.id);
            const Icon = CATEGORY_ICONS[c.id];
            const groups = Array.from(new Set(eps.map((e) => e.group)));
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/docs?category=${c.id}`} className="group block h-full rounded-[26px] bg-card p-5 transition hover:bg-card-2">
                  <div className="flex items-center gap-4">
                    <span className="grid size-14 place-items-center rounded-[18px] bg-mint-soft text-mint"><Icon className="size-7" /></span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[19px] font-bold">{c.name}</h2>
                      <div className="text-[13.5px] text-muted">{eps.length} endpoint · {eps.filter((e) => e.tier === "premium").length} premium</div>
                    </div>
                    <ChevronRight className="size-5 text-subtle transition group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-3 text-[14.5px] text-muted">{c.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {groups.map((g) => <Badge key={g}>{g}</Badge>)}
                  </div>
                  <ul className="mt-4 space-y-1.5 text-[14px]">
                    {eps.slice(0, 5).map((e) => (
                      <li key={e.id} className="flex items-center gap-2 text-fg/90">
                        <span className="size-1.5 rounded-full bg-mint" /> <span className="truncate">{e.name}</span>
                        {e.tier === "premium" && <Lock className="size-3 text-warn" />}
                      </li>
                    ))}
                    {eps.length > 5 && <li className="pl-3.5 text-muted">+{eps.length - 5} lainnya</li>}
                  </ul>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
