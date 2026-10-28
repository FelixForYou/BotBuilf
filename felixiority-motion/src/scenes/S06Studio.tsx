import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Box3D } from "../components/Box3D";
import { Camera } from "../components/Camera";
import { Backdrop, Icon } from "../components/Primitives";
import { MaskWords, SectionLabel } from "../components/Type";
import { E, SPRING, keys, mix, prog, sp, tw } from "../lib/anim";
import { OVERLAP } from "../timeline";
import { C, F, SHADOW } from "../theme";

const WIN = { x: 150, y: 250, w: 1620, h: 790 };
const LEFT_W = 250;
const RIGHT_W = 350;
const TOP_H = 54;
const TL_H = 214;
const CANVAS = { x: WIN.x + LEFT_W + 50, y: WIN.y + TOP_H + 26, w: 870, h: 489 };
const CANVAS_C = { x: CANVAS.x + CANVAS.w / 2, y: CANVAS.y + CANVAS.h / 2 };
/** Tombol render (dunia = layar saat kamera netral) — titik asal reveal Scene 07. */
export const S6_RENDER_BTN = { x: WIN.x + WIN.w - 92, y: WIN.y + TOP_H / 2 };

const TRACKS = [
  { name: "Teks", color: C.terracotta, clips: [[0.02, 0.38], [0.45, 0.8]], keys: [0.05, 0.2, 0.36, 0.5, 0.7] },
  { name: "Kubus 3D", color: C.charcoal, clips: [[0.1, 0.92]], keys: [0.12, 0.3, 0.55, 0.9] },
  { name: "Kamera", color: "#B8B2A7", clips: [[0, 1]], keys: [0, 0.25, 0.5, 0.75, 1] },
  { name: "Logo", color: C.felix, clips: [[0.6, 1]], keys: [0.62, 0.82, 0.98] },
  { name: "SFX", color: C.gold, clips: [[0.04, 0.08], [0.3, 0.34], [0.62, 0.66], [0.9, 0.94]], keys: [] },
];

/** Waktu playhead (0..1) — maju, lalu scrubbing bolak-balik, lalu play sampai akhir. */
const playhead = (n: number) =>
  keys(n, [
    [40, 0.05],
    [130, 0.42, E.inOut],
    [158, 0.22, E.inOut],
    [182, 0.58, E.inOut],
    [200, 0.48, E.inOut],
    [300, 1.0, E.inOut],
  ]);

/** Isi kanvas pratinjau dievaluasi di waktu t (seperti composition di Studio). */
const Preview: React.FC<{ t: number; n: number }> = ({ t, n }) => {
  const words = ["Design.", "Animate.", "Render."];
  const cubeX = mix(-120, CANVAS.w + 120, E.inOut(Math.min(1, Math.max(0, (t - 0.1) / 0.8))));
  return (
    <div style={{ position: "absolute", inset: 0, background: C.white, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${C.line} 1.2px, transparent 1.4px)`, backgroundSize: "28px 28px", opacity: 0.6 }} />
      <div style={{ position: "absolute", left: 60, top: 150, display: "flex", gap: 18, fontFamily: F.sans, fontWeight: 600, fontSize: 70, letterSpacing: "-0.05em", color: C.charcoal }}>
        {words.map((w, i) => {
          const p = Math.min(1, Math.max(0, (t - 0.08 - i * 0.12) / 0.12));
          const e = E.out(p);
          return (
            <span key={w} style={{ display: "inline-block", transform: `translateY(${(1 - e) * 40}px)`, opacity: e, fontFamily: i === 2 ? F.serif : F.sans, fontStyle: i === 2 ? "italic" : undefined, fontWeight: i === 2 ? 400 : 600, color: i === 2 ? C.terracotta : C.charcoal, fontSize: i === 2 ? 78 : 70 }}>
              {w}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 60, top: 260, width: 300 * E.inOut(Math.min(1, Math.max(0, (t - 0.45) / 0.2))), height: 3, background: C.terracotta }} />
      <div style={{ position: "absolute", left: cubeX, top: 390, perspective: 800 }}>
        <Box3D w={70} h={70} d={70} top={C.terracotta} front={C.terracottaDeep} side="#9E5640" radius={8} style={{ transform: `rotateX(-20deg) rotateY(${t * 360 + n * 0.5}deg)` }} />
      </div>
      <div style={{ position: "absolute", left: 18, bottom: 14, fontFamily: F.mono, fontSize: 13, color: C.muted }}>1920×1080 · 60 fps</div>
    </div>
  );
};

export const S06Studio: React.FC = () => {
  const f = useCurrentFrame();
  const n = f - OVERLAP;
  const t = playhead(n);

  // match cut: mulai dari kanvas putih penuh layar, lalu kamera mundur
  const pull = sp(n, -12, SPRING.heavy);
  const startS = 1920 / CANVAS.w;
  const camS = mix(startS, 1, pull) * keys(n, [
    [200, 1],
    [300, 1.04, E.inOut],
    [420, 1.04],
  ]);
  const camX = mix(CANVAS_C.x - 960, 0, pull) + keys(n, [
    [60, 0],
    [150, 30, E.inOut],
    [260, -20, E.inOut],
    [330, 0, E.inOut],
  ]);
  const camY = mix(CANVAS_C.y - 540, 0, pull);
  const camRx = keys(n, [
    [60, 0],
    [140, 3, E.inOut],
    [330, 0, E.inOut],
  ]);
  const camRy = keys(n, [
    [60, 0],
    [140, -4, E.inOut],
    [330, 0, E.inOut],
  ]);
  const chrome = prog(n, 10, 50);

  // render
  const render = tw(n, 300, 392, 0, 1, E.inOut);
  const done = sp(n, 394, SPRING.pop);

  const tlX = WIN.x + 150;
  const tlW = WIN.w - 190;

  // objek 3D yang melintas dekat kamera (kamera mengikutinya)
  const fly = prog(n, 70, 170, E.inOut);
  const flyX = mix(-300, CANVAS_C.x + 160, fly);
  const flyY = mix(900, CANVAS.y + 410, fly);
  const flyS = mix(4.2, 1, fly);

  return (
    <AbsoluteFill style={{ opacity: prog(f, 21, 28) }}>
      <Backdrop dots={0.4} />
      <Camera s={camS} x={camX} y={camY} rx={camRx} ry={camRy} ox={CANVAS_C.x} oy={CANVAS_C.y} perspective={2600}>
        {/* jendela studio */}
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            borderRadius: 24,
            background: C.warmWhite,
            border: `1px solid ${C.line}`,
            boxShadow: SHADOW.float,
            overflow: "hidden",
            opacity: 1,
          }}
        >
          {/* top bar */}
          <div style={{ height: TOP_H, display: "flex", alignItems: "center", padding: "0 22px", gap: 10, borderBottom: `1px solid ${C.line}`, opacity: chrome, fontFamily: F.ui }}>
            {[C.terracotta, C.line, C.line].map((c, i) => (
              <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
            ))}
            <span style={{ marginLeft: 16, fontWeight: 600, fontSize: 16, color: C.charcoal }}>Felixiority Studio</span>
            <span style={{ fontFamily: F.mono, fontSize: 14, color: C.muted }}>· Remotion · FelixiorityShowreel.tsx</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: F.mono, fontSize: 14, color: C.charcoalSoft }}>
              {String(Math.round(t * 3600)).padStart(4, "0")} / 3600
            </span>
          </div>
          {/* panel kiri: komposisi */}
          <div style={{ position: "absolute", left: 0, top: TOP_H, width: LEFT_W, bottom: TL_H, borderRight: `1px solid ${C.line}`, padding: "18px 16px", opacity: chrome, fontFamily: F.ui, transform: `translateX(${(1 - chrome) * -40}px)` }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.12em", color: C.muted, marginBottom: 12 }}>KOMPOSISI</div>
            {["01 Awakening", "02 Tools", "03 Panel", "04 Warehouse", "05 Telegram", "06 Studio", "07 Semile AI", "08 Reveal"].map((s, i) => (
              <div key={s} style={{ padding: "9px 10px", borderRadius: 8, fontSize: 15, color: i === 5 ? C.charcoal : C.charcoalSoft, background: i === 5 ? C.white : "transparent", boxShadow: i === 5 ? SHADOW.soft : undefined, fontWeight: i === 5 ? 600 : 400, display: "flex", gap: 10, alignItems: "center" }}>
                <Icon name="play" size={12} color={i === 5 ? C.terracotta : C.muted} />
                {s}
              </div>
            ))}
          </div>
          {/* panel kanan: kurva gerak */}
          <div style={{ position: "absolute", right: 0, top: TOP_H, width: RIGHT_W, bottom: TL_H, borderLeft: `1px solid ${C.line}`, padding: "18px 20px", opacity: chrome, fontFamily: F.ui, transform: `translateX(${(1 - chrome) * 40}px)` }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.12em", color: C.muted }}>MOTION CURVE</div>
            <CurveEditor t={t} n={n} />
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 14 }}>
              {[
                ["Easing", "bezier(.16,1,.3,1)"],
                ["Spring", "damping 13"],
                ["Posisi X", `${Math.round(mix(-120, 990, t))} px`],
                ["Rotasi", `${Math.round(t * 360)}°`],
              ].map(([k, v]) => (
                <div key={k} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ color: C.muted, fontSize: 12 }}>{k}</div>
                  <div style={{ fontFamily: F.mono, color: C.charcoal, fontSize: 13, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          {/* timeline */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: TL_H, borderTop: `1px solid ${C.line}`, background: C.white, opacity: chrome, transform: `translateY(${(1 - chrome) * 60}px)` }}>
            {/* ruler */}
            <div style={{ position: "absolute", left: tlX - WIN.x, right: 40, top: 8, height: 20, fontFamily: F.mono, fontSize: 11, color: C.muted }}>
              {Array.from({ length: 11 }).map((_, i) => (
                <span key={i} style={{ position: "absolute", left: `${i * 10}%`, transform: "translateX(-50%)" }}>
                  {i * 6}s
                </span>
              ))}
            </div>
            {TRACKS.map((tr, i) => (
              <div key={tr.name} style={{ position: "absolute", left: 0, right: 0, top: 34 + i * 34, height: 34, display: "flex", alignItems: "center" }}>
                <span style={{ width: 150, paddingLeft: 20, fontFamily: F.ui, fontSize: 14, color: C.charcoalSoft }}>{tr.name}</span>
                <div style={{ position: "absolute", left: tlX - WIN.x, width: tlW, top: 6, height: 22 }}>
                  {tr.clips.map(([a, b], k) => {
                    const g = prog(n, 30 + i * 6 + k * 4, 60 + i * 6 + k * 4, E.out);
                    return <div key={k} style={{ position: "absolute", left: `${a * 100}%`, width: `${(b - a) * 100 * g}%`, height: "100%", borderRadius: 6, background: tr.color, opacity: 0.22 }} />;
                  })}
                  {tr.keys.map((k, j) => {
                    const hit = Math.abs(t - k) < 0.02 ? 1 : 0;
                    const e = sp(n, 50 + i * 5 + j * 3, SPRING.pop);
                    return (
                      <div key={j} style={{ position: "absolute", left: `${k * 100}%`, top: 4, width: 14, height: 14, marginLeft: -7, transform: `rotate(45deg) scale(${e * (1 + hit * 0.4)})`, background: hit ? C.terracotta : tr.color, border: `2px solid ${C.white}`, borderRadius: 2 }} />
                    );
                  })}
                </div>
              </div>
            ))}
            {/* playhead */}
            <div style={{ position: "absolute", left: tlX - WIN.x + t * tlW, top: 0, bottom: 0, width: 2, background: C.terracotta, opacity: prog(n, 36, 46) }}>
              <div style={{ position: "absolute", left: -7, top: 0, width: 16, height: 14, background: C.terracotta, borderRadius: "3px 3px 8px 8px" }} />
            </div>
          </div>
        </div>

        {/* kanvas pratinjau */}
        <div style={{ position: "absolute", left: CANVAS.x, top: CANVAS.y, width: CANVAS.w, height: CANVAS.h, borderRadius: mix(0, 12, pull), overflow: "hidden", boxShadow: pull > 0.2 ? SHADOW.card : undefined }}>
          <Preview t={t} n={n} />
          {/* overlay render */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(38,37,34,0.55)", opacity: render > 0 ? Math.min(1, render * 8) * (1 - prog(n, 392, 410)) : 0, display: "grid", placeItems: "center" }}>
            <div style={{ width: 460, fontFamily: F.ui, color: C.white }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17 }}>
                <span>Rendering MP4 · H.264</span>
                <span style={{ fontFamily: F.mono }}>{Math.round(render * 100)}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 8, background: "rgba(255,255,255,0.2)", marginTop: 12, overflow: "hidden" }}>
                <div style={{ width: `${render * 100}%`, height: "100%", background: C.terracotta }} />
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 13, marginTop: 10, opacity: 0.75 }}>frame {String(Math.round(render * 3600)).padStart(4, "0")} / 3600 · 60 fps</div>
              {/* filmstrip frame yang dirender */}
              <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 34, borderRadius: 4, background: render > (i + 1) / 9 ? C.terracottaSoft : "rgba(255,255,255,0.12)", transform: `scale(${render > (i + 1) / 9 ? 1 : 0.9})` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* tombol render (posisi absolut di atas window) */}
        <div style={{ position: "absolute", left: S6_RENDER_BTN.x - 70, top: S6_RENDER_BTN.y - 19, width: 140, height: 38, opacity: chrome }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 12,
              background: done > 0.5 ? C.green : C.terracotta,
              color: C.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 15,
              transform: `scale(${1 - prog(n, 296, 300) * 0.08 + prog(n, 300, 308) * 0.08 + (done > 0 ? Math.sin(done * Math.PI) * 0.1 : 0)})`,
            }}
          >
            <Icon name={done > 0.5 ? "check" : "play"} size={16} color={C.white} stroke={2.4} />
            {done > 0.5 ? "Selesai" : render > 0 ? "Rendering…" : "Render"}
          </div>
        </div>

        {/* objek 3D melintas */}
        {fly > 0 && fly < 1 ? (
          <div style={{ position: "absolute", left: flyX, top: flyY, transform: `scale(${flyS})`, filter: `blur(${Math.sin(fly * Math.PI) * 3}px)` }}>
            <Box3D w={70} h={70} d={70} top={C.terracotta} front={C.terracottaDeep} side="#9E5640" radius={8} style={{ transform: `rotateX(-20deg) rotateY(${fly * 540}deg)` }} />
          </div>
        ) : null}
      </Camera>

      {/* judul */}
      <div style={{ position: "absolute", left: 150, top: 72, right: 150, display: "flex", alignItems: "flex-end", justifyContent: "space-between", opacity: 1 - prog(n, 420, 440) }}>
        <div>
          <SectionLabel index="06" title="REMOTION STUDIO" f={n} delay={40} />
          <div style={{ marginTop: 18, fontSize: 88, lineHeight: 1, display: "flex", gap: "0.24em", whiteSpace: "nowrap" }}>
            <MaskWords text="Design." f={n} delay={70} style={{ fontFamily: F.sans, fontWeight: 600, letterSpacing: "-0.05em", color: C.charcoal }} />
            <MaskWords text="Animate." f={n} delay={84} style={{ fontFamily: F.sans, fontWeight: 600, letterSpacing: "-0.05em", color: C.charcoal }} />
            <MaskWords text="Render." f={n} delay={98} style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 98, color: C.terracotta }} />
          </div>
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 19, lineHeight: 1.45, color: C.charcoalSoft, width: 400, textAlign: "right", opacity: prog(n, 120, 150), paddingBottom: 10 }}>
          Motion design berbasis kode — setiap frame dapat diulang &amp; dirender presisi.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CurveEditor: React.FC<{ t: number; n: number }> = ({ t, n }) => {
  const W = 310;
  const H = 200;
  const p0 = [16, H - 16];
  const p3 = [W - 16, 16];
  const c1 = [16 + (W - 32) * 0.16, H - 16 - (H - 32) * 1.0];
  const c2 = [16 + (W - 32) * 0.3, 16];
  const draw = prog(n, 40, 100, E.inOut);
  const bez = (u: number, a: number, b: number, c: number, d: number) => (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d;
  const dot = [bez(t, p0[0], c1[0], c2[0], p3[0]), bez(t, p0[1], c1[1], c2[1], p3[1])];
  return (
    <svg width={W} height={H} style={{ marginTop: 12, background: C.white, borderRadius: 12, border: `1px solid ${C.line}` }}>
      {[0.25, 0.5, 0.75].map((g) => (
        <g key={g}>
          <line x1={W * g} x2={W * g} y1={0} y2={H} stroke={C.softGray} />
          <line y1={H * g} y2={H * g} x1={0} x2={W} stroke={C.softGray} />
        </g>
      ))}
      <line x1={p0[0]} y1={p0[1]} x2={c1[0]} y2={c1[1]} stroke={C.muted} strokeDasharray="3 4" opacity={draw} />
      <line x1={p3[0]} y1={p3[1]} x2={c2[0]} y2={c2[1]} stroke={C.muted} strokeDasharray="3 4" opacity={draw} />
      <path d={`M${p0} C${c1} ${c2} ${p3}`} stroke={C.terracotta} strokeWidth={3} fill="none" pathLength={1} strokeDasharray={`${draw} 1`} />
      {[c1, c2].map((c, i) => (
        <circle key={i} cx={c[0]} cy={c[1]} r={6} fill={C.white} stroke={C.charcoal} strokeWidth={2} opacity={draw} />
      ))}
      <circle cx={dot[0]} cy={dot[1]} r={8} fill={C.terracotta} stroke={C.white} strokeWidth={3} opacity={prog(n, 60, 80)} />
    </svg>
  );
};
