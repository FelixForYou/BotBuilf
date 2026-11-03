"use client";

import { motion } from "motion/react";
import { ArrowRight, BookOpen, Check, KeyRound, Plus, Terminal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORY_ICONS } from "@/components/category-icon";
import { useApp } from "@/components/providers";
import { Badge, Button, Card, CodeBlock, ListGroup, ListRow, PageTransition, SectionLabel, Skeleton, StatGrid, Steps } from "@/components/ui";
import { useCatalog } from "@/components/use-catalog";
import { Mascot } from "@/components/brand";
import { BRAND } from "@/lib/brand";
import { api, fmtIDR, fmtNum } from "@/lib/client";

interface Stats {
  endpoints: number;
  users: number;
  requests_24h: number;
  success_rate: number | null;
  avg_latency: number | null;
}
interface Plans {
  free: { daily_limit: number; rpm: number };
  plans: { id: string; name: string; price: number; duration_days: number; daily_limit: number }[];
}

export default function Home() {
  const { me, lang } = useApp();
  const { data } = useCatalog();
  const [stats, setStats] = useState<Stats | null>(null);
  const [plans, setPlans] = useState<Plans | null>(null);
  const [origin, setOrigin] = useState("https://your-domain");
  useEffect(() => {
    setOrigin(window.location.origin);
    api<Stats>("/api/stats").then(setStats).catch(() => {});
    api<Plans>("/api/plans").then(setPlans).catch(() => {});
  }, []);
  const id = lang === "id";

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <div className="flex items-center gap-4">
          <Mascot className="size-[76px]" />
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight sm:text-[34px]">{BRAND.name}</h1>
            <div className="text-[15px] font-medium text-mint">by {BRAND.developer}</div>
            <div className="text-[14px] text-muted">REST API · JSON · v{BRAND.version}</div>
          </div>
        </div>
        <p className="mt-5 text-[17px] leading-relaxed text-muted">
          {id
            ? "Satu API key untuk downloader media, AI chat & gambar, tools developer, dan hiburan — siap dipakai di bot Telegram, WhatsApp, website, dan aplikasi."
            : "One API key for media downloaders, AI chat & images, developer tools and fun APIs — ready for Telegram/WhatsApp bots, websites and apps."}
        </p>

        <Link href={me ? "/dashboard/keys?new=1" : "/register"} className="group mt-6 block">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex items-center justify-center gap-4 rounded-[30px] border-2 border-dashed border-line bg-card/40 px-6 py-9 transition group-hover:border-mint/60">
            <span className="grid size-[62px] place-items-center rounded-full bg-mint-soft text-mint transition group-hover:bg-mint group-hover:text-mint-ink">
              <Plus className="size-7" strokeWidth={2.4} />
            </span>
            <span className="text-[22px] font-semibold text-muted transition group-hover:text-fg sm:text-[26px]">{id ? "Buat API key" : "Create API key"}</span>
          </motion.div>
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button size="lg" href={me ? "/dashboard" : "/register"} icon={KeyRound}>
            {me ? "Dashboard" : id ? "Dapatkan key gratis" : "Get a free key"}
          </Button>
          <Button size="lg" variant="secondary" href="/docs" icon={BookOpen}>
            {id ? "Baca dokumentasi" : "Read the docs"}
          </Button>
        </div>

        {/* Statistik nyata */}
        <SectionLabel>{id ? "Status layanan · 24 jam" : "Service status · 24h"}</SectionLabel>
        {stats ? (
          <StatGrid
            items={[
              { value: stats.endpoints, label: "Endpoint" },
              { value: fmtNum(stats.requests_24h), label: "Request" },
              { value: stats.success_rate === null ? "—" : `${stats.success_rate}%`, label: id ? "Sukses" : "Success" },
              { value: stats.avg_latency === null ? "—" : `${stats.avg_latency}ms`, label: "Latency" },
            ]}
          />
        ) : (
          <Skeleton className="h-[70px] rounded-[20px]" />
        )}

        {/* Contoh request */}
        <SectionLabel right={<Link href="/explorer" className="flex items-center gap-1 text-[14px] font-medium text-mint">Explorer <ArrowRight className="size-4" /></Link>}>
          {id ? "Request pertama" : "First request"}
        </SectionLabel>
        <CodeBlock
          lang="curl"
          code={`curl "${origin}/api/v1/tools/dns?domain=google.com&apikey=YOUR_API_KEY"\n\n# {\n#   "status": true,\n#   "creator": "${BRAND.developer}",\n#   "result": { "domain": "google.com", "records": [...] }\n# }`}
        />

        {/* Kategori */}
        <SectionLabel right={<Link href="/categories" className="text-[14px] font-medium text-mint">{id ? "Semua" : "All"}</Link>}>{id ? "Kategori API" : "API categories"}</SectionLabel>
        {data ? (
          <ListGroup>
            {data.categories.map((c) => (
              <ListRow
                key={c.id}
                icon={CATEGORY_ICONS[c.id]}
                label={c.name}
                sub={c.description}
                value={`${data.endpoints.filter((e) => e.category === c.id).length}`}
                href={`/docs?category=${c.id}`}
              />
            ))}
          </ListGroup>
        ) : (
          <Skeleton className="h-[330px] rounded-[22px]" />
        )}

        {/* Cara kerja */}
        <SectionLabel>{id ? "Cara kerja" : "How it works"}</SectionLabel>
        <Card>
          <Steps
            steps={[
              { label: id ? "Daftar akun" : "Create an account", sub: id ? "Gratis, cukup email & password" : "Free — email & password", state: "done" },
              { label: id ? "Buat API key" : "Create an API key", sub: id ? "Key free langsung aktif" : "Free keys work instantly", state: "done" },
              { label: id ? "Panggil endpoint" : "Call an endpoint", sub: "?apikey=… / X-API-Key", state: "done" },
              { label: id ? "Upgrade premium" : "Upgrade to premium", sub: id ? "Aktif otomatis setelah bayar" : "Auto-activates after payment", state: "active" },
            ]}
          />
        </Card>

        {/* Pricing teaser */}
        <SectionLabel right={<Link href="/pricing" className="text-[14px] font-medium text-mint">{id ? "Detail" : "Details"}</Link>}>{id ? "Paket" : "Plans"}</SectionLabel>
        {plans ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="flex items-center justify-between">
              <div>
                <div className="text-[17px] font-semibold">Free</div>
                <div className="text-[13.5px] text-muted">{fmtNum(plans.free.daily_limit)} req/{id ? "hari" : "day"} · {plans.free.rpm} req/{id ? "mnt" : "min"}</div>
              </div>
              <Badge>Rp0</Badge>
            </Card>
            {plans.plans.slice(0, 3).map((p) => (
              <Card key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="text-[17px] font-semibold">{p.name}</div>
                  <div className="text-[13.5px] text-muted">{fmtNum(p.daily_limit)} req/{id ? "hari" : "day"} · {p.duration_days} {id ? "hari" : "days"}</div>
                </div>
                <Badge tone="mint">{fmtIDR(p.price)}</Badge>
              </Card>
            ))}
          </div>
        ) : (
          <Skeleton className="h-24 rounded-[22px]" />
        )}

        <Card className="mt-8 text-center">
          <Terminal className="mx-auto size-8 text-mint" />
          <h2 className="mt-3 text-[22px] font-bold">{id ? "Siap membangun?" : "Ready to build?"}</h2>
          <p className="mx-auto mt-1.5 max-w-md text-[15px] text-muted">
            {id ? "Semua endpoint punya dokumentasi lengkap, contoh kode, dan tombol Try API." : "Every endpoint has full docs, code samples and a Try API button."}
          </p>
          <ul className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-x-4 gap-y-1.5 text-[13.5px] text-muted">
            {["OpenAPI 3.1", "Rate limit header", "CORS", "JSON envelope"].map((x) => (
              <li key={x} className="flex items-center gap-1.5"><Check className="size-4 text-mint" />{x}</li>
            ))}
          </ul>
          <Button size="lg" href="/docs" className="mt-6 w-full sm:w-auto">{id ? "Buka dokumentasi" : "Open docs"}</Button>
        </Card>

        <footer className="mt-12 text-center text-[13px] text-subtle">
          © {new Date().getFullYear()} {BRAND.name} · Developed by <span className="font-semibold text-muted">{BRAND.developer}</span>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/legal/privacy" className="hover:text-fg">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-fg">Terms</Link>
            <Link href="/api/openapi.json" className="hover:text-fg">OpenAPI</Link>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
