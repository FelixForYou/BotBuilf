import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Camera } from "../components/Camera";
import { FelixLogo, LOGO_H, LOGO_W } from "../components/Logo";
import { Backdrop, Sparkle } from "../components/Primitives";
import { MaskWords, SplitChars } from "../components/Type";
import { E, SPRING, keys, prog, rand, sp, tw } from "../lib/anim";
import { C, F } from "../theme";

const CX = 960;
const CY = 540;

/** Kurva-kurva elegan yang tumbuh dari titik pusat. */
const CURVES = [
  "M960,540 C1100,380 1380,360 1520,520 S1700,860 1420,900",
  "M960,540 C820,700 540,720 400,560 S220,220 500,180",
  "M960,540 C1080,640 1180,820 1060,960",
  "M960,540 C840,440 740,260 860,120",
  "M960,540 C1200,520 1500,640 1700,420",
  "M960,540 C720,560 420,440 220,660",
];

const LOGO_SIZE = 500;

export const S01BrandAwakening: React.FC = () => {
  const f = useCurrentFrame();

  // ---------------------------------------------------------------- kamera
  const camS = keys(f, [
    [0, 1.35],
    [120, 1.06, E.inOut],
    [300, 1.0, E.inOut],
    [345, 1.0],
    [420, 3.4, E.in],
  ]);
  const camRz = keys(f, [
    [0, -3],
    [140, 0, E.inOut],
  ]);

  // -------------------------------------------------------------- titik & garis
  const dotIn = sp(f, -4, SPRING.pop);
  const dotPulse = Math.sin(Math.max(0, f - 20) / 7) * 0.08 * (1 - prog(f, 20, 60));
  const draw = (i: number) => prog(f, 34 + i * 5, 96 + i * 5, E.inOut);
  const erase = (i: number) => prog(f, 92 + i * 4, 140 + i * 4, E.inOut);
  const ring = prog(f, 100, 150, E.inOut);
  const disk = sp(f, 118, SPRING.heavy);
  const dotR = 9 * dotIn * (1 + dotPulse);

  // ------------------------------------------------------------------ logo
  const rise = (ff: number) => sp(ff, 140, SPRING.pop);
  const r = rise(f);
  const vel = (rise(f) - rise(f - 1)) * 60;
  const stretch = Math.max(-0.12, Math.min(0.16, vel * 0.03));
  const charY = (1 - r) * 340;
  const wordIn = sp(f, 168, SPRING.pop);
  // geser ke kiri untuk memberi ruang tipografi, lalu kembali ke tengah untuk push-in
  const slide = keys(f, [
    [215, 0],
    [262, 1, E.inOut],
    [338, 1],
    [380, 0, E.inOut],
  ]);
  const logoX = -440 * slide;
  const logoScale = 1 - 0.12 * slide;
  const float = Math.sin(f / 38) * 6;
  const parallaxChar = slide * -10 + Math.sin(f / 50) * 4;

  // ------------------------------------------------------------ tipografi
  const typeOut = 330;
  const typeOpacity = 1 - prog(f, typeOut + 10, typeOut + 30);

  return (
    <AbsoluteFill>
      <Backdrop dots={0.55 * prog(f, 0, 60)} offsetX={-f * 0.15} offsetY={-f * 0.1} />
      <Camera s={camS} rz={camRz} oy={CY}>
        {/* ring orbit & disk identitas */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <g transform={`translate(${logoX * 0.85} 0)`}>
            <circle cx={CX} cy={CY} r={300 * disk * logoScale} fill={C.softGray} />
            <circle
              cx={CX}
              cy={CY}
              r={330 * logoScale}
              fill="none"
              stroke={C.terracotta}
              strokeWidth={2}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - ring}
              transform={`rotate(${-90 + f * 0.25} ${CX} ${CY})`}
            />
            <circle
              cx={CX}
              cy={CY}
              r={372 * logoScale}
              fill="none"
              stroke={C.charcoal}
              strokeOpacity={0.18}
              strokeWidth={1.2}
              strokeDasharray="2 10"
              opacity={prog(f, 130, 170)}
              transform={`rotate(${-f * 0.18} ${CX} ${CY})`}
            />
            {/* satelit kecil yang mengorbit */}
            {[0, 1, 2].map((i) => {
              const a = (f * 0.9 + i * 120) * (Math.PI / 180);
              const rr = 330 * logoScale;
              return (
                <circle
                  key={i}
                  cx={CX + Math.cos(a) * rr}
                  cy={CY + Math.sin(a) * rr}
                  r={i === 0 ? 7 : 4}
                  fill={i === 1 ? C.felix : C.terracotta}
                  opacity={prog(f, 150 + i * 6, 170 + i * 6)}
                />
              );
            })}
          </g>
          {CURVES.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={i % 3 === 2 ? C.charcoal : C.terracotta}
              strokeOpacity={i % 3 === 2 ? 0.5 : 1}
              strokeWidth={i < 2 ? 2.4 : 1.6}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${Math.max(0.0001, draw(i) - erase(i))} 2`}
              strokeDashoffset={-erase(i)}
            />
          ))}
          {/* titik terracotta awal */}
          <circle cx={CX} cy={CY} r={dotR * (1 - prog(f, 118, 140))} fill={C.terracotta} />
        </svg>

        {/* LOGO: karakter muncul dengan depth + squash/stretch */}
        <div
          style={{
            position: "absolute",
            left: CX - LOGO_SIZE / 2,
            top: CY - (LOGO_SIZE * LOGO_H) / LOGO_W / 2 - 10,
            transform: `translate(${logoX}px, ${float * prog(f, 200, 240)}px) scale(${logoScale})`,
          }}
        >
          <CameraMotionBlur shutterAngle={200} samples={f > 136 && f < 200 ? 8 : 1}>
            <FelixLogo
              width={LOGO_SIZE}
              character={{
                y: charY + parallaxChar,
                s: 0.55 + 0.45 * r,
                sx: 1 - stretch * 0.6,
                sy: 1 + stretch,
                o: prog(f, 138, 150),
              }}
              wordmark={{ y: (1 - wordIn) * 240, s: 0.7 + 0.3 * wordIn, o: prog(f, 168, 178) }}
              sheen={tw(f, 230, 290, -0.4, 1.4, E.inOut)}
              shadow={0.55 * prog(f, 150, 190)}
            />
          </CameraMotionBlur>
        </div>

        {/* kilauan kecil di sekitar logo */}
        {[
          [-230, -210, 46, 186],
          [240, -170, 34, 192],
          [270, 40, 28, 198],
          [-270, 120, 24, 204],
          [190, 250, 20, 210],
        ].map(([dx, dy, size, d], i) => {
          const s = sp(f, d, SPRING.bouncy);
          const out = prog(f, 320 + i * 3, 345 + i * 3, E.in);
          return (
            <Sparkle
              key={i}
              size={size}
              style={{
                position: "absolute",
                left: CX + dx * logoScale + logoX - size / 2,
                top: CY + dy * logoScale - size / 2 + float * 0.6,
                transform: `scale(${s * (1 - out) * (0.85 + 0.15 * Math.sin(f / 9 + i))}) rotate(${(1 - s) * 90 + f * 0.4}deg)`,
              }}
            />
          );
        })}

        {/* tipografi kinetik di kanan */}
        <div
          style={{
            position: "absolute",
            left: 900,
            top: 300,
            width: 920,
            opacity: typeOpacity,
            transform: `translateX(${(1 - prog(f, 228, 280)) * 40 - prog(f, typeOut, typeOut + 40, E.in) * 60}px)`,
          }}
        >
          <div style={{ fontFamily: F.mono, fontSize: 19, letterSpacing: "0.18em", color: C.terracotta, marginBottom: 26 }}>
            <SplitChars text="01 — BRAND IDENTITY" f={f} delay={236} stagger={0.8} />
          </div>
          <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 132, letterSpacing: "-0.055em", color: C.charcoal, lineHeight: 0.95 }}>
            <SplitChars text="FELIXIORITY" f={f} delay={240} stagger={2.6} exitAt={typeOut} />
          </div>
          <div style={{ height: 2, background: C.charcoal, opacity: 0.12, margin: "34px 0 30px", transformOrigin: "left", transform: `scaleX(${prog(f, 262, 310, E.inOut)})` }} />
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 54, color: C.charcoal, lineHeight: 1.15 }}>
            <MaskWords text="Built with imagination." f={f} delay={270} exitAt={typeOut + 6} />
            <br />
            <MaskWords
              text="Powered by innovation."
              f={f}
              delay={288}
              exitAt={typeOut + 10}
              wordStyle={(i) => (i === 2 ? { color: C.terracotta } : undefined)}
            />
          </div>
        </div>

        {/* debu cahaya halus yang mengapung (depth) */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = rand(i * 7 + 1) * 1920;
          const y = rand(i * 13 + 2) * 1080;
          const s = 2 + rand(i * 3) * 4;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x + Math.sin((f + i * 40) / 60) * 20,
                top: y - f * (0.15 + rand(i) * 0.3),
                width: s,
                height: s,
                borderRadius: "50%",
                background: i % 4 === 0 ? C.felix : C.terracotta,
                opacity: 0.25 * prog(f, 60 + i * 4, 120 + i * 4),
              }}
            />
          );
        })}
      </Camera>
    </AbsoluteFill>
  );
};
