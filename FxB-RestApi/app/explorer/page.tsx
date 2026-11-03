"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MethodBadge } from "@/components/endpoint-row";
import { useApp } from "@/components/providers";
import { Runner } from "@/components/runner";
import { Badge, Card, PageTransition, Segmented, Select, Skeleton } from "@/components/ui";
import { useCatalog } from "@/components/use-catalog";

export default function ExplorerPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-2xl" />}>
      <Explorer />
    </Suspense>
  );
}

function Explorer() {
  const { data } = useCatalog();
  const { me, lang } = useApp();
  const sp = useSearchParams();
  const router = useRouter();
  const [cat, setCat] = useState("downloader");
  const selected = sp.get("endpoint") ?? "";
  const ep = data?.endpoints.find((e) => e.id === selected) ?? data?.endpoints.find((e) => e.category === cat);

  useEffect(() => {
    if (ep && ep.category !== cat) setCat(ep.category);
  }, [ep, cat]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[30px] bg-card px-5 pb-7 pt-6">
          <h1 className="text-[28px] font-bold">API Explorer</h1>
          <p className="mt-0.5 text-[14.5px] text-muted">Step 1 of 2 · {lang === "id" ? "Pilih endpoint" : "Pick an endpoint"}</p>

          {!data ? (
            <div className="mt-6 space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-40" /></div>
          ) : (
            <>
              <div className="mt-5">
                <Segmented
                  value={cat === "downloader" || cat === "ai" ? cat : "more"}
                  onChange={(v) => {
                    const c = v === "more" ? "tools" : v;
                    setCat(c);
                    const first = data.endpoints.find((e) => e.category === c);
                    if (first) router.replace(`/explorer?endpoint=${first.id}`, { scroll: false });
                  }}
                  options={[{ value: "downloader", label: "Downloader" }, { value: "ai", label: "AI" }, { value: "more", label: lang === "id" ? "Lainnya" : "More" }]}
                />
              </div>
              <div className="mt-5 grid grid-cols-[1fr_1.4fr] items-center gap-3">
                <div>
                  <div className="text-[17px] font-semibold">{lang === "id" ? "Kategori" : "Category"}</div>
                </div>
                <Select value={cat} onChange={(e) => { setCat(e.target.value); const f = data.endpoints.find((x) => x.category === e.target.value); if (f) router.replace(`/explorer?endpoint=${f.id}`, { scroll: false }); }}>
                  {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_1.4fr] items-center gap-3">
                <div>
                  <div className="text-[17px] font-semibold">Endpoint</div>
                  {ep?.tier === "premium" && <div className="flex items-center gap-1 text-[13px] text-warn"><AlertTriangle className="size-3.5" /> Premium</div>}
                </div>
                <Select warn={ep?.tier === "premium"} value={ep?.id ?? ""} onChange={(e) => router.replace(`/explorer?endpoint=${e.target.value}`, { scroll: false })}>
                  {data.endpoints.filter((e) => e.category === cat).map((e) => (
                    <option key={e.id} value={e.id}>{e.name}{e.status !== "online" ? " (nonaktif)" : ""}</option>
                  ))}
                </Select>
              </div>
              {ep && (
                <Link href={`/docs/${ep.id}`} className="mt-4 flex items-center gap-2 text-[14px] text-muted underline underline-offset-4 hover:text-fg">
                  <MethodBadge m={ep.method} /> <span className="truncate">{ep.path}</span>
                </Link>
              )}
            </>
          )}
        </div>

        {ep && (
          <div className="mt-5 rounded-[30px] bg-card px-5 pb-7 pt-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-bold">{ep.name}</h2>
                <p className="mt-0.5 text-[14px] text-muted">Step 2 of 2 · {lang === "id" ? "Isi parameter & kirim" : "Fill params & send"}</p>
              </div>
              <Badge tone={ep.tier === "premium" ? "warn" : "mint"}>{ep.tier}</Badge>
            </div>
            <Runner ep={ep} />
          </div>
        )}
        {!me && (
          <Card className="mt-5 text-[14px] text-muted">
            {lang === "id" ? "Mode uji coba tanpa login dibatasi beberapa request per hari dan hanya endpoint free. " : "Trial mode without login is limited to a few free requests per day. "}
            <Link href="/register" className="font-semibold text-mint">{lang === "id" ? "Daftar gratis" : "Sign up free"}</Link>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
