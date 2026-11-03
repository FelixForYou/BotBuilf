"use client";
import { Fragment, useRef } from "react";
import Link from "next/link";
import type { Settings } from "@/lib/types";
import { gsap, useGSAP, motionState } from "./motion";

const split = (text: string, accentLast = false) => {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((w, i) => (
    <Fragment key={i}>
      <span className="w">
        <span className={accentLast && i === words.length - 1 ? "serif" : undefined}>{w}</span>
      </span>
      {i < words.length - 1 ? " " : ""}
    </Fragment>
  ));
};

function useReveal(root: React.RefObject<HTMLElement | null>, extra?: (q: (s: string) => Element[]) => void) {
  useGSAP(
    () => {
      if (motionState().level === "minimal") return;
      const q = gsap.utils.selector(root);
      q("[data-words]").forEach((el) => {
        gsap.fromTo(el.querySelectorAll(".w > span"), { yPercent: 110 }, {
          yPercent: 0, duration: 1, stagger: 0.04, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
      q("[data-rise]").forEach((el) => {
        gsap.fromTo(el, { autoAlpha: 0, y: 36 }, {
          autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });
      q("[data-rule]").forEach((el) => {
        gsap.fromTo(el, { scaleX: 0 }, {
          scaleX: 1, duration: 1.1, ease: "expo.inOut",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      });
      extra?.(q);
    },
    { scope: root }
  );
}

export function About({ about }: { about: Settings["about"] }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section ref={root} className="about" id="tentang" aria-labelledby="about-title">
      <div className="about__side">
        <p className="label">(03) Tentang Felixiority</p>
        <h2 id="about-title" className="about__title" data-words>{split(about.title, true)}</h2>
      </div>
      <div className="about__main">
        {about.paragraphs.map((p, i) => (
          <p key={i} className={i === 0 ? "about__lead" : "about__p"} data-rise>{p}</p>
        ))}
        {about.focus.length > 0 && (
          <ol className="about__focus">
            {about.focus.map((f, i) => (
              <li key={i}>
                <span className="about__rule" data-rule aria-hidden="true" />
                <span className="about__n">{String(i + 1).padStart(2, "0")}</span>
                <span data-rise>{f}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export function Services({ services }: { services: Settings["services"] }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root, (q) => {
    gsap.fromTo(q(".svc__row"), { autoAlpha: 0, y: 50 }, {
      autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.09, ease: "expo.out",
      scrollTrigger: { trigger: q(".svc__list")[0], start: "top 85%", once: true },
    });
  });
  if (!services.length) return null;
  return (
    <section ref={root} className="svc" id="layanan" aria-labelledby="svc-title">
      <div className="svc__head">
        <p className="label">(04) Layanan &amp; fokus</p>
        <h2 id="svc-title" className="svc__title" data-words>{split("Yang bisa dikerjakan bersama.", true)}</h2>
      </div>
      <ol className="svc__list">
        {services.map((s, i) => (
          <li key={i} className="svc__row" tabIndex={0}>
            <span className="svc__n">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="svc__name">{s.title}</h3>
            <div className="svc__body"><p>{s.body}</p></div>
            <span className="svc__mark" aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  );
}

function contactItems(c: Settings["contact"]) {
  const out: { label: string; value: string; href: string }[] = [];
  if (c.email) out.push({ label: "Email", value: c.email, href: `mailto:${c.email}` });
  if (c.telegram) {
    const u = c.telegram.replace(/^@/, "");
    out.push({ label: "Telegram", value: `@${u}`, href: `https://t.me/${u}` });
  }
  if (c.whatsapp) {
    const num = c.whatsapp.replace(/[^0-9]/g, "");
    out.push({ label: "WhatsApp", value: c.whatsapp, href: `https://wa.me/${num}` });
  }
  return out;
}

export function ContactFooter({ contact, socials }: { contact: Settings["contact"]; socials: Settings["socials"] }) {
  const root = useRef<HTMLElement>(null);
  const items = contactItems(contact);
  useReveal(root, (q) => {
    gsap.fromTo(q(".ct__item"), { autoAlpha: 0, y: 30 }, {
      autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "expo.out",
      scrollTrigger: { trigger: q(".ct__list")[0] ?? root.current, start: "top 88%", once: true },
    });
  });

  return (
    <section ref={root} className="ct" id="kontak" aria-labelledby="ct-title" data-nav-dark>
      <div className="ct__top">
        <p className="label label--light">(05) Kontak</p>
        <h2 id="ct-title" className="ct__title" data-words>{split(contact.title, true)}</h2>
        {contact.note && <p className="ct__note" data-rise>{contact.note}</p>}
      </div>

      <div className="ct__grid">
        {items.length > 0 ? (
          <ul className="ct__list">
            {items.map((it) => (
              <li key={it.label} className="ct__item">
                <span className="ct__label">{it.label}</span>
                <a className="ct__link" href={it.href} target={it.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                  <span>{it.value}</span><span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ct__empty" data-rise>Saluran kontak sedang disiapkan.</p>
        )}
        <div className="ct__aside">
          {contact.location && (
            <p className="ct__item"><span className="ct__label">Lokasi</span><span>{contact.location}</span></p>
          )}
          {socials.length > 0 && (
            <div className="ct__item">
              <span className="ct__label">Sosial</span>
              <ul className="ct__socials">
                {socials.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}

export function EndFooter() {
  const root = useRef<HTMLElement>(null);
  const year = new Date().getFullYear();
  useReveal(root, (q) => {
    // Penutup: wordmark tersusun, garis biru menyambung tiga simpul, lalu diam.
    gsap
      .timeline({ scrollTrigger: { trigger: root.current, start: "top 85%", once: true } })
      .fromTo(q(".end__word .ch > span"), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.04, ease: "expo.out" })
      .fromTo(q(".end__line"), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "expo.inOut" }, 0.35)
      .fromTo(q(".end__node"), { scale: 0 }, { scale: 1, duration: 0.5, stagger: 0.12, ease: "back.out(2)" }, 0.6)
      .fromTo(q(".end__caption"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 1);
  });
  return (
  <footer ref={root} className="end" data-nav-dark>
      <div className="end__motif" aria-hidden="true">
        <span className="end__node" /><span className="end__line" /><span className="end__node" /><span className="end__line" /><span className="end__node" />
      </div>
      <p className="end__word"><span className="sr-only">FELIXIORITY</span>
        {"FELIXIORITY".split("").map((c, i) => <span className="ch" key={i} aria-hidden="true"><span>{c}</span></span>)}
      </p>
      <p className="end__caption">Website · API · Infrastruktur · Eksperimen</p>
      <div className="end__bottom">
        <span>© {year} Felixiority</span>
        <a href="#top" className="end__top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: motionState().level === "minimal" ? "auto" : "smooth" }); }}>Kembali ke atas ↑</a>
        <Link href="/admin/login" className="end__admin" prefetch={false}>Login Admin</Link>
      </div>
  </footer>
  );
}
