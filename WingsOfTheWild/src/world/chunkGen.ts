// Pembangkitan data chunk (dipakai di Web Worker). Murni & deterministik.
import { CAVE, heightAt, colorAt, normalAt, forestWeight, flowerWeight, mountainWeight, biomeAt, waterHeightAt, VILLAGE, LAKE, roadDist, ISLANDS, landMask } from './terrain';
import { mulberry32, fbm } from '../core/noise';

export const CHUNK = 256;
export const CHUNKS_PER_SIDE = 16; // 16 * 256 = 4096 m
export const chunkOrigin = (i: number) => -2048 + i * CHUNK;

export interface TerrainData { positions: Float32Array; colors: Float32Array; index: Uint16Array | Uint32Array; }

export function buildTerrain(cx: number, cz: number, segs: number): TerrainData {
  const ox = chunkOrigin(cx), oz = chunkOrigin(cz);
  const n = segs + 1;
  const step = CHUNK / segs;
  const gridCount = n * n;
  const skirtCount = 4 * n;
  const positions = new Float32Array((gridCount + skirtCount) * 3);
  const colors = new Float32Array((gridCount + skirtCount) * 3);
  const col = [0, 0, 0];
  const heights = new Float32Array(gridCount);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = ox + i * step, z = oz + j * step;
    heights[j * n + i] = heightAt(x, z);
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i;
    const x = ox + i * step, z = oz + j * step, h = heights[k];
    const hl = i > 0 ? heights[k - 1] : heightAt(x - step, z);
    const hr = i < segs ? heights[k + 1] : heightAt(x + step, z);
    const hd = j > 0 ? heights[k - n] : heightAt(x, z - step);
    const hu = j < segs ? heights[k + n] : heightAt(x, z + step);
    const nx = hl - hr, ny = 2 * step, nz = hd - hu;
    const ylen = ny / Math.hypot(nx, ny, nz);
    colorAt(x, z, h, ylen, col);
    positions[k * 3] = x; positions[k * 3 + 1] = h; positions[k * 3 + 2] = z;
    colors[k * 3] = col[0]; colors[k * 3 + 1] = col[1]; colors[k * 3 + 2] = col[2];
  }
  const indices: number[] = [];
  for (let j = 0; j < segs; j++) for (let i = 0; i < segs; i++) {
    const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
    if ((i + j) % 2 === 0) indices.push(a, c, b, b, c, d);
    else indices.push(a, c, d, a, d, b);
  }
  // Skirt (rok) di tepi chunk untuk menutup celah antar-LOD
  const edges: number[][] = [[], [], [], []];
  for (let t = 0; t < n; t++) {
    edges[0].push(t); // utara (j=0)
    edges[1].push(segs * n + t); // selatan
    edges[2].push(t * n); // barat
    edges[3].push(t * n + segs); // timur
  }
  let s = gridCount;
  for (let e = 0; e < 4; e++) {
    const start = s;
    for (const k of edges[e]) {
      positions[s * 3] = positions[k * 3];
      positions[s * 3 + 1] = positions[k * 3 + 1] - 12;
      positions[s * 3 + 2] = positions[k * 3 + 2];
      colors[s * 3] = colors[k * 3]; colors[s * 3 + 1] = colors[k * 3 + 1]; colors[s * 3 + 2] = colors[k * 3 + 2];
      s++;
    }
    for (let t = 0; t < n - 1; t++) {
      const a = edges[e][t], b = edges[e][t + 1], c = start + t, d = start + t + 1;
      indices.push(a, b, c, b, d, c, a, c, b, b, c, d); // dua sisi agar tidak tergantung orientasi
    }
  }
  const index = positions.length / 3 > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
  return { positions, colors, index };
}

// ---------- Properti (pohon, batu, dll.) ----------
export const PROP_TYPES = ['pine', 'tree', 'palm', 'bush', 'rock', 'flower', 'reed', 'fruit', 'snowpine'] as const;
export type PropType = typeof PROP_TYPES[number];
export const PICKUP_KINDS = ['seed', 'berry', 'fruit', 'insect', 'twig'] as const;
export type PickupKind = typeof PICKUP_KINDS[number];

export interface PropData {
  /** per tipe: matriks 16 float per instance */
  mats: Record<string, Float32Array>;
  tints: Record<string, Float32Array>;
  /** titik bertengger x,y,z,jenis(0 pohon,1 batu,2 semak) */
  perches: Float32Array;
  /** pickup: jenis(index), x, y, z */
  pickups: Float32Array;
  /** collider bola: x,y,z,r */
  colliders: Float32Array;
}

function compose(out: number[], x: number, y: number, z: number, rotY: number, sx: number, sy: number, sz: number, tilt = 0) {
  const c = Math.cos(rotY), s = Math.sin(rotY);
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  // R = Ry * Rx(tilt)
  out.push(
    c * sx, 0, -s * sx, 0,
    s * st * sy, ct * sy, c * st * sy, 0,
    s * ct * sz, -st * sz, c * ct * sz, 0,
    x, y, z, 1,
  );
}

export function buildProps(cx: number, cz: number, density: number): PropData {
  const ox = chunkOrigin(cx), oz = chunkOrigin(cz);
  const rand = mulberry32(cx * 7919 + cz * 104729 + 13);
  const mats: Record<string, number[]> = {};
  const tints: Record<string, number[]> = {};
  for (const t of PROP_TYPES) { mats[t] = []; tints[t] = []; }
  const perches: number[] = [], pickups: number[] = [], colliders: number[] = [];
  const add = (t: PropType, x: number, y: number, z: number, rot: number, s: number, sy = s, tint = 1, tilt = 0) => {
    compose(mats[t], x, y, z, rot, s, sy, s, tilt);
    tints[t].push(tint, tint * (0.95 + rand() * 0.1), tint);
  };
  const cell = 8;
  for (let gz = 0; gz < CHUNK / cell; gz++) for (let gx = 0; gx < CHUNK / cell; gx++) {
    const r0 = rand(), r1 = rand(), r2 = rand(), r3 = rand(), r4 = rand();
    const x = ox + gx * cell + r1 * cell, z = oz + gz * cell + r2 * cell;
    if (Math.abs(x) > 2040 || Math.abs(z) > 2040) continue;
    if (Math.hypot(x - CAVE.x, z - CAVE.z) < 30) continue; // rongga gua bebas pohon
    const h = heightAt(x, z);
    if (h < 0.5) continue;
    const wh = waterHeightAt(x, z, h);
    if (wh > h - 0.2) {
      continue;
    }
    const biome = biomeAt(x, z, h);
    const fw = forestWeight(x, z);
    const mw = mountainWeight(x, z);
    const vd = Math.hypot(x - VILLAGE.x, z - VILLAGE.z) / VILLAGE.r;
    const nearRoad = vd < 1.4 && roadDist(x, z) < 8;
    if (nearRoad) continue;
    const [, ny] = normalAt(x, z, 3);
    const rot = r3 * Math.PI * 2;
    // tepi air → alang-alang
    const wNear = waterHeightAt(x + 6, z, heightAt(x + 6, z)) > -Infinity || waterHeightAt(x - 6, z, heightAt(x - 6, z)) > -Infinity;
    if (wNear && r0 < 0.5 * density && h < 30) { add('reed', x, h, z, rot, 1 + r4 * 0.6); continue; }
    if (biome === 'beach' || biome === 'island') {
      const isl = ISLANDS.some((i) => Math.hypot(x - i.x, z - i.z) < i.r * 1.4) || landMask(x, z) < 0.9;
      if (isl && r0 < 0.05 * density && h > 1.5) {
        const s = 0.9 + r4 * 0.5;
        add('palm', x, h, z, rot, s, s, 1, (r4 - 0.5) * 0.3);
        perches.push(x, h + 9.5 * s, z, 0);
      } else if (r0 > 0.985) { add('rock', x, h - 0.3, z, rot, 1 + r4 * 2); perches.push(x, h + 1 + r4 * 1.6, z, 1); }
      else if (r0 > 0.96 && r0 <= 0.985) pickups.push(4, x, h + 0.1, z); // ranting pantai
      continue;
    }
    if (biome === 'snow' || biome === 'mountain') {
      if (ny > 0.7 && r0 < (biome === 'snow' ? 0.04 : 0.1) * density && h < 330) {
        const s = 0.8 + r4 * 0.7;
        add(biome === 'snow' ? 'snowpine' : 'pine', x, h - 0.2, z, rot, s, s * (0.9 + r2 * 0.3), 0.9 + r1 * 0.2);
        perches.push(x, h + 11 * s, z, 0);
      } else if (r0 > 0.965) {
        const s = 1.5 + r4 * 4;
        add('rock', x, h - s * 0.3, z, rot, s, s * 0.8, 0.9 + r1 * 0.2);
        perches.push(x, h + s * 0.55, z, 1);
        if (s > 3) colliders.push(x, h, z, s * 0.75);
      } else if (r0 > 0.94 && mw < 0.8 && h < 200) pickups.push(0, x, h + 0.1, z);
      continue;
    }
    if (biome === 'village') {
      // kebun buah di dekat pusat desa & sudut
      if (vd > 0.3 && vd < 0.45 && r0 < 0.12 * density) {
        const s = 0.9 + r4 * 0.3;
        add('fruit', x, h, z, rot, s);
        perches.push(x, h + 6.2 * s, z, 0);
        if (r1 < 0.6) pickups.push(2, x + 1.5, h + 0.1, z + 1);
      } else if (vd > 0.45 && r0 < 0.06) pickups.push(0, x, h + 0.1, z); // biji di ladang
      else if (r0 > 0.99) add('bush', x, h, z, rot, 1 + r4 * 0.5);
      continue;
    }
    const treeChance = (fw * 0.55 + 0.012) * density;
    if (r0 < treeChance && ny > 0.75) {
      const pine = fbm(x / 200, z / 200, 2, 77) > 0.05 || h > 60;
      const s = 0.8 + r4 * 0.8;
      add(pine ? 'pine' : 'tree', x, h - 0.2, z, rot, s, s * (0.85 + r2 * 0.35), 0.85 + r1 * 0.3);
      perches.push(x, h + (pine ? 11 : 8.5) * s, z, 0);
      if (r2 < 0.15) pickups.push(4, x + 2, h + 0.1, z + 1.2); // ranting di bawah pohon
      continue;
    }
    if (r0 < treeChance + 0.05 * density && fw > 0.2) {
      add('bush', x, h, z, rot, 0.9 + r4 * 0.6);
      perches.push(x, h + 1.5, z, 2);
      if (r1 < 0.5) pickups.push(1, x + 1, h + 0.1, z);
      continue;
    }
    const fl = flowerWeight(x, z);
    if (fl > 0.3 && r0 > 1 - 0.35 * fl * density) {
      add('flower', x, h, z, rot, 0.8 + r4 * 0.6, 0.8 + r4 * 0.6, 0.85 + r1 * 0.3);
      if (r1 < 0.05) pickups.push(3, x, h + 1.5 + r2, z); // serangga di bunga
      continue;
    }
    if (r0 > 0.992 && biome !== 'flowers') { add('rock', x, h - 0.3, z, rot, 1 + r4 * 2.5); perches.push(x, h + 1.2 + r4 * 1.8, z, 1); continue; }
    if (r0 > 0.97 && r0 < 0.985) pickups.push(0, x, h + 0.1, z);
    if (r0 > 0.955 && r0 < 0.965 && fw > 0.3) pickups.push(4, x, h + 0.1, z);
    if (r0 > 0.94 && r0 < 0.95) pickups.push(3, x, h + 1.2 + r2 * 2, z);
  }
  // pohon di tepi danau
  void LAKE;
  const toF = (o: Record<string, number[]>) => { const r: Record<string, Float32Array> = {}; for (const k in o) r[k] = new Float32Array(o[k]); return r; };
  return { mats: toF(mats), tints: toF(tints), perches: new Float32Array(perches), pickups: new Float32Array(pickups), colliders: new Float32Array(colliders) };
}

/** Gambar peta (RGBA) seluruh dunia untuk layar peta. */
export function buildMapImage(size: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(size * size * 4);
  const col = [0, 0, 0];
  const step = 4096 / size;
  let prevRow = new Float32Array(size);
  for (let j = 0; j < size; j++) {
    const row = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const x = -2048 + (i + 0.5) * step, z = -2048 + (j + 0.5) * step;
      const h = heightAt(x, z);
      row[i] = h;
      const w = waterHeightAt(x, z, h);
      let r: number, g: number, b: number;
      if (w > h) {
        const depth = Math.min(1, (w - h) / 20);
        r = 0.36 - depth * 0.18; g = 0.62 - depth * 0.2; b = 0.78 - depth * 0.1;
      } else {
        const hn = j > 0 ? prevRow[i] : h;
        const hw = i > 0 ? row[i - 1] : h;
        colorAt(x, z, h, 0.9, col);
        const shade = 1 + Math.max(-0.35, Math.min(0.35, ((h - hn) + (h - hw)) * 0.025));
        r = col[0] * shade; g = col[1] * shade; b = col[2] * shade;
      }
      const k = (j * size + i) * 4;
      out[k] = r * 255; out[k + 1] = g * 255; out[k + 2] = b * 255; out[k + 3] = 255;
    }
    prevRow = row;
  }
  return out;
}
