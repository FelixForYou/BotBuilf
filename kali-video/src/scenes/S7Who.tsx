import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { CommandBar, Eyebrow, Headline } from "../components/Ui";
import { C, FONT, MONO, PAD, SHADOW } from "../theme";
import { beat, prog, spr } from "../timing";

const PEOPLE: { icon: IconName; title: string; sub: string; color: string; bg: string }[] = [
  { icon: "search", title: "Peneliti keamanan", sub: "cybersecurity researcher", color: C.blue, bg: C.blueSoft },
  { icon: "target", title: "Pentester", sub: "penetration tester", color: C.orange, bg: C.orangeSoft },
  { icon: "monitor", title: "Analis keamanan", sub: "security analyst", color: C.green, bg: C.greenSoft },
  { icon: "fingerprint", title: "Investigator forensik", sub: "digital forensics", color: C.violet, bg: C.violetSoft },
  { icon: "cap", title: "Mahasiswa", sub: "yang lagi belajar", color: "#0891b2", bg: "#e3f6fa" },
];

export const S7Who: React.FC = () => {
  const f = useCurrentFrame();
  const send = beat("s7", "send");
  const tip = beat("s7", "tip");
  const toTip = prog(f, tip, 20);
  const ts = Math.min(1, spr(f, tip, 14, 140));

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 150, width: 940 }}>
        <Eyebrow text="06 · PENGGUNA" start={send} />
        <div style={{ marginTop: 22 }}>
          <Headline words={["Yang", "pakai", { t: "siapa?", accent: "blue" }]} start={send + 4} />
        </div>
      </div>

      <div style={{ position: "absolute", left: PAD, top: 430, width: 940, opacity: 1 - toTip * 0.25 }}>
        {PEOPLE.map((p, i) => {
          const st = beat("s7", `w${i}`);
          const s = Math.min(1, spr(f, st, 13, 160));
          return (
            <div key={p.title} style={{ display: "flex", alignItems: "center", gap: 24, height: 100, padding: "0 26px", marginBottom: 12, borderRadius: 22, background: "#fff", border: `1.5px solid ${C.line}`, boxShadow: SHADOW, opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
              <div style={{ width: 72, height: 72, borderRadius: 36, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={p.icon} size={40} color={p.color} stroke={2.2} draw={prog(f, st, 24)} />
              </div>
              <div>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: C.ink, letterSpacing: -1 }}>{p.title}</div>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.faint }}>{p.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* official advice */}
      <div style={{ position: "absolute", left: PAD, top: 1010, width: 940, padding: "30px 36px", borderRadius: 26, background: "#fffaf0", border: `2px solid ${C.orange}55`, boxShadow: SHADOW, opacity: ts, transform: `translateY(${(1 - ts) * 60}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 20, color: C.orange, letterSpacing: 2 }}>
          <Icon name="book" size={28} color={C.orange} stroke={2.3} /> SARAN TIM KALI
        </div>
        <div style={{ marginTop: 14, fontFamily: FONT, fontWeight: 800, fontSize: 48, color: C.ink, letterSpacing: -2, lineHeight: 1.1 }}>
          Masih pemula? Kuasai <span style={{ color: C.blue }}>dasar Linux</span> dulu.
        </div>
        <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 18, color: C.faint }}>kali.org/docs · "Should I Use Kali Linux?"</div>
      </div>

      <CommandBar query="siapa yang pakai?" typeAt={beat("s7", "type")} sendAt={send} />
    </AbsoluteFill>
  );
};
