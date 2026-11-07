import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Chip } from "../components/Fx";
import { Icon, IconName } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

const Layer: React.FC<{ start: number; y: number; w: number; label: string; sub: string; color: string; icon: IconName }> = ({ start, y, w, label, sub, color, icon }) => {
  const f = useCurrentFrame();
  const s = spr(f, start, 14, 140);
  return (
    <div
      style={{
        position: "absolute",
        left: 1340 - w / 2,
        top: y,
        width: w,
        height: 120,
        borderRadius: 18,
        background: `linear-gradient(90deg, ${color}33, ${color}11)`,
        border: `2px solid ${color}`,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 30px",
        opacity: Math.min(s, 1),
        transform: `translateY(${(1 - Math.min(s, 1)) * -120}px) perspective(900px) rotateX(${(1 - Math.min(s, 1)) * 40}deg)`,
        boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${color}33`,
      }}
    >
      <Icon name={icon} size={50} color={color} />
      <div>
        <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 700, color: C.text }}>{label}</div>
        <div style={{ fontFamily: MONO, fontSize: 21, color: C.muted }}>{sub}</div>
      </div>
    </div>
  );
};

const Purpose: React.FC<{ start: number; icon: IconName; title: string; sub: string; x: number }> = ({ start, icon, title, sub, x }) => {
  const f = useCurrentFrame();
  const s = spr(f, start, 13, 130);
  return (
    <div style={{ position: "absolute", left: x, top: 560, width: 500, height: 250, borderRadius: 22, background: C.panel, border: `1.5px solid ${C.kali}99`, padding: 30, opacity: Math.min(s, 1), transform: `translateY(${(1 - Math.min(s, 1)) * 60}px)`, boxShadow: `inset 0 3px 0 ${C.cyan}` }}>
      <Icon name={icon} size={60} color={C.cyan} draw={prog(f, start, 30)} />
      <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 700, color: C.text, marginTop: 14 }}>{title}</div>
      <div style={{ fontFamily: FONT, fontSize: 26, color: C.muted, marginTop: 6 }}>{sub}</div>
    </div>
  );
};

export const S2What: React.FC = () => {
  const f = useCurrentFrame();
  const logo = beat("s2", "logo");
  const stack = beat("s2", "stack");
  const offsec = beat("s2", "offsec");
  const rename = beat("s2", "rename");
  const purpose = beat("s2", "purpose");

  const reveal = prog(f, logo, 40);
  const toStack = prog(f, stack, 34, easeInOut);
  const toOff = prog(f, offsec, 30, easeInOut);
  const toPurpose = prog(f, purpose, 30, easeInOut);
  const renameP = prog(f, rename, 30);

  // logo moves from center to the left column when the stack appears, and up when purposes show
  const logoX = interpolate(toStack, [0, 1], [960, 480]);
  const logoY = interpolate(toPurpose, [0, 1], [interpolate(toStack, [0, 1], [380, 330]), 250]);
  const logoS = interpolate(toPurpose, [0, 1], [interpolate(toStack, [0, 1], [1.2, 0.95]), 0.6]);

  return (
    <AbsoluteFill>
      {/* Official Kali logo (kali.org/images/kali-logo.svg) revealed by a scan line */}
      <div style={{ position: "absolute", left: logoX - 260, top: logoY - 147, width: 520, height: 294, transform: `scale(${logoS})`, opacity: 1 - toPurpose * 0.0 }}>
        <svg width={720} height={480} viewBox="-100 -90 720 480" style={{ position: "absolute", left: -100, top: -90, overflow: "visible" }}>
          <g transform={`rotate(${f * 0.4} 260 147)`}>
            <circle cx={260} cy={147} r={230} fill="none" stroke={C.kali} strokeWidth={2} strokeDasharray="70 30 8 30" opacity={reveal * 0.6} />
          </g>
          <circle cx={260} cy={147} r={250} fill="none" stroke={C.cyan} strokeOpacity={0.2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - reveal} />
        </svg>
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(-90px -90px calc(${(1 - reveal) * 100}% - ${reveal * 90}px) -90px)`, filter: `drop-shadow(0 0 40px ${C.kali}aa)` }}>
          <Img src={staticFile("img/kali-logo.svg")} style={{ width: 520, height: 294 }} />
        </div>
        {reveal > 0 && reveal < 1 ? <div style={{ position: "absolute", left: -40, right: -40, top: reveal * 294, height: 3, background: C.cyan, boxShadow: `0 0 24px ${C.cyan}` }} /> : null}
      </div>

      {/* chips under logo (definition) */}
      <div style={{ position: "absolute", left: logoX - 500, width: 1000, top: logoY + 200, display: "flex", justifyContent: "center", gap: 20, opacity: 1 - toPurpose }}>
        <Chip text="Open Source" start={beat("s2", "chip0")} icon={<Icon name="code" size={28} color={C.cyan} />} />
        <Chip text="Berbasis Debian" start={beat("s2", "chip1")} icon={<Icon name="layers" size={28} color={C.cyan} />} color={C.kali} />
        <Chip text="Gratis" start={beat("s2", "chip2")} icon={<Icon name="check" size={28} color={C.green} />} color={C.green} />
      </div>

      {/* distribution stack: what "distribusi" means */}
      <div style={{ position: "absolute", inset: 0, opacity: toStack * (1 - toOff) }}>
        <div style={{ position: "absolute", left: 1040, top: 170, width: 600, textAlign: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: C.cyan }}>APA ITU "DISTRIBUSI"?</div>
        <Layer start={beat("s2", "L2")} y={230} w={600} label="Kali Linux" sub="ratusan tools keamanan + konfigurasi" color={C.kali} icon="shieldCheck" />
        <Layer start={beat("s2", "L1")} y={370} w={680} label="Debian" sub="fondasi sistem & paket" color={C.cyan} icon="package" />
        <Layer start={beat("s2", "L0")} y={510} w={760} label="Kernel Linux" sub="inti yang mengatur perangkat keras" color={C.muted} icon="cpu" />
      </div>

      {/* developer: Offensive Security → OffSec */}
      <div style={{ position: "absolute", left: 1000, top: 210, width: 760, opacity: toOff * (1 - toPurpose), transform: `translateX(${(1 - toOff) * 80}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: C.cyan, marginBottom: 20 }}>DIKEMBANGKAN OLEH</div>
        <div style={{ padding: "30px 36px", borderRadius: 22, background: C.panel, border: `1.5px solid ${C.kali}aa` }}>
          <div style={{ position: "relative", height: 80 }}>
            <div style={{ position: "absolute", fontFamily: FONT, fontSize: 64, fontWeight: 700, color: C.text, opacity: 1 - renameP, filter: `blur(${renameP * 8}px)` }}>Offensive Security</div>
            <div style={{ position: "absolute", fontFamily: FONT, fontSize: 64, fontWeight: 700, color: C.kali, opacity: renameP, transform: `translateY(${(1 - renameP) * 30}px)` }}>
              OffSec <span style={{ fontSize: 28, color: C.muted, fontWeight: 500 }}>(nama saat ini)</span>
            </div>
          </div>
          <div style={{ fontFamily: FONT, fontSize: 28, color: C.muted, marginTop: 18, lineHeight: 1.4 }}>Perusahaan pelatihan & sertifikasi keamanan siber.</div>
          <div style={{ fontFamily: MONO, fontSize: 21, color: C.dim, marginTop: 18 }}>"Kali Linux is part of OffSec's Community Projects." — kali.org</div>
        </div>
      </div>

      {/* designed for */}
      <div style={{ position: "absolute", inset: 0, opacity: toPurpose }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: C.cyan }}>DIRANCANG KHUSUS UNTUK</div>
        <Purpose start={beat("s2", "pu0")} icon="target" title="Penetration Testing" sub="uji keamanan dengan izin" x={160} />
        <Purpose start={beat("s2", "pu1")} icon="list" title="Security Auditing" sub="memeriksa kepatuhan & konfigurasi" x={710} />
        <Purpose start={beat("s2", "pu2")} icon="shield" title="Keamanan Informasi" sub="forensik, reverse engineering, dll." x={1260} />
      </div>
    </AbsoluteFill>
  );
};
