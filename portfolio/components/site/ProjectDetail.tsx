"use client";
import { Fragment, useRef } from "react";
import type { Project } from "@/lib/types";
import { categoryLabel, linkLabel, mediaUrl, statusLabel } from "@/lib/types";
import { ProjectVisual } from "../art/ProjectVisual";
import { TLink } from "./Transition";
import { gsap, useGSAP, motionState, markReady } from "./motion";

export function ProjectDetail({ project: p, next, preview = false }: { project: Project; next?: Project | null; preview?: boolean }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const { level } = motionState();
      if (level === "minimal") { markReady(); return; }
      const q = gsap.utils.selector(root);
      gsap
        .timeline({ delay: 0.15 })
        .fromTo(q(".pd__title .w > span"), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.05, ease: "expo.out" })
        .fromTo(q(".pd__crumb, .pd__summary"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.3)
        .fromTo(q(".pd__hero-visual"), { clipPath: "inset(18% 8% 18% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 0.2)
        .fromTo(q(".pd__hero-visual .visual"), { scale: 1.15 }, { scale: 1, duration: 1.5, ease: "expo.out" }, 0.2)
        .fromTo(q(".pd__facts > div"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06 }, 0.7);
      markReady();
      q(".pd__body p, .pd__shot").forEach((el) => {
        gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });
      if (level === "full") {
        gsap.to(q(".pd__hero-visual .visual"), {
          yPercent: 8, ease: "none",
          scrollTrigger: { trigger: q(".pd__hero-visual")[0], start: "top top", end: "bottom top", scrub: true },
        });
      }
    },
    { scope: root, dependencies: [p.id] }
  );

  const paragraphs = p.description.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  return (
    <article ref={root} className="pd">
      {preview && (
        <div className="pd__preview-bar" role="status">
          Mode preview admin · {p.published ? "sudah dipublikasikan" : "draft, belum terlihat publik"}
        </div>
      )}
      <header className="pd__head">
        <p className="pd__crumb">
          <TLink href="/#semua-project" label="Semua project">← Semua project</TLink>
          <span>/</span>
          <span>{p.categories.map(categoryLabel).join(" · ")}</span>
        </p>
        <h1 className="pd__title">
          {p.title.split(/\s+/).map((w, i) => <Fragment key={i}><span className="w"><span>{w}</span></span>{" "}</Fragment>)}
        </h1>
        {p.summary && <p className="pd__summary">{p.summary}</p>}
      </header>

      <div className="pd__hero-visual">
        <ProjectVisual project={p} priority />
      </div>

      <div className="pd__layout">
        <dl className="pd__facts">
          <div><dt>Status</dt><dd><b className={`st st--${p.status}`}>{statusLabel(p.status)}</b></dd></div>
          <div><dt>Kategori</dt><dd>{p.categories.map(categoryLabel).join(", ")}</dd></div>
          {p.tech.length > 0 && (
            <div><dt>Teknologi</dt><dd><ul className="pd__tech">{p.tech.map((t) => <li key={t}>{t}</li>)}</ul></dd></div>
          )}
          {p.links.length > 0 && (
            <div>
              <dt>Tautan</dt>
              <dd className="pd__links">
                {p.links.map((l) => (
                  <a key={l.url + l.kind} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn--line btn--sm">
                    <span>{linkLabel(l)}</span><span className="btn__arrow" aria-hidden="true">↗</span>
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <div className="pd__body">
          {paragraphs.length ? paragraphs.map((t, i) => <p key={i}>{t}</p>) : <p>Deskripsi lengkap belum ditulis.</p>}
        </div>
      </div>

      {p.gallery.length > 0 && (
        <section className="pd__gallery" aria-label="Screenshot project">
          {p.gallery.map((g, i) => (
            <figure key={g.id} className={`pd__shot${i % 3 === 0 ? " pd__shot--wide" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(g.file)} alt={g.alt} width={g.width || undefined} height={g.height || undefined} loading="lazy" decoding="async" />
              <figcaption>{String(i + 1).padStart(2, "0")} · {g.alt}</figcaption>
            </figure>
          ))}
        </section>
      )}

      {next && (
        <TLink href={`/project/${next.slug}`} label={next.title} className="pd__next">
          <span className="label">Project berikutnya</span>
          <span className="pd__next-title">{next.title}</span>
          <span className="pd__next-arrow" aria-hidden="true">→</span>
        </TLink>
      )}
    </article>
  );
}
