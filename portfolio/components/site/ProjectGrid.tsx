"use client";
import { Fragment, useMemo, useRef, useState, useLayoutEffect } from "react";
import type { Project } from "@/lib/types";
import { CATEGORIES, categoryLabel, statusLabel } from "@/lib/types";
import { ProjectVisual } from "../art/ProjectVisual";
import { TLink } from "./Transition";
import { gsap, Flip, ScrollTrigger, useGSAP, motionState } from "./motion";

type Filter = "all" | (typeof CATEGORIES)[number]["id"];

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const batchTriggers = useRef<ScrollTrigger[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length };
    for (const cat of CATEGORIES) c[cat.id] = projects.filter((p) => p.categories.includes(cat.id)).length;
    return c;
  }, [projects]);

  const visible = useMemo(() => {
    const qn = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== "all" && !p.categories.includes(filter)) return false;
      if (!qn) return true;
      return [p.title, p.summary, p.tech.join(" "), p.categories.map(categoryLabel).join(" ")].join(" ").toLowerCase().includes(qn);
    });
  }, [projects, filter, query]);
  const visibleIds = new Set(visible.map((p) => p.id));

  // Simpan posisi sebelum perubahan filter, lalu animasikan ke layout baru dengan Flip.
  const capture = () => {
    if (!grid.current) return;
    // Setelah pengguna berinteraksi, semua card dianggap sudah "masuk": hentikan reveal berbasis scroll.
    batchTriggers.current.forEach((t) => t.kill());
    batchTriggers.current = [];
    gsap.set(grid.current.querySelectorAll(".pg__item"), { autoAlpha: 1, y: 0 });
    if (motionState().level === "minimal") return;
    flipState.current = Flip.getState(grid.current.querySelectorAll(".pg__item"));
  };

  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !grid.current) return;
    flipState.current = null;
    Flip.from(state, {
      duration: 0.7,
      ease: "power3.inOut",
      absolute: true,
      nested: true,
      stagger: 0.025,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.04, delay: 0.15 }),
    });
  }, [filter, query]);

  useGSAP(
    () => {
      const { level } = motionState();
      if (level === "minimal") return;
      const q = gsap.utils.selector(root);
      gsap.fromTo(q(".pg__title .w > span"), { yPercent: 110 }, {
        yPercent: 0, stagger: 0.05, duration: 1, ease: "expo.out",
        scrollTrigger: { trigger: q(".pg__title")[0], start: "top 85%", once: true },
      });
      gsap.fromTo(q(".pg__rule"), { scaleX: 0 }, {
        scaleX: 1, duration: 1.2, ease: "expo.inOut",
        scrollTrigger: { trigger: q(".pg__rule")[0], start: "top 90%", once: true },
      });
      const items = q(".pg__item");
      gsap.set(items, { autoAlpha: 0, y: 60 });
      batchTriggers.current = ScrollTrigger.batch(items, {
        start: "top 92%",
        once: true,
        onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "expo.out", overwrite: true }),
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="pg" id="semua-project" aria-labelledby="pg-title">
      <div className="pg__head">
        <p className="label">(02) Arsip kerja</p>
        <h2 id="pg-title" className="pg__title">
          {"Semua project".split(" ").map((w, i) => <Fragment key={i}><span className="w"><span>{w}</span></span>{" "}</Fragment>)}
          <em className="pg__count">{String(projects.length).padStart(2, "0")}</em>
        </h2>
      </div>
      <div className="pg__rule" aria-hidden="true" />

      <div className="pg__controls">
        <label className="pg__search">
          <span className="sr-only">Cari project</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 0M13 13l4.5 4.5" /></svg>
          <input
            type="search"
            placeholder="Cari nama, teknologi, atau kategori"
            value={query}
            onChange={(e) => { capture(); setQuery(e.target.value); }}
          />
        </label>
        <div className="pg__filters" role="group" aria-label="Filter kategori">
          {([{ id: "all", label: "Semua" }, ...CATEGORIES] as { id: Filter; label: string }[]).map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-pressed={filter === c.id}
              disabled={counts[c.id] === 0}
              onClick={() => { if (filter !== c.id) { capture(); setFilter(c.id); } }}
            >
              {c.label}<sup>{counts[c.id]}</sup>
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{visible.length} project ditampilkan</p>

      <ul ref={grid} className="pg__grid">
        {projects.map((p, i) => {
          if (!visibleIds.has(p.id)) return null;
          const pos = visible.findIndex((v) => v.id === p.id);
          return (
            <li key={p.id} className={`pg__item pg__item--${pos % 5}`} data-flip-id={`p-${p.id}`}>
              <TLink href={`/project/${p.slug}`} label={p.title} className="pc">
                <span className="pc__media">
                  <ProjectVisual project={p} />
                  <span className="pc__reveal" aria-hidden="true">
                    <span>{p.summary}</span>
                    <span className="pc__go">Buka project →</span>
                  </span>
                </span>
                <span className="pc__row">
                  <span className="pc__n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pc__title">{p.title}</span>
                  <b className={`st st--${p.status}`}>{statusLabel(p.status)}</b>
                </span>
                <span className="pc__cats">{p.categories.map(categoryLabel).join(" / ")}</span>
                <span className="pc__sum">{p.summary}</span>
              </TLink>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && (
        <div className="pg__empty">
          <p>Tidak ada project yang cocok dengan pencarian ini.</p>
          <button type="button" className="btn btn--line" onClick={() => { capture(); setQuery(""); setFilter("all"); }}>Reset filter</button>
        </div>
      )}
    </section>
  );
}
