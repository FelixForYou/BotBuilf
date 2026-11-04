// Tantangan: balapan checkpoint udara, tantangan menyelam, dan terbang melewati celah.
import * as THREE from 'three';
import { heightAt, VILLAGE, LAKE, ISLANDS, PEAK } from '../world/terrain';
import type { Landmarks } from '../world/landmarks';

export interface Course { id: string; name: string; type: 'race' | 'dive' | 'gap'; rings: THREE.Vector3[]; radius: number; medals: [number, number, number]; xp: number; desc: string; }
export type Medal = 'emas' | 'perak' | 'perunggu' | 'selesai';

function above(x: number, z: number, h: number) { return new THREE.Vector3(x, Math.max(heightAt(x, z), 0) + h, z); }

export function buildCourses(L: Landmarks): Course[] {
  const wf = L.waterfallPos;
  const ruins = L.pois.find((p) => p.id === 'ruins')!;
  const arch = L.pois.find((p) => p.id === 'arch')!;
  const tree = L.pois.find((p) => p.id === 'greattree')!;
  const isl = ISLANDS[2];
  return [
    { id: 'race-valley', name: 'Balap Lembah', type: 'race', radius: 7, medals: [55, 70, 90], xp: 90, desc: 'Lintasi desa, sungai, dan danau.',
      rings: [above(150, 260, 22), above(330, 230, 18), above(520, 180, 14), above(VILLAGE.x - 120, VILLAGE.z - 20, 16), above(VILLAGE.x + 60, VILLAGE.z - 120, 25), above(640, -200, 20), above(LAKE.x + 120, LAKE.z + 80, 8), above(LAKE.x - 60, LAKE.z + 160, 10), above(60, 80, 18)] },
    { id: 'race-forest', name: 'Balap Hutan Tua', type: 'race', radius: 7, medals: [50, 65, 85], xp: 100, desc: 'Meliuk di antara hutan menuju Pohon Raksasa.',
      rings: [above(-420, 120, 30), above(-560, 40, 26), above(-700, -60, 30), above(-850, -100, 34), new THREE.Vector3(tree.x + 30, tree.y - 40, tree.z + 10), new THREE.Vector3(tree.x - 25, tree.y - 30, tree.z - 20), above(-1150, -50, 28), above(-1000, 150, 24), above(-760, 260, 22)] },
    { id: 'race-coast', name: 'Balap Pantai', type: 'race', radius: 8, medals: [70, 90, 115], xp: 110, desc: 'Sepanjang pantai menuju mercusuar.',
      rings: [above(-300, 1250, 14), above(-80, 1330, 10), above(150, 1360, 10), above(400, 1350, 12), above(650, 1350, 12), above(900, 1300, 14), above(1150, 1300, 16), new THREE.Vector3(isl.x - 60, 25, isl.z - 40), new THREE.Vector3(isl.x - 20, 45, isl.z + 30)] },
    { id: 'dive-falls', name: 'Tukikan Air Terjun', type: 'dive', radius: 6, medals: [9, 12, 16], xp: 120, desc: 'Menukik tajam menyusuri air terjun.',
      rings: [new THREE.Vector3(wf.x, wf.y + 90, wf.z - 15), new THREE.Vector3(wf.x, wf.y + 65, wf.z - 2), new THREE.Vector3(wf.x, wf.y + 42, wf.z + 8), new THREE.Vector3(wf.x, wf.y + 22, wf.z + 18), new THREE.Vector3(wf.x, wf.y + 7, wf.z + 30)] },
    { id: 'dive-peak', name: 'Terjun Puncak', type: 'dive', radius: 7, medals: [14, 18, 24], xp: 140, desc: 'Dari puncak bersalju turun secepat mungkin.',
      rings: [above(PEAK.x, PEAK.z + 30, 40), above(PEAK.x + 10, PEAK.z + 110, 20), above(PEAK.x + 20, PEAK.z + 200, 15), above(PEAK.x + 30, PEAK.z + 290, 12), above(PEAK.x + 40, PEAK.z + 380, 10)] },
    { id: 'gap-ruins', name: 'Celah Reruntuhan', type: 'gap', radius: 3.2, medals: [16, 22, 30], xp: 110, desc: 'Terbang melewati lengkungan & celah tiang kuno.',
      rings: (() => {
        const rx = -700, rz = 350, out: THREE.Vector3[] = [];
        for (const i of [8, 3, 6, 1]) {
          const a = ((i + 0.5) / 10) * Math.PI * 2;
          out.push(new THREE.Vector3(rx + Math.cos(a) * 24, heightAt(rx + Math.cos(a) * 24, rz + Math.sin(a) * 24) + 4, rz + Math.sin(a) * 24));
        }
        out.push(new THREE.Vector3(ruins.x, ruins.y + 6, ruins.z));
        return out;
      })() },
    { id: 'gap-arch', name: 'Gerbang Karang', type: 'gap', radius: 4, medals: [12, 16, 22], xp: 110, desc: 'Lewati gerbang karang dan celah di laut.',
      rings: [new THREE.Vector3(arch.x, 9, arch.z + 60), new THREE.Vector3(arch.x, 9, arch.z), new THREE.Vector3(arch.x + 40, 6, arch.z - 50), new THREE.Vector3(arch.x - 10, 9, arch.z - 3), new THREE.Vector3(arch.x - 60, 14, arch.z + 30)] },
  ];
}

export class Challenges {
  readonly group = new THREE.Group();
  courses: Course[];
  active: Course | null = null;
  next = 0;
  time = 0;
  private startRings: THREE.Mesh[] = [];
  private rings: THREE.Mesh[] = [];
  private ringMat = new THREE.MeshBasicMaterial({ color: 0x7ff0ff, transparent: true, opacity: 0.85 });
  private ringMatDim = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
  private startMat = new THREE.MeshBasicMaterial({ color: 0xffd36e, transparent: true, opacity: 0.8 });
  private prevPos = new THREE.Vector3();
  cooldown = 0;
  onRing: ((i: number, total: number) => void) | null = null;
  onFinish: ((c: Course, t: number, medal: Medal) => void) | null = null;
  onFail: ((c: Course, reason: string) => void) | null = null;
  onStart: ((c: Course) => void) | null = null;

  constructor(L: Landmarks) {
    this.courses = buildCourses(L);
    for (const c of this.courses) {
      const m = this.ringMesh(c.radius * 1.4, this.startMat);
      this.orient(m, c.rings[0], c.rings[1]);
      this.startRings.push(m);
      this.group.add(m);
      // tiang cahaya kecil agar terlihat dari jauh
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 30, 5), new THREE.MeshBasicMaterial({ color: 0xffd36e, transparent: true, opacity: 0.35 }));
      beacon.position.copy(c.rings[0]).add(new THREE.Vector3(0, c.radius * 1.4 + 15, 0));
      this.group.add(beacon);
    }
    for (let i = 0; i < 10; i++) {
      const r = this.ringMesh(1, this.ringMatDim);
      r.visible = false;
      this.rings.push(r);
      this.group.add(r);
    }
  }

  private ringMesh(r: number, mat: THREE.Material) {
    return new THREE.Mesh(new THREE.TorusGeometry(r, Math.max(0.25, r * 0.08), 6, 24), mat);
  }
  private orient(m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
    m.position.copy(a);
    m.lookAt(b);
  }

  start(c: Course) {
    this.active = c; this.next = 1; this.time = 0;
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      if (i < c.rings.length - 1) {
        const a = c.rings[i + 1], b = c.rings[Math.min(c.rings.length - 1, i + 2)];
        r.geometry.dispose();
        r.geometry = new THREE.TorusGeometry(c.radius, Math.max(0.22, c.radius * 0.07), 6, 24);
        this.orient(r, a, b.equals(a) ? c.rings[i] : b);
        if (b.equals(a)) r.lookAt(c.rings[i]);
        r.visible = true;
      } else r.visible = false;
    }
    this.startRings.forEach((s) => (s.visible = false));
    this.onStart?.(c);
  }

  cancel(reason: string) {
    if (!this.active) return;
    const c = this.active;
    this.active = null;
    this.rings.forEach((r) => (r.visible = false));
    this.startRings.forEach((s) => (s.visible = true));
    this.cooldown = 3;
    this.onFail?.(c, reason);
  }

  private passed(p: THREE.Vector3, q: THREE.Vector3, center: THREE.Vector3, r: number) {
    // jarak terdekat segmen p->q ke pusat cincin
    const d = new THREE.Vector3().subVectors(q, p);
    const l2 = d.lengthSq();
    const t = l2 > 0 ? Math.max(0, Math.min(1, new THREE.Vector3().subVectors(center, p).dot(d) / l2)) : 0;
    return p.clone().addScaledVector(d, t).distanceTo(center) < r;
  }

  update(dt: number, pos: THREE.Vector3, flying: boolean, t: number) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (const s of this.startRings) s.rotation.z = t * 0.5;
    if (!this.active) {
      if (flying && this.cooldown <= 0) for (const c of this.courses) {
        if (this.passed(this.prevPos, pos, c.rings[0], c.radius * 1.4)) { this.start(c); break; }
      }
    } else {
      const c = this.active;
      this.time += dt;
      for (let i = 0; i < this.rings.length; i++) {
        const r = this.rings[i];
        if (!r.visible) continue;
        r.material = i + 1 === this.next ? this.ringMat : this.ringMatDim;
        const s = i + 1 === this.next ? 1 + Math.sin(t * 6) * 0.05 : 1;
        r.scale.setScalar(s);
        if (i + 1 < this.next) r.visible = false;
      }
      if (this.passed(this.prevPos, pos, c.rings[this.next], c.radius * 1.15)) {
        this.next++;
        this.onRing?.(this.next - 1, c.rings.length - 1);
        if (this.next >= c.rings.length) {
          const tm = this.time;
          const medal: Medal = tm <= c.medals[0] ? 'emas' : tm <= c.medals[1] ? 'perak' : tm <= c.medals[2] ? 'perunggu' : 'selesai';
          this.active = null;
          this.rings.forEach((r) => (r.visible = false));
          this.startRings.forEach((s) => (s.visible = true));
          this.cooldown = 4;
          this.onFinish?.(c, tm, medal);
        }
      } else if (this.time > c.medals[2] * 2) this.cancel('Waktu habis');
      else if (!flying) this.cancel('Kamu mendarat');
    }
    this.prevPos.copy(pos);
  }

  get nextRing(): THREE.Vector3 | null { return this.active ? this.active.rings[this.next] : null; }
}
