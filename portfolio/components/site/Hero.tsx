"use client";
import { Fragment, useRef } from "react";
import { TLink } from "./Transition";
import { gsap, useGSAP, motionState, markReady } from "./motion";

const WORD = "FELIXIORITY".split("");
// koordinat dalam satuan kotak diagram (lebar 100, tinggi 86)
const WIRES = ["M60 22.4 H78 V43", "M52 58.5 H32 V67.1", "M16 39.6 V67.1"];

export function Hero({ eyebrow, headline, sub }: { eyebrow: string; headline: string; sub: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const { level, touch } = motionState();
      const q = gsap.utils.selector(root);
      if (level === "minimal") { markReady(); return; }

      // ---------- Intro: garis → huruf → judul → antarmuka → kabel ----------
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .fromTo(q(".hero__grid i"), { scaleY: 0 }, { scaleY: 1, duration: 1.3, stagger: 0.07, ease: "expo.inOut" }, 0)
        .fromTo(q(".hero__meta > *"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05 }, 0.25)
        .fromTo(q(".hero__word .ch > span"), { yPercent: 108 }, { yPercent: 0, duration: 1.15, stagger: 0.045 }, 0.2)
        .fromTo(q(".hero__title .w > span"), { yPercent: 112 }, { yPercent: 0, duration: 1, stagger: 0.035 }, 0.45)
        .fromTo(q(".hero__eyebrow, .hero__sub, .hero__cta"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.75)
        .fromTo(q(".node"), { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, stagger: 0.14, ease: "power4.inOut" }, 0.55)
        // lepas clip-path setelah terbuka supaya label node (di luar kotak) ikut terlihat
        .set(q(".node"), { clearProps: "clipPath" }, 1.9)
        .fromTo(q(".node__tag"), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.12 }, 1.2)
        .fromTo(q(".wire"), { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.1, stagger: 0.18, ease: "power2.inOut" }, 1.15)
        .fromTo(q(".wire-label"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.1 }, 1.7)
        .fromTo(q(".meter > i"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, stagger: 0.1, ease: "power3.out" }, 1.4)
        .fromTo(q(".node--web .blk"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06 }, 1.1);
      markReady();

      // ---------- Denyut data: berjalan di kabel, lalu jeda supaya mata bisa istirahat ----------
      const pulse = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 2.6, paused: false });
      q(".pulse").forEach((p, i) => {
        pulse.fromTo(p, { strokeDashoffset: 10, autoAlpha: 1 }, { strokeDashoffset: -92, duration: 1.1, ease: "power1.inOut" }, i * 0.55);
        pulse.set(p, { autoAlpha: 0 });
      });
      pulse.fromTo(q(".node--srv .led"), { backgroundColor: "#1F3DFF" }, { backgroundColor: "currentColor", duration: 0.6, stagger: 0.08 }, 1.6);

      const mm = gsap.matchMedia();

      // ---------- Desktop penuh: hero dipin lalu jendela web membesar menjadi panggung project ----------
      if (level === "full" && !touch) {
        mm.add("(min-width: 900px)", () => {
          const web = q(".node--web")[0] as HTMLElement;
          const pinEl = q(".hero__pin")[0] as HTMLElement;
          const toCover = () => {
            const r = web.getBoundingClientRect();
            const p = pinEl.getBoundingClientRect();
            const s = Math.max(p.width / r.width, p.height / r.height) * 1.04;
            return {
              x: p.left + p.width / 2 - (r.left + r.width / 2),
              y: p.top + p.height / 2 - (r.top + r.height / 2),
              scale: s,
            };
          };
          let cover = { x: 0, y: 0, scale: 1 };
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=130%",
              pin: pinEl,
              scrub: 0.7,
              invalidateOnRefresh: true,
              onRefreshInit: () => { gsap.set(web, { clearProps: "transform" }); cover = toCover(); },
              onToggle: (self) => (self.isActive || self.progress === 0 ? pulse.play() : pulse.pause()),
              onUpdate: (self) => web.toggleAttribute("data-nav-dark", self.progress > 0.55),
            },
          });
          cover = toCover();
          tl.to(q(".hero__word .ch > span"), { yPercent: 110, stagger: { each: 0.025, from: "center" }, duration: 0.35 }, 0)
            .to(q(".hero__copy"), { y: -80, autoAlpha: 0, duration: 0.3 }, 0)
            .to(q(".hero__meta, .hero__grid"), { autoAlpha: 0, duration: 0.25 }, 0.05)
            .to(q(".node--api"), { xPercent: 40, autoAlpha: 0, duration: 0.35 }, 0.05)
            .to(q(".node--srv"), { yPercent: 60, autoAlpha: 0, duration: 0.35 }, 0.08)
            .to(q(".hero__wires, .node__tag, .wire-label"), { autoAlpha: 0, duration: 0.2 }, 0.05)
            .to(q(".node--web .node__body > *"), { autoAlpha: 0, duration: 0.2 }, 0.3)
            .to(web, { x: () => cover.x, y: () => cover.y, scale: () => cover.scale, duration: 0.6, ease: "power2.inOut" }, 0.3)
            .to(web, { backgroundColor: "#111111", borderColor: "rgba(242,238,230,0)", duration: 0.35 }, 0.45)
            .fromTo(q(".hero__handoff"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.75);
        });
      }

      // ---------- Ringan / sentuh: parallax sederhana tanpa pin ----------
      mm.add("(max-width: 899px), (pointer: coarse)", () => {
        if (level === "full" && !touch && window.innerWidth >= 900) return;
        gsap.to(q(".hero__word"), {
          yPercent: 30, ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
      if (level === "light" && !touch) {
        mm.add("(min-width: 900px)", () => {
          gsap.to(q(".hero__word"), { yPercent: 35, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
          gsap.to(q(".hero__system"), { yPercent: -12, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
        });
      }
    },
    { scope: root }
  );

  const words = headline.split(/\s+/).filter(Boolean);

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div className="hero__pin">
        <div className="hero__grid" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="hero__meta" aria-hidden="true">
          <span>(00) Portofolio</span>
          <span>Website / API / Infrastruktur</span>
          <span className="hero__meta-end">Pterodactyl · AI · Bot</span>
        </div>

        <div className="hero__body">
          <div className="hero__copy">
            <p className="hero__eyebrow" data-hide><span className="sq" aria-hidden="true" />{eyebrow}</p>
            <h1 id="hero-title" className="hero__title">
              {words.map((w, i) => (
                <Fragment key={i}><span className="w"><span data-hide>{w}</span></span>{i < words.length - 1 ? " " : ""}</Fragment>
              ))}
            </h1>
            <p className="hero__sub" data-hide>{sub}</p>
            <div className="hero__cta" data-hide>
              <TLink href="/#project" className="btn btn--solid" label="Project">
                <span>Jelajahi Project</span><span className="btn__arrow" aria-hidden="true">↓</span>
              </TLink>
              <TLink href="/#kontak" className="btn btn--line" label="Kontak">
                <span>Hubungi Saya</span><span className="btn__arrow" aria-hidden="true">→</span>
              </TLink>
            </div>
          </div>

          <div className="hero__system" aria-hidden="true">
            {/* viewBox mengikuti rasio kotak (1 : 0.86) agar garis tidak terdistorsi */}
            <svg className="hero__wires" viewBox="0 0 100 86">
              {WIRES.map((d) => <path key={d} className="wire" pathLength={100} d={d} />)}
              {WIRES.map((d) => <path key={"p" + d} className="pulse" pathLength={100} d={d} />)}
            </svg>
            <span className="wire-label" style={{ left: "66%", top: "20.5%" }}>HTTPS</span>
            <span className="wire-label" style={{ left: "34%", top: "70.5%" }}>REST</span>
            <span className="wire-label" style={{ left: "17.5%", top: "58%" }}>WINGS</span>

            <div className="node node--web" data-hide>
              <span className="node__tag">01 / Website</span>
              <div className="node__bar"><i /><i /><i /><span>felixiority</span></div>
              <div className="node__body">
                <div className="blk blk--nav"><i /><i /><i /><i /></div>
                <div className="blk blk--head" />
                <div className="blk blk--line" />
                <div className="blk blk--line short" />
                <div className="blk blk--grid"><b /><b className="on" /><b /></div>
              </div>
            </div>

            <div className="node node--api" data-hide>
              <span className="node__tag">02 / Rest API</span>
              <div className="node__body">
                <p><em>$</em> curl /api/ai/chat?q=halo</p>
                <p className="ok">200 OK · application/json</p>
                <p className="dim">{`{ "status": true, "result": "…" }`}</p>
              </div>
            </div>

            <div className="node node--srv" data-hide>
              <span className="node__tag">03 / Infrastruktur</span>
              <div className="node__body">
                <p className="srv-head"><span>node-01</span><span className="leds"><i className="led" /><i className="led" /><i className="led" /></span></p>
                {[["CPU", 0.42], ["RAM", 0.64], ["DISK", 0.3]].map(([k, v]) => (
                  <p className="srv-row" key={k as string}>
                    <span>{k}</span>
                    <span className="meter"><i style={{ width: `${(v as number) * 100}%` }} /></span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="hero__word" aria-hidden="true">
          {WORD.map((c, i) => (
            <span className="ch" key={i}><span data-hide>{c}</span></span>
          ))}
        </p>

        <div className="hero__handoff" aria-hidden="true">
          <span>(01) Project pilihan</span>
          <b>Yang sedang dibangun dan dijalankan.</b>
        </div>
      </div>
    </section>
  );
}
