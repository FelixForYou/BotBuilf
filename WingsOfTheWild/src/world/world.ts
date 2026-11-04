// Fasad dunia: kueri tinggi, permukaan, tabrakan, tempat bertengger, arus udara, wilayah.
import * as THREE from 'three';
import { heightAt, waterHeightAt, normalAt, biomeAt, BIOME_NAME, WORLD_HALF, mountainWeight, type Biome } from './terrain';
import { ChunkManager } from './chunks';
import { Landmarks, type Collider, type Perch } from './landmarks';
import { Water } from './water';
import { Sky } from './sky';

export const THERMALS = [
  { x: 0, z: 150, r: 45 }, { x: -350, z: -200, r: 40 }, { x: 650, z: 650, r: 40 }, { x: -1100, z: 500, r: 45 },
  { x: 300, z: 950, r: 40 }, { x: -200, z: -700, r: 50 }, { x: 900, z: -400, r: 45 }, { x: 1300, z: 600, r: 40 },
  { x: -800, z: -900, r: 55 }, { x: 200, z: -1250, r: 55 }, { x: -1300, z: -600, r: 45 },
];

export interface Contact { ground: boolean; hit: boolean; normal: THREE.Vector3; }

export class World {
  readonly scene: THREE.Scene;
  readonly chunks: ChunkManager;
  readonly landmarks: Landmarks;
  readonly water: Water;
  readonly sky: Sky;
  private tmpN = new THREE.Vector3();

  constructor(scene: THREE.Scene, chunks: ChunkManager) {
    this.scene = scene;
    this.chunks = chunks;
    this.water = new Water();
    this.landmarks = new Landmarks(this.water.falls);
    this.sky = new Sky();
    scene.add(chunks.group, this.water.group, this.landmarks.group, this.sky.group);
    scene.fog = this.sky.fog;
  }

  height(x: number, z: number) { return heightAt(x, z); }
  waterAt(x: number, z: number) { return waterHeightAt(x, z); }
  biome(x: number, z: number): Biome { return biomeAt(x, z); }
  regionName(x: number, z: number) { return BIOME_NAME[biomeAt(x, z)]; }

  /** Permukaan tertinggi (tanah atau atap/objek) di bawah y. */
  surfaceAt(x: number, z: number, y: number): number {
    let s = heightAt(x, z);
    for (const c of this.landmarks.colliders) {
      if (c.type === 'box') {
        if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ && c.maxY <= y + 0.6 && c.maxY > s) s = c.maxY;
      } else if (c.type === 'cyl') {
        if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r && c.y1 <= y + 0.6 && c.y1 > s) s = c.y1;
      }
    }
    return s;
  }

  /** Dorong posisi keluar dari collider. Mengembalikan info kontak. */
  collide(pos: THREE.Vector3, prev: THREE.Vector3, r: number): Contact {
    const res: Contact = { ground: false, hit: false, normal: this.tmpN.set(0, 1, 0) };
    const check = (c: Collider) => {
      if (c.type === 'box') {
        if (pos.x < c.minX - r || pos.x > c.maxX + r || pos.z < c.minZ - r || pos.z > c.maxZ + r || pos.y < c.minY - r || pos.y > c.maxY + r) return;
        const px = [c.maxX + r - pos.x, pos.x - (c.minX - r)], pz = [c.maxZ + r - pos.z, pos.z - (c.minZ - r)], py = [c.maxY + r - pos.y, pos.y - (c.minY - r)];
        const m = Math.min(px[0], px[1], pz[0], pz[1], py[0]);
        res.hit = true;
        if (m === py[0] || prev.y >= c.maxY) { pos.y = c.maxY + r; res.ground = true; res.normal.set(0, 1, 0); }
        else if (m === px[0]) { pos.x = c.maxX + r; res.normal.set(1, 0, 0); }
        else if (m === px[1]) { pos.x = c.minX - r; res.normal.set(-1, 0, 0); }
        else if (m === pz[0]) { pos.z = c.maxZ + r; res.normal.set(0, 0, 1); }
        else { pos.z = c.minZ - r; res.normal.set(0, 0, -1); }
      } else if (c.type === 'cyl') {
        if (pos.y > c.y1 + r || pos.y < c.y0) return;
        const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz);
        if (d > c.r + r) return;
        res.hit = true;
        if (prev.y >= c.y1 - 0.05 || pos.y > c.y1 - 0.3) { pos.y = c.y1 + r; res.ground = true; res.normal.set(0, 1, 0); return; }
        const k = (c.r + r) / (d || 1);
        pos.x = c.x + dx * k; pos.z = c.z + dz * k;
        res.normal.set(dx / (d || 1), 0, dz / (d || 1));
      } else if (c.type === 'sphere') {
        const dx = pos.x - c.x, dy = pos.y - c.y, dz = pos.z - c.z, d = Math.hypot(dx, dy, dz);
        if (d > c.r + r) return;
        res.hit = true;
        const k = (c.r + r) / (d || 1);
        pos.set(c.x + dx * k, c.y + dy * k, c.z + dz * k);
        res.normal.set(dx, dy, dz).normalize();
        if (res.normal.y > 0.6) res.ground = true;
      } else {
        const dx = pos.x - c.x, dy = pos.y - c.y, dz = pos.z - c.z, d = Math.hypot(dx, dy, dz);
        if (Math.abs(d - c.r) > 1.4 + r) return;
        const nx = dx / d, ny = dy / d, nz = dz / d;
        if (nx * c.openDir.x + ny * c.openDir.y + nz * c.openDir.z > c.openCos) return;
        const pd = Math.hypot(prev.x - c.x, prev.y - c.y, prev.z - c.z);
        const target = pd < c.r ? c.r - 1.4 - r : c.r + 1.4 + r;
        pos.set(c.x + nx * target, c.y + ny * target, c.z + nz * target);
        res.hit = true;
        res.normal.set(nx, ny, nz).multiplyScalar(pd < c.r ? -1 : 1);
        if (res.normal.y > 0.6) res.ground = true;
      }
    };
    for (const c of this.landmarks.colliders) check(c);
    this.chunks.forNear(pos.x, pos.z, 10, (ch) => {
      const cs = ch.props?.colliders;
      if (!cs) return;
      for (let i = 0; i < cs.length; i += 4) check({ type: 'sphere', x: cs[i], y: cs[i + 1], z: cs[i + 2], r: cs[i + 3] });
    });
    return res;
  }

  /** Apakah titik berada di dalam objek padat (untuk kamera). */
  solidAt(x: number, y: number, z: number): boolean {
    if (y < heightAt(x, z) + 0.6) return true;
    for (const c of this.landmarks.colliders) {
      if (c.type === 'box' && x > c.minX && x < c.maxX && y > c.minY && y < c.maxY && z > c.minZ && z < c.maxZ) return true;
      if (c.type === 'cyl' && y > c.y0 && y < c.y1 && (x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return true;
      if (c.type === 'sphere' && (x - c.x) ** 2 + (y - c.y) ** 2 + (z - c.z) ** 2 < c.r * c.r) return true;
    }
    return false;
  }

  /** Cari titik bertengger terdekat dalam radius. */
  nearestPerch(x: number, y: number, z: number, radius: number, forward?: THREE.Vector3): Perch | null {
    let best: Perch | null = null, bestD = radius;
    const consider = (px: number, py: number, pz: number) => {
      const dx = px - x, dy = py - y, dz = pz - z;
      let d = Math.hypot(dx, dy * 1.3, dz);
      if (forward && d > 3) {
        const dot = (dx * forward.x + dz * forward.z) / (Math.hypot(dx, dz) || 1);
        d *= dot > 0.2 ? 1 : 1.8;
      }
      if (d < bestD) { bestD = d; best = { x: px, y: py, z: pz }; }
    };
    for (const p of this.landmarks.perches) if (Math.abs(p.x - x) < radius && Math.abs(p.z - z) < radius) consider(p.x, p.y, p.z);
    this.chunks.forNear(x, z, radius, (ch) => {
      const ps = ch.props?.perches;
      if (!ps) return;
      for (let i = 0; i < ps.length; i += 4) if (Math.abs(ps[i] - x) < radius && Math.abs(ps[i + 2] - z) < radius) consider(ps[i], ps[i + 1], ps[i + 2]);
    });
    return best;
  }

  /** Arus udara naik: lereng menghadap angin, tebing, dan kolom termal. */
  updraftAt(x: number, y: number, z: number): number {
    const g = heightAt(x, z);
    const above = y - g;
    let up = 0;
    if (above < 140) {
      const [nx, ny, nz] = normalAt(x, z, 6);
      const slope = 1 - ny;
      const facing = -(nx * this.sky.windDir.x + nz * this.sky.windDir.y) / (Math.hypot(nx, nz) || 1);
      const cliff = slope > 0.25 ? 1 : slope / 0.25;
      up += Math.max(0, facing * 0.6 + 0.4) * cliff * (1 - above / 140) * (6 + this.sky.windStrength * 1.3) * (0.6 + mountainWeight(x, z) * 0.6);
    }
    for (const t of THERMALS) {
      const d = Math.hypot(x - t.x, z - t.z);
      if (d < t.r && y < 520) up += (1 - d / t.r) * 9 * this.sky.daylight;
    }
    return up;
  }

  outOfBounds(x: number, z: number) { return Math.max(Math.abs(x), Math.abs(z)) > WORLD_HALF - 60; }
}
