import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../lib/theme";
import { easeIO, expoInOut, mix, prog } from "../lib/anim";
import { FadeUp, Label, Mark, RiseWords } from "../lib/ui";
import { HERO } from "../lib/data";

/**
 * Intro + hero, mengikuti koreografi GSAP situs:
 * tirai biru → garis → huruf → judul → antarmuka → kabel → denyut,
 * lalu jendela website membesar menjadi panggung project (handoff gelap).
 */
const WORD = "FELIXIORITY".split("");
const WIRES = ["M60 22.4 H78 V43", "M52 58.5 H32 V67.1", "M16 39.6 V67.1"];
const U = 6.6; // px per satuan diagram (100 x 86)
const SYS_W = 100 * U;
const SYS_H = 86 * U;

// posisi node dalam satuan diagram
const NODES = {
  web: { x: 0, y: 0, w: 60, h: 39.6 },
  api: { x: 52, y: 43, w: 48, h: 26 },
  srv: { x: 0, y: 67.1, w: 46, h: 18.9 },
};

export const HERO_DURATION = 330;
const T = 40; // tirai selesai, intro dimulai
const HANDOFF = 225;

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const at = (s: number, d = 24, e = undefined as undefined | ((n: number) => number)) => prog(frame, T + s, d, e);

  // --- handoff progress
  const h = prog(frame, HANDOFF, 70, easeIO);
  const hOut = prog(frame, HANDOFF, 30);
  const wordOut = (i: number) => prog(frame, HANDOFF + Math.abs(i - 5) * 1.5, 24);

  // --- tirai pembuka
  const curtainLabel = prog(frame, 0, 18);
  const curtainUp = prog(frame, 22, 26, expoInOut);

  // geometry: web node → cover layar
  const sysLeft = width - 80 - SYS_W;
  const sysTop = 205;
  const web = NODES.web;
  const webCx = sysLeft + (web.x + web.w / 2) * U;
  const webCy = sysTop + (web.y + web.h / 2) * U;
  const coverScale = Math.max(width / (web.w * U), height / (web.h * U)) * 1.04;
  const zoom = prog(frame, HANDOFF + 15, 50, easeIO);
  const darken = prog(frame, HANDOFF + 30, 25);

  const pulseCycle = (i: number) => {
    const local = (frame - (T + 75) - i * 16) % 130;
    return local >= 0 && local < 34 ? local / 34 : -1;
  };

  const meters: [string, number][] = [["CPU", 0.42], ["RAM", 0.64], ["DISK", 0.3]];
  const ledOn = (i: number) => {
    const local = (frame - (T + 120) - i * 3) % 130;
    return local >= 0 && local < 18;
  };

  return (
    <AbsoluteFill style={{ background: C.bone, color: C.ink, fontFamily: F.sans, overflow: "hidden" }}>
      {/* garis grid vertikal */}
      {[0, 1, 2, 3, 4].map((i) => (
        <i
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 80 + i * ((width - 160) / 4),
            width: 1,
            background: C.line,
            transformOrigin: "top",
            transform: `scaleY(${at(i * 2, 40, expoInOut)})`,
            opacity: 1 - hOut,
          }}
        />
      ))}

      {/* nav */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 92, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 80px", borderBottom: `1px solid ${C.line}`, opacity: at(4, 20) * (1 - hOut) }}>
        <span style={{ display: "flex", alignItems: "center", gap: 18, fontWeight: 700, fontSize: 28, letterSpacing: "-0.02em" }}>
          <Mark size={11} shift={at(30, 20)} /> FELIXIORITY
        </span>
        <span style={{ display: "flex", gap: 52, fontSize: 24, fontWeight: 520 }}>
          {["Project", "Tentang", "Layanan", "Kontak"].map((l, i) => (
            <span key={l} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <small style={{ fontFamily: F.mono, fontSize: 15, color: C.muted }}>0{i + 1}</small>
              {l}
            </span>
          ))}
        </span>
      </div>

      {/* meta */}
      <div style={{ position: "absolute", top: 122, left: 80, right: 80, display: "flex", justifyContent: "space-between", opacity: 1 - hOut }}>
        {["(00) Portofolio", "Website / API / Infrastruktur", "Pterodactyl · AI · Bot"].map((m, i) => (
          <FadeUp key={m} start={T + 8 + i * 2} dur={18} y={8}>
            <Label>{m}</Label>
          </FadeUp>
        ))}
      </div>

      {/* copy */}
      <div style={{ position: "absolute", left: 80, top: 210, width: 960, transform: `translateY(${mix(hOut, 0, -80)}px)`, opacity: 1 - hOut }}>
        <FadeUp start={T + 22} style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: F.mono, fontSize: 22, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <i style={{ width: 12, height: 12, background: C.blue }} />
          {HERO.eyebrow}
        </FadeUp>
        <h1 style={{ margin: "28px 0 0", fontSize: 80, lineHeight: 1.02, fontWeight: 650, letterSpacing: "-0.035em" }}>
          <RiseWords text={HERO.headline} start={T + 13} stagger={1.1} dur={30} serifWords={[5, 6]} />
        </h1>
        <FadeUp start={T + 26} style={{ marginTop: 30, fontSize: 27, lineHeight: 1.45, color: C.ink2, maxWidth: 820 }}>
          {HERO.sub}
        </FadeUp>
        <FadeUp start={T + 30} style={{ marginTop: 36, display: "flex", gap: 18 }}>
          <Btn solid fill={prog(frame, T + 95, 22)} label="Jelajahi Project" arrow="↓" />
          <Btn label="Hubungi Saya" arrow="→" />
        </FadeUp>
      </div>

      {/* diagram sistem */}
      <div style={{ position: "absolute", left: sysLeft, top: sysTop, width: SYS_W, height: SYS_H }}>
        <svg viewBox="0 0 100 86" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", opacity: 1 - hOut }}>
          {WIRES.map((d, i) => (
            <path key={d} d={d} pathLength={100} fill="none" stroke={C.ink} strokeWidth={0.25} strokeDasharray="100" strokeDashoffset={mix(at(34 + i * 5, 34, easeIO), 100, 0)} />
          ))}
          {WIRES.map((d, i) => {
            const p = pulseCycle(i);
            return p < 0 ? null : (
              <path key={"p" + d} d={d} pathLength={100} fill="none" stroke={C.blue} strokeWidth={0.9} strokeDasharray="10 200" strokeDashoffset={mix(easeIO(p), 10, -92)} />
            );
          })}
        </svg>
        {[["HTTPS", 66, 18.5], ["REST", 34, 68.5], ["WINGS", 17.5, 56]].map(([t, x, y], i) => (
          <span key={t as string} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, fontFamily: F.mono, fontSize: 15, background: C.bone, padding: "2px 8px", color: C.muted, opacity: at(51 + i * 3, 12) * (1 - hOut) }}>
            {t}
          </span>
        ))}

        {/* web */}
        <Node n={NODES.web} reveal={at(16, 30, expoInOut)} tagIn={at(36, 16)} tag="01 / Website" 
          style={{
            transformOrigin: "center",
            transform: `translate(${mix(zoom, 0, width / 2 - webCx)}px, ${mix(zoom, 0, height / 2 - webCy)}px) scale(${mix(zoom, 1, coverScale)})`,
            zIndex: 3,
          }}
          fill={interpolateColors(darken, [0, 1], [C.bone, C.dark])}
          borderColor={interpolateColors(darken, [0, 1], [C.ink, C.dark])}
          tagOut={hOut}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 14px", borderBottom: `1px solid ${C.line}`, opacity: 1 - hOut }}>
            {[0, 1, 2].map((i) => <i key={i} style={{ width: 10, height: 10, border: `1.5px solid ${C.ink}` }} />)}
            <span style={{ marginLeft: 12, fontFamily: F.mono, fontSize: 15, color: C.muted }}>felixiority</span>
          </div>
          <div style={{ padding: 22, display: "grid", gap: 14, opacity: 1 - hOut }}>
            {[
              <div key="nav" style={{ display: "flex", gap: 10 }}>{[0, 1, 2, 3].map((i) => <i key={i} style={{ width: 40, height: 6, background: C.bone3 }} />)}</div>,
              <div key="head" style={{ height: 34, width: "78%", background: C.ink }} />,
              <div key="l1" style={{ height: 8, width: "92%", background: C.bone3 }} />,
              <div key="l2" style={{ height: 8, width: "60%", background: C.bone3 }} />,
              <div key="grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 4 }}>
                {[0, 1, 2].map((i) => <b key={i} style={{ height: 66, background: i === 1 ? C.blue : C.bone2 }} />)}
              </div>,
            ].map((el, i) => {
              const q = at(26 + i * 2, 18);
              return <div key={i} style={{ opacity: q, transform: `translateY(${mix(q, 10, 0)}px)` }}>{el}</div>;
            })}
          </div>
        </Node>

        {/* api */}
        <Node n={NODES.api} reveal={at(20, 30, expoInOut)} tagIn={at(40, 16)} tag="02 / Rest API" dark
          style={{ transform: `translateX(${mix(h, 0, 40)}%)`, opacity: 1 - hOut }} tagOut={hOut}>
          <div style={{ padding: "22px 22px", fontFamily: F.mono, fontSize: 17, lineHeight: 1.9, color: C.bone }}>
            <p style={{ margin: 0 }}><em style={{ color: C.blue, fontStyle: "normal" }}>$</em> curl /api/ai/chat?q=halo</p>
            <p style={{ margin: 0, color: "#8b9bff", opacity: at(48, 10) }}>200 OK · application/json</p>
            <p style={{ margin: 0, color: C.boneDim, opacity: at(54, 10) }}>{`{ "status": true, "result": "…" }`}</p>
          </div>
        </Node>

        {/* server */}
        <Node n={NODES.srv} reveal={at(24, 30, expoInOut)} tagIn={at(44, 16)} tag="03 / Infrastruktur"
          style={{ transform: `translateY(${mix(h, 0, 60)}%)`, opacity: 1 - hOut }} tagOut={hOut}>
          <div style={{ padding: "12px 18px", fontFamily: F.mono, fontSize: 15 }}>
            <p style={{ margin: "0 0 6px", display: "flex", justifyContent: "space-between" }}>
              <span>node-01</span>
              <span style={{ display: "flex", gap: 6 }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: 9, height: 9, background: ledOn(i) ? C.blue : C.ink }} />)}</span>
            </p>
            {meters.map(([k, v], i) => (
              <p key={k} style={{ margin: "5px 0", display: "grid", gridTemplateColumns: "56px 1fr", alignItems: "center" }}>
                <span>{k}</span>
                <span style={{ height: 8, background: C.bone3 }}>
                  <i style={{ display: "block", height: "100%", width: `${v * 100}%`, background: C.ink, transformOrigin: "left", transform: `scaleX(${at(48 + i * 3, 36)})` }} />
                </span>
              </p>
            ))}
          </div>
        </Node>
      </div>

      {/* kata raksasa */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: -52, textAlign: "center", fontSize: 306, fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 1, whiteSpace: "nowrap" }}>
        {WORD.map((c, i) => (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
            <span style={{ display: "inline-block", transform: `translateY(${mix(at(6 + i * 1.4, 34), 108, 0) + mix(wordOut(i), 0, 110)}%)`, color: i === 6 ? C.blue : C.ink }}>{c}</span>
          </span>
        ))}
      </div>

      {/* handoff ke project */}
      <div style={{ position: "absolute", left: 80, bottom: 120, color: C.bone, zIndex: 5 }}>
        <FadeUp start={HANDOFF + 56} dur={26} y={30}>
          <Label light>(01) Project pilihan</Label>
          <div style={{ marginTop: 22, fontSize: 104, fontWeight: 650, letterSpacing: "-0.04em", lineHeight: 1 }}>
            Yang sedang dibangun <span style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 400, letterSpacing: 0 }}>dan dijalankan.</span>
          </div>
        </FadeUp>
      </div>

      {/* tirai pembuka */}
      <AbsoluteFill style={{ background: C.blue, color: C.bone, display: "grid", placeItems: "center", clipPath: `inset(0 0 ${curtainUp * 100}% 0)` }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontSize: 150, fontWeight: 750, letterSpacing: "-0.04em", lineHeight: 1, transform: `translateY(${mix(curtainLabel, 110, 0) + mix(curtainUp, 0, -110)}%)` }}>FELIXIORITY</div>
        </div>
        <div style={{ position: "absolute", bottom: 60, left: 80, right: 80, display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: 20, opacity: curtainLabel * (1 - curtainUp) }}>
          <span>Portofolio</span>
          <span>2026</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Node: React.FC<{
  n: { x: number; y: number; w: number; h: number };
  reveal: number;
  tagIn: number;
  tagOut?: number;
  tag: string;
  dark?: boolean;
  fill?: string;
  borderColor?: string;
  hOut?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ n, reveal, tagIn, tagOut = 0, tag, dark, fill, borderColor, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: n.x * U,
      top: n.y * U,
      width: n.w * U,
      height: n.h * U,
      ...style,
    }}
  >
    <span style={{ position: "absolute", left: 0, top: -30, fontFamily: F.mono, fontSize: 15, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", opacity: tagIn * (1 - tagOut), transform: `translateX(${mix(tagIn, -10, 0)}px)` }}>
      {tag}
    </span>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: fill ?? (dark ? C.dark : C.bone),
        border: `1px solid ${borderColor ?? C.ink}`,
        overflow: "hidden",
        clipPath: reveal >= 1 ? undefined : `inset(0 0 ${(1 - reveal) * 100}% 0)`,
      }}
    >
      {children}
    </div>
  </div>
);

const Btn: React.FC<{ label: string; arrow: string; solid?: boolean; fill?: number }> = ({ label, arrow, solid, fill = 0 }) => (
  <span
    style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      gap: 18,
      height: 72,
      padding: "0 30px",
      border: `1.5px solid ${solid && fill > 0.5 ? C.blue : C.ink}`,
      background: solid ? C.ink : "transparent",
      color: solid ? C.bone : C.ink,
      fontSize: 23,
      fontWeight: 560,
      overflow: "hidden",
    }}
  >
    {solid && <i style={{ position: "absolute", inset: 0, background: C.blue, transformOrigin: "bottom", transform: `scaleY(${fill})` }} />}
    <span style={{ position: "relative" }}>{label}</span>
    <span style={{ position: "relative", fontFamily: F.mono, transform: `translateY(${fill * 4}px)` }}>{arrow}</span>
  </span>
);
