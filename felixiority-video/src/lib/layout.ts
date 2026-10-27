/** Rect bersama untuk match-cut antarscene. */
export const PANEL_RECT = {x: 140, y: 250, w: 1640, h: 740, r: 28};
/** Titik "live" di kolom kiri Scene 02 (target lingkaran terracotta dari Scene 01). */
export const S2_LIVE_DOT = {x: 141, y: 171};

import {Easing} from 'remotion';
import {expLerp, ramp} from './anim';

/** Jendela preview di Scene 03 (koordinat layar) — kamera menembusnya ke Scene 04. */
export const PORTAL = {x: PANEL_RECT.x + 1140, y: PANEL_RECT.y + 444, w: 384, h: 216, start: 1350, end: 1400};

export type PortalState = {t: number; k: number; cx: number; cy: number; rect: {x: number; y: number; w: number; h: number}};

/** State kamera portal berdasarkan frame global. */
export const portalAt = (globalFrame: number): PortalState => {
  const t = ramp(globalFrame, [PORTAL.start, PORTAL.end], [0, 1], Easing.bezier(0.55, 0, 0.25, 1));
  const k = expLerp(t, 1, 1920 / PORTAL.w);
  const wcx = PORTAL.x + PORTAL.w / 2;
  const wcy = PORTAL.y + PORTAL.h / 2;
  const cx = wcx + (960 - wcx) * t;
  const cy = wcy + (540 - wcy) * t;
  return {t, k, cx, cy, rect: {x: cx - (PORTAL.w / 2) * k, y: cy - (PORTAL.h / 2) * k, w: PORTAL.w * k, h: PORTAL.h * k}};
};
