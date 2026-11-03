"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3, BookOpen, ChevronLeft, CircleHelp, Compass, CreditCard, FileText, Globe, Grid2x2, Home, KeyRound, LayoutDashboard, LifeBuoy,
  LogIn, LogOut, Moon, MoreHorizontal, Receipt, Settings, Shield, ShieldCheck, Sparkles, Sun, Terminal, UserPlus, Wrench, X, Zap, Rocket, Lock,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { fmtNum } from "@/lib/client";
import { Mascot, Smiley } from "./brand";
import { useApp } from "./providers";
import { Button, ListGroup, ListRow, SegmentBar, Sheet, cx, toast } from "./ui";

export function TopBar() {
  const { theme, setTheme, lang, setLang, setDrawer, t } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bar backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-1 px-3 sm:px-5">
        <div className="flex w-[92px] items-center gap-1 lg:w-auto">
          {isHome ? (
            <Link href="/" aria-label="Beranda" className="grid size-10 place-items-center">
              <Mascot className="size-8" />
            </Link>
          ) : (
            <button aria-label={t("back")} onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))} className="grid size-10 place-items-center rounded-full hover:bg-card-2">
              <ChevronLeft className="size-7" strokeWidth={2} />
            </button>
          )}
          <button aria-label={t("appearance")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid size-10 place-items-center rounded-full hover:bg-card-2">
            <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
              {theme === "dark" ? <Sun className="size-[22px]" strokeWidth={1.9} /> : <Moon className="size-[22px]" strokeWidth={1.9} />}
            </motion.span>
          </button>
        </div>
        <Link href="/" className="flex flex-1 items-center justify-center gap-2 text-[18px] font-bold tracking-tight lg:flex-none lg:px-3">
          {BRAND.name}
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {[
            ["/docs", t("docs")],
            ["/explorer", t("explorer")],
            ["/categories", t("categories")],
            ["/pricing", t("pricing")],
            ["/dashboard", t("dashboard")],
          ].map(([href, label]) => (
            <Link key={href} href={href} className={cx("rounded-full px-3.5 py-2 text-[14px] font-medium transition hover:bg-card-2", pathname.startsWith(href) ? "text-mint" : "text-muted")}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex w-[92px] items-center justify-end gap-1 lg:w-auto">
          <button aria-label={t("language")} title={lang === "id" ? "Bahasa Indonesia" : "English"} onClick={() => setLang(lang === "id" ? "en" : "id")} className="relative grid size-10 place-items-center rounded-full hover:bg-card-2">
            <Globe className="size-[22px]" strokeWidth={1.9} />
            <span className="absolute -bottom-0.5 right-0 rounded-full bg-mint px-1 text-[9px] font-bold uppercase text-mint-ink">{lang}</span>
          </button>
          <button aria-label={t("menu")} onClick={() => setDrawer(true)} className="grid size-10 place-items-center rounded-full hover:bg-card-2">
            <MoreHorizontal className="size-[24px]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Drawer() {
  const { drawer, setDrawer, me, t, lang, setLang, theme, setTheme, setTour, refreshMe } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => setDrawer(false), [pathname, setDrawer]);
  useEffect(() => {
    if (drawer) void refreshMe();
  }, [drawer, refreshMe]);
  const close = () => setDrawer(false);
  const q = me?.quota;
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshMe();
    toast(lang === "id" ? "Berhasil keluar." : "Logged out.");
    close();
    router.push("/");
  }
  return (
    <AnimatePresence>
      {drawer && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside
            className="absolute inset-y-0 right-0 w-full max-w-[420px] overflow-y-auto bg-bg px-4 pb-10 pt-5 sm:border-l sm:border-line"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 className="text-[30px] font-bold">{t("menu")}</h2>
              <button aria-label="Tutup" onClick={close} className="grid size-10 place-items-center rounded-full hover:bg-card-2">
                <X className="size-6" />
              </button>
            </div>

            {me ? (
              <>
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <span className="text-[13px] font-semibold tracking-[0.08em] text-muted">{t("requestsToday")}</span>
                  <span className="text-[14px] font-semibold text-mint">
                    {fmtNum(q?.used ?? 0)} {t("of")} {fmtNum(q?.limit ?? 0)}
                  </span>
                </div>
                <SegmentBar used={q?.used ?? 0} limit={q?.limit ?? 1} />
                <p className="mt-2.5 px-1 text-[13px] text-muted">
                  {fmtNum(Math.max(0, (q?.limit ?? 0) - (q?.used ?? 0)))} {t("left")} · {q?.tier === "premium" ? "Premium" : "Free"}
                </p>
              </>
            ) : (
              <div className="rounded-[22px] bg-card p-4">
                <p className="text-[14.5px] text-muted">{lang === "id" ? "Masuk untuk mengelola API key, statistik, dan paket premium." : "Log in to manage API keys, usage and premium plans."}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button href="/login" variant="secondary" icon={LogIn}>{t("login")}</Button>
                  <Button href="/register" icon={UserPlus}>{t("register")}</Button>
                </div>
              </div>
            )}

            {me && (
              <>
                <Label>{t("account")}</Label>
                <ListGroup>
                  <ListRow icon={LayoutDashboard} label={t("dashboard")} href="/dashboard" />
                  <ListRow icon={KeyRound} label={t("keys")} href="/dashboard/keys" />
                  <ListRow icon={BarChart3} label={t("usage")} href="/dashboard/usage" />
                  <ListRow icon={Receipt} label={t("orders")} href="/dashboard/orders" />
                  <ListRow icon={Settings} label={t("settings")} href="/dashboard/settings" />
                </ListGroup>
              </>
            )}
            {me?.role === "admin" && (
              <>
                <Label>{t("admin")}</Label>
                <ListGroup>
                  <ListRow icon={ShieldCheck} label={t("adminPanel")} href="/admin" />
                </ListGroup>
              </>
            )}

            <Label>{t("explore")}</Label>
            <ListGroup>
              <ListRow icon={Home} label={t("home")} href="/" />
              <ListRow icon={BookOpen} label={t("docs")} href="/docs" />
              <ListRow icon={Terminal} label={t("explorer")} href="/explorer" />
              <ListRow icon={Grid2x2} label={t("categories")} href="/categories" />
              <ListRow icon={CreditCard} label={t("pricing")} href="/pricing" />
            </ListGroup>

            <Label>{t("preferences")}</Label>
            <ListGroup>
              <ListRow icon={Globe} label={t("language")} value={lang === "id" ? "Indonesia" : "English"} onClick={() => setLang(lang === "id" ? "en" : "id")} />
              <ListRow icon={theme === "dark" ? Moon : Sun} label={t("appearance")} value={theme === "dark" ? t("dark") : t("light")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
            </ListGroup>

            <Label>{t("guide")}</Label>
            <ListGroup>
              <ListRow icon={Compass} label={t("takeTour")} onClick={() => { close(); setTour(true); }} />
              <ListRow icon={Sparkles} label={t("features")} href="/guide#features" />
              <ListRow icon={CircleHelp} label={t("howItWorks")} href="/guide#how" />
              <ListRow icon={FileText} label={t("faq")} href="/guide#faq" />
              <ListRow icon={Wrench} label={t("tips")} href="/guide#tips" />
            </ListGroup>

            <Label>{t("legal")}</Label>
            <ListGroup>
              <ListRow icon={Shield} label={t("privacy")} href="/legal/privacy" />
              <ListRow icon={FileText} label={t("terms")} href="/legal/terms" />
            </ListGroup>

            {me && (
              <ListGroup className="mt-6">
                <ListRow icon={LogOut} label={t("logout")} sub={me.email} onClick={logout} danger />
              </ListGroup>
            )}
            <p className="mt-8 text-center text-[12.5px] text-subtle">
              {BRAND.name} v{BRAND.version} · by <span className="font-semibold text-muted">{BRAND.developer}</span>
            </p>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2.5 mt-7 px-1 text-[13px] font-semibold tracking-[0.08em] text-muted">{children}</h3>;
}

export function HelpFab() {
  const { help, setHelp, lang } = useApp();
  const support = process.env.NEXT_PUBLIC_SUPPORT_URL;
  return (
    <>
      <motion.button
        aria-label="Bantuan"
        onClick={() => setHelp(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-5 right-4 z-30 grid size-[60px] place-items-center rounded-full bg-[#1f3a33] text-mint shadow-[0_12px_30px_-8px_rgba(0,0,0,0.6)] sm:bottom-7 sm:right-7"
        style={{ background: "color-mix(in oklab, var(--mint) 22%, var(--card))" }}
      >
        <Smiley className="size-8" />
      </motion.button>
      <Sheet open={help} onClose={() => setHelp(false)} title={lang === "id" ? "Butuh bantuan?" : "Need help?"} subtitle={lang === "id" ? "Pilih yang paling sesuai." : "Pick what fits best."}>
        <ListGroup>
          <ListRow icon={Rocket} label={lang === "id" ? "Mulai cepat" : "Quick start"} sub={lang === "id" ? "Buat key & request pertama" : "Create a key & first request"} href="/guide#how" onClick={() => setHelp(false)} />
          <ListRow icon={BookOpen} label={lang === "id" ? "Dokumentasi API" : "API docs"} href="/docs" onClick={() => setHelp(false)} />
          <ListRow icon={Zap} label={lang === "id" ? "Error & limit" : "Errors & limits"} sub="401, 403, 429, 503" href="/guide#tips" onClick={() => setHelp(false)} />
          <ListRow icon={Lock} label="OpenAPI JSON" sub="/api/openapi.json" href="/api/openapi.json" />
          {support && <ListRow icon={LifeBuoy} label={lang === "id" ? "Hubungi FELIXIORITY" : "Contact FELIXIORITY"} href={support} />}
        </ListGroup>
      </Sheet>
    </>
  );
}

const SLIDES = [
  { icon: KeyRound, title: { id: "Satu key, ", en: "One key, " }, em: { id: "semua API", en: "every API" }, text: { id: "Buat API key gratis dalam hitungan detik, lalu panggil downloader, AI, tools, dan hiburan dari bot atau aplikasimu.", en: "Create a free API key in seconds, then call downloaders, AI, tools and fun APIs from your bot or app." } },
  { icon: ShieldCheck, title: { id: "Kami cek ", en: "We check it " }, em: { id: "duluan", en: "first" }, text: { id: "Setiap request divalidasi: parameter, limit, dan izin key — jadi errornya jelas dan kuotamu tidak terbuang.", en: "Every request is validated — params, limits and key scope — so errors are clear and your quota isn't wasted." } },
  { icon: Terminal, title: { id: "Coba ", en: "Try it " }, em: { id: "langsung", en: "live" }, text: { id: "Dokumentasi interaktif: lihat parameter, salin contoh, dan tekan Try API untuk melihat respons nyata.", en: "Interactive docs: see params, copy snippets and hit Try API to see real responses." } },
  { icon: Sparkles, title: { id: "Naik ke ", en: "Go " }, em: { id: "Premium", en: "Premium" }, text: { id: "Limit lebih besar, endpoint premium, dan aktivasi otomatis setelah pembayaran terverifikasi.", en: "Higher limits, premium endpoints and automatic activation once payment is verified." } },
];

export function Tour() {
  const { tour, setTour, lang } = useApp();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (tour) setI(0);
  }, [tour]);
  const s = SLIDES[i];
  const Icon = s.icon;
  const last = i === SLIDES.length - 1;
  return (
    <AnimatePresence>
      {tour && (
        <motion.div className="fixed inset-0 z-[70] flex flex-col bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-5">
            <div className="flex justify-end">
              <button onClick={() => setTour(false)} className="px-2 py-2 text-[16px] text-muted hover:text-fg">
                {lang === "id" ? "Lewati" : "Skip"}
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }} className="flex flex-col items-center">
                  <div className="grid size-[124px] place-items-center rounded-[34px] bg-[color-mix(in_oklab,var(--mint)_22%,var(--card))]">
                    <Icon className="size-16 text-mint" strokeWidth={1.8} />
                  </div>
                  <h2 className="mt-8 text-[30px] font-extrabold leading-tight">
                    {s.title[lang]}
                    <em className="italic">{s.em[lang]}</em>
                  </h2>
                  <p className="mt-4 text-[16.5px] leading-relaxed text-muted">{s.text[lang]}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mb-6 flex justify-center gap-2">
              {SLIDES.map((_, k) => (
                <motion.span key={k} animate={{ width: k === i ? 22 : 7 }} className={cx("h-[7px] rounded-full", k === i ? "bg-mint" : "bg-card-3")} />
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={() => (last ? setTour(false) : setI(i + 1))}>
              {last ? (lang === "id" ? "Mulai" : "Get started") : lang === "id" ? "Lanjut" : "Continue"}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
