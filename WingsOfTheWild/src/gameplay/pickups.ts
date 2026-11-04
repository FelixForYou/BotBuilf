// Makanan & ranting: dibaca dari data chunk, dirender dengan instancing, muncul kembali setelah dimakan.
import * as THREE from 'three';
import { PICKUP_KINDS } from '../world/chunkGen';
import type { ChunkManager } from '../world/chunks';
import { pickupGeometry } from '../world/models';

export type Kind = 'seed' | 'berry' | 'fruit' | 'insect' | 'twig' | 'crumb';
export interface Item { key: number; kind: Kind; x: number; y: number; z: number; }

export const FOOD_VALUE: Record<string, number> = { seed: 12, berry: 16, fruit: 26, insect: 10, crumb: 15, fish: 30 };
export const KIND_NAME: Record<string, string> = { seed: 'biji', berry: 'buah beri', fruit: 'buah', insect: 'serangga', twig: 'ranting', crumb: 'remah roti', fish: 'ikan' };
const KINDS: Kind[] = ['seed', 'berry', 'fruit', 'insect', 'twig', 'crumb'];
const RANGE = 120;

export class Pickups {
  readonly group = new THREE.Group();
  private meshes = {} as Record<Kind, THREE.InstancedMesh>;
  private taken = new Map<number, number>();
  private dynamic: Item[] = [];
  private dynKey = 1e9;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3(1, 1, 1);
  private p = new THREE.Vector3();
  private e = new THREE.Euler();
  visible: Item[] = [];
  time = 0;

  constructor(private chunks: ChunkManager) {
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0x222211 });
    for (const k of KINDS) {
      const im = new THREE.InstancedMesh(pickupGeometry(k), mat, 400);
      im.count = 0;
      im.frustumCulled = false;
      this.meshes[k] = im;
      this.group.add(im);
    }
  }

  isTaken(key: number) {
    const t = this.taken.get(key);
    if (t === undefined) return false;
    if (this.time > t) { this.taken.delete(key); return false; }
    return true;
  }

  take(it: Item) {
    if (it.key >= 1e9) this.dynamic = this.dynamic.filter((d) => d.key !== it.key);
    else this.taken.set(it.key, this.time + (it.kind === 'twig' ? 240 : 150));
  }

  spawnDynamic(kind: Kind, x: number, y: number, z: number) {
    this.dynamic.push({ key: this.dynKey++, kind, x, y, z });
    if (this.dynamic.length > 40) this.dynamic.shift();
  }

  /** Iterasi semua item dalam radius. */
  forEach(x: number, z: number, r: number, fn: (it: Item) => void) {
    this.chunks.forNear(x, z, r, (c) => {
      const p = c.props?.pickups;
      if (!p) return;
      for (let i = 0; i < p.length; i += 4) {
        const ix = p[i + 1], iz = p[i + 3];
        if (Math.abs(ix - x) > r || Math.abs(iz - z) > r) continue;
        const key = c.idx * 10000 + i / 4;
        if (this.isTaken(key)) continue;
        fn({ key, kind: PICKUP_KINDS[p[i]] as Kind, x: ix, y: p[i + 2], z: iz });
      }
    });
    for (const d of this.dynamic) if (Math.abs(d.x - x) < r && Math.abs(d.z - z) < r) fn(d);
  }

  nearest(x: number, y: number, z: number, r: number, filter?: (k: Kind) => boolean): Item | null {
    let best: Item | null = null, bd = r;
    this.forEach(x, z, r, (it) => {
      if (filter && !filter(it.kind)) return;
      const d = Math.hypot(it.x - x, (it.y - y) * 0.7, it.z - z);
      if (d < bd) { bd = d; best = it; }
    });
    return best;
  }

  update(dt: number, px: number, pz: number) {
    this.time += dt;
    const counts: Record<string, number> = {};
    for (const k of KINDS) counts[k] = 0;
    this.visible.length = 0;
    this.forEach(px, pz, RANGE, (it) => {
      const mesh = this.meshes[it.kind];
      const n = counts[it.kind];
      if (n >= 400) return;
      let y = it.y;
      if (it.kind === 'insect') {
        const ph = it.key * 1.37;
        this.p.set(it.x + Math.sin(this.time * 1.3 + ph) * 1.2, y + Math.sin(this.time * 2.1 + ph) * 0.5, it.z + Math.cos(this.time * 1.1 + ph) * 1.2);
        this.e.set(0, this.time * 2 + ph, Math.sin(this.time * 30 + ph) * 0.6);
        it.x = this.p.x; it.y = this.p.y; it.z = this.p.z;
      } else {
        this.p.set(it.x, y + (it.kind === 'twig' ? 0 : Math.sin(this.time * 2 + it.key) * 0.05), it.z);
        this.e.set(0, it.key * 0.7 + (it.kind === 'fruit' ? this.time * 0.5 : 0), 0);
      }
      this.q.setFromEuler(this.e);
      const sc = it.kind === 'twig' ? 1.3 : 1.25;
      this.s.set(sc, sc, sc);
      this.m.compose(this.p, this.q, this.s);
      mesh.setMatrixAt(n, this.m);
      counts[it.kind] = n + 1;
      this.visible.push(it);
    });
    for (const k of KINDS) {
      this.meshes[k].count = counts[k];
      this.meshes[k].instanceMatrix.needsUpdate = true;
    }
  }
}
