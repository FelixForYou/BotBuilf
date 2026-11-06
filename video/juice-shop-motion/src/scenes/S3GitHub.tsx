import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Corners, Sfx, Typewriter, clamp, easeInOut, prog} from '../components/fx';
import {Icon} from '../components/Icons';
import {cue, scene} from '../timeline';
import {C, FACTS, FONT} from '../theme';

const W = 1500;
const H = 830;
const GH = {bg: '#0d1117', bg2: '#010409', border: '#30363d', text: '#e6edf3', muted: '#8d96a0', link: '#4493f8', btn: '#21262d'};

const Btn: React.FC<{icon: string; label: string; count?: string; active?: boolean; glow?: number; press?: number}> = ({
  icon,
  label,
  count,
  active,
  glow = 0,
  press = 0,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${active ? '#e3b341' : GH.border}`,
      borderRadius: 8,
      background: GH.btn,
      color: GH.text,
      fontFamily: FONT.body,
      fontSize: 19,
      height: 40,
      transform: `scale(${1 - press * 0.08})`,
      boxShadow: glow ? `0 0 ${30 * glow}px ${C.amber}aa, 0 0 0 ${3 * glow}px ${C.amber}55` : undefined,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px'}}>
      <Icon name={icon} size={20} color={active ? '#e3b341' : GH.muted} fill={active ? '#e3b341' : 'none'} />
      {label}
    </div>
    {count && (
      <div style={{borderLeft: `1px solid ${GH.border}`, padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center'}}>
        <span style={{background: '#30363d', borderRadius: 20, padding: '1px 9px', fontSize: 16, fontWeight: 600}}>{count}</span>
      </div>
    )}
  </div>
);

const FILES = [
  ['dir', '.github'],
  ['dir', 'config'],
  ['dir', 'data'],
  ['dir', 'frontend'],
  ['dir', 'lib'],
  ['dir', 'routes'],
  ['dir', 'test'],
  ['file', 'Dockerfile'],
  ['file', 'LICENSE'],
  ['file', 'README.md'],
  ['file', 'package.json'],
];

const RepoPage: React.FC<{starred: number; starGlow: number; press: number; hl: Record<string, number>}> = ({starred, starGlow, press, hl}) => {
  const f = useCurrentFrame();
  const Hl: React.FC<{k: string; style: React.CSSProperties}> = ({k, style}) => {
    const p = hl[k] ?? 0;
    return p > 0 ? (
      <div style={{position: 'absolute', border: `2.5px solid ${C.cyan}`, borderRadius: 10, boxShadow: `0 0 24px ${C.cyan}88, inset 0 0 24px ${C.cyan}22`, opacity: p, transform: `scale(${1.15 - 0.15 * p})`, pointerEvents: 'none', ...style}} />
    ) : null;
  };
  return (
    <div style={{position: 'absolute', inset: 0, background: GH.bg, color: GH.text, fontFamily: FONT.body}}>
      {/* repo header */}
      <div style={{position: 'absolute', left: 40, top: 30, display: 'flex', alignItems: 'center', gap: 14, fontSize: 30}}>
        <Icon name="repo" size={28} color={GH.muted} />
        <span style={{color: GH.link}}>juice-shop</span>
        <span style={{color: GH.muted}}>/</span>
        <span style={{color: GH.link, fontWeight: 600}}>juice-shop</span>
        <span style={{fontSize: 16, color: GH.muted, border: `1px solid ${GH.border}`, borderRadius: 20, padding: '2px 10px', marginLeft: 6}}>Public</span>
      </div>
      <Hl k="name" style={{left: 26, top: 18, width: 520, height: 64}} />
      <div style={{position: 'absolute', right: 36, top: 30, display: 'flex', gap: 12}}>
        <Btn icon="eye" label="Watch" />
        <Btn icon="fork" label="Fork" count={FACTS.forks} />
        <Btn icon="star" label={starred > 0.5 ? 'Starred' : 'Star'} count={FACTS.stars} active={starred > 0.5} glow={starGlow} press={press} />
      </div>
      <Hl k="star" style={{right: 24, top: 18, width: 186, height: 64}} />

      {/* tabs */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, height: 54, borderBottom: `1px solid ${GH.border}`, display: 'flex', gap: 34, paddingLeft: 40, alignItems: 'center', fontSize: 19, color: GH.muted}}>
        {['Code', 'Issues', 'Pull requests', 'Actions', 'Security', 'Insights'].map((t, i) => (
          <div key={t} style={{display: 'flex', alignItems: 'center', gap: 8, color: i === 0 ? GH.text : GH.muted, height: '100%', borderBottom: i === 0 ? '3px solid #f78166' : '3px solid transparent'}}>
            <Icon name={['code', 'target', 'fork', 'scan', 'shield', 'trophy'][i]} size={18} color={GH.muted} />
            {t}
          </div>
        ))}
      </div>

      {/* file list */}
      <div style={{position: 'absolute', left: 40, top: 176, width: 960, border: `1px solid ${GH.border}`, borderRadius: 10, overflow: 'hidden'}}>
        <div style={{background: '#161b22', padding: '14px 18px', fontSize: 17, color: GH.muted, display: 'flex', gap: 10, alignItems: 'center'}}>
          <div style={{width: 24, height: 24, borderRadius: 12, background: '#30363d'}} />
          <span style={{color: GH.text, fontWeight: 600}}>master</span> · latest commit on 2026-10-23
        </div>
        {FILES.map(([type, name], i) => (
          <div key={name} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', borderTop: `1px solid ${GH.border}`, fontSize: 18, opacity: prog(f, 8 + i * 2, 20 + i * 2)}}>
            <Icon name={type === 'dir' ? 'book' : 'code'} size={18} color={type === 'dir' ? '#7d8590' : GH.muted} />
            <span style={{color: GH.text}}>{name}</span>
          </div>
        ))}
      </div>
      {/* README peek */}
      <div style={{position: 'absolute', left: 40, top: 720, width: 960, height: 200, border: `1px solid ${GH.border}`, borderRadius: 10, padding: '18px 22px', display: 'flex', gap: 18, alignItems: 'center'}}>
        <Img src={staticFile('juiceshop-logo.svg')} style={{height: 64}} />
        <div style={{fontSize: 34, fontWeight: 600}}>OWASP Juice Shop</div>
      </div>

      {/* about sidebar */}
      <div style={{position: 'absolute', left: 1040, top: 176, width: 420, fontSize: 18, color: GH.muted, lineHeight: 1.5}}>
        <div style={{color: GH.text, fontWeight: 600, fontSize: 21, marginBottom: 10}}>About</div>
        <div style={{color: GH.text, fontSize: 18, marginBottom: 16}}>
          Probably the most modern and sophisticated insecure web application
        </div>
        <div style={{color: GH.link, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14}}>
          <Icon name="globe" size={18} color={GH.link} /> owasp-juice.shop
        </div>
        {[
          ['book', 'Readme'],
          ['shield', `${FACTS.license} license`],
          ['star', `${FACTS.stars} stars`],
          ['fork', `${FACTS.forks} forks`],
        ].map(([ic, t]) => (
          <div key={t} style={{display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6}}>
            <Icon name={ic} size={18} color={GH.muted} /> {t}
          </div>
        ))}
        <div style={{borderTop: `1px solid ${GH.border}`, margin: '18px 0', paddingTop: 16}}>
          <div style={{color: GH.text, fontWeight: 600, fontSize: 20, marginBottom: 8}}>Releases</div>
          <div style={{display: 'flex', gap: 10, alignItems: 'center', color: GH.text}}>
            <Icon name="flag" size={18} color="#3fb950" /> {FACTS.version}
            <span style={{fontSize: 14, color: '#3fb950', border: '1px solid #238636', borderRadius: 20, padding: '0 8px'}}>Latest</span>
          </div>
        </div>
        <div style={{borderTop: `1px solid ${GH.border}`, paddingTop: 16}}>
          <div style={{color: GH.text, fontWeight: 600, fontSize: 20, marginBottom: 8}}>Language</div>
          <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
            <div style={{width: 12, height: 12, borderRadius: 6, background: '#3178c6'}} /> {FACTS.language}
          </div>
        </div>
      </div>
      <Hl k="about" style={{left: 1026, top: 166, width: 450, height: 140}} />
      <Hl k="meta" style={{left: 1026, top: 300, width: 300, height: 150}} />
    </div>
  );
};

// camera keyframes: [frame, scale, focusX, focusY] in browser-content coordinates
const useCamera = (keys: [number, number, number, number][]) => {
  const f = useCurrentFrame();
  const frames = keys.map((k) => k[0]);
  const opts = {...clamp, easing: easeInOut};
  const s = interpolate(f, frames, keys.map((k) => k[1]), opts);
  const lim = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  // keep the page covering the whole viewport (no empty edges while zoomed)
  return {
    s,
    x: lim(interpolate(f, frames, keys.map((k) => k[2]), opts), W / (2 * s), W - W / (2 * s)),
    y: lim(interpolate(f, frames, keys.map((k) => k[3]), opts), H / (2 * s), H + 140 - H / (2 * s)),
  };
};

export const S3GitHub: React.FC = () => {
  const f = useCurrentFrame();
  const {duration} = scene('s3');
  const tRepo = cue('s3', 'GitHub');
  const tName = cue('s3', 'juice-shop, garis', -10);
  const tStars = cue('s3', 'empat belas', -14);
  const tMit = cue('s3', 'berlisensi', -6);
  const tStar = cue('s3', 'tekan tombol', -16);
  const tClick = cue('s3', 'untuk mendukung', -6);

  const win = prog(f, 0, 34);
  const cam = useCamera([
    [0, 1, W / 2, H / 2],
    [tName - 6, 1, W / 2, H / 2],
    [tName + 24, 1.75, 330, 160],
    [tStars - 6, 1.75, 330, 160],
    [tStars + 26, 1.8, 1180, 170],
    [tMit - 4, 1.8, 1180, 170],
    [tMit + 26, 1.55, 1150, 340],
    [tStar - 8, 1.55, 1150, 340],
    [tStar + 24, 1.9, 1280, 140],
    [tClick + 60, 1.9, 1280, 140],
    [duration - 10, 1.1, W / 2, H / 2 - 40],
  ]);

  // cursor path towards Star button (content coords ≈ 1390, 50)
  const cp = prog(f, tStar, tClick, easeInOut);
  const cx = interpolate(cp, [0, 1], [800, 1396]);
  const cy = interpolate(cp, [0, 1], [560, 58]) - Math.sin(cp * Math.PI) * 90;
  const press = interpolate(f, [tClick, tClick + 5, tClick + 14], [0, 1, 0], clamp);
  const starred = f >= tClick + 4 ? 1 : 0;
  const glow = interpolate(f, [tClick + 4, tClick + 20, tClick + 120], [0, 1, 0.4], clamp);

  const hl = {
    name: interpolate(f, [tName + 18, tName + 30, tStars - 4, tStars + 4], [0, 1, 1, 0], clamp),
    star: interpolate(f, [tStars + 18, tStars + 30, tMit - 4, tMit + 4], [0, 1, 1, 0], clamp),
    about: interpolate(f, [tMit + 18, tMit + 30, tStar - 6, tStar + 2], [0, 1, 1, 0], clamp),
    meta: interpolate(f, [tMit + 24, tMit + 36, tStar - 6, tStar + 2], [0, 1, 1, 0], clamp),
  };

  // lower-third caption that follows the narration
  const captions: [number, string, string][] = [
    [tName + 10, 'repo', FACTS.repo],
    [tStars + 14, 'star', `${FACTS.stars} stars di GitHub`],
    [tMit + 14, 'shield', `Lisensi ${FACTS.license} · Dokumentasi lengkap`],
    [tStar + 10, 'star', 'Dukung developer — beri Star'],
  ];
  const cur = [...captions].reverse().find((c) => f >= c[0]);
  const capP = cur ? prog(f, cur[0], cur[0] + 18) : 0;

  const bx = (1920 - W) / 2;
  const by = 46;

  return (
    <AbsoluteFill>
      <Sfx at={0} name="whoosh" volume={0.45} />
      <Sfx at={10} name="typing_short" volume={0.4} />
      <Sfx at={tRepo} name="beep2" volume={0.35} />
      {captions.map((c, i) => (
        <Sfx key={i} at={c[0] - 12} name={i === 0 ? 'whoosh' : 'whoosh_rev'} volume={0.3} />
      ))}
      {captions.map((c, i) => (
        <Sfx key={`b${i}`} at={c[0] + 8} name="blip" volume={0.35} />
      ))}
      <Sfx at={tClick} name="click" volume={0.8} />
      <Sfx at={tClick + 3} name="star" volume={0.7} />
      <Sfx at={tClick + 10} name="chime" volume={0.45} />

      {/* browser window */}
      <div
        style={{
          position: 'absolute',
          left: bx,
          top: by,
          width: W,
          height: H + 56,
          borderRadius: 16,
          overflow: 'hidden',
          border: `1.5px solid ${C.cyan}55`,
          boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 80px ${C.cyan}22`,
          transform: `perspective(1600px) rotateX(${(1 - win) * 18}deg) translateY(${(1 - win) * 120}px) scale(${0.9 + 0.1 * win})`,
          opacity: win,
        }}
      >
        <div style={{height: 56, background: '#161b22', display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', borderBottom: `1px solid ${GH.border}`}}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
          ))}
          <div style={{marginLeft: 24, flex: 1, maxWidth: 760, height: 36, borderRadius: 18, background: GH.bg2, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', fontFamily: FONT.mono, fontSize: 19, color: GH.text}}>
            <Icon name="lock" size={16} color={C.green} />
            <Typewriter text={`https://${FACTS.url}`} start={10} cps={60} caret={false} />
          </div>
        </div>
        <div style={{position: 'relative', width: W, height: H, overflow: 'hidden', background: GH.bg}}>
          <div
            style={{
              position: 'absolute',
              width: W,
              height: H + 140,
              transformOrigin: '0 0',
              transform: `translate(${W / 2 - cam.x * cam.s}px, ${H / 2 - cam.y * cam.s}px) scale(${cam.s})`,
            }}
          >
            <RepoPage starred={starred} starGlow={glow} press={press} hl={hl} />
            {/* star burst particles */}
            {f >= tClick + 3 &&
              new Array(16).fill(0).map((_, i) => {
                const a = (i / 16) * Math.PI * 2 + random(`a${i}`) * 0.4;
                const p = prog(f, tClick + 3, tClick + 40);
                const d = 20 + p * (50 + random(`d${i}`) * 40);
                return (
                  <div key={i} style={{position: 'absolute', left: 1338 + Math.cos(a) * d, top: 50 + Math.sin(a) * d, opacity: 1 - p, transform: `scale(${1 - p * 0.6}) rotate(${p * 180}deg)`}}>
                    <Icon name="star" size={12} color={C.amber} fill={C.amber} stroke={1} />
                  </div>
                );
              })}
            {/* cursor */}
            {f >= tStar - 4 && (
              <div style={{position: 'absolute', left: cx, top: cy, transform: `scale(${1 - press * 0.15})`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))'}}>
                {press > 0 && (
                  <div style={{position: 'absolute', left: -20, top: -20, width: 40, height: 40, borderRadius: 20, border: `2px solid ${C.cyan}`, transform: `scale(${1 + press})`, opacity: press}} />
                )}
                <Icon name="cursor" size={30} color="#000" fill="#fff" stroke={1.4} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* lower third */}
      {cur && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 52, display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 34px', background: 'rgba(4,7,13,0.88)', border: `1.5px solid ${C.cyan}77`, borderRadius: 12, clipPath: `inset(0 ${50 - capP * 50}% 0 ${50 - capP * 50}%)`}}>
            <Icon name={cur[1]} size={30} color={cur[1] === 'star' ? C.amber : C.cyan} fill={cur[1] === 'star' ? C.amber : 'none'} />
            <span style={{fontFamily: FONT.mono, fontSize: 32, color: C.text, letterSpacing: 1}}>{cur[2]}</span>
          </div>
        </div>
      )}
      <div style={{position: 'absolute', left: bx, top: by}}>
        <Corners w={W} h={H + 56} size={34} p={win} />
      </div>
    </AbsoluteFill>
  );
};
