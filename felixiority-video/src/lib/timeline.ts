/**
 * Timeline global (60 FPS). Setiap scene punya `from` (termasuk overlap transisi)
 * dan `dur`. Scene berikutnya selalu dirender di atas scene sebelumnya.
 */
export const SCENES = {
  awakening: {from: 0, dur: 420, n: '01', label: 'Brand Awakening'},
  tools: {from: 410, dur: 490, n: '02', label: 'Felixiority Tools'},
  panel: {from: 880, dur: 520, n: '03', label: 'Felix Panel'},
  warehouse: {from: 1300, dur: 580, n: '04', label: 'User Warehouse'},
  telegram: {from: 1840, dur: 495, n: '05', label: 'Telegram Automation'},
  studio: {from: 2325, dur: 520, n: '06', label: 'Remotion Studio'},
  ai: {from: 2800, dur: 450, n: '07', label: 'Semile AI'},
  final: {from: 3220, dur: 380, n: '08', label: 'Final Reveal'},
} as const;

export type SceneKey = keyof typeof SCENES;
export const TOTAL = 3600;
