import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Decode, useTyped } from "../components/Fx";
import { GithubMark, Icon, IconName } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

const Word: React.FC<{ start: number; icon: IconName; text: string }> = ({ start, icon, text }) => {
  const f = useCurrentFrame();
  const s = spr(f, start, 12, 150);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: Math.min(s, 1), transform: `translateY(${(1 - Math.min(s, 1)) * 50}px) scale(${0.8 + 0.2 * Math.min(s, 1)})` }}>
      <Icon name={icon} size={70} color={C.cyan} draw={prog(f, start, 26)} />
      <span style={{ fontFamily: FONT, fontSize: 84, fontWeight: 700, color: C.text, letterSpacing: -1 }}>{text}</span>
    </div>
  );
};

export const S8Outro: React.FC = () => {
  const f = useCurrentFrame();
  const ethics = beat("s8", "ethics");
  const fin = beat("s8", "final");
  const logo = beat("s8", "logo");
  const click = beat("s8", "click");

  const toEthics = prog(f, ethics, 30, easeInOut);
  const toFinal = prog(f, fin, 30, easeInOut);
  const ls = spr(f, logo, 12, 110);
  const url = useTyped("github.com/bee-san/RustScan", beat("s8", "url"), 50);
  const starred = f >= click + 2;
  const burst = spr(f, click + 2, 18, 90);
  const press = f >= click && f < click + 8 ? 0.9 : 1;
  const close = prog(f, click + 40, 30);

  return (
    <AbsoluteFill>
      {/* summary words */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 70, opacity: 1 - toEthics, transform: `translateY(${-toEthics * 60}px)` }}>
        <Word start={beat("s8", "w0")} icon="zap" text="Cepat" />
        <Word start={beat("s8", "w1")} icon="layers" text="Fleksibel" />
        <Word start={beat("s8", "w2")} icon="code" text="Open Source" />
      </div>

      {/* ethics */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", flexDirection: "column", alignItems: "center", opacity: toEthics * (1 - toFinal), transform: `scale(${0.94 + 0.06 * toEthics})` }}>
        <div style={{ filter: `drop-shadow(0 0 30px ${C.green})` }}>
          <Icon name="shieldCheck" size={170} color={C.green} stroke={1.3} draw={toEthics} />
        </div>
        <div style={{ marginTop: 26, fontFamily: FONT, fontSize: 64, fontWeight: 700, color: C.text, textAlign: "center", lineHeight: 1.15 }}>
          Scan hanya sistem <span style={{ color: C.green }}>milikmu</span>
          <br />
          atau yang <span style={{ color: C.green }}>memberi izin</span>.
        </div>
        <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 26, color: C.muted, letterSpacing: 3 }}>ETHICAL HACKING · LEGAL · BERTANGGUNG JAWAB</div>
      </div>

      {/* final lockup */}
      <div style={{ position: "absolute", inset: 0, opacity: toFinal }}>
        <div style={{ position: "absolute", left: 960 - 110, top: 150, width: 220, height: 251, transform: `scale(${interpolate(ls, [0, 1], [0.5, 1])})`, filter: `drop-shadow(0 0 40px ${C.cyan}88)` }}>
          <Img src={staticFile("img/rustscan_shield.png")} style={{ width: 220, height: 251 }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 430, textAlign: "center", fontFamily: FONT, fontSize: 110, fontWeight: 700, color: C.text, letterSpacing: 8, lineHeight: 1 }}>
          <Decode text="RUSTSCAN" start={logo + 4} dur={36} seed="rs8" />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 570, display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 28px", borderRadius: 14, background: C.panel, border: `1.5px solid ${C.kali}88`, fontFamily: MONO, fontSize: 36, color: C.text }}>
            <GithubMark size={38} color={C.text} />
            {url}
            <span style={{ display: "inline-block", width: 16, height: 36, background: C.cyan, opacity: Math.floor(f / 18) % 2 }} />
          </div>
          <div style={{ position: "relative", transform: `scale(${press})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRadius: 14, background: starred ? `${C.yellow}22` : "#21262d", border: `2px solid ${starred ? C.yellow : "#30363d"}`, fontFamily: FONT, fontSize: 34, fontWeight: 700, color: C.text, boxShadow: starred ? `0 0 50px ${C.yellow}66` : undefined }}>
              <Icon name="star" size={36} color={starred ? C.yellow : C.muted} fill={starred ? C.yellow : "none"} />
              {starred ? "Starred" : "Star"}
            </div>
            {starred ? (
              <svg width={300} height={300} viewBox="-150 -150 300 300" style={{ position: "absolute", left: -60, top: -110, overflow: "visible" }}>
                {new Array(12).fill(0).map((_, i) => {
                  const a = (i / 12) * Math.PI * 2;
                  const r = burst * (70 + random(`ob${i}`) * 50);
                  return <path key={i} transform={`translate(${Math.cos(a) * r} ${Math.sin(a) * r}) scale(${1 - burst * 0.7})`} d="m0 -10 3 6.5 7 1-5 4.5 1.2 7L0 5.5l-6.2 3.5 1.2-7-5-4.5 7-1z" fill={i % 2 ? C.yellow : C.cyan} opacity={1 - burst * 0.9} />;
                })}
              </svg>
            ) : null}
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 10, color: C.cyan, opacity: close }}>
          STAY ETHICAL · STAY CURIOUS
        </div>
      </div>
    </AbsoluteFill>
  );
};
