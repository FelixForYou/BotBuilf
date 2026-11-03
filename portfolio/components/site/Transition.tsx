"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { gsap, ScrollTrigger, motionState } from "./motion";

type Nav = (href: string, label?: string) => void;
const Ctx = createContext<Nav>(() => {});
export const useTransitionNav = () => useContext(Ctx);

function scrollToHash(hash: string, smooth: boolean) {
  const el = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (el) el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  else window.scrollTo({ top: 0 });
}

/**
 * Transisi antar halaman: panel biru menutup layar dengan label tujuan,
 * route berganti, lalu panel membuka ke atas. Konten tetap berupa link asli.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pending = useRef<{ hash: string } | null>(null);
  const busy = useRef(false);
  const [label, setLabel] = useState("FELIXIORITY");

  const navigate = useCallback<Nav>(
    (href, nextLabel) => {
      if (busy.current) return;
      const url = new URL(href, window.location.href);
      const samePage = url.pathname === window.location.pathname;
      const { level } = motionState();

      if (samePage) {
        history.pushState(null, "", url.hash || url.pathname);
        scrollToHash(url.hash, level !== "minimal");
        return;
      }
      pending.current = { hash: url.hash };
      if (level === "minimal" || !overlay.current) {
        router.push(url.pathname + url.search);
        return;
      }
      busy.current = true;
      setLabel(nextLabel || "FELIXIORITY");
      const o = overlay.current;
      gsap.killTweensOf([o, labelRef.current]);
      gsap
        .timeline({ onComplete: () => router.push(url.pathname + url.search) })
        .set(o, { display: "flex", clipPath: "inset(100% 0% 0% 0%)" })
        .to(o, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power4.inOut" })
        .fromTo(labelRef.current, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "expo.out" }, "-=0.2");
    },
    [router]
  );

  // Setelah route berganti: lompat ke posisi, buka panel.
  useEffect(() => {
    const p = pending.current;
    pending.current = null;
    if (p) {
      window.scrollTo({ top: 0 });
      // beri waktu satu frame agar layout halaman baru terbentuk
      requestAnimationFrame(() => {
        if (!p.hash) return;
        ScrollTrigger.refresh();
        scrollToHash(p.hash, false);
      });
    }
    const o = overlay.current;
    if (!o || !busy.current) return;
    gsap
      .timeline({
        delay: 0.1,
        onComplete: () => {
          gsap.set(o, { display: "none" });
          busy.current = false;
        },
      })
      .to(labelRef.current, { yPercent: -110, duration: 0.35, ease: "power2.in" })
      .to(o, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.65, ease: "power4.inOut" }, "-=0.1");
  }, [pathname]);

  return (
    <Ctx.Provider value={navigate}>
      {children}
      <div ref={overlay} className="page-curtain" aria-hidden="true">
        <span className="page-curtain__mask">
          <span ref={labelRef} className="page-curtain__label">{label}</span>
        </span>
        <span className="page-curtain__meta">Felixiority</span>
      </div>
    </Ctx.Provider>
  );
}

/** Link dengan transisi halaman. Klik dengan Ctrl/Cmd/middle tetap perilaku normal browser. */
export function TLink({
  href, label, children, className, onClick, ...rest
}: { href: string; label?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const navigate = useTransitionNav();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href, label);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
