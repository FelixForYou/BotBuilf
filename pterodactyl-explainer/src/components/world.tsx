import React from 'react';

/** SVG di koordinat dunia (origin = pusat World). */
export const WSvg: React.FC<{children: React.ReactNode; z?: number; o?: number}> = ({children, z = 0, o = 1}) => (
  <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: `translateZ(${z}px)`, opacity: o}}>
    {children}
  </svg>
);

export type Pt = [number, number];
export const qbez = (t: number, a: Pt, c: Pt, b: Pt): Pt => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};
export const qpath = (a: Pt, c: Pt, b: Pt) => `M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`;
export const cbez = (t: number, a: Pt, c1: Pt, c2: Pt, b: Pt): Pt => {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
    u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1],
  ];
};
export const cpath = (a: Pt, c1: Pt, c2: Pt, b: Pt) => `M${a[0]},${a[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${b[0]},${b[1]}`;

/** Elemen HTML di posisi dunia 2D (tanpa rotasi), berpusat. */
export const At: React.FC<{x: number; y: number; z?: number; s?: number; o?: number; r?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  x, y, z = 0, s = 1, o = 1, r = 0, children, style,
}) => (
  <div style={{position: 'absolute', left: 0, top: 0, transform: `translate3d(${x}px, ${y}px, ${z}px) translate(-50%, -50%) rotate(${r}deg) scale(${s})`, opacity: o, width: 'max-content', ...style}}>
    {children}
  </div>
);
