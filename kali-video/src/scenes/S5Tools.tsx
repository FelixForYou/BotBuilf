import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { CommandBar, Eyebrow, Headline, Select } from "../components/Ui";
import { C, FONT, MONO, PAD, SHADOW } from "../theme";
import { beat, prog, spr } from "../timing";

// Logos & versions from kali.org (homepage tool showcase + kali.org/tools/<name>)
const TOOLS = [
  { logo: "img/tool-logo-nmap.svg", name: "Nmap", fn: "metain jaringan & port", ver: "7.99" },
  { logo: "img/tool-logo-wireshark.svg", name: "Wireshark", fn: "analisis lalu lintas", ver: "4.6.6" },
  { logo: "img/tool-logo-metasploit.svg", name: "Metasploit", fn: "riset kerentanan", ver: "6.5.3" },
  { logo: "img/tool-logo-burp.svg", name: "Burp Suite", fn: "tes keamanan web", ver: "2026.8" },
  { logo: "img/tool-logo-john.svg", name: "John the Ripper", fn: "cek password lemah", ver: "1.9.0" },
];
const CLOUD = ["aircrack-ng", "hydra", "sqlmap", "maltego", "responder", "ffuf", "netexec", "nuclei", "feroxbuster", "gitleaks", "sherlock", "rustscan", "powershell-empire", "starkiller", "httpx-toolkit", "subfinder"];
const CW = 460;
const CH = 270;
const pos = (i: number) => ({ x: PAD + (i % 2) * (CW + 20), y: 450 + Math.floor(i / 2) * (CH + 20) });

export const S5Tools: React.FC = () => {
  const f = useCurrentFrame();
  const send = beat("s5", "send");
  const cloud = beat("s5", "cloud");
  const starts = [1, 2, 3, 4, 5].map((i) => beat("s5", `c${i}`));
  const active = starts.reduce((a, s, i) => (f >= s ? i : a), -1);
  const cloudOut = prog(f, starts[0] - 14, 18);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 150, width: 940 }}>
        <Eyebrow text="04 · TOOLS" start={send} />
        <div style={{ marginTop: 22 }}>
          <Headline words={["Ratusan", { t: "tools.", accent: "blue" }]} start={send + 4} />
        </div>
      </div>

      {/* hundreds of tools: a cloud of real Kali package names */}
      <div style={{ position: "absolute", left: PAD, top: 470, width: 940, display: "flex", flexWrap: "wrap", gap: 14, opacity: 1 - cloudOut, filter: `blur(${cloudOut * 6}px)` }}>
        {[...TOOLS.map((t) => t.name.toLowerCase().split(" ")[0]), ...CLOUD].map((n, i) => {
          const p = prog(f, cloud + i * 2.5, 16);
          return (
            <span key={n} style={{ fontFamily: MONO, fontSize: 28, color: i < 5 ? C.blue : C.muted, background: i < 5 ? C.blueSoft : "#fff", border: `1.5px solid ${i < 5 ? "transparent" : C.line}`, borderRadius: 12, padding: "10px 16px", opacity: p, transform: `translateY(${(1 - p) * 20 + Math.sin(f / 25 + i) * 3}px)` }}>
              {n}
            </span>
          );
        })}
        <span style={{ fontFamily: MONO, fontSize: 28, color: C.faint, padding: "10px 6px", opacity: prog(f, cloud + 60, 16) }}>+ ratusan lainnya</span>
      </div>

      {TOOLS.map((t, i) => {
        const s = Math.min(1, spr(f, starts[i], 13, 150));
        const p = pos(i);
        const isAct = active === i;
        return (
          <div key={t.name} style={{ position: "absolute", left: p.x, top: p.y, width: CW, height: CH, borderRadius: 24, background: "#fff", border: `1.5px solid ${C.line}`, boxShadow: SHADOW, opacity: s * (isAct || active > 4 ? 1 : 0.6), transform: `translateY(${(1 - s) * 50}px) scale(${0.92 + 0.08 * s})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Img src={staticFile(t.logo)} style={{ width: 110, height: 110, objectFit: "contain" }} />
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: C.ink, letterSpacing: -1 }}>{t.name}</div>
            <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted, fontWeight: 500 }}>{t.fn}</div>
            <div style={{ position: "absolute", top: 16, right: 18, fontFamily: MONO, fontSize: 16, color: C.faint }}>v{t.ver}</div>
          </div>
        );
      })}
      {/* sixth slot */}
      <div style={{ position: "absolute", left: pos(5).x, top: pos(5).y, width: CW, height: CH, borderRadius: 24, border: `2px dashed ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, opacity: prog(f, starts[4] + 20, 20) }}>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, color: C.blue }}>+</span>
        <span style={{ fontFamily: FONT, fontSize: 26, color: C.muted, fontWeight: 600 }}>ratusan lainnya</span>
        <span style={{ fontFamily: MONO, fontSize: 18, color: C.faint }}>kali.org/tools</span>
      </div>
      {active >= 0 ? <Select x={pos(active).x - 6} y={pos(active).y - 6} w={CW + 12} h={CH + 12} start={starts[active] + 2} end={active < 4 ? starts[active + 1] : starts[4] + 60} label={`top10 · ${TOOLS[active].name.toLowerCase()}`} /> : null}

      <CommandBar query="tools populernya?" typeAt={beat("s5", "type")} sendAt={send} />
    </AbsoluteFill>
  );
};
