// Sarang: dibangun dari ranting, bisa ditingkatkan, tempat istirahat/tidur & titik kembali.
import * as THREE from 'three';
import { colored, at, merge } from '../world/models';

export const NEST_LEVELS = [2, 8, 16, 28, 45]; // total ranting untuk level 1..5
export const NEST_NAMES = ['Sarang Sederhana', 'Sarang Nyaman', 'Sarang Kokoh', 'Sarang Indah', 'Sarang Megah'];

export class Nest {
  readonly group = new THREE.Group();
  data: { x: number; y: number; z: number; level: number; twigs: number } | null = null;
  private mesh: THREE.Mesh | null = null;

  set(d: Nest['data']) { this.data = d; this.rebuild(); }

  levelFor(twigs: number) { let l = 0; for (const t of NEST_LEVELS) if (twigs >= t) l++; return l; }
  nextNeed() { if (!this.data) return NEST_LEVELS[0]; const l = this.data.level; return l >= NEST_LEVELS.length ? 0 : NEST_LEVELS[l] - this.data.twigs; }

  build(x: number, y: number, z: number, twigs: number) {
    this.data = { x, y, z, twigs, level: 0 };
    this.data.level = this.levelFor(twigs);
    this.rebuild();
  }
  add(twigs: number): boolean {
    if (!this.data) return false;
    const before = this.data.level;
    this.data.twigs += twigs;
    this.data.level = this.levelFor(this.data.twigs);
    this.rebuild();
    return this.data.level > before;
  }

  rebuild() {
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh = null; }
    const d = this.data;
    if (!d) return;
    const L = Math.max(1, d.level);
    const r = 0.55 + L * 0.12;
    const parts = [colored(at(new THREE.TorusGeometry(r, 0.18 + L * 0.03, 5, 10), 0, 0.15, 0, Math.PI / 2), 0x8a6a42, 0.25, 3)];
    parts.push(colored(at(new THREE.CylinderGeometry(r * 0.9, r * 0.5, 0.25, 10), 0, 0.05, 0), 0x6b4f30));
    for (let i = 0; i < 4 + L * 2; i++) {
      const a = i * 2.4;
      parts.push(colored(at(new THREE.CylinderGeometry(0.03, 0.03, r * 1.6, 3), Math.cos(a) * r, 0.25, Math.sin(a) * r, 0.3, a, Math.PI / 2), 0x9a7a52));
    }
    if (d.level >= 3) for (let i = 0; i < Math.min(3, d.level - 2); i++) parts.push(colored(at(new THREE.IcosahedronGeometry(0.13, 1), (i - 1) * 0.22, 0.25, 0.05, 0, 0, 0, [1, 1.25, 1]), 0xdfe9ef));
    if (d.level >= 5) parts.push(colored(at(new THREE.OctahedronGeometry(0.1, 0), 0, 0.45, -r * 0.6), 0xffd36e));
    this.mesh = new THREE.Mesh(merge(parts), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    this.mesh.position.set(d.x, d.y, d.z);
    this.group.add(this.mesh);
  }

  near(p: THREE.Vector3, r = 3.5) { return !!this.data && Math.hypot(p.x - this.data.x, p.y - this.data.y, p.z - this.data.z) < r; }
}
