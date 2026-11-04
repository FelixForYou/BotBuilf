// Model burung low-poly dengan animasi prosedural (kepak, luncur, menukik, belok, mendarat, jalan, bertengger, makan).
import * as THREE from 'three';
import type { Species } from '../gameplay/species';
import { damp } from '../core/noise';

export interface BirdPose {
  mode: 'fly' | 'ground' | 'perch';
  flap: number;      // 0..1 intensitas kepakan
  flapSpeed: number; // Hz
  fold: number;      // 0..1 sayap terlipat (menukik)
  flare: number;     // 0..1 mengerem/mendarat
  bank: number;      // radian
  walk: number;      // 0..1 kecepatan berjalan
  peck: number;      // 0..1 animasi makan
  roll: number;      // putaran evasive roll
  carry: number;     // jumlah ranting dibawa
}

function tint(geo: THREE.BufferGeometry, fn: (y: number, x: number, z: number) => THREE.Color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.getAttribute('position');
  const col = new Float32Array(p.count * 3);
  for (let f = 0; f < p.count; f += 3) {
    const cy = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3;
    const cx = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3;
    const cz = (p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)) / 3;
    const c = fn(cy, cx, cz);
    for (let v = 0; v < 3; v++) { col[(f + v) * 3] = c.r; col[(f + v) * 3 + 1] = c.g; col[(f + v) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export class BirdModel {
  readonly root = new THREE.Group();
  private inner = new THREE.Group();
  private body!: THREE.Mesh;
  private head = new THREE.Group();
  private tail = new THREE.Group();
  private wings: { shoulder: THREE.Group; elbow: THREE.Group; side: number }[] = [];
  private legs: THREE.Mesh[] = [];
  private twigs = new THREE.Group();
  private mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  private phase = 0;
  private walkPhase = 0;
  private s = { flap: 0, fold: 0, flare: 0, bank: 0, legs: 0, peck: 0, idle: 0 };
  private headLook = 0;
  private headTimer = 0;

  constructor(sp: Species, colors: { body: string; wing: string; belly: string; beak: string }) {
    this.root.add(this.inner);
    this.build(sp, colors);
  }

  build(sp: Species, colors: { body: string; wing: string; belly: string; beak: string }) {
    this.inner.clear();
    this.wings = []; this.legs = [];
    const cb = new THREE.Color(colors.body), cw = new THREE.Color(colors.wing), cy = new THREE.Color(colors.belly), ck = new THREE.Color(colors.beak);
    const S = sp.size;
    // Badan
    const bodyGeo = new THREE.IcosahedronGeometry(1, 1);
    bodyGeo.scale(0.3, 0.28, 0.58);
    this.body = new THREE.Mesh(tint(bodyGeo, (y) => (y < -0.05 ? cy : cb)), this.mat);
    this.body.castShadow = true;
    this.inner.add(this.body);
    // Kepala
    this.head.clear();
    this.head.position.set(0, 0.2, 0.48);
    const hg = new THREE.IcosahedronGeometry(0.21, 1);
    const headMesh = new THREE.Mesh(tint(hg, (y, _x, z) => (y < -0.06 && z > 0 ? cy : cb)), this.mat);
    this.head.add(headMesh);
    const beak = new THREE.ConeGeometry(0.06, sp.id === 'raja-udang' ? 0.4 : 0.22, 4);
    beak.rotateX(Math.PI / 2);
    beak.translate(0, -0.02, 0.27 + (sp.id === 'raja-udang' ? 0.08 : 0));
    this.head.add(new THREE.Mesh(tint(beak, () => ck), this.mat));
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(sp.id === 'hantu' ? 0.06 : 0.035, 0), new THREE.MeshBasicMaterial({ color: sp.id === 'hantu' ? 0xf2c23a : 0x111111 }));
      eye.position.set(sx * 0.14, 0.05, 0.12);
      this.head.add(eye);
    }
    this.inner.add(this.head);
    // Ekor
    this.tail.clear();
    this.tail.position.set(0, 0.06, -0.5);
    const tl = 0.55 * sp.tail;
    const tailShape = new THREE.Shape();
    tailShape.moveTo(-0.08, 0); tailShape.lineTo(0.08, 0);
    if (sp.forkTail) { tailShape.lineTo(0.22, -tl); tailShape.lineTo(0, -tl * 0.55); tailShape.lineTo(-0.22, -tl); }
    else { tailShape.lineTo(0.2, -tl); tailShape.lineTo(-0.2, -tl); }
    const tg = new THREE.ShapeGeometry(tailShape);
    tg.rotateX(Math.PI / 2);
    this.tail.add(new THREE.Mesh(tint(tg, () => cw), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide })));
    this.inner.add(this.tail);
    // Sayap: dua segmen per sisi
    const wingMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
    const span = sp.wing;
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.18, 0.12, 0.08);
      const innerShape = new THREE.Shape();
      innerShape.moveTo(0, 0.18); innerShape.lineTo(0.75 * span, 0.12); innerShape.lineTo(0.75 * span, -0.3); innerShape.lineTo(0, -0.36);
      const ig = new THREE.ShapeGeometry(innerShape);
      ig.rotateX(Math.PI / 2); // XY -> XZ (z = -y)
      ig.scale(side, 1, 1);
      const innerMesh = new THREE.Mesh(tint(ig, () => cw.clone().lerp(cb, 0.35)), wingMat);
      innerMesh.castShadow = true;
      shoulder.add(innerMesh);
      const elbow = new THREE.Group();
      elbow.position.set(side * 0.75 * span, 0, 0);
      const outerShape = new THREE.Shape();
      outerShape.moveTo(0, 0.12); outerShape.lineTo(0.55 * span, 0.0); outerShape.lineTo(0.85 * span, -0.12); outerShape.lineTo(0.35 * span, -0.3); outerShape.lineTo(0, -0.3);
      const og = new THREE.ShapeGeometry(outerShape);
      og.rotateX(Math.PI / 2);
      og.scale(side, 1, 1);
      const outerMesh = new THREE.Mesh(tint(og, (_y, x) => (Math.abs(x) > 0.5 * span ? cw.clone().multiplyScalar(0.75) : cw)), wingMat);
      outerMesh.castShadow = true;
      elbow.add(outerMesh);
      shoulder.add(elbow);
      this.inner.add(shoulder);
      this.wings.push({ shoulder, elbow, side });
    }
    // Kaki
    for (const sx of [-1, 1]) {
      const lg = new THREE.CylinderGeometry(0.02, 0.025, 0.3, 4);
      lg.translate(0, -0.15, 0);
      const leg = new THREE.Mesh(tint(lg, () => new THREE.Color(0xd9a35a)), this.mat);
      leg.position.set(sx * 0.1, -0.18, 0.02);
      this.inner.add(leg);
      this.legs.push(leg);
    }
    // Ranting yang dibawa
    this.twigs.clear();
    for (let i = 0; i < 6; i++) {
      const tw = new THREE.Mesh(tint(new THREE.CylinderGeometry(0.02, 0.025, 0.7, 3), () => new THREE.Color(0x8a5f3a)), this.mat);
      tw.rotation.set(0.3 * i, 0, Math.PI / 2 + (i - 2) * 0.2);
      tw.position.set(0, -0.02 + i * 0.03, 0.27);
      tw.visible = false;
      this.twigs.add(tw);
    }
    this.head.add(this.twigs);
    this.root.scale.setScalar(S * 0.9);
  }

  /** Animasi diperbarui setiap frame. */
  animate(p: BirdPose, dt: number) {
    const s = this.s;
    s.flap = damp(s.flap, p.flap, 10, dt);
    s.fold = damp(s.fold, p.fold, 6, dt);
    s.flare = damp(s.flare, p.flare, 6, dt);
    s.bank = damp(s.bank, p.bank, 6, dt);
    s.legs = damp(s.legs, p.mode === 'fly' ? (p.flare > 0.5 ? 1 : 0) : 1, 8, dt);
    s.peck = damp(s.peck, p.peck, 14, dt);
    this.phase += dt * p.flapSpeed * Math.PI * 2;
    const grounded = p.mode !== 'fly';
    // Sayap
    for (const w of this.wings) {
      const sd = w.side;
      let shoulderZ: number, shoulderY: number, elbowZ: number, elbowY: number;
      if (grounded) {
        // terlipat di sisi badan
        shoulderZ = sd * -0.2; shoulderY = sd * -1.35; elbowZ = sd * 0.1; elbowY = sd * -0.25;
        if (p.walk > 0.1) shoulderZ += Math.sin(this.walkPhase * 2) * 0.05 * sd;
      } else {
        const flapA = Math.sin(this.phase) * 0.95 * s.flap;
        const glideWobble = Math.sin(this.phase * 0.25) * 0.04 * (1 - s.flap);
        shoulderZ = sd * (flapA + 0.08 + glideWobble + s.flare * 0.5);
        elbowZ = sd * (Math.sin(this.phase - 0.9) * 0.6 * s.flap - 0.05);
        shoulderY = sd * (-s.fold * 0.9 + s.flare * 0.35);
        elbowY = sd * (-s.fold * 0.5);
      }
      w.shoulder.rotation.set(0, -shoulderY, shoulderZ, 'YXZ');
      w.elbow.rotation.set(0, -elbowY, elbowZ, 'YXZ');
    }
    // Badan
    const bob = grounded ? Math.abs(Math.sin(this.walkPhase)) * 0.06 * p.walk : -Math.sin(this.phase) * 0.04 * s.flap;
    this.inner.position.y = bob;
    this.inner.rotation.z = grounded ? 0 : s.bank + p.roll;
    this.inner.rotation.x = grounded ? s.peck * 0.6 : -s.flare * 0.5;
    if (grounded) {
      this.walkPhase += dt * p.walk * 14;
      this.headTimer -= dt;
      if (this.headTimer < 0) { this.headTimer = 0.6 + Math.random() * 2; this.headLook = (Math.random() - 0.5) * 1.6 * (p.walk < 0.1 ? 1 : 0.2); }
    } else this.headLook = 0;
    this.head.rotation.y = damp(this.head.rotation.y, this.headLook, 10, dt);
    this.head.rotation.x = s.peck * 0.9 + (grounded ? 0 : s.fold * -0.2);
    this.tail.rotation.x = -s.flare * 0.5 + (grounded ? -0.25 : 0) + s.fold * 0.1;
    this.tail.rotation.y = s.bank * 0.4;
    for (let i = 0; i < 2; i++) {
      const leg = this.legs[i];
      leg.visible = s.legs > 0.05;
      leg.scale.y = Math.max(0.05, s.legs);
      leg.rotation.x = grounded ? Math.sin(this.walkPhase + i * Math.PI) * 0.6 * p.walk : 0.9 * (1 - s.flare);
    }
    this.twigs.children.forEach((t, i) => (t.visible = i < p.carry));
  }
}
