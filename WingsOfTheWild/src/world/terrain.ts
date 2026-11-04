// Fungsi tinggi & bioma dunia — deterministik, dipakai oleh mesh, peta, fisika, dan AI.
import { fbm, ridged, smoothstep, lerp, clamp } from '../core/noise';

export const WORLD_HALF = 2048; // dunia 4096 x 4096 m
export const SEA_LEVEL = 0;
export const LAKE = { x: 250, z: -350, r: 210, level: 14 };
export const VILLAGE = { x: 900, z: 200, r: 270, h: 18 };
export const PEAK = { x: -350, z: -1450 };
export const CAVE = { x: 520, z: -880, floor: 168 };
export const ISLANDS = [
  { x: -700, z: 1800, r: 130, h: 22 },
  { x: 250, z: 1880, r: 95, h: 15 },
  { x: 1500, z: 1350, r: 170, h: 34 },
  { x: -1500, z: 900, r: 140, h: 26 },
];

export type Biome = 'sea' | 'beach' | 'mountain' | 'snow' | 'forest' | 'meadow' | 'flowers' | 'lake' | 'river' | 'village' | 'island';

// ---------- Sungai ----------
type P2 = [number, number];
const RIVER_UP_CTRL: P2[] = [[-160, -1300], [-170, -1120], [-140, -980], [-110, -880], [-40, -760], [70, -620], [170, -480], [250, -350]];
const RIVER_DOWN_CTRL: P2[] = [[250, -350], [430, -170], [540, 60], [590, 360], [680, 680], [790, 990], [880, 1300], [950, 1720], [990, 1950]];

function catmull(ctrl: P2[], step: number): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(2, Math.ceil(len / step));
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

export interface RiverPoint { x: number; z: number; w: number; h: number; }
export const RIVER: RiverPoint[][] = [];
const SEG_CELL = 64;
const segGrid = new Map<number, Array<[RiverPoint, RiverPoint]>>();
const segKey = (cx: number, cz: number) => (cx + 100) * 1000 + (cz + 100);

function buildRivers() {
  const build = (ctrl: P2[], up: boolean) => {
    const pts = catmull(ctrl, 8);
    const rp: RiverPoint[] = pts.map(([x, z], i) => ({ x, z, w: lerp(up ? 6 : 10, up ? 11 : 16, i / pts.length), h: 0 }));
    // Tinggi air = minimum berjalan dari tanah alami (air selalu turun ke hilir).
    let run = Infinity;
    for (let i = 0; i < rp.length; i++) {
      const nat = baseHeight(rp[i].x, rp[i].z) - 1.4;
      run = Math.min(run, nat);
      rp[i].h = run;
    }
    if (up) {
      for (const p of rp) p.h = Math.max(p.h, LAKE.level);
      rp[rp.length - 1].h = LAKE.level;
    } else {
      rp[0].h = LAKE.level;
      for (let i = 1; i < rp.length; i++) rp[i].h = Math.min(rp[i].h, rp[i - 1].h, LAKE.level - 0.2);
      for (const p of rp) p.h = Math.max(p.h, -0.4);
    }
    RIVER.push(rp);
    for (let i = 0; i < rp.length - 1; i++) {
      const a = rp[i], b = rp[i + 1];
      const pad = 60;
      const x0 = Math.floor((Math.min(a.x, b.x) - pad) / SEG_CELL), x1 = Math.floor((Math.max(a.x, b.x) + pad) / SEG_CELL);
      const z0 = Math.floor((Math.min(a.z, b.z) - pad) / SEG_CELL), z1 = Math.floor((Math.max(a.z, b.z) + pad) / SEG_CELL);
      for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
        const k = segKey(cx, cz);
        let arr = segGrid.get(k);
        if (!arr) segGrid.set(k, (arr = []));
        arr.push([a, b]);
      }
    }
  };
  build(RIVER_UP_CTRL, true);
  build(RIVER_DOWN_CTRL, false);
}

/** Jarak ke sungai terdekat: {d, h (tinggi air), w}. */
const riverRes = { d: Infinity, h: 0, w: 0 };
export function riverQuery(x: number, z: number) {
  riverRes.d = Infinity;
  const arr = segGrid.get(segKey(Math.floor(x / SEG_CELL), Math.floor(z / SEG_CELL)));
  if (!arr) return riverRes;
  for (const [a, b] of arr) {
    const abx = b.x - a.x, abz = b.z - a.z;
    const t = clamp(((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz), 0, 1);
    const px = a.x + abx * t, pz = a.z + abz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < riverRes.d) {
      riverRes.d = d;
      riverRes.h = lerp(a.h, b.h, t);
      riverRes.w = lerp(a.w, b.w, t);
    }
  }
  return riverRes;
}

// ---------- Jalan desa ----------
const ROADS: Array<[number, number, number, number]> = [
  [VILLAGE.x - 250, VILLAGE.z, VILLAGE.x + 250, VILLAGE.z + 30],
  [VILLAGE.x, VILLAGE.z - 240, VILLAGE.x - 20, VILLAGE.z + 250],
  [VILLAGE.x - 250, VILLAGE.z, 560, 120],
  [VILLAGE.x + 20, VILLAGE.z + 250, 900, 700],
];
export function roadDist(x: number, z: number) {
  let best = Infinity;
  for (const [ax, az, bx, bz] of ROADS) {
    const abx = bx - ax, abz = bz - az;
    const t = clamp(((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - abx * t, z - az - abz * t));
  }
  return best;
}
export function nearRoadArea(x: number, z: number) {
  return Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < VILLAGE.r * 1.1 || Math.hypot(x - 730, z - 450) < 300;
}

// ---------- Bobot wilayah ----------
export function landMask(x: number, z: number) {
  const dx = x / 1750, dz = (z + 150) / 1600;
  const r = Math.sqrt(dx * dx + dz * dz) + fbm(x / 700, z / 700, 3, 11) * 0.18;
  return 1 - smoothstep(0.84, 1.0, r);
}
export function mountainWeight(x: number, z: number) {
  return smoothstep(-450, -980, z + fbm(x / 500, z / 500, 2, 4) * 220);
}
export function forestWeight(x: number, z: number) {
  const m = mountainWeight(x, z);
  const west = smoothstep(-250, -650, x + fbm(x / 300, z / 300, 2, 8) * 160);
  const patch = smoothstep(0.22, 0.42, fbm(x / 320, z / 320, 3, 21)) * 0.85;
  const vd = Math.hypot(x - VILLAGE.x, z - VILLAGE.z) / VILLAGE.r;
  const ld = Math.hypot(x - LAKE.x, z - LAKE.z) / LAKE.r;
  return Math.max(west, patch) * (1 - m) * smoothstep(1.0, 1.4, vd) * smoothstep(1.1, 1.5, ld);
}
export function flowerWeight(x: number, z: number) {
  const f = smoothstep(0.08, 0.3, fbm(x / 170, z / 170, 2, 33) + Math.exp(-((x * x + (z - 200) ** 2) / 90000)) * 0.4);
  return f * (1 - mountainWeight(x, z)) * (1 - forestWeight(x, z));
}

/** Tinggi tanpa sungai. */
function baseHeight(x: number, z: number): number {
  const land = landMask(x, z);
  let h = 14 + fbm(x / 520, z / 520, 4, 3) * 16 + fbm(x / 140, z / 140, 3, 5) * 4;
  const fw = forestWeight(x, z);
  h += fw * (fbm(x / 260, z / 260, 3, 7) * 0.5 + 0.5) * 30;
  const mw = mountainWeight(x, z);
  if (mw > 0) {
    const r = ridged(x / 600, z / 600, 5, 9);
    h += mw * (r * 270 + 20);
    // tebing: undakan curam
    const step = smoothstep(0.55, 0.62, r) * 40 * mw;
    h += step;
  }
  const pdx = (x - PEAK.x) / 420, pdz = (z - PEAK.z) / 420;
  h += Math.exp(-(pdx * pdx + pdz * pdz) * 2.2) * 190;
  // Gua kristal: rongga di lereng + teras di depan pintu (menghadap utara)
  const cd = Math.hypot(x - CAVE.x, z - CAVE.z);
  if (cd < 70) {
    if (cd < 25) h = Math.min(h, CAVE.floor);
    else if (z < CAVE.z + 6) h = lerp(h, CAVE.floor, 1 - smoothstep(25, 70, cd));
  }
  // Desa: diratakan
  const vd = Math.hypot(x - VILLAGE.x, z - VILLAGE.z) / VILLAGE.r;
  const vf = 1 - smoothstep(0.75, 1.2, vd);
  if (vf > 0) h = lerp(h, VILLAGE.h + fbm(x / 90, z / 90, 2, 2) * 1.2, vf);
  // Danau
  const ld = Math.hypot(x - LAKE.x, z - LAKE.z) / (LAKE.r * (1 + fbm(x / 120, z / 120, 2, 12) * 0.15));
  if (ld < 1) h = LAKE.level - 1 - 7 * (1 - ld * ld);
  else if (ld < 1.9) {
    const bank = LAKE.level - 1 + (ld - 1) * 35;
    const rim = LAKE.level + (ld - 1.08) * 9;
    h = Math.min(Math.max(h, rim), bank);
  }
  // Pesisir
  let out = lerp(-20 + fbm(x / 200, z / 200, 2, 13) * 6, h, land);
  if (out > -2 && out < 7 && mw < 0.3) out = lerp(out, 1.6, 0.55 * (1 - Math.abs(out - 2.5) / 4.5)); // pantai landai
  for (const is of ISLANDS) {
    const d = Math.hypot(x - is.x, z - is.z) / is.r;
    if (d < 1.6) {
      const ih = is.h * Math.max(0, 1 - d * d) + fbm(x / 60, z / 60, 2, 41) * 3 - (d > 1 ? (d - 1) * 40 : 0) + 1;
      out = Math.max(out, ih > 3 ? ih : lerp(out, ih, 0.6));
    }
  }
  return out;
}

export function heightAt(x: number, z: number): number {
  let h = baseHeight(x, z);
  const r = riverQuery(x, z);
  if (r.d < r.w + 40) {
    const w = r.w;
    if (r.d < w) {
      const t = r.d / w;
      h = Math.min(h, r.h - 0.4 - 1.8 * (1 - t * t));
    } else {
      h = Math.min(h, r.h - 0.4 + (r.d - w) * 0.8);
      if (r.d < w + 10) h = Math.max(h, r.h + 0.25 * (r.d - w)); // tanggul
    }
  }
  return h;
}

/** Ketinggian air di titik (atau -Infinity jika tidak ada air). */
export function waterHeightAt(x: number, z: number, groundH = heightAt(x, z)): number {
  let best = -Infinity;
  if (groundH < SEA_LEVEL) best = SEA_LEVEL;
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r * 1.6 && groundH < LAKE.level) best = Math.max(best, LAKE.level);
  const r = riverQuery(x, z);
  if (r.d < r.w * 1.1 && groundH < r.h) best = Math.max(best, r.h);
  return best;
}

export function normalAt(x: number, z: number, e = 2): [number, number, number] {
  const hl = heightAt(x - e, z), hr = heightAt(x + e, z), hd = heightAt(x, z - e), hu = heightAt(x, z + e);
  const nx = hl - hr, ny = 2 * e, nz = hd - hu;
  const l = Math.hypot(nx, ny, nz);
  return [nx / l, ny / l, nz / l];
}

export function biomeAt(x: number, z: number, h = heightAt(x, z)): Biome {
  if (h < SEA_LEVEL - 0.2) {
    return 'sea';
  }
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r * 1.05 && h < LAKE.level) return 'lake';
  const r = riverQuery(x, z);
  if (r.d < r.w) return 'river';
  for (const is of ISLANDS) if (Math.hypot(x - is.x, z - is.z) < is.r * 1.5) return h < 3.5 ? 'beach' : 'island';
  if (h < 3.6 && landMask(x, z) < 0.98) return 'beach';
  if (h > 270 + fbm(x / 80, z / 80, 2, 1) * 40) return 'snow';
  if (mountainWeight(x, z) > 0.45) return 'mountain';
  if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < VILLAGE.r * 1.05) return 'village';
  if (forestWeight(x, z) > 0.45) return 'forest';
  if (flowerWeight(x, z) > 0.5) return 'flowers';
  return 'meadow';
}

export const BIOME_NAME: Record<Biome, string> = {
  sea: 'Laut Biru', beach: 'Pantai Pasir', mountain: 'Pegunungan Batu', snow: 'Puncak Bersalju', forest: 'Hutan Tua',
  meadow: 'Padang Rumput', flowers: 'Kebun Bunga', lake: 'Danau Cermin', river: 'Sungai Perak', village: 'Desa Lembah', island: 'Pulau Kecil',
};

// ---------- Warna tanah ----------
const C = {
  sand: [0.93, 0.85, 0.62], grass: [0.47, 0.72, 0.33], grass2: [0.6, 0.78, 0.36], forest: [0.27, 0.5, 0.25], rock: [0.52, 0.5, 0.5],
  rock2: [0.42, 0.4, 0.43], snow: [0.95, 0.97, 1.0], dirt: [0.62, 0.5, 0.36], wheat: [0.9, 0.78, 0.38], soil: [0.5, 0.37, 0.25],
  crop: [0.38, 0.62, 0.25], seabed: [0.55, 0.6, 0.5], flowerPink: [0.92, 0.55, 0.7], flowerYellow: [0.97, 0.86, 0.35],
};
export function colorAt(x: number, z: number, h: number, ny: number, out: number[]): void {
  const n = fbm(x / 40, z / 40, 2, 99);
  let c: number[];
  const mw = mountainWeight(x, z);
  if (h < -0.5) c = C.seabed;
  else if (h < 3.4 && landMask(x, z) < 0.995 && mw < 0.3) c = C.sand;
  else {
    const fw = forestWeight(x, z);
    const g = n > 0 ? C.grass2 : C.grass;
    c = [lerp(g[0], C.forest[0], fw), lerp(g[1], C.forest[1], fw), lerp(g[2], C.forest[2], fw)];
    const fl = flowerWeight(x, z);
    if (fl > 0.4) {
      const s = fbm(x / 7, z / 7, 1, 55);
      if (s > 0.25) c = C.flowerPink; else if (s < -0.3) c = C.flowerYellow;
    }
    const vd = Math.hypot(x - VILLAGE.x, z - VILLAGE.z) / VILLAGE.r;
    if (vd < 1.25 || nearRoadArea(x, z)) {
      if (vd > 0.45 && vd < 1.15) {
        const ang = Math.atan2(z - VILLAGE.z, x - VILLAGE.x);
        const sector = Math.floor((ang + Math.PI) / (Math.PI / 4));
        if (sector % 2 === 0) {
          const stripe = Math.floor((x * 0.7 + z * 0.7) / 6) % 3;
          c = stripe === 0 ? C.wheat : stripe === 1 ? C.soil : C.crop;
          if (sector === 4) c = stripe === 1 ? C.soil : C.crop;
        }
      }
      if (roadDist(x, z) < 4.5) c = C.dirt;
    }
    const rockT = smoothstep(0.78, 0.62, ny) + mw * smoothstep(40, 120, h) * 0.6;
    if (rockT > 0) {
      const r = n > 0.1 ? C.rock2 : C.rock;
      const t = clamp(rockT, 0, 1);
      c = [lerp(c[0], r[0], t), lerp(c[1], r[1], t), lerp(c[2], r[2], t)];
    }
    const snowLine = 255 + fbm(x / 80, z / 80, 2, 1) * 40;
    if (h > snowLine && ny > 0.55) c = C.snow;
  }
  const v = 1 + n * 0.07;
  out[0] = c[0] * v; out[1] = c[1] * v; out[2] = c[2] * v;
}

buildRivers();
