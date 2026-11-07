import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

const Tile: React.FC<{ start: number; icon: IconName; title: string; sub: string; x: number; y: number; dim: number }> = ({ start, icon, title, sub, x, y, dim }) => {
  const f = useCurrentFrame();
  const s = spr(f, start, 13, 120);
  const glow = Math.max(0, 1 - (f - start) / 40);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 380,
        height: 250,
        borderRadius: 22,
        background: C.panel,
        border: `1.5px solid ${C.kali}${f >= start ? "aa" : "33"}`,
        boxShadow: `0 0 ${glow * 60}px ${C.cyan}88`,
        padding: 28,
        opacity: interpolate(Math.min(s, 1), [0, 1], [0.15, 1]) * (1 - dim * 0.75),
        transform: `translateY(${(1 - Math.min(s, 1)) * 40}px) scale(${0.92 + 0.08 * Math.min(s, 1)})`,
        filter: `blur(${dim * 3}px)`,
      }}
    >
      <Icon name={icon} size={60} color={C.cyan} draw={prog(f, start, 30)} />
      <div style={{ fontFamily: FONT, fontSize: 38, fontWeight: 700, color: C.text, marginTop: 16 }}>{title}</div>
      <div style={{ fontFamily: MONO, fontSize: 21, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
};

const Limit: React.FC<{ start: number; title: string; sub: string; y: number }> = ({ start, title, sub, y }) => {
  const f = useCurrentFrame();
  const p = prog(f, start, 26);
  const jitter = f >= start && f < start + 10 ? Math.sin(f * 3) * 6 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 560,
        top: y,
        width: 1100,
        padding: "22px 30px",
        borderRadius: 18,
        background: "rgba(40, 18, 8, 0.55)",
        border: `1.5px solid ${C.orange}88`,
        display: "flex",
        gap: 24,
        alignItems: "center",
        opacity: p,
        transform: `translateX(${(1 - p) * 80 + jitter}px)`,
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 18px)`,
      }}
    >
      <Icon name="alert" size={52} color={C.orange} />
      <div>
        <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 700, color: C.text }}>{title}</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
};

const Persona: React.FC<{ start: number; icon: IconName; label: string; x: number }> = ({ start, icon, label, x }) => {
  const f = useCurrentFrame();
  const s = spr(f, start, 12, 140);
  return (
    <div style={{ position: "absolute", left: x, top: 380, width: 360, textAlign: "center", opacity: Math.min(s, 1), transform: `translateY(${(1 - Math.min(s, 1)) * 60}px)` }}>
      <div style={{ width: 200, height: 200, margin: "0 auto", borderRadius: 100, border: `2px solid ${C.cyan}`, background: `${C.kali}1a`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${C.kali}55` }}>
        <Icon name={icon} size={96} color={C.cyan} draw={prog(f, start, 30)} />
      </div>
      <div style={{ fontFamily: FONT, fontSize: 42, fontWeight: 700, color: C.text, marginTop: 24 }}>{label}</div>
    </div>
  );
};

export const S7Features: React.FC = () => {
  const f = useCurrentFrame();
  const lim = beat("s7", "lim");
  const who = beat("s7", "who0") - 40;
  const toLim = prog(f, lim, 34, easeInOut);
  const toWho = prog(f, who, 30, easeInOut);

  const header = (label: string, color: string, p: number) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO, fontSize: 32, letterSpacing: 8, color, opacity: p, transform: `translateY(${(1 - p) * -20}px)` }}>{label}</div>
  );

  return (
    <AbsoluteFill>
      {/* FEATURES */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - toLim, transform: `scale(${1 - 0.08 * toLim})` }}>
        {header("FITUR UNGGULAN", C.cyan, prog(f, 0, 20))}
        <Tile start={beat("s7", "f0")} icon="code" title="Scripting Engine" sub="Python · Lua · Shell" x={150} y={250} dim={0} />
        <Tile start={beat("s7", "f1")} icon="brain" title="Adaptive Learning" sub="belajar dari OS & pemakaianmu" x={560} y={250} dim={0} />
        <Tile start={beat("s7", "f2")} icon="network" title="IPv6 · CIDR" sub="plus input file target" x={970} y={250} dim={0} />
        <Tile start={beat("s7", "f3")} icon="zap" title="Mode UDP" sub="flag --udp" x={1380} y={250} dim={0} />
        <Tile start={beat("s7", "f3") + 14} icon="target" title="Auto-pipe Nmap" sub="port terbuka → nmap" x={355} y={540} dim={0} />
        <Tile start={beat("s7", "f3") + 24} icon="eye" title="Accessible" sub="ramah screen reader" x={765} y={540} dim={0} />
        <Tile start={beat("s7", "f3") + 34} icon="layers" title="Greppable" sub="flag -g · cocok untuk grep" x={1175} y={540} dim={0} />
      </div>

      {/* LIMITATIONS */}
      <div style={{ position: "absolute", inset: 0, opacity: toLim * (1 - toWho) }}>
        {header("KETERBATASAN", C.orange, toLim)}
        <div style={{ position: "absolute", left: 260, top: 270, opacity: toLim }}>
          <Icon name="alert" size={220} color={C.orange} stroke={1.2} draw={toLim} />
        </div>
        <Limit start={beat("s7", "lim0")} title="Deteksi layanan butuh Nmap" sub="RustScan menemukan port; analisis versi dikerjakan Nmap." y={280} />
        <Limit start={beat("s7", "lim1")} title="Batch size berlebih → port terlewat" sub="Turunkan dengan -b <angka> sesuai batas sistem." y={450} />
        <div style={{ position: "absolute", left: 560, top: 620, width: 1100, fontFamily: MONO, fontSize: 22, color: C.muted, lineHeight: 1.5, opacity: prog(f, beat("s7", "lim1") + 30, 24) }}>
          Peringatan resmi (rustscan -h): jangan gunakan pada infrastruktur sensitif — server bisa kewalahan oleh banyaknya koneksi.
        </div>
      </div>

      {/* WHO */}
      <div style={{ position: "absolute", inset: 0, opacity: toWho }}>
        {header("COCOK UNTUK", C.cyan, toWho)}
        <Persona start={beat("s7", "who0")} icon="target" label="Pentester" x={260} />
        <Persona start={beat("s7", "who1")} icon="flag" label="Pemain CTF" x={780} />
        <Persona start={beat("s7", "who2")} icon="server" label="Admin Jaringan" x={1300} />
      </div>
    </AbsoluteFill>
  );
};
