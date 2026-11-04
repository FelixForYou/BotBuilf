// Preset grafis. Angka ini diukur & disetel untuk HP kelas menengah (Low) hingga PC (High).
import type { QualityName } from './save/save';
import type { QualityParams } from './world/chunks';
import type { NpcCaps } from './ai/npcs';

export interface QualityPreset extends QualityParams { pixelRatioCap: number; npc: NpcCaps; label: string; }

export const QUALITY: Record<QualityName, QualityPreset> = {
  low: { label: 'Rendah', viewDist: 650, propRadius: 300, density: 0.55, lodSegs: [32, 16, 8, 4], shadows: false, pixelRatioCap: 1, npc: { birds: 22, humans: 5, animals: 6 } },
  medium: { label: 'Sedang', viewDist: 950, propRadius: 430, density: 0.8, lodSegs: [48, 24, 12, 6], shadows: false, pixelRatioCap: 1.5, npc: { birds: 36, humans: 8, animals: 10 } },
  high: { label: 'Tinggi', viewDist: 1400, propRadius: 600, density: 1, lodSegs: [64, 32, 16, 8], shadows: true, pixelRatioCap: 2, npc: { birds: 56, humans: 10, animals: 14 } },
};
