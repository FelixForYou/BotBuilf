import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Box3D } from "../components/Box3D";
import { Card, Dot, Icon, fmt } from "../components/Primitives";
import { Headline, SectionLabel } from "../components/Type";
import { E, SPRING, keys, prog, rand, sp, tw } from "../lib/anim";
import { OVERLAP } from "../timeline";
import { C, F } from "../theme";

/** Rect portal Scene 03 di layar saat Scene 04 mulai tersingkap. */
export const S4_FROM = { x: 425, y: 203, w: 1070, h: 674, r: 40 };

const UNIT_W = 600;
const UNIT_D = 130;
const LEVELS = 3;
const SLOTS = 8;
const LEVEL_H = 104;
const UNITS = [
  { x: 360, y: 330 },
  { x: 1060, y: 330 },
  { x: 360, y: 760 },
  { x: 1060, y: 760 },
  { x: 360, y: 1190 },
  { x: 1060, y: 1190 },
];
/** Palet user dibuat tenang: mayoritas netral hangat, aksen terracotta, sedikit ungu Felix. */
const userColor = (r: number) => (r < 0.34 ? C.white : r < 0.6 ? "#EAD9CF" : r < 0.8 ? C.terracotta : r < 0.93 ? C.charcoal : C.felix);
const NAMES = "FARNIKSDMLYTBQHGEWCVPJOUZ";

const isFocusSlot = (s: { u: number; l: number; k: number }) => s.u === 1 && s.l === 2 && s.k === 2;

/** Kotak yang berdiri di lantai (koordinat lantai; tinggi = sumbu normal lantai). */
const FloorBox: React.FC<React.ComponentProps<typeof Box3D> & { x: number; y: number; z?: number }> = ({ x, y, z = 0, ...box }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transformStyle: "preserve-3d", transform: `translateZ(${z}px) rotateX(-90deg)` }}>
    <Box3D {...box} />
  </div>
);

export const S04Warehouse: React.FC = () => {
  const f = useCurrentFrame();
  const n = f - OVERLAP;

  // dolly kamera halus melintasi gudang
  const panX = keys(n, [
    [-30, -260],
    [440, 140, E.inOut],
  ]);
  const panY = keys(n, [
    [-30, -200],
    [440, 40, E.inOut],
  ]);
  const zoom = keys(n, [
    [-30, 1.45],
    [60, 0.9, E.out],
    [440, 0.98, E.inOut],
  ]);
  const tilt = keys(n, [
    [-30, 52],
    [80, 58, E.out],
  ]);

  const unitIn = (i: number) => sp(n, -10 + i * 8, SPRING.smooth);

  // urutan slot pengisian user (diacak deterministik)
  const slots: Array<{ u: number; l: number; k: number; order: number }> = [];
  UNITS.forEach((_, u) => {
    for (let l = 0; l < LEVELS; l++) for (let k = 0; k < SLOTS; k++) slots.push({ u, l, k, order: rand(u * 100 + l * 10 + k) });
  });
  const ordered = [...slots].sort((a, b) => a.order - b.order);
  const fillStart = 50;
  const fillSpan = 300;
  const delayOf = new Map(ordered.map((s, i) => [`${s.u}-${s.l}-${s.k}`, fillStart + (i / ordered.length) ** 0.9 * fillSpan]));
  const filled = ordered.filter((s) => n >= (delayOf.get(`${s.u}-${s.l}-${s.k}`) ?? 0) + 12).length;

  const focus = sp(n, 230, SPRING.pop);

  return (
    <AbsoluteFill style={{ background: C.softGray }}>
      {/* ambient light */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 62% 40%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)" }} />

      <AbsoluteFill style={{ perspective: 5200, perspectiveOrigin: "55% 30%" }}>
        <div
          style={{
            position: "absolute",
            left: 1240 - 900,
            top: 650 - 900,
            width: 1800,
            height: 1800,
            transformStyle: "preserve-3d",
            transform: `scale(${zoom}) rotateX(${tilt}deg) rotateZ(45deg) translate(${-panX}px, ${-panY}px)`,
          }}
        >
          {/* lantai grid (sama dengan portal Scene 03) */}
          <div
            style={{
              position: "absolute",
              inset: -600,
              backgroundImage: `linear-gradient(${C.line} 1.5px, transparent 1.5px), linear-gradient(90deg, ${C.line} 1.5px, transparent 1.5px)`,
              backgroundSize: "60px 60px",
              WebkitMaskImage: "radial-gradient(closest-side, black 55%, transparent 100%)",
            }}
          />
          {/* jalur data di lantai */}
          <svg width={1800} height={1800} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path
              d="M-300,545 L1700,545 M-300,975 L1700,975 M710,-200 L710,1600"
              stroke={C.terracotta}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${prog(n, 0, 90, E.inOut)} 1`}
              opacity={0.55}
            />
            {Array.from({ length: 10 }).map((_, i) => {
              const t = ((n * 4 + i * 230) % 2000) - 300;
              const lane = i % 3;
              const cx = lane === 2 ? 710 : t;
              const cy = lane === 0 ? 545 : lane === 1 ? 975 : t * 0.9;
              return <circle key={i} cx={cx} cy={cy} r={7} fill={C.terracotta} opacity={prog(n, 40, 70)} />;
            })}
          </svg>

          {UNITS.map((u, ui) => {
            const e = unitIn(ui);
            return (
              <div key={ui} style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: `scale3d(1,1,${Math.max(0.001, e)})`, opacity: Math.min(1, e * 2) }}>
                {/* bayangan unit */}
                <div style={{ position: "absolute", left: u.x - 20, top: u.y - 10, width: UNIT_W + 40, height: UNIT_D + 50, background: "rgba(38,37,34,0.10)", filter: "blur(14px)", borderRadius: 12 }} />
                {/* tiang */}
                {[0, 1].map((cx) =>
                  [0, 1].map((cy) => (
                    <FloorBox key={`${cx}${cy}`} x={u.x + 6 + cx * (UNIT_W - 12)} y={u.y + 6 + cy * (UNIT_D - 12)} w={10} d={10} h={LEVEL_H * LEVELS + 10} top="#FFFFFF" front="#E9E6E0" side="#D7D3CB" radius={2} />
                  )),
                )}
                {/* papan rak */}
                {Array.from({ length: LEVELS }).map((_, l) => (
                  <FloorBox
                    key={l}
                    x={u.x + UNIT_W / 2}
                    y={u.y + UNIT_D / 2}
                    z={l * LEVEL_H}
                    w={UNIT_W}
                    d={UNIT_D}
                    h={12}
                    top={C.white}
                    front={l === 0 ? C.terracotta : "#E4E0D8"}
                    side="#D3CEC5"
                    radius={3}
                  />
                ))}
                {/* label unit */}
                <div style={{ position: "absolute", left: u.x, top: u.y + UNIT_D + 18, fontFamily: F.mono, fontSize: 22, color: C.charcoalSoft, letterSpacing: "0.1em" }}>
                  RAK-{String.fromCharCode(65 + ui)} · NODE-0{ui + 1}
                </div>
              </div>
            );
          })}

          {/* user sebagai objek 3D yang jatuh & menempati slot */}
          {slots.map((s) => {
            const u = UNITS[s.u];
            const d = delayOf.get(`${s.u}-${s.l}-${s.k}`) ?? 0;
            const p = sp(n, d, SPRING.pop);
            if (p < 0.002) return null;
            const color = isFocusSlot(s) ? C.felix : userColor(rand(s.u * 31 + s.l * 7 + s.k * 3));
            const letter = NAMES[(s.u * 7 + s.l * 3 + s.k * 5) % NAMES.length];
            const size = 50;
            const x = u.x + 46 + s.k * ((UNIT_W - 92) / (SLOTS - 1));
            const y = u.y + UNIT_D / 2;
            const z = s.l * LEVEL_H + 12;
            const isFocus = isFocusSlot(s);
            const lift = isFocus ? focus * 60 : 0;
            return (
              <FloorBox
                key={`${s.u}-${s.l}-${s.k}`}
                x={x}
                y={y}
                z={z + (1 - p) * 420 + lift}
                w={size}
                d={size}
                h={size}
                top={color}
                front={color}
                side={color}
                radius={10}
                edge="rgba(255,255,255,0.35)"
                topContent={
                  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontFamily: F.sans, fontWeight: 700, fontSize: 24, color: color === C.white || color === "#EAD9CF" ? C.charcoal : C.white, transform: "rotate(-45deg)" }}>
                    {letter}
                  </div>
                }
                frontContent={<div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.12))" }} />}
              />
            );
          })}
        </div>
      </AbsoluteFill>

      {/* kabut tepi agar fokus ke tengah */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 80% at 60% 50%, transparent 55%, ${C.softGray} 100%)` }} />

      {/* ruang baca untuk teks di kiri */}
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${C.softGray} 0%, rgba(238,236,232,0.92) 30%, rgba(238,236,232,0) 52%)` }} />

      {/* teks */}
      <div style={{ position: "absolute", left: 110, top: 110, width: 760 }}>
        <SectionLabel index="04" title="3D USER WAREHOUSE" f={n} delay={10} />
        <div style={{ marginTop: 26 }}>
          <Headline parts={[["Every User.", "sans"], ["One Living Space.", "serif"]]} f={n} delay={24} size={82} />
        </div>
        <div style={{ marginTop: 22, fontFamily: F.ui, fontSize: 21, lineHeight: 1.45, color: C.charcoalSoft, maxWidth: 520, opacity: prog(n, 70, 100) }}>
          Setiap pengguna panel hadir sebagai objek di ruang kerja digital — tertata otomatis per node.
        </div>
      </div>

      {/* counter */}
      <Card style={{ position: "absolute", left: 110, bottom: 110, padding: "22px 28px", display: "flex", gap: 22, alignItems: "center", opacity: prog(n, 60, 80), transform: `translateY(${tw(n, 60, 90, 30, 0)}px)` }}>
        <Dot size={10} pulse={(n % 50) / 50} />
        <div>
          <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 44, letterSpacing: "-0.04em", color: C.charcoal, lineHeight: 1 }}>{fmt((filled / slots.length) * 1204)}</div>
          <div style={{ fontFamily: F.ui, fontSize: 16, color: C.muted, marginTop: 6 }}>pengguna tersinkron · 6 node</div>
        </div>
      </Card>

      {/* kartu info user yang disorot */}
      <div
        style={{
          position: "absolute",
          left: 1460,
          top: 120,
          opacity: Math.min(1, focus * 1.4) * (1 - prog(n, 400, 420)),
          transform: `translateY(${(1 - focus) * 30}px) scale(${0.9 + focus * 0.1})`,
          transformOrigin: "left bottom",
        }}
      >
        <Card float style={{ padding: "18px 22px", width: 330, fontFamily: F.ui }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: C.felix, color: C.white, display: "grid", placeItems: "center", fontFamily: F.sans, fontWeight: 700, fontSize: 22 }}>F</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 19, color: C.charcoal }}>felix_dev</div>
              <div style={{ fontSize: 14, color: C.muted }}>RAK-B · level 3</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 15, color: C.charcoalSoft }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Icon name="server" size={17} color={C.terracotta} /> 3 server
            </span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Dot size={8} /> aktif
            </span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};
