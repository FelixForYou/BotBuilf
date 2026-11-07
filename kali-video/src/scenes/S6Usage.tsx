import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { KaliTerminal, TermLine } from "../components/KaliTerminal";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, scene, spr } from "../timing";

const Step: React.FC<{ start: number; n: number; icon: IconName; label: string; color: string; x: number; y: number }> = ({ start, n, icon, label, color, x, y }) => {
  const f = useCurrentFrame();
  const s = spr(f, start, 13, 150);
  const act = f >= start;
  return (
    <div style={{ position: "absolute", left: x - 120, top: y - 80, width: 240, textAlign: "center", opacity: act ? 1 : 0.25, transform: `scale(${act ? 0.85 + 0.15 * Math.min(1, s) : 0.85})` }}>
      <div style={{ width: 120, height: 120, margin: "0 auto", borderRadius: 60, border: `3px solid ${color}`, background: `${color}1f`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: act ? `0 0 40px ${color}66` : undefined }}>
        <Icon name={icon} size={60} color={color} draw={act ? prog(f, start, 26) : 1} />
      </div>
      <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted, marginTop: 12 }}>LANGKAH {n}</div>
      <div style={{ fontFamily: FONT, fontSize: 30, color: C.text, fontWeight: 700 }}>{label}</div>
    </div>
  );
};

export const S6Usage: React.FC = () => {
  const f = useCurrentFrame();
  const sc = scene("s6");
  const term = beat("s6", "term");
  const lab = beat("s6", "lab");
  const goal = beat("s6", "goal");
  const st = [1, 2, 3, 4].map((i) => beat("s6", `st${i}`));

  const deskIn = prog(f, 0, 40);
  const dolly = interpolate(f, [0, term + 40], [1.0, 1.12], { extrapolateRight: "clamp", easing: easeInOut });
  const toLab = prog(f, lab, 30, easeInOut);
  const toGoal = prog(f, goal, 26, easeInOut);

  const t1 = beat("s6", "type1");
  const t2 = beat("s6", "type2");
  const t3 = beat("s6", "type3");
  const lines: TermLine[] = [
    { at: t1, kind: "cmd", text: "whoami", typeDur: 18 },
    { at: t1 + 22, kind: "out", segs: [{ text: "kali", color: C.text }] },
    { at: t2, kind: "cmd", text: "grep PRETTY /etc/os-release", typeDur: 26 },
    { at: t2 + 30, kind: "out", segs: [{ text: 'PRETTY_NAME="Kali GNU/Linux Rolling"', color: C.text }] },
    { at: t3, kind: "cmd", text: "nmap --version", typeDur: 20 },
    { at: t3 + 26, kind: "out", segs: [{ text: "Nmap version 7.99 ( https://nmap.org )", color: C.cyan }] },
  ];

  // loop arrows between steps
  const pts = [
    [560, 530],
    [960, 330],
    [1360, 530],
    [960, 720],
  ];

  return (
    <AbsoluteFill>
      {/* Desktop: official Kali screenshot (kali.org) inside a display frame */}
      <div
        style={{
          position: "absolute",
          left: 210,
          top: 150,
          width: 1500,
          height: 844,
          borderRadius: 22,
          overflow: "hidden",
          border: `2px solid ${C.kali}88`,
          boxShadow: `0 50px 120px rgba(0,0,0,0.6), 0 0 120px ${C.kali}33`,
          opacity: deskIn * (1 - toLab),
          transform: `perspective(2200px) rotateX(${(1 - deskIn) * 14}deg) scale(${0.96 + 0.04 * deskIn - toLab * 0.08})`,
          filter: `blur(${toLab * 8}px)`,
        }}
      >
        <Img src={staticFile("img/notebook-kali-2024.1.jpg")} style={{ width: 1500, height: 844, transform: `scale(${dolly})`, transformOrigin: "30% 45%" }} />
        <div style={{ position: "absolute", left: 20, bottom: 18, padding: "6px 14px", borderRadius: 8, background: "rgba(0,0,0,0.6)", fontFamily: MONO, fontSize: 18, color: C.muted }}>screenshot desktop resmi · kali.org</div>
      </div>

      {/* terminal over the desktop */}
      <div style={{ opacity: 1 - toLab }}>
        <KaliTerminal x={820} y={380} w={980} h={420} lines={lines} start={term} fontSize={27} title="kali@kali: ~" />
        <div style={{ position: "absolute", left: 820, top: 820, width: 980, display: "flex", gap: 16, opacity: prog(f, t3 + 30, 20) }}>
          {[
            ["whoami", "siapa saya?"],
            ["grep", "cari teks"],
            ["nmap", "cek versi tool"],
          ].map(([c, d]) => (
            <div key={c} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(6,11,24,0.9)", border: `1px solid ${C.kali}66`, fontFamily: MONO, fontSize: 20, color: C.text }}>
              <span style={{ color: C.cyan }}>{c}</span> = {d}
            </div>
          ))}
        </div>
      </div>

      {/* private lab cycle */}
      <div style={{ position: "absolute", inset: 0, opacity: toLab * (1 - toGoal * 0.85) }}>
        <div style={{ position: "absolute", left: 300, top: 170, width: 1320, height: 690, borderRadius: 30, border: `2px dashed ${C.green}88`, background: `${C.green}08` }} />
        <div style={{ position: "absolute", left: 330, top: 186, display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 24, color: C.green, letterSpacing: 4 }}>
          <Icon name="shieldCheck" size={30} color={C.green} /> LAB PRIBADI · MESIN MILIK SENDIRI
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {pts.map((p, i) => {
            const q = pts[(i + 1) % 4];
            const pr = prog(f, st[i] + 10, 26);
            const mx = (p[0] + q[0]) / 2 + (q[1] - p[1]) * 0.25;
            const my = (p[1] + q[1]) / 2 - (q[0] - p[0]) * 0.25;
            return <path key={i} d={`M ${p[0]} ${p[1]} Q ${mx} ${my} ${q[0]} ${q[1]}`} fill="none" stroke={C.kali} strokeWidth={3} strokeDasharray="1" pathLength={1} strokeDashoffset={1 - pr} opacity={0.7} />;
          })}
        </svg>
        <Step start={st[0]} n={1} icon="search" label="Uji mesin lab" color={C.cyan} x={pts[0][0]} y={pts[0][1]} />
        <Step start={st[1]} n={2} icon="alert" label="Temukan kelemahan" color={C.orange} x={pts[1][0]} y={pts[1][1]} />
        <Step start={st[2]} n={3} icon="wrench" label="Perbaiki" color={C.kali} x={pts[2][0]} y={pts[2][1]} />
        <Step start={st[3]} n={4} icon="check" label="Uji ulang: aman" color={C.green} x={pts[3][0]} y={pts[3][1]} />
        <div style={{ position: "absolute", left: 960 - 90, top: 530 - 50, width: 180, textAlign: "center", opacity: prog(f, st[0], 20) }}>
          <Icon name="laptop" size={80} color={C.text} />
          <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted }}>Kali Linux</div>
        </div>
      </div>

      {/* goal */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", opacity: toGoal * (1 - prog(f, sc.dur - 16, 16)), transform: `scale(${0.9 + 0.1 * toGoal})` }}>
        <div style={{ filter: `drop-shadow(0 0 30px ${C.green})`, display: "inline-block" }}>
          <Icon name="shieldCheck" size={150} color={C.green} stroke={1.4} draw={toGoal} />
        </div>
        <div style={{ fontFamily: FONT, fontSize: 80, fontWeight: 700, color: C.text, marginTop: 10 }}>
          Tujuan: sistem <span style={{ color: C.green }}>lebih aman</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
