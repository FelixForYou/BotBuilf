import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

const PEOPLE: { icon: IconName; title: string; sub: string }[] = [
  { icon: "search", title: "Cybersecurity Researcher", sub: "meneliti ancaman & celah" },
  { icon: "target", title: "Penetration Tester", sub: "uji keamanan berizin" },
  { icon: "monitor", title: "Security Analyst", sub: "memantau & menganalisis" },
  { icon: "fingerprint", title: "Forensics Investigator", sub: "menelusuri bukti digital" },
  { icon: "cap", title: "Mahasiswa & Pelajar", sub: "belajar keamanan siber" },
];

export const S7Who: React.FC = () => {
  const f = useCurrentFrame();
  const qIn = prog(f, 0, 22);
  const times = [0, 1, 2, 3, 4].map((i) => beat("s7", `w${i}`));
  const tip = beat("s7", "tip");
  const toTip = prog(f, tip, 28, easeInOut);
  const qUp = prog(f, times[0] - 20, 30, easeInOut);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 440 - qUp * 290, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 110 - qUp * 46, color: C.text, opacity: qIn }}>
        Siapa <span style={{ color: C.kali }}>penggunanya?</span>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: 1 - toTip * 0.75, transform: `translateY(${-toTip * 70}px) scale(${1 - toTip * 0.1})`, filter: `blur(${toTip * 3}px)` }}>
        {PEOPLE.map((p, i) => {
          const s = spr(f, times[i], 12, 140);
          const x = 160 + i * 330;
          return (
            <div key={p.title} style={{ position: "absolute", left: x, top: 330, width: 300, textAlign: "center", opacity: Math.min(1, s), transform: `translateY(${(1 - Math.min(1, s)) * 80}px)` }}>
              <div style={{ position: "relative", width: 190, height: 190, margin: "0 auto" }}>
                <svg width={190} height={190} viewBox="-95 -95 190 190" style={{ position: "absolute", inset: 0 }}>
                  <circle r={88} fill={`${C.kali}18`} stroke={C.kali} strokeWidth={2} />
                  <g transform={`rotate(${f * (i % 2 ? -1 : 1) * 0.8})`}>
                    <circle r={80} fill="none" stroke={C.cyan} strokeWidth={3} strokeDasharray="40 22" opacity={0.7} />
                  </g>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={p.icon} size={84} color={C.cyan} draw={prog(f, times[i], 28)} />
                </div>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: C.text, marginTop: 20, lineHeight: 1.15 }}>{p.title}</div>
              <div style={{ fontFamily: FONT, fontSize: 23, color: C.muted, marginTop: 6 }}>{p.sub}</div>
            </div>
          );
        })}
      </div>

      {/* official advice for beginners */}
      <div style={{ position: "absolute", left: 360, top: 560, width: 1200, padding: "30px 40px", borderRadius: 22, background: "rgba(6,11,24,0.95)", border: `2px solid ${C.yellow}99`, display: "flex", gap: 30, alignItems: "center", opacity: toTip, transform: `translateY(${(1 - toTip) * 60}px)`, boxShadow: `0 0 60px ${C.yellow}22` }}>
        <Icon name="book" size={86} color={C.yellow} draw={toTip} />
        <div>
          <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: C.yellow }}>SARAN RESMI TIM KALI</div>
          <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 700, color: C.text, marginTop: 6 }}>Pemula: kuasai dasar Linux dulu.</div>
          <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted, marginTop: 10 }}>kali.org/docs · "Should I Use Kali Linux?"</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
