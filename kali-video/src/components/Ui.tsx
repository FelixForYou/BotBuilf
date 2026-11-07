import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, H, MONO, PAD, SERIF, SHADOW, W } from "../theme";
import { ease, easeInOut, prog, spr } from "../timing";

/* ------------------------------------------------------------------ */
/* Backdrop: white with slowly drifting pastel blobs                    */
/* ------------------------------------------------------------------ */
export const Backdrop: React.FC<{ tint: [string, string]; dark?: number }> = ({ tint, dark = 0 }) => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 140) * 6;
  const b = Math.cos(f / 170) * 6;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${20 + a}% ${18 + b}%, ${tint[0]}, transparent 70%), radial-gradient(900px 1000px at ${85 - b}% ${80 + a}%, ${tint[1]}, transparent 70%)`,
        }}
      />
      {dark > 0 ? (
        <AbsoluteFill style={{ background: `radial-gradient(1100px 1300px at 50% 35%, #12245a, ${C.navy} 70%)`, opacity: dark }} />
      ) : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Header + footer chrome                                              */
/* ------------------------------------------------------------------ */
export const Chrome: React.FC<{ section: string; index: number; total: number; dark?: number }> = ({ section, index, total, dark = 0 }) => {
  const f = useCurrentFrame();
  const col = dark > 0.5 ? "rgba(255,255,255,0.45)" : C.faint;
  const sec = Math.floor(f / 60);
  const fr = f % 60;
  const tc = `00:00:${String(sec).padStart(2, "0")}:${String(fr).padStart(2, "0")}`;
  return (
    <AbsoluteFill style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 2.5, color: col, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: PAD - 20, top: 46 }}>KALI LINUX · EDUKASI</div>
      <div style={{ position: "absolute", right: PAD - 20, top: 46, textAlign: "right" }}>
        <div>{section}</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 8 }}>
          {new Array(total).fill(0).map((_, i) => (
            <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: i < index ? (dark > 0.5 ? "#fff" : C.blue) : col, opacity: i < index ? 1 : 0.5 }} />
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: PAD - 20, bottom: 40 }}>{tc} • NARASI + SFX</div>
      <div style={{ position: "absolute", right: PAD - 20, bottom: 40 }}>1080×1920 · 60FPS</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Eyebrow + headline with accent words                                 */
/* ------------------------------------------------------------------ */
export type Word = string | { t: string; accent?: "blue" | "serif" | "red" | "green" };

export const Eyebrow: React.FC<{ text: string; start: number; dot?: string }> = ({ text, start, dot = C.blue }) => {
  const f = useCurrentFrame();
  const p = prog(f, start, 20);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.muted, opacity: p, transform: `translateY(${(1 - p) * 10}px)` }}>
      <span style={{ width: 9, height: 9, borderRadius: 5, background: dot }} />
      {text}
    </div>
  );
};

/** Headline: words rise from a mask, one by one. */
export const Headline: React.FC<{ words: Word[]; start: number; size?: number; stagger?: number; out?: number; lineBreakAfter?: number[] }> = ({ words, start, size = 96, stagger = 3, out, lineBreakAfter = [] }) => {
  const f = useCurrentFrame();
  const o = out !== undefined ? prog(f, out, 14, easeInOut) : 0;
  return (
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.06, letterSpacing: -size * 0.045, color: C.ink, display: "flex", flexWrap: "wrap", columnGap: size * 0.22 }}>
      {words.map((w, i) => {
        const wd = typeof w === "string" ? { t: w } : w;
        const p = prog(f, start + i * stagger, 24, ease);
        const style: React.CSSProperties =
          wd.accent === "blue"
            ? { color: C.blue }
            : wd.accent === "serif"
              ? { fontFamily: SERIF, fontWeight: 400, fontStyle: "italic", color: C.blue, letterSpacing: 0 }
              : wd.accent === "red"
                ? { color: C.red }
                : wd.accent === "green"
                  ? { color: C.green }
                  : {};
        return (
          <React.Fragment key={i}>
            <span style={{ overflow: "hidden", display: "inline-block", paddingBottom: size * 0.1, marginBottom: -size * 0.1 }}>
              <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 105 + o * -105}%)`, ...style }}>{wd.t}</span>
            </span>
            {lineBreakAfter.includes(i) ? <span style={{ flexBasis: "100%", height: 0 }} /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* White card (mac-window style)                                        */
/* ------------------------------------------------------------------ */
export const Card: React.FC<{
  x?: number;
  y: number;
  w?: number;
  h?: number;
  title?: string;
  meta?: string;
  start: number;
  end?: number;
  children?: React.ReactNode;
  pad?: number;
  bg?: string;
  style?: React.CSSProperties;
}> = ({ x = PAD, y, w = W - PAD * 2, h, title, meta, start, end, children, pad = 28, bg = C.card, style }) => {
  const f = useCurrentFrame();
  const s = spr(f, start, 16, 140);
  const o = end !== undefined ? prog(f, end, 16, easeInOut) : 0;
  const v = Math.min(1, s);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: bg,
        borderRadius: 24,
        border: `1.5px solid ${C.line}`,
        boxShadow: SHADOW,
        overflow: "hidden",
        opacity: v * (1 - o),
        transform: `translateY(${(1 - v) * 50 - o * 30}px) scale(${0.97 + 0.03 * v})`,
        filter: `blur(${(1 - v) * 6 + o * 6}px)`,
        ...style,
      }}
    >
      {title ? (
        <div style={{ height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", borderBottom: `1.5px solid ${C.line}` }}>
          {["#e6e8ee", "#e6e8ee", "#e6e8ee"].map((c, i) => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
          <span style={{ marginLeft: 10, fontFamily: FONT, fontWeight: 700, fontSize: 22, color: C.ink }}>{title}</span>
          <span style={{ flex: 1 }} />
          {meta ? <span style={{ fontFamily: MONO, fontSize: 17, color: C.faint }}>{meta}</span> : null}
        </div>
      ) : null}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Design-tool selection box with handles + size label                 */
/* ------------------------------------------------------------------ */
export const Select: React.FC<{ x: number; y: number; w: number; h: number; start: number; end?: number; label?: string; color?: string }> = ({ x, y, w, h, start, end, label, color = C.blue }) => {
  const f = useCurrentFrame();
  if (f < start) return null;
  const p = prog(f, start, 14);
  const o = end !== undefined ? prog(f, end, 10) : 0;
  const sc = 1.06 - 0.06 * p;
  const handle = (l: number, t: number) => (
    <div style={{ position: "absolute", left: l - 6, top: t - 6, width: 12, height: 12, background: "#fff", border: `2px solid ${color}`, borderRadius: 2 }} />
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: p * (1 - o), transform: `scale(${sc})`, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, border: `2.5px solid ${color}`, borderRadius: 4 }} />
      {handle(0, 0)}
      {handle(w, 0)}
      {handle(0, h)}
      {handle(w, h)}
      <div style={{ position: "absolute", left: w / 2, top: h + 12, transform: "translateX(-50%)", background: color, color: "#fff", fontFamily: MONO, fontSize: 16, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>
        {label ?? `${Math.round(w)} × ${Math.round(h)}`}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Cursor that travels between waypoints and clicks                     */
/* ------------------------------------------------------------------ */
export const Cursor: React.FC<{ path: { at: number; x: number; y: number }[]; clicks?: number[]; hideAfter?: number }> = ({ path, clicks = [], hideAfter }) => {
  const f = useCurrentFrame();
  if (f < path[0].at - 10 || (hideAfter !== undefined && f > hideAfter)) return null;
  const at = path.map((p) => p.at);
  const opt = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: easeInOut };
  const x = path.length > 1 ? interpolate(f, at, path.map((p) => p.x), opt) : path[0].x;
  const y = path.length > 1 ? interpolate(f, at, path.map((p) => p.y), opt) : path[0].y;
  const appear = prog(f, path[0].at - 10, 10);
  const fade = hideAfter !== undefined ? 1 - prog(f, hideAfter - 10, 10) : 1;
  const pressing = clicks.some((c) => f >= c && f < c + 7);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: appear * fade, pointerEvents: "none" }}>
      {clicks.map((c) =>
        f >= c && f < c + 26 ? (
          <div key={c} style={{ position: "absolute", left: -34, top: -34, width: 68, height: 68, borderRadius: 34, background: `${C.blue}33`, border: `2px solid ${C.blue}`, transform: `scale(${0.4 + (f - c) / 18})`, opacity: 1 - (f - c) / 26 }} />
        ) : null,
      )}
      <svg width={46} height={46} viewBox="0 0 24 24" style={{ transform: `scale(${pressing ? 0.85 : 1})`, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))" }}>
        <path d="M5 3l14 7.5-6.2 1.7L10 18.5z" fill={C.ink} stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Pill (inline highlighted word)                                       */
/* ------------------------------------------------------------------ */
export const Pill: React.FC<{ text: string; color: string; size: number; p: number; strike?: number }> = ({ text, color, size, p, strike = 0 }) => (
  <span style={{ position: "relative", display: "inline-block", background: color, color: "#fff", borderRadius: size * 0.36, padding: `0.02em 0.24em 0.08em`, transform: `scale(${0.8 + 0.2 * p})`, opacity: p, fontFamily: FONT, fontWeight: 800, letterSpacing: -size * 0.04, boxShadow: `0 12px 30px ${color}44` }}>
    {text}
    {strike > 0 ? <span style={{ position: "absolute", left: "6%", right: "6%", top: "52%", height: size * 0.07, background: C.ink, transform: `scaleX(${strike})`, transformOrigin: "left", borderRadius: 4 }} /> : null}
  </span>
);

/* ------------------------------------------------------------------ */
/* Bottom command bar (persistent UI, like a search/prompt box)         */
/* ------------------------------------------------------------------ */
export const CommandBar: React.FC<{ query?: string; typeAt?: number; sendAt?: number; chips?: string[]; hide?: number }> = ({ query, typeAt = 0, sendAt, chips = ["kali.org", "docs"], hide = 0 }) => {
  const f = useCurrentFrame();
  const n = query ? Math.floor(interpolate(f, [typeAt, typeAt + query.length * 2.2], [0, query.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) : 0;
  const sent = sendAt !== undefined && f >= sendAt;
  const typed = query && !sent ? query.slice(0, n) : "";
  const btnPulse = sendAt !== undefined && f >= sendAt && f < sendAt + 10 ? 0.86 : 1;
  const y = 1590;
  return (
    <div style={{ position: "absolute", left: PAD, top: y, width: W - PAD * 2, opacity: 1 - hide, transform: `translateY(${hide * 40}px)` }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {chips.map((c) => (
          <span key={c} style={{ fontFamily: MONO, fontSize: 17, color: C.muted, background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.green }} />
            {c}
          </span>
        ))}
      </div>
      <div style={{ height: 124, background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 26, boxShadow: SHADOW, padding: "22px 26px", position: "relative" }}>
        <div style={{ fontFamily: FONT, fontSize: 28, color: typed ? C.ink : C.faint, fontWeight: 500 }}>
          {typed || "Tanya soal Kali Linux..."}
          {typed ? <span style={{ display: "inline-block", width: 3, height: 30, background: C.ink, marginLeft: 3, verticalAlign: "middle", opacity: Math.floor(f / 16) % 2 }} /> : null}
        </div>
        <div style={{ position: "absolute", left: 26, bottom: 18, display: "flex", gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${C.faint}`, opacity: 0.6 }} />
          ))}
        </div>
        <div style={{ position: "absolute", right: 22, bottom: 18, width: 50, height: 50, borderRadius: 25, background: typed || sent ? C.blue : "#e9edf5", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${btnPulse})` }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={typed || sent ? "#fff" : C.faint} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
export const SEND_BTN = { x: W - PAD - 22 - 25, y: 1590 + 41 + 124 - 18 - 25 };

/* ------------------------------------------------------------------ */
/* Captions (Indonesian subtitles), spoken words darken                 */
/* ------------------------------------------------------------------ */
export const Captions: React.FC<{ parts: { start: number; dur: number; text: string }[]; dark?: boolean }> = ({ parts, dark }) => {
  const f = useCurrentFrame();
  const cur = parts.find((p) => f >= p.start - 3 && f < p.start + p.dur + 10);
  if (!cur) return null;
  const pin = prog(f, cur.start - 3, 10);
  const pout = prog(f, cur.start + cur.dur + 1, 9, easeInOut);
  const words = cur.text.split(" ");
  const spoken = interpolate(f, [cur.start, cur.start + cur.dur], [0, words.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: PAD, right: PAD, top: 1400, height: 150, display: "flex", alignItems: "flex-end", justifyContent: "center", opacity: pin * (1 - pout), transform: `translateY(${(1 - pin) * 10}px)` }}>
      <div style={{ textAlign: "center", fontFamily: FONT, fontSize: 36, fontWeight: 600, lineHeight: 1.32, letterSpacing: -0.5 }}>
        {words.map((w, i) => (
          <span key={i} style={{ color: i < spoken ? (dark ? "#fff" : C.ink) : dark ? "rgba(255,255,255,0.35)" : C.faint }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Scene wrapper: soft fade + rise in, soft fade out. */
export const Shell: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const pin = prog(f, 0, 18);
  const pout = prog(f, dur - 14, 14, easeInOut);
  return <AbsoluteFill style={{ opacity: pin * (1 - pout), transform: `translateY(${(1 - pin) * 24 - pout * 24}px)`, filter: `blur(${(1 - pin) * 6 + pout * 6}px)` }}>{children}</AbsoluteFill>;
};

export { H };
