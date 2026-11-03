"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TLink } from "./Transition";
import { gsap, motionState } from "./motion";

const LINKS = [
  { href: "/#project", label: "Project", n: "01" },
  { href: "/#tentang", label: "Tentang", n: "02" },
  { href: "/#layanan", label: "Layanan", n: "03" },
  { href: "/#kontak", label: "Kontak", n: "04" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Nav berganti tema saat berada di atas section gelap (dicek di garis tengah bar).
    let raf = 0;
    const check = () => {
      raf = 0;
      setScrolled(window.scrollY > 40);
      const stack = document.elementsFromPoint(window.innerWidth / 2, 32);
      setDark(stack.some((el) => !el.closest(".nav") && el.closest("[data-nav-dark]")));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  // Animasi panel menu mobile: tirai turun, lalu link naik satu per satu.
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const { level } = motionState();
    tl.current?.kill();
    document.body.classList.toggle("menu-open", open);
    if (level === "minimal") {
      gsap.set(el, { display: open ? "flex" : "none", clipPath: "none" });
      return;
    }
    const items = el.querySelectorAll("[data-menu-item]");
    if (open) {
      tl.current = gsap
        .timeline()
        .set(el, { display: "flex" })
        .fromTo(el, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "power4.inOut" })
        .fromTo(items, { yPercent: 100 }, { yPercent: 0, duration: 0.6, stagger: 0.06, ease: "expo.out" }, "-=0.2");
    } else if (getComputedStyle(el).display !== "none") {
      tl.current = gsap
        .timeline({ onComplete: () => { gsap.set(el, { display: "none" }); } })
        .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.45, ease: "power3.inOut" });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}${dark && !open ? " is-dark" : ""}`}>
      <div className="nav__bar">
        <TLink href="/" className="nav__logo" aria-label="FELIXIORITY, kembali ke beranda" label="FELIXIORITY">
          <span className="nav__mark" aria-hidden="true"><i /><i /><i /></span>
          FELIXIORITY
        </TLink>
        <nav className="nav__links" aria-label="Navigasi utama">
          {LINKS.map((l) => (
            <TLink key={l.href} href={l.href} className="nav__link" label={l.label}>
              <span className="nav__link-n">{l.n}</span>
              <span className="nav__link-t" data-text={l.label}>{l.label}</span>
            </TLink>
          ))}
        </nav>
        <button
          ref={toggle}
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Tutup menu" : "Buka menu"}</span>
          <span className="nav__toggle-lines" aria-hidden="true"><i /><i /></span>
          <span className="nav__toggle-label" aria-hidden="true">{open ? "Tutup" : "Menu"}</span>
        </button>
      </div>
      <div id="mobile-menu" ref={panel} className="nav__panel" hidden={false} aria-hidden={!open} inert={!open}>
        <ul>
          {LINKS.map((l) => (
            <li key={l.href} className="nav__panel-row">
              <span className="nav__panel-mask">
                <TLink href={l.href} data-menu-item className="nav__panel-link" label={l.label} onClick={() => setOpen(false)}>
                  <span>{l.n}</span>
                  {l.label}
                </TLink>
              </span>
            </li>
          ))}
        </ul>
        <p className="nav__panel-foot">Felixiority · website, API, infrastruktur</p>
      </div>
    </header>
  );
}
