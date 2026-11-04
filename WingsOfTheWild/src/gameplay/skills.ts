// Skill aktif (dengan cooldown) & pasif (ditingkatkan dengan poin skill).
export type ActiveId = 'dash' | 'vision' | 'updraft' | 'call' | 'roll';
export type PassiveId = 'stamina' | 'glide' | 'agility' | 'vision' | 'carry';

export interface ActiveDef { id: ActiveId; name: string; icon: string; key: string; desc: string; cd: number[]; cost: number; levelText: string[]; }
export interface PassiveDef { id: PassiveId; name: string; icon: string; desc: string; perLevel: string; }

export const ACTIVES: ActiveDef[] = [
  { id: 'dash', name: 'Wind Dash', icon: '💨', key: 'Shift', desc: 'Melesat singkat ke arah terbang.', cd: [6, 5, 4], cost: 12, levelText: ['Lesatan dasar', 'Cooldown 5 dtk', 'Cooldown 4 dtk'] },
  { id: 'vision', name: 'Sky Vision', icon: '👁', key: '2', desc: 'Tandai makanan, sarang, burung & bahaya di sekitar.', cd: [22, 18, 14], cost: 0, levelText: ['Radius 140 m, 8 dtk', 'Radius 190 m, 10 dtk', 'Radius 250 m, 12 dtk'] },
  { id: 'updraft', name: 'Updraft', icon: '⤒', key: '3', desc: 'Dorongan vertikal singkat.', cd: [12, 10, 8], cost: 10, levelText: ['Dorongan 12', 'Dorongan 15', 'Dorongan 18'] },
  { id: 'call', name: 'Flock Call', icon: '🎶', key: '4', desc: 'Panggil burung terdekat untuk terbang bersamamu.', cd: [30, 25, 20], cost: 0, levelText: ['Radius 60 m, 30 dtk', 'Radius 90 m, 40 dtk', 'Radius 120 m, 50 dtk'] },
  { id: 'roll', name: 'Evasive Roll', icon: '🌀', key: '5 / F', desc: 'Berguling menghindar — kebal sesaat dari predator.', cd: [5, 4, 3], cost: 6, levelText: ['Kebal 0,55 dtk', 'Cooldown 4 dtk', 'Cooldown 3 dtk'] },
];

export const PASSIVES: PassiveDef[] = [
  { id: 'stamina', name: 'Paru-paru Kuat', icon: '❤', desc: 'Kapasitas stamina meningkat.', perLevel: '+20% stamina' },
  { id: 'glide', name: 'Bulu Peluncur', icon: '🪶', desc: 'Meluncur lebih hemat energi (turun lebih lambat).', perLevel: '+15% efisiensi luncur' },
  { id: 'agility', name: 'Sayap Lincah', icon: '↻', desc: 'Belokan lebih tajam dan responsif.', perLevel: '+12% kelincahan' },
  { id: 'vision', name: 'Mata Tajam', icon: '🔭', desc: 'Jarak pandang & radius Sky Vision lebih jauh.', perLevel: '+15% jarak pandang' },
  { id: 'carry', name: 'Paruh Kokoh', icon: '🪵', desc: 'Membawa bahan sarang lebih banyak.', perLevel: '+1 ranting' },
];

export const MAX_ACTIVE = 3;
export const MAX_PASSIVE = 3;

export class Skills {
  levels: Record<ActiveId, number> = { dash: 1, vision: 1, updraft: 1, call: 1, roll: 1 };
  passives: Record<PassiveId, number> = { stamina: 0, glide: 0, agility: 0, vision: 0, carry: 0 };
  cooldown: Record<ActiveId, number> = { dash: 0, vision: 0, updraft: 0, call: 0, roll: 0 };
  visionT = 0;
  callT = 0;

  def(id: ActiveId) { return ACTIVES.find((a) => a.id === id)!; }
  maxCd(id: ActiveId) { return this.def(id).cd[this.levels[id] - 1]; }
  ready(id: ActiveId) { return this.cooldown[id] <= 0; }
  trigger(id: ActiveId) { this.cooldown[id] = this.maxCd(id); }
  visionRadius() { return [140, 190, 250][this.levels.vision - 1] * (1 + this.passives.vision * 0.15); }
  visionDuration() { return [8, 10, 12][this.levels.vision - 1]; }
  updraftPower() { return [12, 15, 18][this.levels.updraft - 1]; }
  callRadius() { return [60, 90, 120][this.levels.call - 1]; }
  callDuration() { return [30, 40, 50][this.levels.call - 1]; }

  update(dt: number) {
    for (const k in this.cooldown) this.cooldown[k as ActiveId] = Math.max(0, this.cooldown[k as ActiveId] - dt);
    this.visionT = Math.max(0, this.visionT - dt);
    this.callT = Math.max(0, this.callT - dt);
  }
}
