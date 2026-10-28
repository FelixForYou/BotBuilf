import React from "react";
import { E, SPRING, sp, tw } from "../lib/anim";
import { C, F } from "../theme";

/**
 * Kinetic typography: tiap karakter naik dari balik mask dengan stagger,
 * rotasi kecil & blur yang mengendap (follow-through).
 */
export const SplitChars: React.FC<{
  text: string;
  f: number;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
  /** frame mulai keluar (opsional) */
  exitAt?: number;
  from?: "below" | "above";
}> = ({ text, f, delay = 0, stagger = 2.2, style, exitAt, from = "below" }) => {
  const chars = Array.from(text);
  const dir = from === "below" ? 1 : -1;
  return (
    <span style={{ display: "inline-flex", whiteSpace: "pre", ...style }}>
      {chars.map((ch, i) => {
        const d = delay + i * stagger;
        const s = sp(f, d, SPRING.pop);
        const x = exitAt !== undefined ? tw(f, exitAt + i * 1.2, exitAt + i * 1.2 + 18, 0, 1, E.in) : 0;
        const y = (1 - s) * 135 * dir - x * 135 * dir;
        const blur = Math.max(0, (1 - tw(f, d, d + 14, 0, 1)) * 8 + x * 6);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${y}%) rotate(${(1 - s) * 8 * dir}deg)`,
                filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                opacity: tw(f, d, d + 8, 0, 1) * (1 - x),
              }}
            >
              {ch}
            </span>
          </span>
        );
      })}
    </span>
  );
};

/** Baris teks yang tersingkap dari balik mask (per kata). */
export const MaskWords: React.FC<{
  text: string;
  f: number;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
  wordStyle?: (i: number, word: string) => React.CSSProperties | undefined;
  exitAt?: number;
}> = ({ text, f, delay = 0, stagger = 5, style, wordStyle, exitAt }) => {
  const words = text.split(" ");
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", columnGap: "0.26em", ...style }}>
      {words.map((w, i) => {
        const d = delay + i * stagger;
        const s = sp(f, d, SPRING.smooth);
        const x = exitAt !== undefined ? tw(f, exitAt + i * 2, exitAt + i * 2 + 20, 0, 1, E.in) : 0;
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0.04em 0.14em", margin: "-0.06em -0.04em -0.14em" }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - s) * 140 - x * 140}%)`,
                ...wordStyle?.(i, w),
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </span>
  );
};

/** Label section bergaya editorial: "02 — FELIXIORITY TOOLS". */
export const SectionLabel: React.FC<{ index: string; title: string; f: number; delay?: number; exitAt?: number; dark?: boolean }> = ({
  index,
  title,
  f,
  delay = 0,
  exitAt,
  dark,
}) => {
  const line = tw(f, delay, delay + 30, 0, 1);
  const out = exitAt !== undefined ? tw(f, exitAt, exitAt + 18, 0, 1, E.in) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: F.mono, fontSize: 19, letterSpacing: "0.14em", color: dark ? C.softGray : C.charcoalSoft, opacity: 1 - out }}>
      <span style={{ color: C.terracotta, opacity: tw(f, delay, delay + 12, 0, 1) }}>{index}</span>
      <span style={{ width: 56 * line, height: 1.5, background: dark ? C.softGray : C.charcoal, opacity: 0.5 }} />
      <SplitChars text={title} f={f} delay={delay + 8} stagger={0.9} />
    </div>
  );
};

/**
 * Headline editorial: bagian sans + bagian serif italic terracotta.
 * parts: [teks, "sans" | "serif"]
 */
export const Headline: React.FC<{
  parts: Array<[string, "sans" | "serif"]>;
  f: number;
  delay?: number;
  size?: number;
  exitAt?: number;
  align?: "left" | "center";
  color?: string;
}> = ({ parts, f, delay = 0, size = 92, exitAt, align = "left", color = C.charcoal }) => {
  let wordIndex = 0;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: "0.24em", justifyContent: align === "center" ? "center" : "flex-start", lineHeight: 1.02, color }}>
      {parts.map(([t, kind], pi) => {
        const start = wordIndex;
        wordIndex += t.split(" ").length;
        return (
          <MaskWords
            key={pi}
            text={t}
            f={f}
            delay={delay + start * 5}
            exitAt={exitAt !== undefined ? exitAt + start * 2 : undefined}
            style={
              kind === "serif"
                ? { fontFamily: F.serif, fontStyle: "italic", fontSize: size * 1.12, color: C.terracotta, letterSpacing: "-0.01em", fontWeight: 400 }
                : { fontFamily: F.sans, fontSize: size, fontWeight: 600, letterSpacing: "-0.045em" }
            }
          />
        );
      })}
    </div>
  );
};
