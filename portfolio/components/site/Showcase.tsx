"use client";
import { Fragment, useRef } from "react";
import type { Project } from "@/lib/types";
import { categoryLabel, statusLabel } from "@/lib/types";
import { ProjectVisual } from "../art/ProjectVisual";
import { TLink } from "./Transition";
import { gsap, useGSAP, motionState, markReady } from "./motion";

const DEPTH = 1100; // jarak antar bidang di sumbu Z (px)

/**
 * Showcase project pilihan.
 * Desktop (motion penuh): section dipin, "kamera" maju menembus bidang-bidang project dalam ruang 2.5D.
 * Ringan: geser horizontal ter-scrub. Mobile/minimal: carousel scroll-snap native tanpa membajak scroll.
 */
export function Showcase({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const n = projects.length;

  useGSAP(
    () => {
      if (!n) return;
      const { level, touch } = motionState();
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      // Reveal judul section (semua mode kecuali minimal)
      if (level !== "minimal") {
        gsap.fromTo(q(".sc__head .w > span"), { yPercent: 110 }, {
          yPercent: 0, stagger: 0.05, duration: 1, ease: "expo.out",
          scrollTrigger: { trigger: q(".sc__head")[0], start: "top 85%", once: true },
        });
      }

      if (level === "full" && !touch) {
        mm.add("(min-width: 900px)", () => {
          root.current!.classList.add("sc--3d");
          const planes = q<HTMLElement>(".sc__plane");
          const infos = q<HTMLElement>(".sc__info");
          const ticks = q<HTMLElement>(".sc__tick");
          const cam = q(".sc__cam")[0] as HTMLElement;
          const layout = planes.map((_, i) => ({ x: (i % 2 === 0 ? 1 : -1) * 9, ry: (i % 2 === 0 ? -1 : 1) * 7, z: -i * DEPTH }));
          planes.forEach((p, i) => gsap.set(p, { xPercent: -50, yPercent: -50, x: `${layout[i].x}vw`, z: layout[i].z, rotationY: layout[i].ry }));
          gsap.set(infos, { autoAlpha: 0 });
          gsap.set(infos[0], { autoAlpha: 1 });
          gsap.set(q(".sc__info .m > span"), { yPercent: 0 });

          let active = 0;
          const showInfo = (next: number) => {
            if (next === active) return;
            const dir = next > active ? 1 : -1;
            const prev = infos[active];
            const cur = infos[next];
            gsap.killTweensOf([prev, cur, ...prev.querySelectorAll(".m > span"), ...cur.querySelectorAll(".m > span")]);
            gsap.to(prev.querySelectorAll(".m > span"), { yPercent: -110 * dir, duration: 0.45, stagger: 0.03, ease: "power3.in" });
            gsap.set(prev, { autoAlpha: 0, delay: 0.45 });
            gsap.set(cur, { autoAlpha: 1 });
            gsap.fromTo(cur.querySelectorAll(".m > span"), { yPercent: 110 * dir }, { yPercent: 0, duration: 0.8, stagger: 0.05, delay: 0.25, ease: "expo.out" });
            ticks.forEach((t, i) => t.classList.toggle("is-on", i === next));
            planes.forEach((p, i) => p.classList.toggle("is-active", i === next));
            active = next;
          };
          planes[0].classList.add("is-active");
          ticks[0]?.classList.add("is-on");

          const render = (progress: number) => {
            const camZ = progress * (n - 1) * DEPTH;
            const f = progress * (n - 1);
            const i0 = Math.min(n - 1, Math.floor(f));
            const i1 = Math.min(n - 1, i0 + 1);
            const t = f - i0;
            const camX = -(layout[i0].x + (layout[i1].x - layout[i0].x) * t);
            gsap.set(cam, { transformOrigin: `50% 50% ${-camZ}px`, z: camZ, x: `${camX}vw`, rotationY: -(layout[i0].ry + (layout[i1].ry - layout[i0].ry) * t) * 0.6 });
            planes.forEach((p, i) => {
              const rel = camZ + layout[i].z; // 0 = tepat di depan kamera; positif = sudah terlewati
              let o = 1;
              if (rel > 120) o = Math.max(0, 1 - (rel - 120) / 420);
              else if (rel < -DEPTH * 1.6) o = 0;
              else if (rel < -DEPTH * 0.5) o = 0.35;
              p.style.opacity = String(o);
              p.style.visibility = o === 0 ? "hidden" : "visible";
              p.style.pointerEvents = Math.abs(rel) < DEPTH * 0.4 ? "auto" : "none";
            });
            gsap.set(q(".sc__bar i")[0], { scaleX: progress });
            showInfo(Math.round(f));
          };
          render(0);

          gsap.timeline({
            scrollTrigger: {
              trigger: q(".sc__stage-wrap")[0],
              start: "top top",
              end: () => `+=${(n - 1) * window.innerHeight * 0.9}`,
              pin: true,
              scrub: 0.8,
              snap: n > 1 ? { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.7 }, delay: 0.12, ease: "power2.inOut" } : undefined,
              onUpdate: (self) => render(self.progress),
              invalidateOnRefresh: true,
            },
          });

          // Tilt halus mengikuti pointer pada bidang aktif
          const stage = q(".sc__stage")[0] as HTMLElement;
          const rx = gsap.quickTo(stage, "rotationX", { duration: 0.8, ease: "power3.out" });
          const ry = gsap.quickTo(stage, "rotationY", { duration: 0.8, ease: "power3.out" });
          const onMove = (e: PointerEvent) => {
            const b = stage.getBoundingClientRect();
            rx(((e.clientY - b.top) / b.height - 0.5) * -4);
            ry(((e.clientX - b.left) / b.width - 0.5) * 5);
          };
          const onLeave = () => { rx(0); ry(0); };
          stage.addEventListener("pointermove", onMove);
          stage.addEventListener("pointerleave", onLeave);
          return () => {
            root.current?.classList.remove("sc--3d");
            stage.removeEventListener("pointermove", onMove);
            stage.removeEventListener("pointerleave", onLeave);
            gsap.set([...planes, cam, stage, ...infos], { clearProps: "all" });
            planes.forEach((p) => { p.style.cssText = ""; p.classList.remove("is-active"); });
          };
        });
      }

      if (level === "light" && !touch) {
        mm.add("(min-width: 900px)", () => {
          root.current!.classList.add("sc--rail");
          const track = q(".sc__rail")[0] as HTMLElement;
          gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth + 64),
            ease: "none",
            scrollTrigger: {
              trigger: q(".sc__stage-wrap")[0], start: "top top", pin: true, scrub: 0.6,
              end: () => `+=${track.scrollWidth - window.innerWidth}`, invalidateOnRefresh: true,
            },
          });
          return () => root.current?.classList.remove("sc--rail");
        });
      }
      markReady();
    },
    { scope: root, dependencies: [n] }
  );

  if (!n) return null;

  return (
    <section ref={root} className="sc" id="project" aria-labelledby="sc-title" data-nav-dark>
      <div className="sc__head">
        <p className="label label--light">(01) Project pilihan</p>
        <h2 id="sc-title" className="sc__title">
          {"Yang sedang dibangun dan dijalankan.".split(" ").map((w, i) => (
            <Fragment key={i}><span className="w"><span>{w}</span></span>{" "}</Fragment>
          ))}
        </h2>
      </div>

      <div className="sc__stage-wrap">
        {/* Panel info (desktop 3D) */}
        <div className="sc__infos">
          {projects.map((p, i) => (
            <article className="sc__info" key={p.id} aria-hidden="true">
              <p className="m sc__idx"><span>{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span></p>
              <h3 className="m sc__name"><span>{p.title}</span></h3>
              <p className="m sc__sum"><span>{p.summary}</span></p>
              <p className="m sc__meta"><span>{p.categories.map(categoryLabel).join(" · ")} · <b className={`st st--${p.status}`}>{statusLabel(p.status)}</b></span></p>
            </article>
          ))}
          <div className="sc__ticks" aria-hidden="true">
            {projects.map((p) => <i className="sc__tick" key={p.id} />)}
          </div>
          <div className="sc__bar" aria-hidden="true"><i /></div>
        </div>

        <div className="sc__stage">
          <div className="sc__cam">
            {projects.map((p, i) => (
              <TLink key={p.id} href={`/project/${p.slug}`} label={p.title} className="sc__plane">
                <ProjectVisual project={p} priority={i === 0} />
                <span className="sc__plane-detail">
                  <span className="sc__plane-top">
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <b className={`st st--${p.status}`}>{statusLabel(p.status)}</b>
                  </span>
                  <span className="sc__plane-title">{p.title}</span>
                  <span className="sc__plane-sum">{p.summary}</span>
                  {p.tech.length > 0 && <span className="sc__plane-tech">{p.tech.join(" / ")}</span>}
                  <span className="sc__plane-cta">Lihat detail <span aria-hidden="true">→</span></span>
                </span>
              </TLink>
            ))}
          </div>
        </div>

        {/* Rail horizontal (mode ringan) dan carousel native (mobile/minimal) memakai markup yang sama */}
        <div className="sc__rail">
          {projects.map((p, i) => (
            <TLink key={p.id} href={`/project/${p.slug}`} label={p.title} className="sc__card">
              <ProjectVisual project={p} />
              <span className="sc__card-row">
                <span className="sc__card-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="sc__card-title">{p.title}</span>
                <b className={`st st--${p.status}`}>{statusLabel(p.status)}</b>
              </span>
              <span className="sc__card-sum">{p.summary}</span>
            </TLink>
          ))}
        </div>
      </div>
    </section>
  );
}
