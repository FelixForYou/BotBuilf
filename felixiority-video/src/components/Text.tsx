import React from 'react';
import {E, ramp} from '../lib/anim';
import {C, F} from '../lib/theme';

type Word = {t: string; accent: boolean};

/** "Halo *dunia* ini" → kata-kata; teks di dalam *…* diberi aksen (serif italic terracotta). */
const parse = (s: string): Word[] => {
  const out: Word[] = [];
  let accent = false;
  s.split(/(\*)/).forEach((chunk) => {
    if (chunk === '*') {
      accent = !accent;
      return;
    }
    chunk
      .split(' ')
      .filter(Boolean)
      .forEach((t) => out.push({t, accent}));
  });
  return out;
};

/**
 * Kinetic typography: setiap kata naik dari balik mask dengan rotasi kecil,
 * stagger, lalu (opsional) keluar ke atas.
 */
export const RevealText: React.FC<{
  text: string;
  f: number;
  start: number;
  out?: number;
  stagger?: number;
  dur?: number;
  size: number;
  font?: 'serif' | 'sans' | 'mono';
  weight?: number;
  color?: string;
  accentColor?: string;
  tracking?: string;
  lineHeight?: number;
  style?: React.CSSProperties;
  align?: 'left' | 'center' | 'right';
}> = ({
  text,
  f,
  start,
  out,
  stagger = 4,
  dur = 46,
  size,
  font = 'serif',
  weight = 400,
  color = C.ink,
  accentColor = C.terra,
  tracking,
  lineHeight = 1.02,
  style,
  align = 'left',
}) => {
  const words = parse(text);
  const fam = font === 'serif' ? F.serif : font === 'mono' ? F.mono : F.sans;
  return (
    <div
      style={{
        fontFamily: fam,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: tracking ?? (font === 'serif' ? '-0.015em' : font === 'sans' ? '-0.035em' : '0.12em'),
        lineHeight,
        textAlign: align,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const s = start + i * stagger;
        const p = ramp(f, [s, s + dur], [0, 1], E.out);
        const o = out !== undefined ? ramp(f, [out + i * (stagger * 0.6), out + i * (stagger * 0.6) + 28], [0, 1], E.in) : 0;
        const y = (1 - p) * 105 - o * 105;
        const rot = (1 - p) * 7 - o * 4;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'top',
              padding: '0.06em 0.04em 0.16em',
              margin: '-0.06em -0.04em -0.16em',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${y}%) rotate(${rot}deg)`,
                transformOrigin: '0% 100%',
                fontFamily: w.accent && font !== 'mono' ? F.serif : undefined,
                fontStyle: w.accent && font !== 'mono' ? 'italic' : undefined,
                fontWeight: w.accent && font !== 'mono' ? 400 : undefined,
                color: w.accent ? accentColor : undefined,
                letterSpacing: w.accent && font === 'sans' ? '-0.02em' : undefined,
              }}
            >
              {w.t}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

/** Label kecil monospace: "02 — FELIXIORITY TOOLS" dengan garis yang tergambar. */
export const Kicker: React.FC<{f: number; start: number; out?: number; n: string; label: string; style?: React.CSSProperties; color?: string}> = ({
  f,
  start,
  out,
  n,
  label,
  style,
  color = C.terra,
}) => {
  const line = ramp(f, [start, start + 40], [0, 1], E.out);
  const lineOut = out !== undefined ? ramp(f, [out, out + 24], [0, 1], E.in) : 0;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 16, ...style}}>
      <RevealText text={n} f={f} start={start + 4} out={out} size={17} font="mono" weight={500} color={color} tracking="0.14em" />
      <div style={{width: 48 * line * (1 - lineOut), height: 1.5, background: color, opacity: 0.8}} />
      <RevealText text={label} f={f} start={start + 10} out={out} stagger={3} size={17} font="mono" weight={500} color={C.ink} tracking="0.18em" />
    </div>
  );
};

/** Angka berjalan (counter) dengan easing. */
export const Counter: React.FC<{f: number; start: number; dur?: number; to: number; from?: number; decimals?: number; suffix?: string; prefix?: string}> = ({
  f,
  start,
  dur = 70,
  to,
  from = 0,
  decimals = 0,
  suffix = '',
  prefix = '',
}) => {
  const v = ramp(f, [start, start + dur], [from, to], E.out);
  const s = decimals > 0 ? v.toFixed(decimals).replace('.', ',') : Math.round(v).toLocaleString('id-ID');
  return (
    <span style={{fontVariantNumeric: 'tabular-nums'}}>
      {prefix}
      {s}
      {suffix}
    </span>
  );
};
