import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { C, F } from "../lib/theme";
import { easeIO, expoInOut, mix, prog } from "../lib/anim";
import { Label, RiseWords, StatusTag } from "../lib/ui";
import { PROJECTS, type Project } from "../lib/data";
import { ProjectArt, ART_SIZE } from "../lib/ProjectArt";

/** Showcase gelap: satu project per "slide", ilustrasi antarmuka terbuka dengan masker. */
export const PER_PROJECT = 78;
export const PROJECTS_DURATION = PER_PROJECT * PROJECTS.length;

export const Projects: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.min(PROJECTS.length - 1, Math.floor(frame / PER_PROJECT));
  const local = frame - idx * PER_PROJECT;
  const bar = (i: number) => (i < idx ? 1 : i > idx ? 0 : prog(local, 0, PER_PROJECT, (t) => t));

  return (
    <AbsoluteFill style={{ background: C.dark, color: C.bone, fontFamily: F.sans, overflow: "hidden" }}>
      {/* garis grid gelap */}
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} style={{ position: "absolute", top: 0, bottom: 0, left: 80 + i * 440, width: 1, background: C.lineDark, opacity: prog(frame, 0, 20) }} />
      ))}

      {/* header */}
      <div style={{ position: "absolute", top: 60, left: 80, right: 80, display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: prog(frame, 0, 18) }}>
        <Label light>(01) Project pilihan</Label>
        <span style={{ fontFamily: F.mono, fontSize: 22, color: C.bone }}>
          <Counter n={idx + 1} local={local} /> <span style={{ color: C.boneDim }}>/ {String(PROJECTS.length).padStart(2, "0")}</span>
        </span>
      </div>

      {PROJECTS.map((p, i) => (
        <Sequence key={p.title} name={p.title} from={i * PER_PROJECT} durationInFrames={PER_PROJECT} layout="none">
          <Slide p={p} i={i} last={i === PROJECTS.length - 1} />
        </Sequence>
      ))}

      {/* progres per project */}
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 60, display: "grid", gridTemplateColumns: `repeat(${PROJECTS.length}, 1fr)`, gap: 12 }}>
        {PROJECTS.map((p, i) => (
          <div key={p.title} style={{ display: "grid", gap: 12 }}>
            <span style={{ fontFamily: F.mono, fontSize: 15, color: i === idx ? C.bone : C.boneDim, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</span>
            <span style={{ display: "block", height: 3, background: C.lineDark }}>
              <i style={{ display: "block", height: "100%", background: C.blue, transformOrigin: "left", transform: `scaleX(${bar(i)})` }} />
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Counter: React.FC<{ n: number; local: number }> = ({ n, local }) => {
  const p = prog(local, 0, 18);
  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", height: "1.2em" }}>
      <span style={{ display: "inline-block", transform: `translateY(${mix(p, 100, 0)}%)` }}>{String(n).padStart(2, "0")}</span>
    </span>
  );
};

const Slide: React.FC<{ p: Project; i: number; last: boolean }> = ({ p, i, last }) => {
  const f = useCurrentFrame();
  const out = last ? 0 : prog(f, PER_PROJECT - 16, 16, easeIO);
  const reveal = prog(f, 2, 30, expoInOut);
  const artExit = prog(f, PER_PROJECT - 16, 16, expoInOut);

  return (
    <AbsoluteFill>
      {/* nomor besar outline di latar */}
      <div style={{ position: "absolute", right: 60, top: 70, fontSize: 420, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.06em", color: "transparent", WebkitTextStroke: `2px ${C.lineDark}`, transform: `translateY(${mix(prog(f, 0, 40), 60, 0) + mix(out, 0, -60)}px)`, opacity: 1 - out }}>
        {String(i + 1).padStart(2, "0")}
      </div>

      {/* teks */}
      <div style={{ position: "absolute", left: 80, top: 230, width: 820, opacity: 1 - out, transform: `translateY(${mix(out, 0, -40)}px)` }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center", opacity: prog(f, 4, 16) }}>
          <StatusTag s={p.status} light />
          <span style={{ fontFamily: F.mono, fontSize: 20, color: C.boneDim, textTransform: "uppercase", letterSpacing: "0.04em" }}>{p.cats.join(" · ")}</span>
        </div>
        <h2 style={{ margin: "30px 0 0", fontSize: p.title.length > 16 ? 92 : 116, lineHeight: 0.98, fontWeight: 700, letterSpacing: "-0.045em" }}>
          <RiseWords text={p.title} start={2} stagger={2.5} dur={28} />
        </h2>
        <p style={{ margin: "34px 0 0", fontSize: 32, lineHeight: 1.4, color: "rgba(242,238,230,0.78)", opacity: prog(f, 12, 20), transform: `translateY(${mix(prog(f, 12, 20), 16, 0)}px)` }}>{p.summary}</p>
        <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {p.tech.map((t, k) => {
            const q = prog(f, 18 + k * 3, 16);
            return (
              <span key={t} style={{ fontFamily: F.mono, fontSize: 20, padding: "10px 16px", border: `1px solid ${C.lineDark}`, opacity: q, transform: `translateY(${mix(q, 12, 0)}px)` }}>
                {t}
              </span>
            );
          })}
        </div>
      </div>

      {/* ilustrasi */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 250,
          width: ART_SIZE.w,
          height: ART_SIZE.h,
          clipPath: `inset(${artExit * 100}% 0 ${(1 - reveal) * 100}% 0)`,
          transform: `scale(${mix(prog(f, 0, 50), 1.08, 1)})`,
        }}
      >
        <ProjectArt kind={p.kind} title={p.title} start={8} />
      </div>
      <span style={{ position: "absolute", right: 80, top: 250 + ART_SIZE.h + 18, fontFamily: F.mono, fontSize: 16, color: C.boneDim, opacity: prog(f, 20, 16) * (1 - out) }}>
        Ilustrasi antarmuka · {p.title}
      </span>
    </AbsoluteFill>
  );
};
