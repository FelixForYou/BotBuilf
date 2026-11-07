import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { Card, CommandBar, Eyebrow, Headline, Select } from "../components/Ui";
import { C, FONT, MONO, PAD } from "../theme";
import { beat, prog, spr } from "../timing";

const Node: React.FC<{ label: string; sub: string; start: number; y: number; indent: number; strong?: boolean }> = ({ label, sub, start, y, indent, strong }) => {
  const f = useCurrentFrame();
  const s = Math.min(1, spr(f, start, 14, 150));
  return (
    <div style={{ position: "absolute", left: 40 + indent, top: y, display: "flex", alignItems: "center", gap: 16, opacity: s, transform: `translateX(${(1 - s) * -30}px)` }}>
      {indent > 0 ? <div style={{ position: "absolute", left: -46, top: -34, width: 30, height: 62, borderLeft: `2.5px solid ${C.line}`, borderBottom: `2.5px solid ${C.line}`, borderBottomLeftRadius: 12 }} /> : null}
      <div style={{ padding: "14px 22px", borderRadius: 16, background: strong ? C.blue : "#f4f6fb", color: strong ? "#fff" : C.ink, fontFamily: FONT, fontWeight: 800, fontSize: 38, letterSpacing: -1 }}>{label}</div>
      <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted, fontWeight: 500 }}>{sub}</div>
    </div>
  );
};

const Chip: React.FC<{ start: number; icon: IconName; text: string; color: string; bg: string }> = ({ start, icon, text, color, bg }) => {
  const f = useCurrentFrame();
  const s = Math.min(1, spr(f, start, 12, 170));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderRadius: 999, background: bg, color, fontFamily: FONT, fontWeight: 700, fontSize: 30, transform: `scale(${0.7 + 0.3 * s})`, opacity: s }}>
      <Icon name={icon} size={30} color={color} stroke={2.4} />
      {text}
    </div>
  );
};

const Purpose: React.FC<{ start: number; n: string; title: string; sub: string; color: string; bg: string }> = ({ start, n, title, sub, color, bg }) => {
  const f = useCurrentFrame();
  const s = Math.min(1, spr(f, start, 14, 150));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, height: 104, padding: "0 26px", borderRadius: 18, background: bg, marginBottom: 14, opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
      <span style={{ fontFamily: MONO, fontSize: 22, color, fontWeight: 700 }}>{n}</span>
      <span style={{ fontFamily: FONT, fontSize: 36, fontWeight: 800, color: C.ink, letterSpacing: -1 }}>{title}</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontFamily: FONT, fontSize: 22, color: C.muted }}>{sub}</span>
    </div>
  );
};

export const S2What: React.FC = () => {
  const f = useCurrentFrame();
  const send = beat("s2", "send");
  const dev = beat("s2", "dev");
  const purpose = beat("s2", "purpose");
  const strike = prog(f, beat("s2", "strike"), 12);
  const off = Math.min(1, spr(f, beat("s2", "offsec"), 13, 150));

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, top: 150, width: 940 }}>
        <Eyebrow text="01 · APA ITU" start={send} />
        <div style={{ marginTop: 22 }}>
          <Headline words={["Apa", "itu", { t: "Kali?", accent: "blue" }]} start={send + 4} />
        </div>
      </div>

      {/* Family tree: Linux → Debian → Kali */}
      <Card y={430} h={430} title="sistem-operasi" meta="keluarga Linux" start={beat("s2", "tree")} end={dev}>
        <div style={{ position: "relative", height: 330 }}>
          <Node label="Linux" sub="inti sistem operasi" start={beat("s2", "tree")} y={10} indent={0} />
          <Node label="Debian" sub="distribusi dasar" start={beat("s2", "tree") + 12} y={120} indent={60} />
          <Node label="Kali Linux" sub="dibangun di atas Debian" start={beat("s2", "tree") + 24} y={230} indent={120} strong />
        </div>
      </Card>
      <Select x={PAD + 28 + 40 + 120 - 8} y={430 + 58 + 28 + 230 - 8} w={262} h={92} start={beat("s2", "selKali")} end={dev} />
      <div style={{ position: "absolute", left: PAD, top: 900, display: "flex", gap: 14, opacity: 1 - prog(f, dev, 14) }}>
        <Chip start={beat("s2", "ch0")} icon="layers" text="Berbasis Debian" color={C.blue} bg={C.blueSoft} />
        <Chip start={beat("s2", "ch1")} icon="check" text="Gratis" color={C.green} bg={C.greenSoft} />
        <Chip start={beat("s2", "ch2")} icon="code" text="Open source" color={C.violet} bg={C.violetSoft} />
      </div>

      {/* Developer */}
      <Card y={430} h={560} title="pengembang" meta="kali.org" start={dev} end={purpose}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>
          <Img src={staticFile("img/kali-logo.svg")} style={{ width: 300, height: 170 }} />
          <div style={{ marginTop: 34, fontFamily: FONT, fontSize: 30, color: C.muted, fontWeight: 600 }}>dikembangkan oleh</div>
          <div style={{ position: "relative", marginTop: 8, fontFamily: FONT, fontSize: 64, fontWeight: 800, letterSpacing: -2, color: C.ink, opacity: 1 - off * 0.55 }}>
            Offensive Security
            <div style={{ position: "absolute", left: -6, right: -6, top: "54%", height: 6, background: C.ink, transform: `scaleX(${strike})`, transformOrigin: "left", borderRadius: 3 }} />
          </div>
          <div style={{ marginTop: 6, fontFamily: FONT, fontSize: 88, fontWeight: 800, letterSpacing: -3, color: C.blue, opacity: off, transform: `translateY(${(1 - off) * 20}px) scale(${0.9 + 0.1 * off})` }}>OffSec</div>
        </div>
      </Card>
      <Select x={PAD + 330} y={430 + 58 + 28 + 20 + 170 + 34 + 36 + 8 + 77 + 6} w={280} h={104} start={beat("s2", "offsec") + 6} end={purpose} label="sekarang" />
      <div style={{ position: "absolute", left: PAD, top: 1020, width: 940, textAlign: "center", fontFamily: MONO, fontSize: 20, color: C.faint, opacity: prog(f, beat("s2", "offsec") + 10, 20) * (1 - prog(f, purpose, 14)) }}>
        "Kali Linux is part of OffSec's Community Projects." — kali.org
      </div>

      {/* Purpose */}
      <div style={{ position: "absolute", left: PAD, top: 460, width: 940, opacity: prog(f, purpose, 14) }}>
        <div style={{ fontFamily: FONT, fontSize: 34, color: C.muted, fontWeight: 600, marginBottom: 22 }}>Dirancang khusus untuk:</div>
        <Purpose start={beat("s2", "pu0")} n="01" title="Penetration testing" sub="uji keamanan berizin" color={C.blue} bg={C.blueSoft} />
        <Purpose start={beat("s2", "pu1")} n="02" title="Security auditing" sub="cek konfigurasi" color={C.green} bg={C.greenSoft} />
        <Purpose start={beat("s2", "pu2")} n="03" title="Forensik & riset" sub="keamanan informasi" color={C.violet} bg={C.violetSoft} />
      </div>

      <CommandBar query="apa itu kali linux?" typeAt={beat("s2", "type")} sendAt={send} />
    </AbsoluteFill>
  );
};
