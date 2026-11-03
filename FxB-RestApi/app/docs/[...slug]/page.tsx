"use client";

import { AlertTriangle, Box, Copy, ExternalLink, Play } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { CATEGORY_ICONS } from "@/components/category-icon";
import { MethodBadge } from "@/components/endpoint-row";
import { useApp } from "@/components/providers";
import { Runner } from "@/components/runner";
import { Badge, Button, Card, CodeBlock, EmptyState, InfoTable, PageTransition, SectionLabel, Segmented, Sheet, Skeleton, StatGrid, copyText, toast } from "@/components/ui";
import { useCatalog } from "@/components/use-catalog";
import { BRAND } from "@/lib/brand";
import { snippets } from "@/lib/catalog-types";

const ERRORS = [
  ["400", "INVALID_PARAMS", "Parameter kosong/salah format"],
  ["401", "API_KEY_REQUIRED / INVALID_API_KEY", "Key tidak ada, salah, atau dicabut"],
  ["403", "PREMIUM_REQUIRED", "Endpoint premium, key masih free"],
  ["429", "RATE_LIMITED", "Limit per menit/harian tercapai"],
  ["502/504", "PROVIDER_ERROR / TIMEOUT", "Penyedia eksternal bermasalah"],
  ["503", "PROVIDER_UNAVAILABLE / MAINTENANCE", "Belum dikonfigurasi / sedang perbaikan"],
];

export default function EndpointPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = use(params);
  const id = slug.map(decodeURIComponent).join("/");
  const { data } = useCatalog();
  const { lang } = useApp();
  const ep = data?.endpoints.find((e) => e.id === id);
  const cat = data?.categories.find((c) => c.id === ep?.category);
  const [tryOpen, setTryOpen] = useState(false);
  const [tab, setTab] = useState<"curl" | "javascript" | "python" | "php">("curl");
  const [origin, setOrigin] = useState("https://your-domain");
  useEffect(() => setOrigin(window.location.origin), []);
  const snip = useMemo(() => (ep ? snippets(ep, origin) : null), [ep, origin]);

  if (!data) return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-28" /><Skeleton className="h-14 rounded-full" /><Skeleton className="h-72" /></div>;
  if (!ep) return <div className="mx-auto max-w-3xl"><EmptyState icon={AlertTriangle} title="Endpoint tidak ditemukan" text={`/api/v1/${id}`} action={<Button href="/docs">Ke dokumentasi</Button>} /></div>;

  const Icon = CATEGORY_ICONS[ep.category] ?? Box;
  const example = ep.response === "json" ? JSON.stringify({ status: true, creator: BRAND.developer, endpoint: ep.id, result: ep.example }, null, 2) : `// Respons sukses berupa ${ep.response === "image" ? "gambar biner (Content-Type: image/*)" : "file biner"}.\n// Error tetap berupa JSON:\n${JSON.stringify({ status: false, creator: BRAND.developer, error: { code: "INVALID_PARAMS", message: "Parameter tidak valid: prompt." } }, null, 2)}`;
  const shareUrl = `${origin}${ep.path}?${new URLSearchParams(Object.fromEntries(ep.params.filter((p) => p.type !== "file" && p.required).map((p) => [p.name, p.example ?? ""]))).toString()}`;

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 border-b border-line pb-4 text-[16px] font-semibold">
          <Badge tone={ep.status === "online" ? "mint" : ep.status === "maintenance" ? "warn" : "neutral"}>
            {ep.status === "online" ? "● Online" : ep.status === "maintenance" ? "Perbaikan" : "Belum aktif"}
          </Badge>
          <Link href={`/docs?category=${ep.category}`} className="truncate text-muted hover:text-fg">{cat?.name} · {ep.group}</Link>
        </div>

        <div className="mt-6 flex items-center gap-5">
          <div className="corner-frame grid size-[76px] shrink-0 place-items-center rounded-2xl">
            <Icon className="size-11 text-mint" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[26px] font-bold leading-tight">{ep.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <MethodBadge m={ep.method} />
              <code className="truncate text-[13px] text-muted">{ep.path}</code>
            </div>
          </div>
        </div>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted">{ep.description}</p>
        {ep.note && <p className="mt-3 rounded-2xl bg-warn-soft px-4 py-3 text-[14px] text-warn">{ep.note}</p>}

        <Button size="lg" className="mt-6 w-full" icon={Play} onClick={() => setTryOpen(true)}>Try API</Button>
        <button onClick={async () => (await copyText(shareUrl)) && toast("Link endpoint disalin.")} className="mx-auto mt-4 flex items-center gap-2 text-[15.5px] font-medium text-mint">
          <Copy className="size-4" /> {lang === "id" ? "Salin link" : "Copy link"}
        </button>

        <StatGrid className="mt-6" items={[{ value: ep.method, label: "Method" }, { value: ep.tier === "premium" ? "Premium" : "Free", label: "Tier" }, { value: ep.params.length, label: "Parameter" }]} />

        <SectionLabel>{lang === "id" ? "Tentang endpoint" : "About this endpoint"}</SectionLabel>
        <InfoTable
          rows={[
            { label: "URL", value: <code className="font-mono text-[12.5px]">{origin}{ep.path}</code> },
            { label: "Method", value: ep.method },
            { label: lang === "id" ? "Respons" : "Response", value: ep.response === "json" ? "application/json" : ep.response === "image" ? "image/* (biner)" : "file" },
            { label: "Provider", value: ep.provider ?? "FxB (internal)" },
            { label: "Auth", value: "?apikey= / X-API-Key" },
          ]}
        />

        <SectionLabel>{lang === "id" ? "Parameter" : "Parameters"}</SectionLabel>
        {ep.params.length === 0 ? (
          <Card className="text-[14.5px] text-muted">{lang === "id" ? "Tidak ada parameter selain apikey." : "No parameters besides apikey."}</Card>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-card">
            {ep.params.map((p) => (
              <div key={p.name} className="px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-[14.5px] font-semibold">{p.name}</code>
                  <Badge>{p.type === "enum" ? "enum" : p.type}</Badge>
                  {p.required ? <Badge tone="warn">wajib</Badge> : <span className="text-[12.5px] text-subtle">opsional</span>}
                </div>
                <p className="mt-1 text-[14px] text-muted">{p.description}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-subtle">
                  {p.options && <span>opsi: {p.options.join(" · ")}</span>}
                  {p.default && <span>default: {p.default}</span>}
                  {p.example && <span className="truncate">contoh: {p.example}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <SectionLabel>{lang === "id" ? "Contoh kode" : "Code samples"}</SectionLabel>
        <Segmented value={tab} onChange={setTab} options={[{ value: "curl", label: "cURL" }, { value: "javascript", label: "JS" }, { value: "python", label: "Python" }, { value: "php", label: "PHP" }]} />
        {snip && <CodeBlock className="mt-3" lang={tab} code={snip[tab]} />}

        <SectionLabel>{lang === "id" ? "Contoh respons" : "Example response"}</SectionLabel>
        <CodeBlock lang={ep.response === "json" ? "json · 200" : ep.response} code={example} />

        <SectionLabel>{lang === "id" ? "Kode error" : "Error codes"}</SectionLabel>
        <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-card">
          {ERRORS.map(([s, c, d]) => (
            <div key={c} className="flex items-start gap-3 px-4 py-3 text-[14px]">
              <span className="w-14 shrink-0 font-mono font-semibold text-danger">{s}</span>
              <div className="min-w-0">
                <div className="break-words font-mono text-[12.5px] text-fg">{c}</div>
                <div className="text-muted">{d}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Button variant="ghost" href={`/explorer?endpoint=${ep.id}`} icon={ExternalLink}>Buka di API Explorer</Button>
        </div>
      </div>

      <Sheet open={tryOpen} onClose={() => setTryOpen(false)} title="Try API" subtitle={`${ep.method} ${ep.path}`} wide>
        <Runner ep={ep} autoFocus />
      </Sheet>
    </PageTransition>
  );
}
