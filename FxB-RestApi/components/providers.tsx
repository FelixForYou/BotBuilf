"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translate, type DictKey, type Lang } from "@/lib/i18n";

export interface Me {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  created_at: number;
  quota: { keyName: string; tier: "free" | "premium"; used: number; limit: number; reset: number } | null;
}

interface AppCtx {
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
  me: Me | null;
  meLoading: boolean;
  refreshMe: () => Promise<void>;
  drawer: boolean;
  setDrawer: (v: boolean) => void;
  tour: boolean;
  setTour: (v: boolean) => void;
  help: boolean;
  setHelp: (v: boolean) => void;
}

const Ctx = createContext<AppCtx | null>(null);

function store(k: string, v?: string): string | null {
  try {
    if (v === undefined) return localStorage.getItem(k);
    localStorage.setItem(k, v);
  } catch {
    /* storage tidak tersedia */
  }
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [lang, setLangState] = useState<Lang>("id");
  const [me, setMe] = useState<Me | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [tour, setTour] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const t = store("fxb-theme");
    if (t === "light" || t === "dark") setThemeState(t);
    const l = store("fxb-lang");
    if (l === "en" || l === "id") setLangState(l);
    if (!store("fxb-toured")) setTour(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
  }, [theme, lang]);

  const refreshMe = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const j = await r.json();
      setMe(j.data ?? null);
    } catch {
      setMe(null);
    } finally {
      setMeLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const value = useMemo<AppCtx>(
    () => ({
      theme,
      setTheme: (t) => {
        setThemeState(t);
        store("fxb-theme", t);
      },
      lang,
      setLang: (l) => {
        setLangState(l);
        store("fxb-lang", l);
      },
      t: (k) => translate(lang, k),
      me,
      meLoading,
      refreshMe,
      drawer,
      setDrawer,
      tour,
      setTour: (v) => {
        setTour(v);
        if (!v) store("fxb-toured", "1");
      },
      help,
      setHelp,
    }),
    [theme, lang, me, meLoading, refreshMe, drawer, tour, help],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp di luar Providers");
  return c;
}
