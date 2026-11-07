import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { useTyped } from "../components/Fx";
import { GithubMark, Icon, IconName } from "../components/Icons";
import { C, FONT, MONO } from "../theme";
import { beat, easeInOut, prog, spr } from "../timing";

const GH = {
  bg: "#0d1117",
  panel: "#161b22",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8d96a0",
  link: "#4493f8",
  btn: "#21262d",
};

// Real root entries of github.com/bee-san/RustScan (from a fresh clone).
const FILES: [IconName, string][] = [
  ["folder", "benches"],
  ["folder", "docs"],
  ["folder", "fixtures"],
  ["folder", "pictures"],
  ["folder", "src"],
  ["folder", "tests"],
  ["file", "Cargo.toml"],
  ["file", "LICENSE"],
  ["file", "README.md"],
  ["file", "config.toml"],
];

// Verbatim from the README "Features" section.
const FEATURES = [
  "Scans all 65k ports in 3 seconds.",
  "Full scripting engine support.",
  "Adaptive learning.",
  "IPv6, CIDR, file input and more.",
  "Automatically pipes ports into Nmap.",
];

const Btn: React.FC<{ icon: IconName; label: string; count?: string; active?: number; glow?: number }> = ({ icon, label, count, active = 0, glow = 0 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      height: 52,
      border: `1.5px solid ${active > 0.5 ? "#d29922" : GH.border}`,
      borderRadius: 10,
      background: GH.btn,
      fontFamily: FONT,
      fontSize: 24,
      color: GH.text,
      overflow: "hidden",
      boxShadow: glow > 0 ? `0 0 ${40 * glow}px ${C.yellow}aa` : undefined,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
      <Icon name={icon} size={24} color={active > 0.5 ? C.yellow : GH.muted} fill={active > 0.5 && icon === "star" ? C.yellow : "none"} />
      {label}
    </div>
    {count ? <div style={{ padding: "0 16px", borderLeft: `1.5px solid ${GH.border}`, height: "100%", display: "flex", alignItems: "center", background: "#30363d55" }}>{count}</div> : null}
  </div>
);

export const S3Github: React.FC = () => {
  const f = useCurrentFrame();
  const pin = prog(f, beat("s3", "browser"), 34);
  const url = useTyped("github.com/bee-san/RustScan", beat("s3", "url"), 36);
  const hlName = prog(f, beat("s3", "hlName"), 24);
  const hlFeat = beat("s3", "hlFeat");
  const stars = prog(f, beat("s3", "stars"), 24);
  const lic = prog(f, beat("s3", "license"), 24);
  const click = beat("s3", "click");
  const cursorStart = beat("s3", "cursor");

  // Camera: wide → push on header → features → sidebar → star button.
  const cam = [
    { at: 0, s: 0.92, x: 0, y: 0 },
    { at: beat("s3", "hlName") - 6, s: 0.92, x: 0, y: 0 },
    { at: beat("s3", "hlName") + 30, s: 1.04, x: 60, y: 90 },
    { at: hlFeat + 30, s: 1.08, x: 140, y: -80 },
    { at: beat("s3", "stars") + 30, s: 1.12, x: -260, y: 60 },
    { at: cursorStart + 30, s: 1.32, x: -420, y: 280 },
    { at: click + 80, s: 1.32, x: -420, y: 280 },
    { at: click + 130, s: 1.0, x: 0, y: 40 },
  ];
  const at = cam.map((c) => c.at);
  const opt = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: easeInOut };
  const cs = interpolate(f, at, cam.map((c) => c.s), opt);
  const cx = interpolate(f, at, cam.map((c) => c.x), opt);
  const cy = interpolate(f, at, cam.map((c) => c.y), opt);

  // Cursor path to the Star button (page coords)
  const starX = 1352;
  const starY = 196;
  const cp = prog(f, cursorStart, click - cursorStart - 4, easeInOut);
  const curX = interpolate(cp, [0, 1], [900, starX + 80]);
  const curY = interpolate(cp, [0, 1], [700, starY - 20]) - Math.sin(cp * Math.PI) * 80;
  const press = f >= click && f < click + 8 ? 0.88 : 1;
  const starred = f >= click + 2 ? 1 : 0;
  const glow = starred ? Math.max(0, 1 - (f - click) / 60) + 0.25 : 0;
  const burst = spr(f, click + 2, 18, 90);
  const cta = prog(f, beat("s3", "cta"), 28);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 110,
          width: 1600,
          height: 860,
          transform: `perspective(2400px) rotateX(${(1 - pin) * 18}deg) translateY(${(1 - pin) * 80}px) translate(${cx}px, ${cy}px) scale(${cs})`,
          transformOrigin: "50% 40%",
          opacity: pin,
          borderRadius: 18,
          overflow: "hidden",
          background: GH.bg,
          border: `1.5px solid ${GH.border}`,
          boxShadow: `0 60px 140px rgba(0,0,0,0.7), 0 0 100px ${C.kali}22`,
        }}
      >
        {/* browser chrome */}
        <div style={{ height: 60, background: "#010409", display: "flex", alignItems: "center", gap: 16, padding: "0 20px", borderBottom: `1px solid ${GH.border}` }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 14, height: 14, borderRadius: 7, background: "#30363d" }} />
          ))}
          <div style={{ marginLeft: 20, flex: 1, height: 38, borderRadius: 19, background: GH.panel, display: "flex", alignItems: "center", gap: 12, padding: "0 18px", fontFamily: MONO, fontSize: 22, color: GH.text }}>
            <Icon name="lock" size={20} color={GH.muted} />
            <span>
              <span style={{ color: GH.muted }}>https://</span>
              {url}
            </span>
          </div>
        </div>
        {/* github header */}
        <div style={{ height: 64, display: "flex", alignItems: "center", gap: 18, padding: "0 32px", background: GH.panel, borderBottom: `1px solid ${GH.border}` }}>
          <GithubMark size={36} color={GH.text} />
          <span style={{ fontFamily: FONT, fontSize: 24, color: GH.muted }}>bee-san / RustScan</span>
        </div>
        {/* repo title row */}
        <div style={{ position: "absolute", top: 160, left: 40, right: 40, display: "flex", alignItems: "center", gap: 18 }}>
          <Icon name="book" size={32} color={GH.muted} />
          <div style={{ position: "relative", fontFamily: FONT, fontSize: 36, color: GH.link }}>
            bee-san / <b style={{ color: GH.text }}>RustScan</b>
            <div style={{ position: "absolute", inset: "-8px -14px", border: `3px solid ${C.cyan}`, borderRadius: 10, opacity: hlName, transform: `scale(${1.2 - 0.2 * hlName})`, boxShadow: `0 0 30px ${C.cyan}88` }} />
          </div>
          <span style={{ fontFamily: FONT, fontSize: 20, color: GH.muted, border: `1.5px solid ${GH.border}`, borderRadius: 20, padding: "2px 12px" }}>Public</span>
          <div style={{ flex: 1 }} />
          <Btn icon="eye" label="Watch" />
          <Btn icon="fork" label="Fork" count="1.4k" />
          <div style={{ transform: `scale(${press})` }}>
            <Btn icon="star" label={starred ? "Starred" : "Star"} count="21k" active={starred} glow={glow} />
          </div>
        </div>

        {/* file list */}
        <div style={{ position: "absolute", top: 250, left: 40, width: 1000, border: `1.5px solid ${GH.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ height: 56, background: GH.panel, display: "flex", alignItems: "center", padding: "0 20px", fontFamily: FONT, fontSize: 22, color: GH.muted, gap: 12 }}>
            <Icon name="tag" size={22} color={GH.muted} /> Latest release <b style={{ color: GH.text }}>v2.4.1</b>
          </div>
          {FILES.slice(0, 6).map(([ic, n], i) => (
            <div key={n} style={{ height: 46, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", borderTop: `1px solid ${GH.border}`, fontFamily: FONT, fontSize: 22, color: GH.text, opacity: prog(f, 20 + i * 3, 16) }}>
              <Icon name={ic} size={22} color={ic === "folder" ? GH.link : GH.muted} />
              {n}
            </div>
          ))}
        </div>

        {/* README features (highlighted) */}
        <div style={{ position: "absolute", top: 640, left: 40, width: 1000, padding: "8px 24px 0", fontFamily: FONT, color: GH.text }}>
          <div style={{ fontSize: 30, fontWeight: 700, borderBottom: `1px solid ${GH.border}`, paddingBottom: 8, marginBottom: 6 }}>README · Features</div>
          {FEATURES.slice(0, 3).map((t, i) => {
            const p = prog(f, hlFeat + i * 8, 20);
            return (
              <div key={t} style={{ fontSize: 24, lineHeight: 1.6, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: GH.muted }} />
                <span style={{ background: `linear-gradient(90deg, ${C.cyan}44 ${p * 100}%, transparent ${p * 100}%)`, padding: "0 6px", borderRadius: 4 }}>{t}</span>
              </div>
            );
          })}
        </div>

        {/* About sidebar */}
        <div style={{ position: "absolute", top: 250, left: 1080, width: 480, fontFamily: FONT, color: GH.text }}>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>About</div>
          <div style={{ fontSize: 24, lineHeight: 1.4, color: GH.text, marginBottom: 18 }}>The Modern Port Scanner. Find ports quickly (3 seconds at its fastest).</div>
          {(
            [
              ["star", "21k stars", stars],
              ["fork", "1.4k forks", stars],
              ["scale", "GPL-3.0 license", lic],
              ["cpu", "Rust", lic],
            ] as [IconName, string, number][]
          ).map(([ic, t, p], i) => (
            <div
              key={t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 26,
                height: 54,
                padding: "0 12px",
                borderRadius: 10,
                background: p > 0 ? `rgba(34, 211, 238, ${0.16 * p})` : undefined,
                border: `1.5px solid rgba(34, 211, 238, ${0.6 * p})`,
                marginBottom: 6,
                transform: `translateX(${(i % 2) * 0}px) scale(${1 + 0.03 * p})`,
              }}
            >
              <Icon name={ic} size={26} color={p > 0.5 ? C.cyan : GH.muted} />
              <span style={{ fontWeight: p > 0.5 ? 700 : 400 }}>{t}</span>
            </div>
          ))}
          <div style={{ fontSize: 18, color: GH.muted, marginTop: 10 }}>Stars/forks via shields.io · Nov 2026</div>
        </div>

        {/* star burst */}
        {starred ? (
          <svg width={400} height={400} viewBox="-200 -200 400 400" style={{ position: "absolute", left: starX + 100 - 200, top: starY - 18 - 200, overflow: "visible", pointerEvents: "none" }}>
            {new Array(14).fill(0).map((_, i) => {
              const a = (i / 14) * Math.PI * 2 + random(`sb${i}`) * 0.3;
              const r = burst * (90 + random(`sr${i}`) * 70);
              return (
                <g key={i} transform={`translate(${Math.cos(a) * r} ${Math.sin(a) * r}) scale(${(1 - burst) * 1.2 + 0.1})`} opacity={1 - burst * 0.9}>
                  <path d="m0 -12 3.5 7.5 8 1-6 5.5 1.5 8L0 6l-7 4 1.5-8-6-5.5 8-1z" fill={i % 2 ? C.yellow : C.cyan} />
                </g>
              );
            })}
          </svg>
        ) : null}

        {/* cursor */}
        {f >= cursorStart ? (
          <div style={{ position: "absolute", left: curX, top: curY, transform: `scale(${press})`, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))" }}>
            <svg width={44} height={44} viewBox="0 0 24 24">
              <path d="M5 3l14 7.5-6.2 1.7L10 18.5z" fill="#fff" stroke="#000" strokeWidth={1.2} strokeLinejoin="round" />
            </svg>
            {f >= click && f < click + 24 ? (
              <div style={{ position: "absolute", left: -30, top: -30, width: 60, height: 60, borderRadius: 30, border: `3px solid ${C.yellow}`, transform: `scale(${1 + (f - click) / 10})`, opacity: 1 - (f - click) / 24 }} />
            ) : null}
          </div>
        ) : null}
      </div>

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 820,
          display: "flex",
          justifyContent: "center",
          opacity: cta,
          transform: `translateY(${(1 - cta) * 40}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 34px", borderRadius: 999, background: "rgba(6,11,24,0.92)", border: `2px solid ${C.yellow}88`, boxShadow: `0 0 50px ${C.yellow}33`, fontFamily: FONT, fontSize: 38, color: C.text, fontWeight: 700 }}>
          <Icon name="star" size={40} color={C.yellow} fill={C.yellow} />
          Beri Star — dukung developer open source
          <span style={{ fontFamily: MONO, fontSize: 28, color: C.cyan, fontWeight: 500 }}>github.com/bee-san/RustScan</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
