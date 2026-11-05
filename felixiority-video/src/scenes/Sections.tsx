import React from "react";
import { AbsoluteFill, interpolateColors } from "remotion";
import { C, F } from "../lib/theme";
import { expoInOut, mix, prog, useT } from "../lib/anim";
import { FadeUp, Label, Mark, RiseWords } from "../lib/ui";
import { ABOUT, CONTACT, SERVICES } from "../lib/data";

const Rule: React.FC<{ start: number; dark?: boolean; style?: React.CSSProperties }> = ({ start, dark, style }) => {
  const f = useT();
  return <i style={{ display: "block", height: 1, background: dark ? C.lineDark : C.lineStrong, transformOrigin: "left", transform: `scaleX(${prog(f, start, 36, expoInOut)})`, ...style }} />;
};

/** Seluruh adegan sedikit "drift" ke atas, seperti scroll pelan. */
const useDrift = (dur: number) => {
  const f = useT();
  return mix(prog(f, 0, dur, (t) => t), 20, -20);
};

export const ABOUT_DURATION = 165;
export const About: React.FC = () => {
  const drift = useDrift(ABOUT_DURATION);
  return (
    <AbsoluteFill style={{ background: C.bone, color: C.ink, fontFamily: F.sans, padding: "0 80px", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${drift}px)` }}>
        <FadeUp start={4}><Label>(03) Tentang Felixiority</Label></FadeUp>
        <h2 style={{ margin: "36px 0 0", fontSize: 128, lineHeight: 0.98, fontWeight: 700, letterSpacing: "-0.045em", maxWidth: 1500 }}>
          <RiseWords text={ABOUT.title} start={8} stagger={2} dur={30} serifWords={[4, 5]} blueWords={[5]} />
        </h2>
        <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 120 }}>
          <FadeUp start={30} style={{ fontSize: 34, lineHeight: 1.45, color: C.ink2 }}>{ABOUT.body}</FadeUp>
          <div>
            <FadeUp start={34}><Label>Fokus</Label></FadeUp>
            <div style={{ marginTop: 18 }}>
              {ABOUT.focus.map((t, i) => (
                <div key={t}>
                  <Rule start={38 + i * 6} />
                  <FadeUp start={44 + i * 6} y={14} style={{ display: "flex", gap: 28, alignItems: "baseline", padding: "22px 0", fontSize: 36, fontWeight: 560, letterSpacing: "-0.02em" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 18, color: C.blue }}>0{i + 1}</span>
                    {t}
                  </FadeUp>
                </div>
              ))}
              <Rule start={62} />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SERVICES_DURATION = 165;
export const Services: React.FC = () => {
  const f = useT();
  const drift = useDrift(SERVICES_DURATION);
  // sorotan berpindah antar layanan seperti hover
  return (
    <AbsoluteFill style={{ background: C.bone, color: C.ink, fontFamily: F.sans, padding: "0 80px", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${drift}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <FadeUp start={2}><Label>(04) Layanan &amp; fokus</Label></FadeUp>
            <h2 style={{ margin: "36px 0 0", fontSize: 128, lineHeight: 0.98, fontWeight: 700, letterSpacing: "-0.045em" }}>
              <RiseWords text="Yang bisa dikerjakan bersama." start={6} stagger={2.5} dur={30} serifWords={[3]} />
            </h2>
          </div>
        </div>
        <div style={{ marginTop: 80 }}>
          {SERVICES.map((s, i) => {
            const fill = prog(f, 70 + i * 22, 12) - (i < SERVICES.length - 1 ? prog(f, 70 + (i + 1) * 22, 12) : 0);
            return (
              <div key={s.title} style={{ position: "relative" }}>
                <Rule start={20 + i * 6} />
                <i style={{ position: "absolute", top: 1, left: 0, right: 0, bottom: 0, background: C.ink, transformOrigin: "bottom", transform: `scaleY(${Math.max(0, fill)})` }} />
                <FadeUp start={26 + i * 6} y={16} style={{ position: "relative", display: "grid", gridTemplateColumns: "120px 760px 1fr 60px", alignItems: "center", padding: "30px 24px", color: interpolateColors(fill, [0, 1], [C.ink, C.bone]) }}>
                  <span style={{ fontFamily: F.mono, fontSize: 20, color: interpolateColors(fill, [0, 1], [C.blue, "#8b9bff"]) }}>0{i + 1}</span>
                  <span style={{ fontSize: 50, fontWeight: 650, letterSpacing: "-0.03em" }}>{s.title}</span>
                  <span style={{ fontSize: 25, lineHeight: 1.4, color: interpolateColors(fill, [0, 1], [C.muted, "rgba(242,238,230,0.6)"]) }}>{s.body}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 30, textAlign: "right", transform: `translateX(${fill * 6}px)` }}>→</span>
                </FadeUp>
              </div>
            );
          })}
          <Rule start={44} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CONTACT_DURATION = 165;
export const Contact: React.FC = () => {
  const f = useT();
  const drift = useDrift(CONTACT_DURATION);
  const fill = prog(f, 80, 22);
  return (
    <AbsoluteFill style={{ background: C.dark, color: C.bone, fontFamily: F.sans, padding: "0 80px", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${drift}px)` }}>
        <FadeUp start={4}><Label light>(05) Kontak</Label></FadeUp>
        <h2 style={{ margin: "40px 0 0", fontSize: 124, lineHeight: 1, fontWeight: 700, letterSpacing: "-0.045em", maxWidth: 1600 }}>
          <RiseWords text={CONTACT.title} start={8} stagger={1.6} dur={30} serifWords={[9, 10]} />
        </h2>
        <div style={{ marginTop: 80, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <FadeUp start={36} style={{ fontSize: 32, lineHeight: 1.45, color: "rgba(242,238,230,0.75)", maxWidth: 760 }}>{CONTACT.note}</FadeUp>
          <FadeUp start={44}>
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 24, height: 96, padding: "0 44px", border: `1.5px solid ${interpolateColors(fill, [0, 1], [C.bone, C.blue])}`, fontSize: 32, fontWeight: 560, overflow: "hidden", color: interpolateColors(fill, [0, 1], [C.dark, C.bone]), background: C.bone }}>
              <i style={{ position: "absolute", inset: 0, background: C.blue, transformOrigin: "bottom", transform: `scaleY(${fill})` }} />
              <span style={{ position: "relative" }}>Hubungi Saya</span>
              <span style={{ position: "relative", fontFamily: F.mono, transform: `translateX(${fill * 8}px)` }}>→</span>
            </span>
          </FadeUp>
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 60 }}>
        <Rule start={50} dark />
        <FadeUp start={58} y={8} style={{ display: "flex", justifyContent: "space-between", paddingTop: 22, fontFamily: F.mono, fontSize: 18, color: C.boneDim, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <span>© 2026 Felixiority</span>
          <span>Website · Rest API · AI · Bot · Pterodactyl</span>
        </FadeUp>
      </div>
    </AbsoluteFill>
  );
};

export const OUTRO_DURATION = 120;
const WORD = "FELIXIORITY".split("");
export const Outro: React.FC = () => {
  const f = useT();
  return (
    <AbsoluteFill style={{ background: C.blue, color: C.bone, fontFamily: F.sans, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 70, left: 80, right: 80, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <FadeUp start={6}><Mark size={16} color={C.bone} accent={C.ink} shift={prog(f, 30, 20)} /></FadeUp>
        <FadeUp start={10}><span style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: "0.04em", textTransform: "uppercase" }}>Studio digital independen</span></FadeUp>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontSize: 306, fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 1, whiteSpace: "nowrap" }}>
        {WORD.map((c, i) => (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
            <span style={{ display: "inline-block", transform: `translateY(${mix(prog(f, 4 + Math.abs(i - 5) * 2, 34), 108, 0)}%)` }}>{c}</span>
          </span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 90, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <FadeUp start={34} style={{ fontSize: 48, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Website, API, dan server <br />
          <span style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 400, letterSpacing: 0 }}>dalam satu ekosistem.</span>
        </FadeUp>
        <FadeUp start={42} style={{ fontFamily: F.mono, fontSize: 22, textAlign: "right", lineHeight: 1.7, textTransform: "uppercase" }}>
          Website / API / Infrastruktur<br />Pterodactyl · AI · Bot
        </FadeUp>
      </div>
    </AbsoluteFill>
  );
};
