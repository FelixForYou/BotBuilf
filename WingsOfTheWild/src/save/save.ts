// Penyimpanan lokal (localStorage) dengan penanganan error — progres, posisi, skill, sarang, pengaturan.
export type GameMode = 'santai' | 'petualangan';
export type QualityName = 'low' | 'medium' | 'high';

export interface SaveData {
  v: 1;
  mode: GameMode;
  species: string;
  colors: { body: string; wing: string; belly: string; beak: string };
  pos: [number, number, number];
  yaw: number;
  xp: number; level: number; skillPoints: number;
  skills: Record<string, number>;
  passives: Record<string, number>;
  nest: { x: number; y: number; z: number; level: number; twigs: number } | null;
  carry: number;
  hunger: number; thirst: number; health: number; stamina: number;
  explored: string;
  found: string[];
  courses: Record<string, number>;
  rescued: string[];
  fish: number; eaten: number;
  time: number;
  tutorialDone: boolean;
  playTime: number;
  savedAt: number;
}

export interface Settings {
  quality: QualityName;
  master: number; sfx: number; ambient: number;
  sensitivity: number; invertY: boolean; showFps: boolean; adaptive: boolean;
  dayMinutes: number;
}

const SAVE_KEY = 'wotw-save-v1';
const SETTINGS_KEY = 'wotw-settings-v1';

export function defaultSettings(isTouch: boolean): Settings {
  return { quality: isTouch ? 'low' : 'medium', master: 0.8, sfx: 0.8, ambient: 0.7, sensitivity: 1, invertY: false, showFps: false, adaptive: true, dayMinutes: 20 };
}

export function newSave(mode: GameMode, species: string, colors: SaveData['colors']): SaveData {
  return {
    v: 1, mode, species, colors,
    pos: [60, 70, 260], yaw: Math.PI, xp: 0, level: 1, skillPoints: 0,
    skills: { dash: 1, vision: 1, updraft: 1, call: 1, roll: 1 },
    passives: { stamina: 0, glide: 0, agility: 0, vision: 0, carry: 0 },
    nest: null, carry: 0, hunger: 85, thirst: 85, health: 100, stamina: 100,
    explored: '', found: [], courses: {}, rescued: [], fish: 0, eaten: 0, time: 7.5, tutorialDone: false, playTime: 0, savedAt: Date.now(),
  };
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, v: string): boolean {
  try { localStorage.setItem(key, v); return true; } catch { return false; }
}

export function loadSave(): SaveData | null {
  const raw = safeGet(SAVE_KEY);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as SaveData;
    if (d.v !== 1 || !Array.isArray(d.pos)) return null;
    return d;
  } catch { return null; }
}
export function writeSave(d: SaveData): boolean {
  d.savedAt = Date.now();
  return safeSet(SAVE_KEY, JSON.stringify(d));
}
export function deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* abaikan */ } }

export function loadSettings(isTouch: boolean): Settings {
  const raw = safeGet(SETTINGS_KEY);
  const def = defaultSettings(isTouch);
  if (!raw) return def;
  try { return { ...def, ...JSON.parse(raw) }; } catch { return def; }
}
export function writeSettings(s: Settings) { safeSet(SETTINGS_KEY, JSON.stringify(s)); }

/** Bitset area terjelajah (32x32 sel 128 m) <-> string base64. */
export function encodeBits(bits: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bits.length; i++) s += String.fromCharCode(bits[i]);
  return btoa(s);
}
export function decodeBits(str: string, size: number): Uint8Array {
  const out = new Uint8Array(size);
  if (!str) return out;
  try {
    const s = atob(str);
    for (let i = 0; i < Math.min(size, s.length); i++) out[i] = s.charCodeAt(i);
  } catch { /* data rusak: mulai kosong */ }
  return out;
}
