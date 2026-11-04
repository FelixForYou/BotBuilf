import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Activity, Archive, CalendarClock, Clock, Cpu, Database, FileCode, FileText, Folder, Globe, HardDrive, KeyRound, MemoryStick, Network, Play, RotateCw, Settings, Square, Terminal, Users} from 'lucide-react';
import {C, FONT, MONO} from '../lib/theme';
import {E, clamp01, ip, p} from '../lib/anim';
import {Icon, PteroLogo} from './graphics';

/*
 * Tampilan dashboard server bergaya Pterodactyl v1 — disederhanakan untuk
 * keterbacaan video. Semua data adalah simulasi.
 */

export type ConsoleLine = {at: number; text: string; kind?: 'info' | 'ok' | 'err' | 'warn' | 'dim' | 'cmd'};

const kindColor = (k?: ConsoleLine['kind']) =>
  k === 'ok' ? '#4ade80' : k === 'err' ? '#f87171' : k === 'warn' ? '#fbbf24' : k === 'dim' ? '#6b7685' : k === 'cmd' ? '#93c5fd' : '#d7dde6';

/** Console: baris muncul pada frame `at` dengan efek ketik singkat. */
export const ConsoleBox: React.FC<{
  w: number; h: number; lines: ConsoleLine[]; size?: number; highlight?: number; highlightAt?: number; title?: boolean; showInput?: boolean;
}> = ({w, h, lines, size = 20, highlight = -1, highlightAt = 0, title = true, showInput = true}) => {
  const f = useCurrentFrame();
  const visible = lines.filter((l) => f >= l.at);
  const lh = size * 1.6;
  const maxRows = Math.floor((h - (showInput ? 64 : 24) - (title ? 0 : 0)) / lh);
  const shown = visible.slice(-maxRows);
  // gulir halus saat baris baru masuk
  const last = visible[visible.length - 1];
  const scrollIn = last ? 1 - p(f, last.at, 12, E.out) : 0;
  return (
    <div style={{width: w, height: h, background: '#0d1014', borderRadius: 12, position: 'relative', overflow: 'hidden', border: '1px solid #232a33'}}>
      <div style={{position: 'absolute', left: 22, right: 22, bottom: showInput ? 62 : 16, fontFamily: MONO, fontSize: size, lineHeight: `${lh}px`,
        transform: `translateY(${scrollIn * lh}px)`}}>
        {shown.map((l, i) => {
          const idx = visible.indexOf(l);
          const typed = Math.floor(ip(f, [l.at, l.at + Math.min(20, l.text.length * 0.6)], [0, l.text.length], E.linear));
          const hl = idx === highlight && f >= highlightAt;
          const hp = p(f, highlightAt, 18);
          return (
            <div key={idx} style={{color: kindColor(l.kind), whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'clip',
              background: hl ? `rgba(239,68,68,${0.22 * hp})` : undefined, borderRadius: 4, margin: '0 -8px', padding: '0 8px',
              boxShadow: hl ? `inset 3px 0 0 rgba(248,113,113,${hp})` : undefined}}>
              {l.text.slice(0, typed)}
              {i === shown.length - 1 && typed < l.text.length ? <span style={{display: 'inline-block', width: size * 0.55, height: size * 1.05, marginLeft: 2, verticalAlign: 'middle', background: '#d7dde6', opacity: 0.7}} /> : null}
            </div>
          );
        })}
      </div>
      {showInput && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 50, borderTop: '1px solid #232a33', display: 'flex', alignItems: 'center',
          padding: '0 22px', gap: 12, fontFamily: MONO, fontSize: size * 0.85, color: '#55606e', background: '#11151a'}}>
          <span style={{color: C.ptero}}>$</span> Ketik perintah…
        </div>
      )}
    </div>
  );
};

/** Grafik garis sederhana dengan area; data = fungsi (frame) => 0..1. */
export const ChartBox: React.FC<{
  w: number; h: number; label: string; value: (fr: number) => number; color?: string; draw?: number; unit?: (v: number) => string; icon?: React.ComponentType<any>; points?: number; bump?: number;
}> = ({w, h, label, value, color = C.ptero, draw = 1, unit = (v) => `${Math.round(v * 100)}%`, icon = Activity, points = 40}) => {
  const f = useCurrentFrame();
  const pw = w - 40;
  const ph = h - 78;
  const step = 6; // frame per sampel
  const pts: [number, number][] = [];
  const shift = (f % step) / step;
  for (let i = 0; i <= points; i++) {
    const fr = f - (points - i) * step - (f % step);
    const v = clamp01(value(fr));
    pts.push([((i - shift) / points) * pw, ph - v * ph]);
  }
  const visibleCount = Math.max(2, Math.round(pts.length * clamp01(draw)));
  const vp = pts.slice(pts.length - visibleCount);
  const line = vp.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  const area = `${line} L${vp[vp.length - 1][0]},${ph} L${vp[0][0]},${ph} Z`;
  const cur = clamp01(value(f));
  return (
    <div style={{width: w, height: h, background: C.pCard, borderRadius: 12, border: `1px solid ${C.pLine}`, position: 'relative', overflow: 'hidden'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px 0', fontFamily: FONT, color: C.pText, fontSize: 19, fontWeight: 600}}>
        <Icon i={icon} size={20} color={C.pMuted} />
        {label}
        <span style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 18, color}}>{unit(cur)}</span>
      </div>
      <svg width={pw} height={ph} style={{position: 'absolute', left: 20, top: 58, overflow: 'hidden'}}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={pw} y1={ph * g} y2={ph * g} stroke="#ffffff" strokeOpacity={0.05} />
        ))}
        <path d={area} fill={color} fillOpacity={0.14} />
        <path d={line} fill="none" stroke={color} strokeWidth={2.6} strokeLinejoin="round" />
        <circle cx={vp[vp.length - 1][0]} cy={vp[vp.length - 1][1]} r={4.5} fill={color} />
      </svg>
    </div>
  );
};

export const StatTile: React.FC<{icon: React.ComponentType<any>; label: string; value: string; w?: number; accent?: string; o?: number}> = ({
  icon, label, value, w = 300, accent = C.pMuted, o = 1,
}) => (
  <div style={{width: w, height: 74, background: C.pCard, borderRadius: 10, border: `1px solid ${C.pLine}`, display: 'flex', alignItems: 'center', gap: 16,
    padding: '0 18px', opacity: o, boxSizing: 'border-box'}}>
    <div style={{width: 40, height: 40, borderRadius: 8, background: '#2a3442', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Icon i={icon} size={22} color={accent} />
    </div>
    <div style={{fontFamily: FONT}}>
      <div style={{fontSize: 14, color: C.pMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600}}>{label}</div>
      <div style={{fontSize: 20, color: C.pText, fontWeight: 600, fontFamily: MONO}}>{value}</div>
    </div>
  </div>
);

export type PowerState = 'running' | 'starting' | 'stopping' | 'offline';

export const StatusPill: React.FC<{state: PowerState; size?: number}> = ({state, size = 18}) => {
  const f = useCurrentFrame();
  const col = state === 'running' ? C.ok : state === 'offline' ? C.err : C.warn;
  const label = state === 'running' ? 'Running' : state === 'offline' ? 'Offline' : state === 'starting' ? 'Starting' : 'Stopping';
  const pulse = state === 'starting' || state === 'stopping' ? 0.5 + 0.5 * Math.sin(f * 0.25) : 1;
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.5, padding: `${size * 0.3}px ${size * 0.8}px`, borderRadius: 999,
      background: `${col}22`, color: col, fontFamily: FONT, fontWeight: 600, fontSize: size}}>
      <div style={{width: size * 0.55, height: size * 0.55, borderRadius: '50%', background: col, opacity: pulse, boxShadow: `0 0 ${size * 0.6}px ${col}`}} />
      {label}
    </div>
  );
};

/** Tombol daya: start / restart / stop; `press` menyorot tombol tertentu. */
export const PowerBar: React.FC<{press?: 'start' | 'restart' | 'stop' | null; pressAmt?: number; scale?: number}> = ({press = null, pressAmt = 0, scale = 1}) => {
  const btn = (id: 'start' | 'restart' | 'stop', label: string, icon: React.ComponentType<any>, col: string) => {
    const on = press === id;
    const a = on ? pressAmt : 0;
    return (
      <div style={{display: 'flex', alignItems: 'center', gap: 10 * scale, padding: `${12 * scale}px ${22 * scale}px`, borderRadius: 10 * scale,
        background: id === 'start' ? `${col}${on ? 'ff' : 'dd'}` : id === 'stop' ? `${col}${on ? 'ff' : 'cc'}` : '#3a4555',
        color: '#fff', fontFamily: FONT, fontWeight: 600, fontSize: 19 * scale, transform: `scale(${1 - 0.06 * Math.sin(Math.PI * clamp01(a))})`,
        boxShadow: on ? `0 0 ${24 * a}px ${col}aa` : 'none'}}>
        <Icon i={icon} size={18 * scale} color="#fff" sw={2.2} />
        {label}
      </div>
    );
  };
  return (
    <div style={{display: 'flex', gap: 12 * scale}}>
      {btn('start', 'Start', Play, '#16a34a')}
      {btn('restart', 'Restart', RotateCw, '#64748b')}
      {btn('stop', 'Stop', Square, '#dc2626')}
    </div>
  );
};

export type FileRow = {name: string; size: string; icon?: 'folder' | 'code' | 'text' | 'key'; at?: number; hl?: boolean};

export const FileList: React.FC<{w: number; rows: FileRow[]; size?: number; hlAmt?: number}> = ({w, rows, size = 21, hlAmt = 0}) => {
  const f = useCurrentFrame();
  const ic = (k?: FileRow['icon']) => (k === 'folder' ? Folder : k === 'code' ? FileCode : k === 'key' ? KeyRound : FileText);
  return (
    <div style={{width: w, background: C.pCard, borderRadius: 12, border: `1px solid ${C.pLine}`, overflow: 'hidden', fontFamily: FONT}}>
      <div style={{display: 'flex', padding: '14px 22px', color: C.pMuted, fontSize: 15, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${C.pLine}`}}>
        <span>Nama</span><span style={{marginLeft: 'auto'}}>Ukuran</span>
      </div>
      {rows.map((r, i) => {
        const a = r.at === undefined ? 1 : p(f, r.at, 22);
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '13px 22px', fontSize: size, color: C.pText,
            borderBottom: i < rows.length - 1 ? `1px solid ${C.pLine}` : undefined, opacity: a, transform: `translateX(${(1 - a) * 30}px)`,
            background: r.hl ? `rgba(61,123,253,${0.18 * hlAmt})` : undefined}}>
            <Icon i={ic(r.icon)} size={22} color={r.icon === 'folder' ? '#f3c76b' : r.icon === 'key' ? C.warn : '#93a4ba'} />
            <span style={{fontFamily: r.icon === 'folder' ? FONT : MONO}}>{r.name}</span>
            <span style={{marginLeft: 'auto', color: C.pMuted, fontFamily: MONO, fontSize: size * 0.85}}>{r.size}</span>
          </div>
        );
      })}
    </div>
  );
};

const TABS: [string, React.ComponentType<any>][] = [
  ['Console', Terminal], ['Files', Folder], ['Databases', Database], ['Schedules', CalendarClock], ['Users', Users], ['Backups', Archive],
  ['Network', Network], ['Startup', Play], ['Settings', Settings],
];

/** Kerangka halaman server: navbar, tab, judul, status, tombol daya. */
export const PteroShell: React.FC<{
  w: number; h: number; name?: string; desc?: string; tab?: string; state?: PowerState; press?: 'start' | 'restart' | 'stop' | null; pressAmt?: number; children?: React.ReactNode; tabAmt?: number;
}> = ({w, h, name = 'Asisten Bot', desc = 'Bot Telegram · Node.js', tab = 'Console', state = 'running', press = null, pressAmt = 0, children}) => (
  <div style={{width: w, height: h, background: C.pBg, position: 'relative', overflow: 'hidden', fontFamily: FONT}}>
    <div style={{height: 64, background: '#10141a', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 18, borderBottom: '1px solid #222a35'}}>
      <PteroLogo h={30} wordColor="#e8edf3" />
      <div style={{marginLeft: 'auto', display: 'flex', gap: 22, color: C.pMuted}}>
        <Icon i={Globe} size={22} color={C.pMuted} />
        <Icon i={Settings} size={22} color={C.pMuted} />
        <div style={{width: 30, height: 30, borderRadius: '50%', background: '#2b3442'}} />
      </div>
    </div>
    <div style={{height: 54, background: '#141921', display: 'flex', alignItems: 'flex-end', padding: '0 28px', gap: 30, borderBottom: '1px solid #222a35'}}>
      {TABS.map(([t]) => (
        <div key={t} style={{paddingBottom: 14, fontSize: 18, fontWeight: 600, color: t === tab ? '#e8edf3' : C.pMuted,
          borderBottom: t === tab ? `3px solid ${C.ptero}` : '3px solid transparent'}}>
          {t}
        </div>
      ))}
    </div>
    <div style={{display: 'flex', alignItems: 'center', padding: '26px 34px 18px', gap: 18}}>
      <div>
        <div style={{fontSize: 32, fontWeight: 700, color: '#eef2f7', letterSpacing: '-0.01em'}}>{name}</div>
        <div style={{fontSize: 18, color: C.pMuted, marginTop: 4}}>{desc}</div>
      </div>
      <div style={{marginLeft: 22}}>
        <StatusPill state={state} />
      </div>
      <div style={{marginLeft: 'auto'}}>
        <PowerBar press={press} pressAmt={pressAmt} />
      </div>
    </div>
    <div style={{position: 'absolute', left: 34, right: 34, top: 64 + 54 + 110, bottom: 28}}>{children}</div>
  </div>
);

/** Kumpulan stat sidebar kanan. */
export const StatColumn: React.FC<{cpu: number; mem: number; disk: string; uptime: string; w?: number; reveal?: number}> = ({cpu, mem, disk, uptime, w = 320, reveal = 1}) => {
  const items: [React.ComponentType<any>, string, string][] = [
    [Globe, 'Alamat', '10.0.0.12:—'],
    [Clock, 'Uptime', uptime],
    [Cpu, 'CPU', `${(cpu * 100).toFixed(1)}%`],
    [MemoryStick, 'Memori', `${Math.round(mem * 1024)} MiB`],
    [HardDrive, 'Disk', disk],
  ];
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      {items.map(([ic, l, v], i) => (
        <StatTile key={l} icon={ic} label={l} value={v} w={w} o={clamp01(reveal * items.length - i)} />
      ))}
    </div>
  );
};

export const uptimeStr = (frames: number, base = 3 * 3600 + 12 * 60) => {
  const s = base + Math.floor(frames / 60);
  return `${Math.floor(s / 3600)}j ${Math.floor((s % 3600) / 60)}m ${s % 60}d`;
};
