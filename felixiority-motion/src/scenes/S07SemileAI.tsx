import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Icon } from "../components/Primitives";
import { Headline, SectionLabel, SplitChars } from "../components/Type";
import { E, SPRING, keys, prog, rand, sp, tw } from "../lib/anim";
import { OVERLAP } from "../timeline";
import { C, F } from "../theme";

const QUESTION = "Ringkas status server hari ini, dan beri saran.";
const ANSWER =
  "Semua 248 server berjalan normal. Tiga server di node-02 mendekati batas CPU — saya sarankan memindahkan mc-skyblock ke node-03 pada pukul 02.00 saat trafik terendah. Mau saya jadwalkan?";

/** Panel kaca cair: blur latar + highlight tepi + kilau lembut. */
const Glass: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; radius?: number; sheen?: number; frost?: boolean }> = ({
  style,
  children,
  radius = 32,
  sheen = 0,
  frost = true,
}) => (
  <div
    style={{
      position: "absolute",
      borderRadius: radius,
      background: "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.38))",
      // backdrop-filter dimatikan selama mask reveal (Chrome merender area di luar clip-path hitam)
      backdropFilter: frost ? "blur(28px) saturate(1.4)" : undefined,
      WebkitBackdropFilter: frost ? "blur(28px) saturate(1.4)" : undefined,
      border: "1px solid rgba(255,255,255,0.9)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(38,37,34,0.05), 0 30px 80px -30px rgba(38,37,34,0.25), 0 2px 6px rgba(38,37,34,0.04)",
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(115deg, rgba(255,255,255,0) ${sheen * 140 - 40}%, rgba(255,255,255,0.55) ${sheen * 140 - 20}%, rgba(255,255,255,0) ${sheen * 140}%)`,
        pointerEvents: "none",
      }}
    />
    {children}
  </div>
);

/** Graf "aliran kecerdasan": simpul & koneksi minimalis dengan pulsa. */
const NODES = Array.from({ length: 16 }).map((_, i) => ({
  x: 980 + rand(i * 5 + 1) * 860,
  y: 90 + rand(i * 9 + 4) * 900,
  r: 3 + rand(i * 2) * 5,
}));
const EDGES: Array<[number, number]> = [];
NODES.forEach((a, i) => {
  NODES.forEach((b, j) => {
    if (j > i && Math.hypot(a.x - b.x, a.y - b.y) < 300) EDGES.push([i, j]);
  });
});

export const S07SemileAI: React.FC = () => {
  const f = useCurrentFrame();
  const n = f - OVERLAP;

  const qIn = sp(n, 70, SPRING.pop);
  const think = prog(n, 92, 100) * (1 - prog(n, 128, 134));
  const shown = Math.floor(tw(n, 132, 330, 0, ANSWER.length, E.linear));
  const aIn = sp(n, 122, SPRING.pop);
  const chips = (i: number) => sp(n, 334 + i * 6, SPRING.pop);
  const blob = (i: number) => Math.sin(n / (50 + i * 13) + i) * 40;
  const winIn = sp(n, -20, SPRING.smooth);
  const frost = n >= 0;
  const drift = keys(n, [
    [-30, 30],
    [420, -20, E.inOut],
  ]);

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden" }}>
      {/* bentuk cair lembut di balik kaca */}
      <AbsoluteFill style={{ filter: "blur(70px)", opacity: 0.85 }}>
        <div style={{ position: "absolute", left: 1080 + blob(0), top: 120 + blob(1), width: 520, height: 520, borderRadius: "50%", background: C.terracottaSoft }} />
        <div style={{ position: "absolute", left: 1380 + blob(2), top: 520 + blob(3), width: 460, height: 460, borderRadius: "50%", background: C.felixSoft }} />
        <div style={{ position: "absolute", left: 900 + blob(4), top: 640 + blob(0), width: 360, height: 360, borderRadius: "50%", background: "#F6E7C8", opacity: 0.7 }} />
      </AbsoluteFill>

      {/* jaringan simpul */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `translateX(${drift}px)` }}>
        {EDGES.map(([a, b], i) => {
          const A = NODES[a];
          const B = NODES[b];
          const d = prog(n, 10 + i * 2, 50 + i * 2, E.inOut);
          const pulse = (n * 0.012 + rand(i)) % 1;
          return (
            <g key={i}>
              <line x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * d} y2={A.y + (B.y - A.y) * d} stroke={C.charcoal} strokeOpacity={0.1} strokeWidth={1.2} />
              <circle cx={A.x + (B.x - A.x) * pulse} cy={A.y + (B.y - A.y) * pulse} r={2.5} fill={i % 3 ? C.terracotta : C.felix} opacity={0.6 * prog(n, 60, 90)} />
            </g>
          );
        })}
        {NODES.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r * sp(n, i * 3, SPRING.pop)} fill={i % 4 === 0 ? C.felix : C.terracotta} opacity={0.5} />
        ))}
      </svg>

      {/* teks kiri */}
      <div style={{ position: "absolute", left: 110, top: 220, width: 700 }}>
        <SectionLabel index="07" title="SEMILE AI" f={n} delay={4} />
        <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 104, letterSpacing: "-0.06em", color: C.charcoal, lineHeight: 0.95 }}>
            <SplitChars text="SEMILE AI" f={n} delay={10} stagger={2.4} />
          </div>
        </div>
        <div
          style={{
            marginTop: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 16px",
            borderRadius: 999,
            border: `1px solid ${C.line}`,
            background: "rgba(255,255,255,0.7)",
            fontFamily: F.mono,
            fontSize: 17,
            color: C.charcoalSoft,
            opacity: prog(n, 34, 50),
            transform: `translateY(${tw(n, 34, 56, 14, 0)}px)`,
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: 5, background: C.felix }} />
          Mile Oneace 1.0
        </div>
        <div style={{ marginTop: 56 }}>
          <Headline parts={[["Intelligence,", "sans"], ["Reimagined.", "serif"]]} f={n} delay={40} size={76} />
        </div>
        <div style={{ marginTop: 22, fontFamily: F.ui, fontSize: 21, lineHeight: 1.45, color: C.charcoalSoft, maxWidth: 560, opacity: prog(n, 90, 120) }}>
          Asisten AI yang memahami konteks infrastruktur Anda — menjawab, menganalisis, dan bertindak.
        </div>
      </div>

      {/* jendela chat kaca */}
      <Glass
        sheen={tw(n, 20, 140, 0, 1.4, E.inOut)}
        frost={frost}
        style={{ left: 940, top: 210 + (1 - winIn) * 80, width: 860, height: 660, opacity: Math.min(1, winIn * 1.4) }}
      >
        <div style={{ height: 78, display: "flex", alignItems: "center", gap: 14, padding: "0 30px", borderBottom: "1px solid rgba(38,37,34,0.07)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: C.charcoal, display: "grid", placeItems: "center" }}>
            <Icon name="spark" size={22} color={C.terracotta} stroke={2} />
          </div>
          <div style={{ fontFamily: F.ui }}>
            <div style={{ fontWeight: 600, fontSize: 19, color: C.charcoal }}>Semile AI</div>
            <div style={{ fontFamily: F.mono, fontSize: 13, color: C.muted }}>model: mile-oneace-1.0</div>
          </div>
        </div>

        <div style={{ padding: "34px 34px", fontFamily: F.ui }}>
          {/* pesan pengguna */}
          <div style={{ display: "flex", justifyContent: "flex-end", opacity: Math.min(1, qIn * 1.5), transform: `translateY(${(1 - qIn) * 24}px) scale(${0.9 + qIn * 0.1})`, transformOrigin: "right bottom" }}>
            <div style={{ maxWidth: 520, padding: "16px 22px", borderRadius: 22, borderBottomRightRadius: 6, background: C.charcoal, color: C.white, fontSize: 22, lineHeight: 1.45 }}>{QUESTION}</div>
          </div>

          {/* balasan AI streaming */}
          <div style={{ display: "flex", gap: 16, marginTop: 30, opacity: Math.min(1, aIn * 1.5), transform: `translateY(${(1 - aIn) * 20}px)` }}>
            <div style={{ width: 38, height: 38, borderRadius: 19, flexShrink: 0, background: `conic-gradient(from ${n * 3}deg, ${C.terracotta}, ${C.felix}, ${C.gold}, ${C.terracotta})`, display: "grid", placeItems: "center" }}>
              <div style={{ width: 30, height: 30, borderRadius: 15, background: C.white, display: "grid", placeItems: "center" }}>
                <Icon name="spark" size={16} color={C.terracotta} stroke={2} />
              </div>
            </div>
            <div style={{ flex: 1, fontSize: 25, lineHeight: 1.55, color: C.charcoal }}>
              {think > 0.01 ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", height: 36, opacity: think, fontSize: 17, color: C.muted }}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} style={{ width: 8, height: 8, borderRadius: 4, background: C.terracotta, opacity: 0.4 + 0.6 * ((Math.sin(n / 5 - k) + 1) / 2) }} />
                  ))}
                  <span style={{ marginLeft: 6 }}>Menganalisis 248 server…</span>
                </div>
              ) : (
                <span>
                  {/* teks penuh dirender agar tata letak stabil; bagian belum tampil transparan */}
                  <span>{ANSWER.slice(0, shown)}</span>
                  {shown < ANSWER.length && n > 130 ? (
                    <span style={{ position: "relative", display: "inline-block", width: 0, height: 0 }}>
                      <span style={{ position: "absolute", left: 2, top: -20, width: 10, height: 24, background: C.terracotta, opacity: Math.floor(n / 15) % 2 ? 1 : 0.35 }} />
                    </span>
                  ) : null}
                  <span style={{ opacity: 0 }}>{ANSWER.slice(shown)}</span>
                </span>
              )}
            </div>
          </div>

          {/* saran aksi */}
          <div style={{ display: "flex", gap: 12, marginTop: 30, marginLeft: 54 }}>
            {["Jadwalkan migrasi", "Lihat detail node-02", "Abaikan"].map((c, i) => (
              <div
                key={c}
                style={{
                  padding: "11px 18px",
                  borderRadius: 999,
                  fontSize: 16,
                  fontWeight: 500,
                  background: i === 0 ? C.terracotta : "rgba(255,255,255,0.75)",
                  color: i === 0 ? C.white : C.charcoal,
                  border: `1px solid ${i === 0 ? C.terracotta : C.line}`,
                  transform: `translateY(${(1 - chips(i)) * 16}px) scale(${0.9 + chips(i) * 0.1})`,
                  opacity: Math.min(1, chips(i) * 1.5),
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* input */}
        <div style={{ position: "absolute", left: 30, right: 30, bottom: 28, height: 62, borderRadius: 31, background: "rgba(255,255,255,0.8)", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px 0 26px", fontFamily: F.ui, fontSize: 17, color: C.muted }}>
          Tanya Semile apa saja…
          <div style={{ width: 44, height: 44, borderRadius: 22, background: C.charcoal, display: "grid", placeItems: "center" }}>
            <Icon name="arrow" size={20} color={C.white} stroke={2.2} style={{ transform: "rotate(-90deg)" }} />
          </div>
        </div>
      </Glass>

      {/* kartu kaca kecil melayang (depth) */}
      <Glass radius={22} frost={frost} sheen={tw(n, 60, 180, 0, 1.4)} style={{ left: 1600, top: 120 + Math.sin(n / 40) * 8, width: 230, height: 92, opacity: prog(n, 150, 175), padding: "18px 20px" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: C.muted }}>latensi</div>
        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: C.charcoal, letterSpacing: "-0.03em" }}>{Math.round(tw(n, 150, 220, 0, 184))} ms</div>
      </Glass>
      <Glass radius={22} frost={frost} sheen={tw(n, 80, 200, 0, 1.4)} style={{ left: 860, top: 820 + Math.sin(n / 36) * 8, width: 250, height: 92, opacity: prog(n, 170, 195), padding: "18px 20px" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: C.muted }}>konteks</div>
        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: C.charcoal, letterSpacing: "-0.03em" }}>{Math.round(tw(n, 170, 240, 0, 128))}K token</div>
      </Glass>
    </AbsoluteFill>
  );
};
