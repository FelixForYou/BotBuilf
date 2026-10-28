/** Seluruh timing video dalam frame @60fps. Satu sumber kebenaran. */
export const VIDEO = {
  fps: 60,
  width: 1920,
  height: 1080,
  durationInFrames: 3600,
} as const;

/** Panjang overlap transisi antarscene (scene berikutnya mulai lebih awal). */
export const OVERLAP = 30;

export const SCENES = {
  s01: { start: 0, end: 420 }, //    00:00–00:07 Brand Awakening
  s02: { start: 420, end: 900 }, //  00:07–00:15 Felixiority Tools
  s03: { start: 900, end: 1380 }, // 00:15–00:23 Felix Panel
  s04: { start: 1380, end: 1860 }, //00:23–00:31 3D User Warehouse
  s05: { start: 1860, end: 2340 }, //00:31–00:39 Telegram Automation
  s06: { start: 2340, end: 2820 }, //00:39–00:47 Remotion Studio
  s07: { start: 2820, end: 3240 }, //00:47–00:54 Semile AI
  s08: { start: 3240, end: 3600 }, //00:54–01:00 Final Brand Reveal
} as const;

export type SceneKey = keyof typeof SCENES;

/** Durasi nominal scene (tanpa intro overlap). */
export const sceneLength = (k: SceneKey) => SCENES[k].end - SCENES[k].start;
