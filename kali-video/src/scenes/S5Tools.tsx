import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog } from "../timing";

// Logos, descriptions and versions: kali.org homepage + kali.org/tools/<name> (all in the "top10" metapackage)
const TOOLS = [
  { logo: "img/tool-logo-nmap.svg", name: "Nmap", fn: "Pemetaan jaringan & pemindaian port", ver: "nmap 7.99", note: "“utility for network exploration or security auditing”" },
  { logo: "img/tool-logo-wireshark.svg", name: "Wireshark", fn: "Analisis lalu lintas jaringan", ver: "wireshark 4.6.6", note: "menangkap & membedah paket jaringan" },
  { logo: "img/tool-logo-metasploit.svg", name: "Metasploit Framework", fn: "Riset kerentanan & uji eksploitasi", ver: "metasploit-framework 6.5.3", note: "platform open source untuk riset kerentanan" },
  { logo: "img/tool-logo-burp.svg", name: "Burp Suite", fn: "Pengujian keamanan aplikasi web", ver: "burpsuite 2026.8", note: "platform terpadu untuk uji keamanan web" },
  { logo: "img/tool-logo-john.svg", name: "John the Ripper", fn: "Audit keamanan kata sandi", ver: "john 1.9.0", note: "membantu admin menemukan password lemah" },
];

// Real tool names shown on kali.org (homepage tool showcase + this video's five)
const CLOUD = ["nmap", "wireshark", "metasploit-framework", "burpsuite", "john", "aircrack-ng", "hydra", "sqlmap", "maltego", "responder", "ffuf", "netexec", "powershell-empire", "starkiller", "rustscan", "nuclei", "feroxbuster", "httpx-toolkit", "sherlock", "gitleaks"];

export const S5Tools: React.FC = () => {
  const f = useCurrentFrame();
  const grid = beat("s5", "grid");
  const starts = [1, 2, 3, 4, 5].map((i) => beat("s5", `t${i}`));
  const toCards = prog(f, starts[0] - 20, 30, easeInOut);
  // carousel glides to card i when its narration starts
  const posSmooth = interpolate(
    f,
    starts.flatMap((st) => [st, st + 24]),
    starts.flatMap((_, i) => [Math.max(0, i - 1), i]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut },
  );

  return (
    <AbsoluteFill>
      {/* "hundreds of tools" cloud */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - toCards * 0.96, filter: `blur(${toCards * 6}px)` }}>
        {CLOUD.map((n, i) => {
          const p = prog(f, grid + i * 2, 24);
          const x = 140 + random(`cx${i}`) * 1500;
          const y = 200 + random(`cy${i}`) * 560;
          const big = i < 5;
          return (
            <div key={n} style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontSize: big ? 38 : 26, color: big ? C.text : C.muted, padding: "8px 18px", border: `1.5px solid ${big ? C.kali : C.dim}`, borderRadius: 999, background: big ? `${C.kali}22` : "transparent", opacity: p, transform: `scale(${0.6 + 0.4 * p}) translateY(${Math.sin(f / 30 + i) * 6}px)` }}>
              {n}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", opacity: prog(f, grid + 10, 20) }}>
          <span style={{ fontFamily: FONT, fontSize: 120, fontWeight: 700, color: C.text, textShadow: `0 0 40px ${C.bg}, 0 0 80px ${C.bg}` }}>
            <span style={{ color: C.kali }}>Ratusan</span> tools
          </span>
        </div>
      </div>

      {/* coverflow carousel */}
      <div style={{ position: "absolute", inset: 0, opacity: toCards, perspective: 1800 }}>
        {TOOLS.map((t, i) => {
          const d = i - posSmooth;
          const abs = Math.abs(d);
          if (abs > 2.2) return null;
          const x = 960 + d * 560;
          const scale = 1 - Math.min(abs, 1) * 0.32;
          const seen = f >= starts[i] - 6;
          return (
            <div
              key={t.name}
              style={{
                position: "absolute",
                left: x - 330,
                top: 190,
                width: 660,
                height: 620,
                borderRadius: 28,
                background: C.panel,
                border: `2px solid ${abs < 0.5 ? C.kali : C.dim}`,
                boxShadow: abs < 0.5 ? `0 40px 100px rgba(0,0,0,0.6), 0 0 80px ${C.kali}44` : undefined,
                transform: `rotateY(${-d * 28}deg) scale(${scale})`,
                opacity: (seen ? 1 : 0.25) * (1 - Math.max(0, abs - 1.2)),
                zIndex: 10 - Math.round(abs * 2),
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 50,
              }}
            >
              <div style={{ width: 230, height: 230, display: "flex", alignItems: "center", justifyContent: "center", filter: abs < 0.5 ? `drop-shadow(0 0 30px ${C.kali}88)` : undefined }}>
                <Img src={staticFile(t.logo)} style={{ width: 220, height: 220, objectFit: "contain" }} />
              </div>
              <div style={{ fontFamily: FONT, fontSize: 58, fontWeight: 700, color: C.text, marginTop: 26, textAlign: "center", lineHeight: 1.05 }}>{t.name}</div>
              <div style={{ fontFamily: FONT, fontSize: 32, color: C.cyan, marginTop: 14, textAlign: "center", padding: "0 30px" }}>{t.fn}</div>
              <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted, marginTop: 14, textAlign: "center", padding: "0 40px" }}>{t.note}</div>
              <div style={{ position: "absolute", bottom: 28, fontFamily: MONO, fontSize: 20, color: C.dim }}>kali.org/tools · {t.ver}</div>
            </div>
          );
        })}
        {/* index dots */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 838, display: "flex", justifyContent: "center", gap: 14 }}>
          {TOOLS.map((_, i) => (
            <div key={i} style={{ width: Math.abs(i - posSmooth) < 0.5 ? 40 : 12, height: 12, borderRadius: 6, background: Math.abs(i - posSmooth) < 0.5 ? C.kali : C.dim }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
