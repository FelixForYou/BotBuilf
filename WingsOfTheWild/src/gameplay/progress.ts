// XP, level, eksplorasi, penemuan.
import { encodeBits, decodeBits } from '../save/save';

export const GRID = 32; // 32x32 sel @128 m
export function xpToNext(level: number) { return 100 + (level - 1) * 70; }

export class Progress {
  xp = 0; level = 1; skillPoints = 0;
  explored = new Uint8Array(GRID * GRID);
  found = new Set<string>();
  courses: Record<string, number> = {};
  rescued = new Set<string>();
  fish = 0; eaten = 0;
  onLevelUp: ((lvl: number) => void) | null = null;
  onXp: ((amount: number, reason: string) => void) | null = null;

  addXp(n: number, reason = '') {
    this.xp += n;
    this.onXp?.(n, reason);
    while (this.xp >= xpToNext(this.level)) {
      this.xp -= xpToNext(this.level);
      this.level++;
      this.skillPoints++;
      this.onLevelUp?.(this.level);
    }
  }

  cellIndex(x: number, z: number) {
    const cx = Math.floor((x + 2048) / 128), cz = Math.floor((z + 2048) / 128);
    if (cx < 0 || cz < 0 || cx >= GRID || cz >= GRID) return -1;
    return cz * GRID + cx;
  }

  /** Tandai sel sekitar (radius 1) sebagai terjelajah. Mengembalikan jumlah sel baru. */
  explore(x: number, z: number, radius = 1): number {
    let n = 0;
    const cx = Math.floor((x + 2048) / 128), cz = Math.floor((z + 2048) / 128);
    for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
      const ix = cx + dx, iz = cz + dz;
      if (ix < 0 || iz < 0 || ix >= GRID || iz >= GRID) continue;
      const k = iz * GRID + ix;
      if (!this.explored[k]) { this.explored[k] = 1; n++; }
    }
    return n;
  }
  exploredPct() { let n = 0; for (const b of this.explored) n += b; return n / this.explored.length; }

  serializeExplored() { return encodeBits(this.explored); }
  loadExplored(s: string) { this.explored = decodeBits(s, GRID * GRID); }
}
