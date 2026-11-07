import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Icon, IconName } from "../components/Icons";
import { KaliTerminal, TermLine } from "../components/KaliTerminal";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, sec } from "../timing";

const Dep: React.FC<{ start: number; icon: IconName; name: string; note: string; tag: string; tagColor: string; y: number }> = ({ start, icon, name, note, tag, tagColor, y }) => {
  const f = useCurrentFrame();
  const p = prog(f, start, 26);
  return (
    <div
      style={{
        position: "absolute",
        left: 1240,
        top: y,
        width: 540,
        padding: "22px 26px",
        borderRadius: 18,
        background: C.panel,
        border: `1.5px solid ${C.kali}66`,
        display: "flex",
        gap: 20,
        alignItems: "center",
        opacity: p,
        transform: `translateX(${(1 - p) * 80}px)`,
        clipPath: `inset(0 0 0 ${(1 - p) * 100}% round 18px)`,
      }}
    >
      <div style={{ width: 76, height: 76, borderRadius: 16, background: `${C.kali}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={44} color={C.cyan} draw={prog(f, start + 5, 30)} />
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: FONT, fontSize: 36, fontWeight: 700, color: C.text }}>{name}</span>
          <span style={{ fontFamily: MONO, fontSize: 18, color: tagColor, border: `1.5px solid ${tagColor}`, borderRadius: 8, padding: "2px 10px" }}>{tag}</span>
        </div>
        <div style={{ fontFamily: FONT, fontSize: 24, color: C.muted, marginTop: 4, lineHeight: 1.3 }}>{note}</div>
      </div>
    </div>
  );
};

export const S5Install: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = beat("s5", "type1");
  const apt = beat("s5", "apt");
  const ver = beat("s5", "ver");
  const t2 = beat("s5", "type2");
  const cargo = beat("s5", "cargo");
  const done = beat("s5", "done");
  const dep0 = beat("s5", "dep0");

  const lines1: TermLine[] = [
    { at: t1, kind: "cmd", text: "sudo apt install rustscan", typeDur: sec(0.9) },
    { at: apt, kind: "out", segs: [{ text: "Reading package lists... Done" }] },
    { at: apt + 8, kind: "out", segs: [{ text: "Building dependency tree... Done" }] },
    { at: apt + 16, kind: "out", segs: [{ text: "The following NEW packages will be installed:" }] },
    { at: apt + 22, kind: "out", segs: [{ text: "  rustscan", color: C.text }] },
    { at: apt + 34, kind: "out", segs: [{ text: "Setting up rustscan ...", color: C.text }] },
    { at: ver - 20, kind: "cmd", text: "rustscan --version", typeDur: 14 },
    { at: ver, kind: "out", segs: [{ text: "rustscan 2.4.1", color: C.green, bold: true }] },
  ];
  const lines2: TermLine[] = [
    { at: t2, kind: "cmd", text: "cargo install rustscan", typeDur: sec(0.8) },
    { at: cargo, kind: "out", segs: [{ text: "  Compiling rustscan v2.4.1", color: C.green }] },
    { at: cargo + 14, kind: "out", segs: [{ text: "  Installing ~/.cargo/bin/rustscan", color: C.green }] },
    { at: done, kind: "out", segs: [{ text: "   Installed package `rustscan v2.4.1`", color: C.green, bold: true }] },
  ];

  // first terminal recedes, second comes forward
  const swap = prog(f, beat("s5", "panel2"), 34, easeInOut);
  const toSide = prog(f, dep0 - 16, 34, easeInOut);

  return (
    <AbsoluteFill>
      {/* section header */}
      <div style={{ position: "absolute", left: 130, top: 120, display: "flex", alignItems: "center", gap: 18, opacity: prog(f, 0, 24) }}>
        <Icon name="package" size={44} color={C.kali} draw={prog(f, 4, 30)} />
        <span style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: C.text }}>INSTALASI · KALI LINUX</span>
      </div>

      <div style={{ position: "absolute", inset: 0, transform: `translateX(${interpolate(toSide, [0, 1], [0, -40])}px)` }}>
        <KaliTerminal
          x={interpolate(swap, [0, 1], [200, 130])}
          y={interpolate(swap, [0, 1], [210, 190])}
          w={interpolate(toSide, [0, 1], [1100, 1040])}
          h={470}
          lines={lines1}
          start={beat("s5", "term")}
          title="Metode 1 · paket Kali (apt)"
          fontSize={24}
          tilt={interpolate(swap, [0, 1], [0, 6])}
        />
        <div style={{ opacity: f >= beat("s5", "panel2") ? 1 : 0 }}>
          <KaliTerminal
            x={interpolate(swap, [0, 1], [700, interpolate(toSide, [0, 1], [640, 130])])}
            y={interpolate(toSide, [0, 1], [600, 680])}
            w={interpolate(toSide, [0, 1], [1100, 1040])}
            h={220}
            lines={lines2}
            start={beat("s5", "panel2")}
            title="Metode 2 · resmi dari README (Cargo)"
            fontSize={24}
          />
        </div>
      </div>

      <div style={{ position: "absolute", left: 1240, top: 205, fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: C.cyan, opacity: prog(f, dep0 - 6, 20) }}>DEPENDENSI</div>
      <Dep start={dep0} icon="target" name="Nmap" note="Untuk deteksi layanan & scripting. Sudah terpasang bawaan di Kali." tag="WAJIB" tagColor={C.cyan} y={250} />
      <Dep start={beat("s5", "dep1")} icon="cpu" name="Rust & Cargo" note="Hanya diperlukan untuk metode cargo install." tag="OPSIONAL" tagColor={C.muted} y={450} />
      <div style={{ position: "absolute", left: 1240, top: 650, width: 540, fontFamily: MONO, fontSize: 20, color: C.dim, lineHeight: 1.5, opacity: prog(f, beat("s5", "dep1") + 16, 20) }}>
        Sumber: kali.org/tools/rustscan · README & wiki Installation-Guide. Tampilan terminal disimulasikan.
      </div>
    </AbsoluteFill>
  );
};
