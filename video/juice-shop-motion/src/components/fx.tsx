import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, FONT} from '../theme';

export const ease = Easing.bezier(0.16, 1, 0.3, 1); // expo-out
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** progress 0→1 between frames a..b with easing */
export const prog = (f: number, a: number, b: number, e = ease) =>
  interpolate(f, [a, b], [0, 1], {...clamp, easing: e});

export const useSpring = (delay = 0, damping = 18, mass = 0.8) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping, mass, stiffness: 120}});
};

/* ---------------------------------- SFX --------------------------------- */
export const Sfx: React.FC<{at: number; name: string; volume?: number; rate?: number}> = ({
  at,
  name,
  volume = 0.5,
  rate = 1,
}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} playbackRate={rate} />
  </Sequence>
);

/* ------------------------------ Background ------------------------------ */
export const Background: React.FC<{hue?: string; intensity?: number}> = ({
  hue = C.cyan,
  intensity = 1,
}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const particles = React.useMemo(
    () =>
      new Array(70).fill(0).map((_, i) => ({
        x: random(`px${i}`) * width,
        y: random(`py${i}`) * height,
        s: 1 + random(`ps${i}`) * 2.6,
        v: 0.15 + random(`pv${i}`) * 0.6,
        o: 0.15 + random(`po${i}`) * 0.55,
        tw: random(`pt${i}`) * 6.28,
      })),
    [width, height],
  );
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      {/* radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 42%, ${hue}1f 0%, transparent 60%),
                       radial-gradient(ellipse 50% 40% at 85% 90%, ${C.blue}1a 0%, transparent 70%)`,
          opacity: intensity,
        }}
      />
      {/* perspective floor grid */}
      <div
        style={{
          position: 'absolute',
          left: -width * 0.5,
          width: width * 2,
          top: height * 0.55,
          height: height * 1.2,
          transform: 'perspective(700px) rotateX(72deg)',
          transformOrigin: 'top center',
          backgroundImage: `linear-gradient(${hue}33 1.5px, transparent 1.5px), linear-gradient(90deg, ${hue}33 1.5px, transparent 1.5px)`,
          backgroundSize: '80px 80px',
          backgroundPosition: `0px ${(f * 1.2) % 80}px`,
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 50%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 50%, transparent 95%)',
          opacity: 0.55 * intensity,
        }}
      />
      {/* flat micro grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${C.line} 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      {/* particles */}
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {particles.map((p, i) => {
          const y = (p.y - f * p.v * 1.6 + height * 4) % height;
          const o = p.o * (0.6 + 0.4 * Math.sin(f / 18 + p.tw)) * intensity;
          return <circle key={i} cx={p.x + Math.sin(f / 60 + p.tw) * 12} cy={y} r={p.s} fill={i % 5 === 0 ? C.green : hue} opacity={o} />;
        })}
      </svg>
      {/* vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};

/** scanlines + subtle flicker; put above everything */
export const ScreenFx: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 2px, transparent 4px)',
          opacity: 0.6,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, transparent ${((f * 0.9) % 140) - 20}%, rgba(34,211,238,0.035) ${((f * 0.9) % 140) - 10}%, transparent ${(f * 0.9) % 140}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------ HUD pieces ------------------------------ */
export const Corners: React.FC<{
  w: number;
  h: number;
  size?: number;
  color?: string;
  p?: number;
  thick?: number;
}> = ({w, h, size = 26, color = C.cyan, p = 1, thick = 2.5}) => {
  const s = size * p;
  const st = {position: 'absolute' as const, width: s, height: s, borderColor: color, borderStyle: 'solid', opacity: p};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, pointerEvents: 'none'}}>
      <div style={{...st, left: -6, top: -6, borderWidth: `${thick}px 0 0 ${thick}px`}} />
      <div style={{...st, right: -6, top: -6, borderWidth: `${thick}px ${thick}px 0 0`}} />
      <div style={{...st, left: -6, bottom: -6, borderWidth: `0 0 ${thick}px ${thick}px`}} />
      <div style={{...st, right: -6, bottom: -6, borderWidth: `0 ${thick}px ${thick}px 0`}} />
    </div>
  );
};

export const Panel: React.FC<{
  style?: React.CSSProperties;
  children?: React.ReactNode;
  glow?: string;
}> = ({style, children, glow = C.cyan}) => (
  <div
    style={{
      background: C.panel,
      border: `1.5px solid ${glow}40`,
      borderRadius: 18,
      boxShadow: `0 0 0 1px rgba(255,255,255,0.03) inset, 0 30px 80px rgba(0,0,0,0.55), 0 0 60px ${glow}14`,
      backdropFilter: 'blur(6px)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({
  children,
  color = C.cyan,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 20px',
      borderRadius: 999,
      border: `1.5px solid ${color}66`,
      background: `${color}14`,
      color,
      fontFamily: FONT.mono,
      fontSize: 22,
      letterSpacing: 2,
      textTransform: 'uppercase',
      ...style,
    }}
  >
    {children}
  </div>
);

/* --------------------------- Kinetic typography -------------------------- */
/** Words slide up from behind a mask, staggered */
export const MaskWords: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  style?: React.CSSProperties;
  dur?: number;
  highlight?: Record<string, string>;
}> = ({text, start, stagger = 4, style, dur = 26, highlight = {}}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0 0.28em', ...style}}>
      {text.split(' ').map((w, i) => {
        const p = prog(f, start + i * stagger, start + i * stagger + dur);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em'}}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * 110}%) rotate(${(1 - p) * 6}deg)`,
                opacity: p > 0 ? 1 : 0,
                color: highlight[w] ?? undefined,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Characters decode from random glyphs into the final text */
const GLYPHS = '01<>/\\{}[]#$%&*+=?ABCDEFXYZ';
export const DecodeText: React.FC<{text: string; start: number; dur?: number; style?: React.CSSProperties}> = ({
  text,
  start,
  dur = 40,
  style,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, start, start + dur, Easing.linear);
  const out = text
    .split('')
    .map((ch, i) => {
      if (ch === ' ') return ' ';
      const reveal = (i / text.length) * 0.82;
      if (p >= reveal + 0.12) return ch;
      if (p < reveal - 0.05) return f < start ? '' : '';
      return GLYPHS[Math.floor(random(`${i}-${Math.floor(f / 2)}`) * GLYPHS.length)];
    })
    .join('');
  return <span style={style}>{out}</span>;
};

/** typewriter with caret */
export const Typewriter: React.FC<{
  text: string;
  start: number;
  cps?: number;
  caret?: boolean;
  style?: React.CSSProperties;
  caretColor?: string;
}> = ({text, start, cps = 32, caret = true, style, caretColor = C.cyan}) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - start) / 60) * cps)));
  const typing = n < text.length && f >= start;
  const blink = Math.floor(f / 18) % 2 === 0;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {caret && f >= start && (typing || blink) ? (
        <span style={{display: 'inline-block', width: '0.55em', height: '1.05em', background: caretColor, verticalAlign: 'text-bottom', marginLeft: 2}} />
      ) : null}
    </span>
  );
};
export const typeDuration = (text: string, cps = 32) => Math.ceil((text.length / cps) * 60);

/** RGB-split glitch around frame `at` */
export const Glitch: React.FC<{at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  at,
  dur = 14,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const active = f >= at && f < at + dur;
  const j = active ? (random(`g${f}`) - 0.5) * 22 : 0;
  const clip = active ? random(`c${f}`) * 80 : 0;
  return (
    <div style={{position: 'relative', ...style}}>
      {active && (
        <>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${j}px)`, color: C.cyan, mixBlendMode: 'screen', clipPath: `inset(${clip}% 0 ${Math.max(0, 70 - clip)}% 0)`}}>
            {children}
          </div>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${-j}px)`, color: C.red, mixBlendMode: 'screen', clipPath: `inset(${Math.max(0, 60 - clip)}% 0 ${clip / 2}% 0)`}}>
            {children}
          </div>
        </>
      )}
      <div style={{transform: active ? `translateX(${j * 0.3}px)` : undefined}}>{children}</div>
    </div>
  );
};

/** Scene-level enter/exit: zoom-blur in, and mask/zoom out at the end */
export const SceneShell: React.FC<{duration: number; children: React.ReactNode; out?: number}> = ({
  duration,
  children,
  out = 16,
}) => {
  const f = useCurrentFrame();
  const pin = prog(f, 0, 22);
  const pout = prog(f, duration - out, duration, easeInOut);
  const scale = interpolate(pin, [0, 1], [1.06, 1]) * interpolate(pout, [0, 1], [1, 0.94]);
  const blur = (1 - pin) * 10 + pout * 12;
  return (
    <AbsoluteFill style={{transform: `scale(${scale})`, filter: `blur(${blur}px)`, opacity: Math.min(pin * 1.4, 1 - pout)}}>
      {children}
    </AbsoluteFill>
  );
};

export const SectionLabel: React.FC<{index: string; title: string; start: number; style?: React.CSSProperties}> = ({
  index,
  title,
  start,
  style,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, start, start + 30);
  return (
    <div style={{position: 'absolute', left: 90, top: 70, display: 'flex', alignItems: 'center', gap: 18, ...style}}>
      <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.cyan, opacity: p, letterSpacing: 3}}>{index}</div>
      <div style={{height: 2, width: 80 * p, background: `linear-gradient(90deg, ${C.cyan}, transparent)`}} />
      <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.muted, letterSpacing: 4, textTransform: 'uppercase', clipPath: `inset(0 ${100 - p * 100}% 0 0)`}}>
        {title}
      </div>
    </div>
  );
};
