import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { Card, CommandBar, Eyebrow, Headline } from "../components/Ui";
import { C, FONT, MONO, PAD, SHADOW } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

type Ln = { at: number; cmd?: string; out?: string; color?: string; dur?: number };

const LightTerm: React.FC<{ lines: Ln[] }> = ({ lines }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ fontFamily: MONO, fontSize: 25, lineHeight: 1.65, color: C.text }}>
      {lines.map((l, i) => {
        if (f < l.at) return null;
        if (l.cmd) {
          const n = Math.floor(interpolate(f, [l.at, l.at + (l.dur ?? 20)], [0, l.cmd.length], { extrapolateRight: "clamp" }));
          return (
            <div key={i}>
              <span style={{ color: C.blue, fontWeight: 700 }}>kali@kali</span>
              <span style={{ color: C.faint }}>:~$ </span>
              {l.cmd.slice(0, n)}
            </div>
          );
        }
        return (
          <div key={i} style={{ color: l.color ?? C.muted, opacity: prog(f, l.at, 8) }}>
            {l.out}
          </div>
        );
      })}
    </div>
  );
};

const Step: React.FC<{ start: number; icon: IconName; title: string; color: string; bg: string; n: number }> = ({ start, icon, title, color, bg, n }) => {
  const f = useCurrentFrame();
  const s = Math.min(1, spr(f, start, 14, 160));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, height: 118, padding: "0 28px", borderRadius: 22, background: "#fff", border: `1.5px solid ${C.line}`, boxShadow: SHADOW, marginBottom: 18, opacity: s, transform: `translateX(${(1 - s) * 50}px)` }}>
      <div style={{ width: 70, height: 70, borderRadius: 18, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={40} color={color} stroke={2.3} draw={prog(f, start, 24)} />
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 18, color: C.faint }}>LANGKAH {n}</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: C.ink, letterSpacing: -1 }}>{title}</div>
      </div>
    </div>
  );
};

export const S6Usage: React.FC = () => {
  const f = useCurrentFrame();
  const send = beat("s6", "send");
  const desk = beat("s6", "desk");
  const term = beat("s6", "term");
  const ty = beat("s6", "typing");
  const lab = beat("s6", "lab");
  const goal = beat("s6", "goal");
  const toLab = prog(f, lab, 18, easeInOut);
  const dolly = interpolate(f, [desk, lab], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gs = Math.min(1, spr(f, goal, 12, 140));

  const lines: Ln[] = [
    { at: ty, cmd: "whoami", dur: 12 },
    { at: ty + 16, out: "kali", color: C.ink },
    { at: ty + 24, cmd: "grep PRETTY /etc/os-release", dur: 26 },
    { at: ty + 54, out: 'PRETTY_NAME="Kali GNU/Linux Rolling"', color: C.ink },
    { at: ty + 62, cmd: "nmap --version", dur: 14 },
    { at: ty + 80, out: "Nmap version 7.99 ( https://nmap.org )", color: C.blue },
  ];

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 150, width: 940 }}>
        <Eyebrow text="05 · CARA PAKAI" start={send} />
        <div style={{ marginTop: 22 }}>
          <Headline words={["Kayak", { t: "gini.", accent: "serif" }]} start={send + 4} out={lab - 8} />
        </div>
        <div style={{ position: "absolute", top: 46 }}>
          {f >= lab - 8 ? <Headline words={["Uji,", "temukan,", { t: "perbaiki.", accent: "blue" }]} start={lab - 2} size={86} /> : null}
        </div>
      </div>

      {/* desktop screenshot (official, kali.org) */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - toLab, transform: `translateY(${-toLab * 40}px)` }}>
        <Card y={430} h={58 + 529} pad={0} title="desktop" meta="screenshot resmi · kali.org" start={desk}>
          <div style={{ width: 940, height: 529, overflow: "hidden" }}>
            <Img src={staticFile("img/notebook-kali-2024.1.jpg")} style={{ width: 940, height: 529, transform: `scale(${dolly})`, transformOrigin: "25% 40%" }} />
          </div>
        </Card>
        <Card y={940} h={58 + 280} title="Terminal" meta="kali@kali: ~" start={term}>
          <LightTerm lines={lines} />
        </Card>
      </div>

      {/* lab loop */}
      <div style={{ position: "absolute", left: PAD, top: 440, width: 940, opacity: toLab * (1 - prog(f, goal - 8, 12)) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 20, color: C.green, marginBottom: 20 }}>
          <Icon name="shieldCheck" size={26} color={C.green} stroke={2.4} /> LAB PRIBADI · MESIN MILIK SENDIRI
        </div>
        <Step start={beat("s6", "st0")} n={1} icon="search" title="Uji mesin lab" color={C.blue} bg={C.blueSoft} />
        <Step start={beat("s6", "st1")} n={2} icon="alert" title="Temukan kelemahan" color={C.orange} bg={C.orangeSoft} />
        <Step start={beat("s6", "st2")} n={3} icon="wrench" title="Perbaiki" color={C.violet} bg={C.violetSoft} />
        <Step start={beat("s6", "st3")} n={4} icon="check" title="Uji ulang: aman" color={C.green} bg={C.greenSoft} />
      </div>

      {/* goal */}
      <div style={{ position: "absolute", left: PAD, top: 620, width: 940, display: "flex", flexDirection: "column", alignItems: "center", opacity: gs, transform: `scale(${0.8 + 0.2 * gs})` }}>
        <div style={{ width: 220, height: 220, borderRadius: 110, background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 30px 70px ${C.green}33` }}>
          <Icon name="shieldCheck" size={130} color={C.green} stroke={1.8} draw={prog(f, goal, 30)} />
        </div>
        <div style={{ marginTop: 36, fontFamily: FONT, fontWeight: 800, fontSize: 84, letterSpacing: -3, color: C.ink }}>
          Lebih <span style={{ color: C.green }}>aman.</span>
        </div>
      </div>

      <CommandBar query="cara pakainya?" typeAt={beat("s6", "type")} sendAt={send} />
    </AbsoluteFill>
  );
};
