import {staticFile} from 'remotion';

export const C = {
  bg: '#04070d',
  bg2: '#070d18',
  panel: 'rgba(12, 22, 38, 0.82)',
  panelSolid: '#0b1424',
  line: 'rgba(56, 189, 248, 0.22)',
  cyan: '#22d3ee',
  blue: '#3b82f6',
  green: '#34d399',
  lime: '#a3e635',
  red: '#f87171',
  amber: '#fbbf24',
  text: '#e6f1ff',
  muted: '#8193b2',
  dim: '#4a5a75',
};

export const FONT = {
  display: 'SpaceGrotesk, Inter, sans-serif',
  body: 'Inter, sans-serif',
  mono: 'JBMono, monospace',
};

export const fontCss = `
@font-face{font-family:SpaceGrotesk;font-weight:700;src:url(${staticFile('fonts/SpaceGrotesk-Bold.woff2')}) format('woff2');}
@font-face{font-family:SpaceGrotesk;font-weight:500;src:url(${staticFile('fonts/SpaceGrotesk-Medium.woff2')}) format('woff2');}
@font-face{font-family:Inter;font-weight:400;src:url(${staticFile('fonts/Inter-Regular.woff2')}) format('woff2');}
@font-face{font-family:Inter;font-weight:600;src:url(${staticFile('fonts/Inter-SemiBold.woff2')}) format('woff2');}
@font-face{font-family:JBMono;font-weight:400;src:url(${staticFile('fonts/JBMono-Regular.woff2')}) format('woff2');}
@font-face{font-family:JBMono;font-weight:700;src:url(${staticFile('fonts/JBMono-Bold.woff2')}) format('woff2');}
`;

// Verified facts (github.com/juice-shop/juice-shop, commit 717f5ef, 2026-10-23)
export const FACTS = {
  repo: 'juice-shop/juice-shop',
  url: 'github.com/juice-shop/juice-shop',
  stars: '14k',
  forks: '21k',
  license: 'MIT',
  version: 'v20.3.0',
  language: 'TypeScript',
  challenges: 116,
  categories: 16,
  leaders: [
    {name: 'Björn Kimminich', handle: 'bkimminich'},
    {name: 'Jannik Hollenbach', handle: 'J12934'},
  ],
};
