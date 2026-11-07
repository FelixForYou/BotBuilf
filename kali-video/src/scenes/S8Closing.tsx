import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Decode } from "../components/Fx";
import { Icon, IconName } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, scene, spr } from "../timing";

const Key: React.FC<{ start: number; icon: IconName; text: string; x: number; y: number }> = ({ start, icon, text, x, y }) => {
  const f = useCurrentFrame();
  const s = spr(f, start, 12, 150);
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 18, padding: "18px 28px", borderRadius: 18, background: C.panel, border: `1.5px solid ${C.kali}99`, opacity: Math.min(1, s), transform: `scale(${0.7 + 0.3 * Math.min(1, s)})` }}>
      <Icon name={icon} size={46} color={C.cyan} draw={prog(f, start, 26)} />
      <span style={{ fontFamily: FONT, fontSize: 36, fontWeight: 700, color: C.text }}>{text}</span>
    </div>
  );
};

export const S8Closing: React.FC = () => {
  const f = useCurrentFrame();
  const sc = scene("s8");
  const versus = beat("s8", "versus");
  const strike = beat("s8", "strike");
  const legal = beat("s8", "legal");
  const fin = beat("s8", "final");
  const ftext = beat("s8", "ftext");

  const recapIn = prog(f, beat("s8", "recap"), 30);
    const toLegal = prog(f, legal, 28, easeInOut);
  const toFinal = prog(f, fin, 30, easeInOut);
  const strikeP = prog(f, strike, 16);
  const protect = spr(f, beat("s8", "protect"), 12, 140);
  const fs = spr(f, ftext, 13, 120);
  const fade = prog(f, sc.dur - 40, 40, easeInOut);

  return (
    <AbsoluteFill>
      {/* recap */}
      <div style={{ position: "absolute", inset: 0, opacity: recapIn * (1 - prog(f, versus - 6, 12)) }}>
        <div style={{ position: "absolute", left: 960 - 200, top: 330, width: 400, height: 226, filter: `drop-shadow(0 0 40px ${C.kali}88)` }}>
          <Img src={staticFile("img/kali-logo.svg")} style={{ width: 400, height: 226 }} />
        </div>
        <Key start={beat("s8", "k0")} icon="layers" text="Berbasis Debian" x={200} y={240} />
        <Key start={beat("s8", "k1")} icon="package" text="Ratusan tools keamanan" x={1240} y={240} />
        <Key start={beat("s8", "k2")} icon="shieldCheck" text="Menguji & meningkatkan keamanan" x={600} y={640} />
      </div>

      {/* hacking vs protecting */}
      <div style={{ position: "absolute", inset: 0, opacity: prog(f, versus + 4, 20) * (1 - toLegal) }}>
        <div style={{ position: "absolute", left: 260, top: 340, width: 600, height: 300, borderRadius: 26, border: `2px solid ${C.red}66`, background: `${C.red}0d`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 1 - strikeP * 0.55 }}>
          <Icon name="bug" size={90} color={C.red} />
          <div style={{ position: "relative", fontFamily: FONT, fontSize: 56, fontWeight: 700, color: C.text, marginTop: 14 }}>
            Sekadar meretas
            <div style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 7, background: C.red, transform: `scaleX(${strikeP})`, transformOrigin: "left", borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 1060, top: 320, width: 620, height: 340, borderRadius: 26, border: `3px solid ${C.green}`, background: `${C.green}14`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: Math.min(1, protect), transform: `scale(${0.8 + 0.2 * Math.min(1.1, protect)})`, boxShadow: `0 0 70px ${C.green}44` }}>
          <Icon name="shieldCheck" size={110} color={C.green} draw={prog(f, beat("s8", "protect"), 26)} />
          <div style={{ fontFamily: FONT, fontSize: 64, fontWeight: 700, color: C.text, marginTop: 14 }}>Melindungi</div>
        </div>
        <div style={{ position: "absolute", left: 930, top: 460, fontFamily: MONO, fontSize: 40, color: C.muted }}>vs</div>
      </div>

      {/* legal & responsible */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", opacity: toLegal * (1 - toFinal) }}>
        <Icon name="scale" size={140} color={C.kali} stroke={1.4} draw={toLegal} />
        <div style={{ display: "flex", gap: 30, marginTop: 40 }}>
          {["Legal", "Berizin", "Bertanggung jawab"].map((t, i) => {
            const p = prog(f, legal + 10 + i * 10, 20);
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 30px", borderRadius: 999, border: `2px solid ${C.green}aa`, background: `${C.green}14`, fontFamily: FONT, fontSize: 44, fontWeight: 700, color: C.text, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
                <Icon name="check" size={40} color={C.green} /> {t}
              </div>
            );
          })}
        </div>
      </div>

      {/* final line */}
      <div style={{ position: "absolute", inset: 0, opacity: toFinal * (1 - fade) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center" }}>
          <div style={{ fontFamily: FONT, fontSize: 104, fontWeight: 700, color: C.text, lineHeight: 1.1, letterSpacing: interpolate(Math.min(1, fs), [0, 1], [30, -1]), filter: `blur(${(1 - Math.min(1, fs)) * 14}px)` }}>
            Understand Security.
          </div>
          <div style={{ fontFamily: FONT, fontSize: 104, fontWeight: 700, color: C.kali, lineHeight: 1.1, textShadow: `0 0 50px ${C.kali}aa`, opacity: prog(f, ftext + 16, 24), transform: `translateY(${(1 - prog(f, ftext + 16, 24)) * 40}px)` }}>
            Build Better Protection.
          </div>
          <div style={{ margin: "40px auto 0", width: 1000, height: 3, background: `linear-gradient(90deg, transparent, ${C.kali}, ${C.cyan}, transparent)`, transform: `scaleX(${prog(f, ftext + 30, 40)})` }} />
          <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: C.muted }}>
            <Decode text="MENGENAL KALI LINUX · kali.org" start={ftext + 40} dur={36} seed="end" />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
