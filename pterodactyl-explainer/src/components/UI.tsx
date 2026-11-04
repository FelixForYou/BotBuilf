import React from "react";
import { C, FONT, MONO } from "../lib/theme";
import { easeOut, p, rand } from "../lib/anim";
import { Icon } from "./Icon";
import { BrandLogo, PteroLogo } from "./Logos";
import { SimTag } from "./Primitives";

/* Simplified rendition of the Pterodactyl v1 server view (dark neutral UI,
 * top bar, sub-navigation, console + stat cards, coloured power buttons). */
const P = { bg: "#1b1e23", bar: "#14161a", card: "#23272e", cardHi: "#2a2f37", text: "#e6e8eb", sub: "#8b929c", console: "#0f1114", cyan: "#4fb3ff" };

export type PowerState = "offline" | "starting" | "running" | "stopping";
const stateCol: Record<PowerState, string> = { offline: C.err, starting: C.warn, running: C.ok, stopping: C.warn };
const stateTxt: Record<PowerState, string> = { offline: "Offline", starting: "Starting", running: "Running", stopping: "Stopping" };

export const StatusPill: React.FC<{ state: PowerState; f?: number; size?: number; label?: string }> = ({ state, f = 0, size = 16, label }) => {
  const blink = state === "starting" || state === "stopping" ? 0.55 + 0.45 * Math.sin(f * 0.25) : 1;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.5, padding: `${size * 0.3}px ${size * 0.75}px`, borderRadius: 999,
      background: "rgba(255,255,255,0.06)", border: `1px solid ${stateCol[state]}44`, fontFamily: FONT, fontSize: size, fontWeight: 600, color: P.text }}>
      <div style={{ width: size * 0.55, height: size * 0.55, borderRadius: "50%", background: stateCol[state], opacity: blink, boxShadow: `0 0 10px ${stateCol[state]}` }} />
      {label ?? stateTxt[state]}
    </div>
  );
};

export const PowerButtons: React.FC<{ active?: "start" | "restart" | "stop" | null; press?: number; scale?: number }> = ({ active = null, press = 0, scale = 1 }) => {
  const btn = (k: "start" | "restart" | "stop", label: string, col: string, icon: "Play" | "RotateCw" | "Square") => {
    const on = active === k;
    const s = on ? 1 - Math.sin(press * Math.PI) * 0.08 : 1;
    return (
      <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 * scale, padding: `${10 * scale}px ${18 * scale}px`, borderRadius: 8 * scale, fontFamily: FONT,
        fontWeight: 600, fontSize: 16 * scale, color: "#fff", background: on ? col : `${col}33`, border: `1px solid ${col}88`, transform: `scale(${s})`,
        boxShadow: on ? `0 0 24px ${col}88` : "none" }}>
        <Icon name={icon} size={16 * scale} stroke={2.2} />
        {label}
      </div>
    );
  };
  return (
    <div style={{ display: "flex", gap: 10 * scale }}>
      {btn("start", "Start", "#16a34a", "Play")}
      {btn("restart", "Restart", "#64748b", "RotateCw")}
      {btn("stop", "Stop", "#dc2626", "Square")}
    </div>
  );
};

export type Line = { t: number; text: string; kind?: "info" | "ok" | "warn" | "err" | "in" | "dim" };
const lineCol = { info: "#cfd6de", ok: C.ok, warn: C.warn, err: C.err, in: P.cyan, dim: "#6b7380" };

/** Console: lines appear at their frame and type quickly; auto-scrolls. */
export const ConsoleView: React.FC<{ f: number; lines: Line[]; w: number; h: number; size?: number; highlight?: number; hiA?: number }> = ({ f, lines, w, h, size = 17, highlight = -1, hiA = 0 }) => {
  const lh = size * 1.6;
  const shown = lines.filter((l) => l.t <= f);
  const maxRows = Math.floor((h - 24) / lh);
  // smooth scroll: offset grows as new lines arrive
  let scroll = 0;
  shown.forEach((l, i) => {
    if (i >= maxRows) scroll += p(f, l.t, l.t + 10, easeOut) * lh;
  });
  return (
    <div style={{ width: w, height: h, background: P.console, borderRadius: 10, overflow: "hidden", position: "relative", fontFamily: MONO, fontSize: size }}>
      <div style={{ position: "absolute", left: 18, right: 18, top: 12, transform: `translateY(${-scroll}px)` }}>
        {shown.map((l, i) => {
          const chars = Math.floor(Math.min(1, (f - l.t) / Math.max(6, l.text.length * 0.35)) * l.text.length);
          const isHi = i === lines.indexOf(l) && lines.indexOf(l) === highlight;
          return (
            <div key={i} style={{ height: lh, lineHeight: `${lh}px`, whiteSpace: "pre", color: lineCol[l.kind ?? "info"], position: "relative" }}>
              {isHi && <div style={{ position: "absolute", left: -10, right: -10, top: 2, bottom: 2, borderRadius: 6, background: `rgba(240,82,79,${0.22 * hiA})`, border: `1px solid rgba(240,82,79,${0.8 * hiA})` }} />}
              <span style={{ position: "relative" }}>{l.text.slice(0, chars)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26, background: `linear-gradient(${P.console}, transparent)` }} />
    </div>
  );
};

/** Simulated resource series: smooth, plausible, deterministic. */
export const series = (seed: number, base: number, wobble: number, spikes: [number, number, number][] = []) => (x: number) => {
  let v = base + Math.sin(x * 0.09 + seed) * wobble * 0.5 + Math.sin(x * 0.031 + seed * 2) * wobble * 0.5 + (rand(Math.floor(x / 3) + seed) - 0.5) * wobble * 0.25;
  for (const [at, height, width] of spikes) v += height * Math.exp(-((x - at) ** 2) / (2 * width * width));
  return Math.max(0, Math.min(100, v));
};

export const Graph: React.FC<{ f: number; w: number; h: number; fn: (x: number) => number; color: string; label: string; unit: (v: number) => string; icon: "Cpu" | "MemoryStick" | "HardDrive" | "Activity"; grow?: number; offset?: number }> = ({
  f, w, h, fn, color, label, unit, icon, grow = 1, offset = 0 }) => {
  const N = 60;
  const gh = h - 66;
  const pts: string[] = [];
  const visible = Math.max(2, Math.floor(N * grow));
  for (let i = 0; i < visible; i++) {
    const x = (i / (N - 1)) * (w - 36) + 18;
    const v = fn((f + offset) / 6 - (N - i));
    pts.push(`${i ? "L" : "M"}${x.toFixed(1)},${(56 + gh - (v / 100) * gh).toFixed(1)}`);
  }
  const lastV = fn((f + offset) / 6);
  const lastX = ((visible - 1) / (N - 1)) * (w - 36) + 18;
  return (
    <div style={{ width: w, height: h, background: P.card, borderRadius: 12, position: "relative", overflow: "hidden", fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 18, top: 14, display: "flex", alignItems: "center", gap: 8, color: P.sub, fontSize: 15, fontWeight: 600 }}>
        <Icon name={icon} size={18} color={color} />
        {label}
      </div>
      <div style={{ position: "absolute", right: 18, top: 12, color: P.text, fontSize: 17, fontWeight: 600, fontFamily: MONO }}>{unit(lastV)}</div>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={18} x2={w - 18} y1={56 + gh * g} y2={56 + gh * g} stroke="rgba(255,255,255,0.05)" />)}
        <path d={`${pts.join(" ")} L ${lastX},${56 + gh} L 18,${56 + gh} Z`} fill={color} fillOpacity={0.12} />
        <path d={pts.join(" ")} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        <circle cx={lastX} cy={56 + gh - (lastV / 100) * gh} r={4.5} fill={color} />
      </svg>
    </div>
  );
};

const tabs = ["Console", "Files", "Databases", "Schedules", "Users", "Backups", "Network", "Startup", "Settings"];

export const PteroWindow: React.FC<{ w: number; h: number; tab?: string; name?: string; children?: React.ReactNode; state?: PowerState; f?: number; brand?: "telegram" | "whatsapp"; topRight?: React.ReactNode }> = ({
  w, h, tab = "Console", name = "asisten-bot", children, state = "running", f = 0, brand = "telegram", topRight }) => (
  <div style={{ width: w, height: h, background: P.bg, borderRadius: 18, overflow: "hidden", fontFamily: FONT, color: P.text, position: "relative", border: "1px solid rgba(255,255,255,0.07)" }}>
    <div style={{ height: 64, background: P.bar, display: "flex", alignItems: "center", padding: "0 26px", gap: 18, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <PteroLogo height={26} />
      <div style={{ flex: 1 }} />
      <SimTag dark />
      <Icon name="Server" size={20} color={P.sub} />
      <Icon name="Settings" size={20} color={P.sub} />
    </div>
    <div style={{ height: 50, background: "#181a1f", display: "flex", alignItems: "center", padding: "0 26px", gap: 26, fontSize: 15, fontWeight: 500, color: P.sub }}>
      {tabs.map((t) => (
        <div key={t} style={{ height: 50, display: "flex", alignItems: "center", color: t === tab ? P.text : undefined, borderBottom: t === tab ? `2px solid ${P.cyan}` : "2px solid transparent" }}>{t}</div>
      ))}
    </div>
    <div style={{ display: "flex", alignItems: "center", padding: "20px 28px 6px", gap: 16 }}>
      <BrandLogo brand={brand} size={34} />
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{name}</div>
        <div style={{ fontSize: 14, color: P.sub, fontFamily: MONO }}>node-01 · 10.0.0.x</div>
      </div>
      <StatusPill state={state} f={f} size={15} />
      <div style={{ flex: 1 }} />
      {topRight}
    </div>
    <div style={{ position: "absolute", left: 28, right: 28, top: 200, bottom: 24 }}>{children}</div>
  </div>
);

export type FileRow = { name: string; size: string; dir?: boolean; hi?: boolean };
export const FileManager: React.FC<{ f: number; w: number; h: number; rows: FileRow[]; at?: number }> = ({ f, w, h, rows, at = 0 }) => (
  <div style={{ width: w, height: h, background: P.card, borderRadius: 12, overflow: "hidden", fontFamily: FONT }}>
    <div style={{ display: "flex", padding: "14px 20px", color: P.sub, fontSize: 14, fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ flex: 1 }}>/home/container</div>
      <div>Ukuran</div>
    </div>
    {rows.map((r, i) => {
      const q = p(f, at + i * 5, at + i * 5 + 20, easeOut);
      return (
        <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", fontSize: 17, color: P.text, opacity: q, transform: `translateX(${(1 - q) * 30}px)`,
          background: r.hi ? "rgba(79,179,255,0.1)" : undefined, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <Icon name={r.dir ? "Folder" : "FileCode"} size={20} color={r.dir ? P.cyan : P.sub} />
          <div style={{ flex: 1, fontFamily: MONO, fontSize: 16 }}>{r.name}</div>
          <div style={{ color: P.sub, fontFamily: MONO, fontSize: 14 }}>{r.size}</div>
        </div>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ chat */
export type Msg = { t: number; from: "user" | "bot"; text: string; typing?: number };
export const ChatWindow: React.FC<{ f: number; platform: "telegram" | "whatsapp"; title: string; subtitle?: string; msgs: Msg[]; w: number; h: number; dark?: boolean }> = ({
  f, platform, title, subtitle = "bot", msgs, w, h, dark }) => {
  const tg = platform === "telegram";
  const head = tg ? C.telegram : "#075E54";
  const bg = dark ? "#101214" : tg ? "#eef3f7" : "#efeae2";
  const userBub = dark ? (tg ? "#2b5278" : "#005c4b") : tg ? "#e1f6cb" : "#d9fdd3";
  const botBub = dark ? "#1f2328" : "#ffffff";
  const shown = msgs.filter((m) => f >= m.t);
  let y = 0;
  const items = shown.map((m, i) => {
    const q = p(f, m.t, m.t + 22, easeOut);
    const lines = Math.ceil(m.text.length / 30);
    const bh = 26 + lines * 26;
    const el = { m, q, y, bh, i };
    y += (bh + 14) * Math.min(1, q * 1.4);
    return el;
  });
  const viewH = h - 150;
  const scroll = Math.max(0, y - viewH);
  return (
    <div style={{ width: w, height: h, borderRadius: 26, overflow: "hidden", background: bg, fontFamily: FONT, position: "relative", border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ height: 76, background: head, display: "flex", alignItems: "center", gap: 14, padding: "0 22px", color: "#fff" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="Bot" size={24} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>{subtitle}</div>
        </div>
        <div style={{ flex: 1 }} />
        <BrandLogo brand={platform} size={30} inner={head} mono="#fff" />
      </div>
      <div style={{ position: "absolute", left: 18, right: 18, top: 92, bottom: 70, overflow: "hidden" }}>
        <div style={{ position: "relative", transform: `translateY(${-scroll}px)` }}>
          {items.map(({ m, q, y: yy, i }) => {
            const user = m.from === "user";
            const typing = m.typing !== undefined && f < m.t + m.typing;
            return (
              <div key={i} style={{ position: "absolute", top: yy, [user ? "right" : "left"]: 0, maxWidth: w * 0.72, opacity: q,
                transform: `translateY(${(1 - q) * 24}px) scale(${0.9 + 0.1 * q})`, transformOrigin: user ? "right bottom" : "left bottom",
                background: user ? userBub : botBub, color: dark ? "#e8eaed" : "#111", padding: "12px 16px", borderRadius: 18,
                borderBottomRightRadius: user ? 6 : 18, borderBottomLeftRadius: user ? 18 : 6, fontSize: 19, lineHeight: "26px", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", whiteSpace: "pre-wrap" }}>
                {typing ? <TypingDots f={f} /> : m.text}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, height: 46, borderRadius: 23, background: dark ? "#1b1e22" : "#fff", display: "flex", alignItems: "center", padding: "0 18px", gap: 10, color: "#999", fontSize: 16 }}>
        Pesan
        <div style={{ flex: 1 }} />
        <Icon name="Send" size={20} color={tg ? C.telegram : C.whatsapp} />
      </div>
    </div>
  );
};

const TypingDots: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ display: "flex", gap: 6, padding: "6px 2px" }}>
    {[0, 1, 2].map((i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#9aa0a6", opacity: 0.35 + 0.65 * Math.max(0, Math.sin(f * 0.18 - i * 0.9)) }} />)}
  </div>
);

/* ------------------------------------------------------------------ code */
export type CodeLine = { text: string; tone?: "kw" | "str" | "cm" | "plain" | "err" | "fix" };
const tok = { kw: "#ff9b6b", str: "#9fd8a6", cm: "#6f7782", plain: "#dfe3e8", err: "#ff7b78", fix: "#7fe0b0" };

export const CodeCard: React.FC<{ f: number; lines: CodeLine[]; w: number; h?: number; at?: number; title?: string; hiLine?: number; hiA?: number; hiColor?: string; size?: number; strike?: number }> = ({
  f, lines, w, h, at = 0, title = "index.js", hiLine = -1, hiA = 0, hiColor = C.err, size = 19, strike = 0 }) => (
  <div style={{ width: w, height: h, background: "#121417", borderRadius: 16, overflow: "hidden", fontFamily: MONO, fontSize: size, border: "1px solid rgba(255,255,255,0.07)" }}>
    <div style={{ height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: "#0c0d0f", color: "#8b929c", fontSize: 15 }}>
      {[C.err, C.warn, C.ok].map((c) => <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.8 }} />)}
      <div style={{ marginLeft: 10 }}>{title}</div>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 12, letterSpacing: "0.08em", opacity: 0.6 }}>CONTOH FIKTIF</span>
    </div>
    <div style={{ padding: "14px 0" }}>
      {lines.map((l, i) => {
        const q = p(f, at + i * 4, at + i * 4 + 16, easeOut);
        const hi = i === hiLine;
        return (
          <div key={i} style={{ display: "flex", padding: "3px 18px", opacity: q, transform: `translateX(${(1 - q) * 16}px)`, position: "relative",
            background: hi ? `${hiColor}${Math.round(hiA * 40).toString(16).padStart(2, "0")}` : undefined }}>
            <span style={{ width: 34, color: "#4b525c" }}>{i + 1}</span>
            <span style={{ color: tok[l.tone ?? "plain"], whiteSpace: "pre", position: "relative" }}>
              {l.text}
              {hi && strike > 0 && <span style={{ position: "absolute", left: 0, top: "52%", height: 2, width: `${strike * 100}%`, background: hiColor }} />}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

/** Abstract browser frame (no real site). */
export const Browser: React.FC<{ w: number; h: number; url?: string; children?: React.ReactNode; tone?: "light" | "dark" }> = ({ w, h, url = "panel.contoh.id", children, tone = "light" }) => (
  <div style={{ width: w, height: h, borderRadius: 16, overflow: "hidden", background: tone === "light" ? "#fff" : "#16181c", border: tone === "light" ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)", fontFamily: FONT, position: "relative" }}>
    <div style={{ height: 46, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: tone === "light" ? "#f1f0ee" : "#0f1013" }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
      <div style={{ marginLeft: 16, flex: 1, height: 28, borderRadius: 8, background: tone === "light" ? "#fff" : "#1d2025", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontSize: 14, color: "#8b929c" }}>
        <Icon name="Lock" size={14} color="#8b929c" />
        {url}
      </div>
    </div>
    <div style={{ position: "absolute", top: 46, left: 0, right: 0, bottom: 0 }}>{children}</div>
  </div>
);
