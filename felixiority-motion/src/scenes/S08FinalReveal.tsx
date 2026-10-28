import React from "react";
import { AbsoluteFill, Freeze, Img, useCurrentFrame } from "remotion";
import { FelixLogo, LOGO_H, LOGO_SRC, LOGO_W } from "../components/Logo";
import { Backdrop, Sparkle } from "../components/Primitives";
import { MaskWords, SplitChars } from "../components/Type";
import { E, SPRING, keys, mix, prog, sp, speedBlur, tw } from "../lib/anim";
import { OVERLAP } from "../timeline";
import { C, F, SHADOW } from "../theme";
import { S01BrandAwakening } from "./S01BrandAwakening";
import { S02Tools } from "./S02Tools";
import { S03FelixPanel } from "./S03FelixPanel";
import { S04Warehouse } from "./S04Warehouse";
import { S05Telegram } from "./S05Telegram";
import { S06Studio } from "./S06Studio";
import { S07SemileAI } from "./S07SemileAI";

const TILE_W = 300;
const TILE_H = (TILE_W * 9) / 16;
const GAP = 24;
const GRID_L = (1920 - (TILE_W * 4 + GAP * 3)) / 2;
const GRID_T = (1080 - (TILE_H * 2 + GAP)) / 2;
export const TILE_SCALE = TILE_W / 1920;
export const tileRect = (i: number) => ({ x: GRID_L + (i % 4) * (TILE_W + GAP), y: GRID_T + Math.floor(i / 4) * (TILE_H + GAP), w: TILE_W, h: TILE_H });
/** Index tile Scene 07 — tujuan "shrink" di akhir Scene 07. */
export const S7_TILE = 6;

/** Snapshot tiap scene (frame lokal sequence) yang menjadi isi tile. */
const SNAPSHOTS: Array<{ frame: number; node: React.ReactNode }> = [
  { frame: 300, node: <S01BrandAwakening /> },
  { frame: 330, node: <S02Tools /> },
  { frame: 330, node: <S03FelixPanel /> },
  { frame: 420, node: <S04Warehouse /> },
  { frame: 330, node: <S05Telegram /> },
  { frame: 380, node: <S06Studio /> },
  { frame: 419, node: <S07SemileAI /> },
];

/** Arah datang tiap tile (melayang dari luar frame). */
const FROM = [
  [-900, -500, -14],
  [-300, -800, 8],
  [400, -800, -6],
  [1000, -500, 12],
  [-1000, 500, 10],
  [-300, 800, -8],
  [0, 0, 0],
  [1000, 600, -12],
];

const LOGO_SIZE = 420;

export const S08FinalReveal: React.FC = () => {
  const f = useCurrentFrame();
  const n = f - OVERLAP;

  // ------------------------------------------------- kamera komposisi
  const camS = (x: number) =>
    keys(x, [
      [0, 1],
      [48, 0.84, E.inOut],
      [96, 7.5, E.in],
    ]);
  const cs = camS(n);
  const camRx = keys(n, [
    [0, 0],
    [48, 14, E.inOut],
    [96, 0, E.in],
  ]);
  const camBlur = speedBlur(camS, n, 4, 18);
  const tilesGone = n > 96;

  // ------------------------------------------------------------ logo
  const pop = sp(n, 84, { damping: 11, stiffness: 120, mass: 0.9 });
  const outro = prog(n, 300, 336, E.inOut);
  const logoScale = mix(0.25 + pop * 0.75, 0.62, outro);
  const logoY = mix(400, 470, outro);
  const disk = sp(n, 80, SPRING.heavy);
  const ringDraw = prog(n, 90, 140, E.inOut);
  const lockup = prog(n, 320, 344, E.out);

  return (
    <AbsoluteFill>
      <Backdrop dots={0.4 * (1 - outro)} />

      {/* ---------------- identitas: disk + ring + logo (di belakang komposisi) */}
      <AbsoluteFill>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <circle cx={960} cy={logoY} r={250 * disk * logoScale} fill={C.softGray} />
          <circle
            cx={960}
            cy={logoY}
            r={290 * logoScale}
            fill="none"
            stroke={C.terracotta}
            strokeWidth={2}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - ringDraw}
            transform={`rotate(${-90 + n * 0.3} 960 ${logoY})`}
          />
          {[0, 1, 2].map((i) => {
            const a = ((n * 0.8 + i * 120) * Math.PI) / 180;
            return <circle key={i} cx={960 + Math.cos(a) * 290 * logoScale} cy={logoY + Math.sin(a) * 290 * logoScale} r={i ? 4 : 7} fill={i === 1 ? C.felix : C.terracotta} opacity={prog(n, 120, 140)} />;
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            left: 960 - LOGO_SIZE / 2,
            top: logoY - ((LOGO_SIZE * LOGO_H) / LOGO_W) / 2,
            transform: `scale(${logoScale}) rotate(${(1 - pop) * -10}deg)`,
            opacity: prog(n, 84, 92),
          }}
        >
          <FelixLogo
            width={LOGO_SIZE}
            character={{ y: (1 - sp(n, 88, SPRING.pop)) * 80 + Math.sin(n / 40) * 4 * (1 - outro) }}
            wordmark={{ y: (1 - sp(n, 100, SPRING.pop)) * 120, s: 0.8 + 0.2 * sp(n, 100, SPRING.pop) }}
            sheen={tw(n, 200, 260, -0.4, 1.4, E.inOut)}
            shadow={0.5}
          />
        </div>
        {/* kilauan dari identitas logo asli */}
        {[
          [-250, -180, 52, 120],
          [250, -200, 36, 128],
          [290, 60, 30, 136],
          [-280, 110, 26, 144],
          [200, 240, 22, 152],
          [-170, 260, 18, 160],
        ].map(([dx, dy, size, d], i) => {
          const s = sp(n, d, SPRING.bouncy);
          const tw2 = 0.8 + 0.2 * Math.sin(n / 8 + i * 1.3);
          return (
            <Sparkle
              key={i}
              size={size}
              style={{
                position: "absolute",
                left: 960 + dx * logoScale - size / 2,
                top: logoY + dy * logoScale - size / 2,
                transform: `scale(${s * tw2 * mix(1, 0.7, outro)}) rotate(${(1 - s) * 120 + n * 0.5}deg)`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* ---------------- tipografi penutup */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 735, display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - prog(n, 300, 318) }}>
        {n < 196 ? (
          <div style={{ display: "flex", gap: "0.3em", alignItems: "baseline", fontSize: 76, lineHeight: 1.1 }}>
            <MaskWords text="Different Ideas." f={n} delay={112} exitAt={180} style={{ fontFamily: F.sans, fontWeight: 600, letterSpacing: "-0.045em", color: C.charcoal }} />
            <MaskWords text="One Vision." f={n} delay={128} exitAt={182} style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 86, color: C.terracotta }} />
          </div>
        ) : (
          <>
            <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 92, letterSpacing: "0.02em", color: C.charcoal, lineHeight: 1 }}>
              <SplitChars text="FELIXIORITY" f={n} delay={198} stagger={2.2} />
            </div>
            <div style={{ marginTop: 18, fontFamily: F.serif, fontStyle: "italic", fontSize: 50, color: C.terracotta }}>
              <MaskWords text="Create Beyond Limits." f={n} delay={226} stagger={6} />
            </div>
          </>
        )}
      </div>

      {/* ---------------- lockup akhir yang bersih */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily: F.mono, fontSize: 23, letterSpacing: "0.3em", color: C.charcoalSoft, opacity: lockup, transform: `translateY(${(1 - lockup) * 16}px)` }}>
        FELIXIORITY <span style={{ color: C.terracotta }}>—</span> CREATE BEYOND LIMITS
      </div>

      {/* ---------------- komposisi geometris dari semua scene */}
      {!tilesGone ? (
        <AbsoluteFill style={{ perspective: 1600, filter: camBlur > 0.3 ? `blur(${camBlur}px)` : undefined, opacity: 1 - prog(n, 84, 96) }}>
          <AbsoluteFill style={{ transformStyle: "preserve-3d", transformOrigin: "960px 540px", transform: `scale(${cs}) rotateX(${camRx}deg)` }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const r = tileRect(i);
              const e = i === S7_TILE ? 1 : sp(n, -30 + [0, 3, 6, 9, 2, 5, 0, 8][i], SPRING.smooth);
              const [fx, fy, fr] = FROM[i];
              const z = (i % 2 ? 1 : -1) * 40 * prog(n, 0, 48, E.inOut);
              const visible = i !== S7_TILE || n >= 0;
              if (!visible) return null;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: r.x,
                    top: r.y,
                    width: r.w,
                    height: r.h,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: C.white,
                    boxShadow: SHADOW.float,
                    transform: `translate3d(${(1 - e) * fx}px, ${(1 - e) * fy}px, ${z}px) rotate(${(1 - e) * fr}deg) scale(${1 + (1 - e) * 0.6})`,
                    opacity: Math.min(1, e * 2),
                  }}
                >
                  {i < 7 ? (
                    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${TILE_SCALE})`, transformOrigin: "0 0" }}>
                      <Freeze frame={SNAPSHOTS[i].frame}>{SNAPSHOTS[i].node}</Freeze>
                    </div>
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: C.felix, display: "grid", placeItems: "center" }}>
                      <Img src={LOGO_SRC.sticker} style={{ height: TILE_H * 0.86 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
