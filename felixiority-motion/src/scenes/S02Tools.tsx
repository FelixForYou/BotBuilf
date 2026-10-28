import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera } from "../components/Camera";
import { Backdrop, Card, Dot, Icon, IconTile, Pill, fmt } from "../components/Primitives";
import { Headline, SectionLabel, MaskWords } from "../components/Type";
import { E, SPRING, keys, mix, prog, rand, sp, tw } from "../lib/anim";
import { OVERLAP } from "../timeline";
import { C, F, SHADOW } from "../theme";

/** Kartu "Server" — kartu yang menjadi jembatan (morph) ke Scene 03. */
export const S2_BRIDGE = { x: 800, y: 250, w: 220, h: 140, endScale: 1.6 };
const PIVOT = { x: S2_BRIDGE.x + S2_BRIDGE.w / 2, y: S2_BRIDGE.y + S2_BRIDGE.h / 2 };

type Rect = { x: number; y: number; w: number; h: number };
const R = {
  frame: { x: 560, y: 160, w: 1200, h: 760 },
  side: { x: 560, y: 210, w: 210, h: 710 },
  chart: { x: 800, y: 410, w: 580, h: 250 },
  list: { x: 1400, y: 410, w: 340, h: 480 },
  auto: { x: 800, y: 680, w: 580, h: 210 },
} satisfies Record<string, Rect>;

const STATS = [
  { label: "Server", value: 248, icon: "server" as const, suffix: "" },
  { label: "Pengguna", value: 1204, icon: "users" as const, suffix: "" },
  { label: "Node", value: 12, icon: "cpu" as const, suffix: "" },
  { label: "Uptime", value: 99.98, icon: "pulse" as const, suffix: "%" },
];

const FEATURES = [
  { title: "Server Management", desc: "Start, stop, dan atur ratusan server", icon: "server" as const, target: "list" },
  { title: "Real-Time Monitoring", desc: "CPU, RAM, dan trafik secara langsung", icon: "pulse" as const, target: "chart" },
  { title: "User Management", desc: "Akses & peran pengguna terpusat", icon: "users" as const, target: "stat1" },
  { title: "Automation & Cleanup", desc: "Bersihkan resource tak terpakai otomatis", icon: "broom" as const, target: "auto" },
];

const SERVERS = ["mc-survival-01", "bot-discord-ai", "web-felixpanel", "node-api-02", "mc-skyblock", "db-replica-03", "lavalink-eu"];

export const S02Tools: React.FC = () => {
  const f = useCurrentFrame();
  const n = f - OVERLAP;

  // highlight fitur yang aktif (dashboard merespons daftar fitur)
  const active = (i: number) => {
    const a = 150 + i * 42;
    return prog(n, a, a + 14) * (1 - prog(n, a + 42, a + 56));
  };
  const hl = (target: string) => {
    const i = FEATURES.findIndex((x) => x.target === target);
    return i < 0 ? 0 : active(i);
  };

  // ---------------------------------------------------------- kamera orbit
  const toBridge = prog(n, 380, 450, E.inOut);
  const camS = keys(n, [
    [-30, 1.5],
    [60, 0.95, E.out],
    [380, 1.0, E.inOut],
    [450, S2_BRIDGE.endScale, E.inOut],
  ]);
  const camRy = keys(n, [
    [-30, -34],
    [70, -17, E.out],
    [380, -11, E.inOut],
    [450, 0, E.inOut],
  ]);
  const camRx = keys(n, [
    [-30, 16],
    [70, 9, E.out],
    [380, 6, E.inOut],
    [450, 0, E.inOut],
  ]);
  const camX = mix(-250 + Math.sin(n / 90) * 10, PIVOT.x - 960, toBridge);
  const camY = mix(-40 + Math.cos(n / 80) * 6, PIVOT.y - 540, toBridge);

  // komponen dashboard masuk dari kedalaman
  const enter = (i: number) => sp(n, -28 + i * 6, SPRING.smooth);
  const fallAway = prog(n, 430, 478, E.in);

  const piece = (r: Rect, i: number, key: string, children: React.ReactNode, opts: { keep?: boolean; radius?: number } = {}) => {
    const e = enter(i);
    const h = hl(key);
    const fall = opts.keep ? 0 : fallAway;
    return (
      <div
        style={{
          position: "absolute",
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          transformStyle: "preserve-3d",
          transform: `translate3d(0, ${(1 - e) * 80 + fall * 60}px, ${(1 - e) * -500 + h * 46 - fall * 260}px)`,
          opacity: Math.min(1, e * 1.4) * (1 - fall),
        }}
      >
        <Card
          radius={opts.radius ?? 18}
          style={{
            width: "100%",
            height: "100%",
            boxShadow: h > 0.01 ? `0 0 0 ${2 * h}px ${C.terracotta}, ${SHADOW.float}` : SHADOW.card,
          }}
        >
          {children}
        </Card>
      </div>
    );
  };

  // data chart deterministik
  const pts = Array.from({ length: 40 }).map((_, i) => {
    const v = 0.5 + Math.sin(i * 0.55 + n * 0.035) * 0.18 + Math.sin(i * 1.7 + 2) * 0.08 + (rand(i + 9) - 0.5) * 0.08;
    return [20 + i * 13.6, 190 - v * 150];
  });
  const linePath = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},200 L20,200 Z`;
  const chartDraw = prog(n, 40, 120, E.inOut);

  return (
    <AbsoluteFill>
      <Backdrop dots={0.5} offsetX={-n * 0.3} />
      <Camera s={camS} ry={camRy} rx={camRx} x={camX} y={camY} ox={PIVOT.x} oy={PIVOT.y} perspective={2000}>
        {/* bayangan lantai di bawah dashboard */}
        <div
          style={{
            position: "absolute",
            left: R.frame.x + 80,
            top: R.frame.y + R.frame.h + 10,
            width: R.frame.w - 160,
            height: 70,
            borderRadius: "50%",
            background: "radial-gradient(closest-side, rgba(38,37,34,0.22), transparent)",
            filter: "blur(10px)",
            opacity: enter(0) * (1 - fallAway),
            transform: "translateZ(-80px)",
          }}
        />
        {/* bingkai aplikasi */}
        <div
          style={{
            position: "absolute",
            left: R.frame.x,
            top: R.frame.y,
            width: R.frame.w,
            height: R.frame.h,
            transform: `translateZ(${(1 - enter(0)) * -400 - 30 - fallAway * 300}px)`,
            opacity: enter(0) * (1 - fallAway),
            background: C.warmWhite,
            borderRadius: 28,
            border: `1px solid ${C.line}`,
            boxShadow: SHADOW.float,
          }}
        >
          <div style={{ height: 50, display: "flex", alignItems: "center", gap: 9, padding: "0 22px", borderBottom: `1px solid ${C.line}` }}>
            {[C.terracotta, C.line, C.line].map((c, i) => (
              <span key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
            ))}
            <span style={{ marginLeft: 18, fontFamily: F.mono, fontSize: 15, color: C.muted }}>tools.felixiority / dashboard</span>
          </div>
        </div>
        {/* sidebar */}
        <div
          style={{
            position: "absolute",
            left: R.side.x + 14,
            top: R.side.y + 18,
            width: R.side.w - 24,
            transform: `translateZ(${(1 - enter(1)) * -300 - 20 - fallAway * 300}px)`,
            opacity: enter(1) * (1 - fallAway),
            fontFamily: F.ui,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px 22px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: C.terracotta, display: "grid", placeItems: "center" }}>
              <Icon name="spark" size={18} color={C.white} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 18, color: C.charcoal }}>Felix Tools</span>
          </div>
          {["Ringkasan", "Server", "Monitoring", "Pengguna", "Node", "Otomasi", "Pengaturan"].map((t, i) => {
            const on = i === 0;
            return (
              <div
                key={t}
                style={{
                  padding: "11px 12px",
                  borderRadius: 10,
                  fontSize: 16,
                  color: on ? C.charcoal : C.charcoalSoft,
                  background: on ? C.white : "transparent",
                  boxShadow: on ? SHADOW.soft : undefined,
                  fontWeight: on ? 600 : 500,
                  marginBottom: 4,
                  opacity: tw(n, 20 + i * 3, 34 + i * 3, 0, 1),
                  transform: `translateX(${tw(n, 20 + i * 3, 40 + i * 3, -16, 0)}px)`,
                }}
              >
                {t}
              </div>
            );
          })}
        </div>

        {/* kartu statistik */}
        {STATS.map((s, i) => {
          const r = { x: 800 + i * 240, y: 250, w: 220, h: 140 };
          const v = s.value * tw(n, 40 + i * 6, 140 + i * 6, 0, 1, E.out);
          const val = s.suffix === "%" ? v.toFixed(2).replace(".", ",") : fmt(v);
          return (
            <React.Fragment key={s.label}>
              {piece(
                r,
                2 + i,
                i === 1 ? "stat1" : `stat${i}`,
                <div style={{ padding: "18px 20px", fontFamily: F.ui }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 16, color: C.muted, fontWeight: 500 }}>{s.label}</span>
                    <Icon name={s.icon} size={20} color={i === 0 ? C.terracotta : C.muted} />
                  </div>
                  <div style={{ fontFamily: F.sans, fontSize: 46, fontWeight: 600, letterSpacing: "-0.04em", color: C.charcoal, marginTop: 14 }}>
                    {val}
                    {s.suffix}
                  </div>
                  <div style={{ fontSize: 13, color: C.green, marginTop: 2, fontWeight: 500 }}>{i === 3 ? "30 hari terakhir" : `+${[12, 86, 2][i]} minggu ini`}</div>
                </div>,
                { keep: i === 0 },
              )}
            </React.Fragment>
          );
        })}

        {/* chart realtime */}
        {piece(
          R.chart,
          6,
          "chart",
          <div style={{ padding: "18px 22px", fontFamily: F.ui }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 18, color: C.charcoal }}>Penggunaan CPU · Cluster</span>
              <Pill color={C.green} bg="#E7F1EA">
                <Dot color={C.green} size={8} pulse={(n % 50) / 50} /> Live
              </Pill>
            </div>
            <svg width={540} height={200} style={{ marginTop: 6 }}>
              {[50, 100, 150].map((y) => (
                <line key={y} x1={20} x2={540} y1={y} y2={y} stroke={C.line} strokeDasharray="3 6" />
              ))}
              <path d={areaPath} fill={C.terracotta} opacity={0.08 * chartDraw} />
              <path d={linePath} fill="none" stroke={C.terracotta} strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray={`${chartDraw} 1`} />
              <circle cx={pts[39][0]} cy={pts[39][1]} r={6} fill={C.white} stroke={C.terracotta} strokeWidth={3} opacity={prog(n, 110, 120)} />
            </svg>
          </div>,
        )}

        {/* daftar server */}
        {piece(
          R.list,
          7,
          "list",
          <div style={{ padding: "18px 20px", fontFamily: F.ui }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: C.charcoal, marginBottom: 12 }}>Server Aktif</div>
            {SERVERS.map((s, i) => {
              const on = prog(n, 50 + i * 6, 64 + i * 6);
              const status = i === 3 ? (n > 180 ? "online" : "starting") : "online";
              return (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 0",
                    borderTop: i ? `1px solid ${C.softGray}` : undefined,
                    opacity: on,
                    transform: `translateY(${(1 - on) * 10}px)`,
                  }}
                >
                  <Dot color={status === "online" ? C.green : C.gold} size={9} pulse={((n + i * 13) % 70) / 70} />
                  <span style={{ fontFamily: F.mono, fontSize: 15, color: C.charcoal, flex: 1 }}>{s}</span>
                  <span style={{ fontSize: 13, color: C.muted }}>{Math.round(18 + rand(i + 3) * 60 + Math.sin(n / 20 + i) * 6)}%</span>
                </div>
              );
            })}
          </div>,
        )}

        {/* otomasi & cleanup */}
        {piece(
          R.auto,
          8,
          "auto",
          <div style={{ padding: "18px 22px", fontFamily: F.ui }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <IconTile name="broom" size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 18, color: C.charcoal }}>Auto Cleanup</div>
                <div style={{ fontSize: 14, color: C.muted }}>Menghapus server tidak aktif &gt; 14 hari</div>
              </div>
              <Pill>{n > 330 ? "Selesai" : "Berjalan"}</Pill>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: C.softGray, marginTop: 26, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${tw(n, 240, 330, 8, 100, E.inOut)}%`, background: C.terracotta, borderRadius: 99 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 14, color: C.charcoalSoft }}>
              <span>{fmt(tw(n, 240, 330, 2, 37))} server dibersihkan</span>
              <span style={{ fontFamily: F.mono }}>{fmt(tw(n, 240, 330, 4, 100, E.inOut))}%</span>
            </div>
          </div>,
        )}
      </Camera>

      {/* teks layar (screen-space) */}
      <div style={{ position: "absolute", left: 110, top: 150, width: 640, opacity: 1 - prog(n, 395, 420) }}>
        <SectionLabel index="02" title="FELIXIORITY TOOLS" f={n} delay={20} exitAt={375} />
        <div style={{ marginTop: 34 }}>
          <Headline parts={[["Manage Everything.", "sans"], ["Effortlessly.", "serif"]]} f={n} delay={40} size={80} exitAt={372} />
        </div>
        <div style={{ marginTop: 24, fontFamily: F.ui, fontSize: 22, lineHeight: 1.45, color: C.charcoalSoft, maxWidth: 520 }}>
          <MaskWords text="Platform manajemen infrastruktur Pterodactyl dalam satu dashboard." f={n} delay={100} stagger={2} exitAt={380} />
        </div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
          {FEATURES.map((ft, i) => {
            const e = sp(n, 140 + i * 42 - 10, SPRING.pop);
            const a = active(i);
            const out = prog(n, 372 + i * 3, 392 + i * 3, E.in);
            return (
              <div
                key={ft.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "12px 16px",
                  borderRadius: 16,
                  background: `rgba(255,255,255,${0.4 + a * 0.6})`,
                  boxShadow: a > 0.01 ? SHADOW.soft : undefined,
                  border: `1px solid ${a > 0.01 ? C.line : "transparent"}`,
                  opacity: Math.min(1, e) * (1 - out),
                  transform: `translateX(${(1 - e) * -40 - out * 40}px) scale(${1 + a * 0.02})`,
                  transformOrigin: "left center",
                }}
              >
                <IconTile name={ft.icon} size={46} bg={a > 0.5 ? C.terracotta : C.terracottaSoft} color={a > 0.5 ? C.white : C.terracottaDeep} />
                <div>
                  <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 21, color: C.charcoal, letterSpacing: "-0.01em" }}>{ft.title}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 16, color: C.muted, marginTop: 2 }}>{ft.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
