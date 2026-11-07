import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { CommandBar, Eyebrow, Headline, Select } from "../components/Ui";
import { C, FONT, MONO, PAD } from "../theme";
import { beat, prog, spr } from "../timing";

const ROWS: { icon: IconName; title: string; sub: string; color: string; bg: string }[] = [
  { icon: "target", title: "Penetration testing", sub: "uji keamanan, wajib izin", color: C.blue, bg: C.blueSoft },
  { icon: "network", title: "Network security", sub: "audit jaringan", color: C.green, bg: C.greenSoft },
  { icon: "globe", title: "Web app security", sub: "cari celah web", color: C.orange, bg: C.orangeSoft },
  { icon: "fingerprint", title: "Digital forensics", sub: "analisis bukti", color: C.violet, bg: C.violetSoft },
  { icon: "list", title: "Vulnerability assessment", sub: "nilai kelemahan", color: C.red, bg: C.redSoft },
  { icon: "wifi", title: "Wireless security", sub: "uji keamanan WiFi", color: "#0891b2", bg: "#e3f6fa" },
];
const TOP = 450;
const STEP = 132;

export const S4Functions: React.FC = () => {
  const f = useCurrentFrame();
  const send = beat("s4", "send");
  const starts = [1, 2, 3, 4, 5, 6].map((i) => beat("s4", `r${i}`));
  const active = starts.reduce((a, s, i) => (f >= s ? i : a), -1);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 150, width: 940 }}>
        <Eyebrow text="03 · FUNGSI" start={send} />
        <div style={{ marginTop: 22 }}>
          <Headline words={["Fungsinya", { t: "apa", accent: "blue" }, { t: "aja?", accent: "blue" }]} start={send + 4} />
        </div>
      </div>

      {ROWS.map((r, i) => {
        const s = Math.min(1, spr(f, starts[i], 14, 160));
        const done = f >= beat("s4", `k${i + 1}`);
        const isAct = active === i;
        return (
          <div
            key={r.title}
            style={{
              position: "absolute",
              left: PAD,
              top: TOP + i * STEP,
              width: 940,
              height: 112,
              borderRadius: 20,
              background: r.bg,
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "0 26px",
              opacity: f < starts[i] ? 0.0 : s * (isAct ? 1 : 0.72),
              transform: `translateX(${(1 - s) * 60}px) scale(${isAct ? 1 : 0.985})`,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 22, color: r.color, fontWeight: 700 }}>0{i + 1}</span>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={r.icon} size={38} color={r.color} stroke={2.2} draw={prog(f, starts[i], 26)} />
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: C.ink, letterSpacing: -1 }}>{r.title}</div>
              <div style={{ fontFamily: FONT, fontSize: 23, color: C.muted, fontWeight: 500 }}>{r.sub}</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ width: 44, height: 44, borderRadius: 22, background: done ? r.color : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${done ? Math.min(1.1, spr(f, beat("s4", `k${i + 1}`), 10, 200)) : 1})` }}>
              {done ? <Icon name="check" size={26} color="#fff" stroke={3} /> : null}
            </div>
          </div>
        );
      })}
      {active >= 0 ? <Select x={PAD - 6} y={TOP + active * STEP - 6} w={952} h={124} start={starts[active] + 2} end={active < 5 ? starts[active + 1] : undefined} label={`fungsi ${active + 1} / 6`} /> : null}

      <CommandBar query="fungsinya apa aja?" typeAt={beat("s4", "type")} sendAt={send} />
    </AbsoluteFill>
  );
};
