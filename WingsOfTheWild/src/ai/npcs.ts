// AI dunia: disimulasikan detail hanya di sekitar pemain (radius aktif), dengan pool & batas jumlah.
import * as THREE from 'three';
import { mulberry32, damp, wrapAngle, clamp } from '../core/noise';
import { heightAt, biomeAt, waterHeightAt, VILLAGE, type Biome } from '../world/terrain';
import type { World } from '../world/world';
import type { Player } from '../player/player';
import { makeHuman, makeRabbit, makeDeer, makeCat, npcBirdBody, npcBirdWing, npcMat, type HumanModel } from './models';
import { BirdModel } from '../player/birdModel';
import { SPECIES } from '../gameplay/species';
import { colored, merge, at } from '../world/models';

export interface NpcCaps { birds: number; humans: number; animals: number; }

interface FlockDef { id: number; x: number; z: number; color: THREE.Color; wing: THREE.Color; size: number; biome: Biome; }
interface NBird { flock: ActiveFlock; pos: THREE.Vector3; vel: THREE.Vector3; off: THREE.Vector3; phase: number; sit: boolean; perch: THREE.Vector3 | null; yaw: number; }
interface ActiveFlock { def: FlockDef; state: 'fly' | 'ground' | 'perch' | 'flee' | 'follow'; t: number; ang: number; alt: number; anchor: THREE.Vector3; birds: NBird[]; }
interface Human { m: HumanModel; home: THREE.Vector3; pos: THREE.Vector3; target: THREE.Vector3; route: THREE.Vector3[]; task: 'walk' | 'garden' | 'sit' | 'stand'; t: number; yaw: number; phase: number; feedCd: number; }
interface Animal { kind: 'rabbit' | 'deer' | 'cat'; obj: THREE.Group; pos: THREE.Vector3; target: THREE.Vector3; yaw: number; t: number; hop: number; state: 'idle' | 'move' | 'flee' | 'stalk' | 'pounce'; home: THREE.Vector3; speed: number; }
interface Fish { pos: THREE.Vector3; ang: number; r: number; c: THREE.Vector3; wy: number; jump: number; vy: number; alive: boolean; }
interface Hawk { model: BirdModel; terr: { x: number; z: number; r: number }; pos: THREE.Vector3; vel: THREE.Vector3; ang: number; state: 'patrol' | 'chase' | 'retreat'; t: number; yaw: number; }

export class NPCs {
  readonly group = new THREE.Group();
  private flockDefs: FlockDef[] = [];
  private flocks: ActiveFlock[] = [];
  private bodyIM: THREE.InstancedMesh;
  private wingIM: THREE.InstancedMesh;
  private humans: Human[] = [];
  private animals: Animal[] = [];
  private fish: Fish[] = [];
  private fishIM: THREE.InstancedMesh;
  private butterIM: THREE.InstancedMesh;
  private butterData: { c: THREE.Vector3; ph: number }[] = [];
  readonly hawks: Hawk[] = [];
  private rand = mulberry32(777);
  private m = new THREE.Matrix4(); private m2 = new THREE.Matrix4(); private q = new THREE.Quaternion(); private e = new THREE.Euler(); private v = new THREE.Vector3(); private s = new THREE.Vector3();
  caps: NpcCaps;
  relaxed = true;
  followers = 0;
  private butterMat: THREE.MeshBasicMaterial;
  private spawnT = 0;
  // event
  onFeed: ((x: number, z: number) => void) | null = null;
  onHit: ((dmg: number, what: string) => void) | null = null;
  onDodge: (() => void) | null = null;
  onScreech: (() => void) | null = null;
  onMeow: (() => void) | null = null;
  threat: { x: number; z: number; d: number } | null = null;

  constructor(caps: NpcCaps) {
    this.caps = caps;
    const bodyGeo = npcBirdBody();
    this.bodyIM = new THREE.InstancedMesh(bodyGeo, npcMat, 64);
    this.wingIM = new THREE.InstancedMesh(npcBirdWing(), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }), 128);
    this.bodyIM.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(64 * 3).fill(1), 3);
    this.wingIM.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(128 * 3).fill(1), 3);
    this.bodyIM.frustumCulled = this.wingIM.frustumCulled = false;
    this.bodyIM.count = this.wingIM.count = 0;
    this.group.add(this.bodyIM, this.wingIM);
    // Ikan
    this.fishIM = new THREE.InstancedMesh(merge([
      colored(at(new THREE.IcosahedronGeometry(0.25, 0), 0, 0, 0, 0, 0, 0, [0.5, 0.6, 1.6]), 0x9fb6c4),
      colored(at(new THREE.ConeGeometry(0.2, 0.3, 3), 0, 0, -0.45, -Math.PI / 2, 0, 0, [0.3, 1, 1]), 0x7f98a8),
    ]), npcMat, 16);
    this.fishIM.count = 0; this.fishIM.frustumCulled = false;
    this.group.add(this.fishIM);
    // Kupu-kupu / kunang-kunang
    const bg = new THREE.PlaneGeometry(0.35, 0.25);
    bg.rotateX(-Math.PI / 2);
    this.butterMat = new THREE.MeshBasicMaterial({ color: 0xffb3d9, side: THREE.DoubleSide });
    this.butterIM = new THREE.InstancedMesh(bg, this.butterMat, 30);
    this.butterIM.count = 0; this.butterIM.frustumCulled = false;
    this.group.add(this.butterIM);
    this.genFlocks();
    // Predator: elang penjaga wilayah
    const hawkSp = SPECIES.find((s) => s.id === 'elang')!;
    for (const terr of [{ x: -200, z: -1150, r: 420 }, { x: -1250, z: -450, r: 280 }, { x: 1250, z: -700, r: 260 }]) {
      const model = new BirdModel(hawkSp, { body: '#3a2a1e', wing: '#2a1d14', belly: '#8a6a4a', beak: '#e8c13a' });
      model.root.scale.setScalar(2.2);
      const pos = new THREE.Vector3(terr.x, heightAt(terr.x, terr.z) + 90, terr.z);
      this.hawks.push({ model, terr, pos, vel: new THREE.Vector3(), ang: this.rand() * 6, state: 'patrol', t: 0, yaw: 0 });
      this.group.add(model.root);
    }
  }

  private genFlocks() {
    const pal: Record<string, [number, number]> = {
      meadow: [0xa5714a, 0x6e4a33], flowers: [0xe0b040, 0x8a6a2a], forest: [0x5a8a3a, 0x3a5a2a], village: [0x9aa0aa, 0x6a707a],
      beach: [0xf4f4f2, 0x9aa6b2], island: [0xf4f4f2, 0x9aa6b2], mountain: [0x3a3a4a, 0x2a2a35], lake: [0x4a7a9a, 0x2a4a6a], river: [0x4a7a9a, 0x2a4a6a],
    };
    let id = 0;
    for (let i = 0; i < 400 && this.flockDefs.length < 40; i++) {
      const x = (this.rand() - 0.5) * 3600, z = (this.rand() - 0.5) * 3600;
      const h = heightAt(x, z);
      if (h < 1 || h > 260) continue;
      const b = biomeAt(x, z, h);
      const p = pal[b];
      if (!p) continue;
      if (this.flockDefs.some((f) => Math.hypot(f.x - x, f.z - z) < 260)) continue;
      this.flockDefs.push({ id: id++, x, z, color: new THREE.Color(p[0]), wing: new THREE.Color(p[1]), size: b === 'beach' || b === 'island' ? 1.4 : 1, biome: b });
    }
    // pastikan ada kawanan dekat titik mulai & desa
    for (const [x, z] of [[40, 300], [VILLAGE.x - 40, VILLAGE.z + 40], [260, -150]]) {
      this.flockDefs.push({ id: id++, x, z, color: new THREE.Color(0xa5714a), wing: new THREE.Color(0x6e4a33), size: 1, biome: 'meadow' });
    }
  }

  get activeBirds(): NBird[] { return this.flocks.flatMap((f) => f.birds); }

  /** Flock Call: ajak burung dalam radius untuk mengikuti pemain. */
  callFlock(p: THREE.Vector3, radius: number, duration: number): number {
    let n = 0;
    for (const f of this.flocks) {
      if (f.birds.some((b) => b.pos.distanceTo(p) < radius)) {
        f.state = 'follow'; f.t = duration; n += f.birds.length;
        for (const b of f.birds) { b.sit = false; b.perch = null; }
      }
    }
    return n;
  }

  /** Penanda untuk Sky Vision. */
  markers(): { x: number; y: number; z: number; type: 'bird' | 'danger' }[] {
    const out: { x: number; y: number; z: number; type: 'bird' | 'danger' }[] = [];
    for (const f of this.flocks) if (f.birds[0]) out.push({ x: f.birds[0].pos.x, y: f.birds[0].pos.y, z: f.birds[0].pos.z, type: 'bird' });
    for (const h of this.hawks) out.push({ x: h.pos.x, y: h.pos.y, z: h.pos.z, type: 'danger' });
    for (const a of this.animals) if (a.kind === 'cat' && !this.relaxed) out.push({ x: a.pos.x, y: a.pos.y + 1, z: a.pos.z, type: 'danger' });
    return out;
  }

  update(dt: number, t: number, player: Player, world: World, night: number, dashing: boolean) {
    const P = player.pos;
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = 1; this.manageSpawns(P, world); }
    this.updateFlocks(dt, t, player, world, dashing);
    this.updateHumans(dt, player, world);
    this.updateAnimals(dt, player, world);
    this.updateFish(dt, t, player);
    this.updateButterflies(dt, t, P, night);
    this.updateHawks(dt, player, world, night);
  }

  private manageSpawns(P: THREE.Vector3, world: World) {
    // Kawanan
    const R = 380;
    this.flocks = this.flocks.filter((f) => {
      const keep = f.state === 'follow' || Math.hypot(f.def.x - P.x, f.def.z - P.z) < R + 120;
      return keep;
    });
    let total = this.flocks.reduce((a, f) => a + f.birds.length, 0);
    const sorted = [...this.flockDefs].sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z));
    for (const d of sorted) {
      if (Math.hypot(d.x - P.x, d.z - P.z) > R) break;
      if (this.flocks.some((f) => f.def === d)) continue;
      const n = 5 + Math.floor(this.rand() * 3);
      if (total + n > this.caps.birds) break;
      total += n;
      const gy = heightAt(d.x, d.z);
      const f: ActiveFlock = { def: d, state: 'fly', t: 10 + this.rand() * 20, ang: this.rand() * 6, alt: 25 + this.rand() * 30, anchor: new THREE.Vector3(d.x, gy + 30, d.z), birds: [] };
      for (let i = 0; i < n; i++) {
        const off = new THREE.Vector3((this.rand() - 0.5) * 10, (this.rand() - 0.5) * 4, (this.rand() - 0.5) * 10);
        f.birds.push({ flock: f, pos: f.anchor.clone().add(off), vel: new THREE.Vector3(), off, phase: this.rand() * 6, sit: false, perch: null, yaw: 0 });
      }
      this.flocks.push(f);
    }
    // Manusia di desa
    const nearVillage = Math.hypot(P.x - VILLAGE.x, P.z - VILLAGE.z) < 480;
    if (nearVillage && this.humans.length < this.caps.humans) {
      const houses = world.landmarks.houses;
      const i = this.humans.length;
      const h = houses[(i * 3) % houses.length];
      if (h) {
        const shirts = [0x4a7ab0, 0xc0504a, 0x5a9a5a, 0xd9a03a, 0x8a5ab0, 0xe8e0d0];
        const m = makeHuman(shirts[i % shirts.length], i % 2 ? 0x3a4a6a : 0x6a5a3a, [0xf0c8a0, 0xc89a70, 0x8a5a3a][i % 3], i % 3 === 0);
        const pos = h.door.clone();
        this.humans.push({ m, home: h.door.clone(), pos, target: pos.clone(), route: [], task: 'stand', t: this.rand() * 5, yaw: 0, phase: 0, feedCd: 10 + this.rand() * 20 });
        this.group.add(m.root);
      }
    } else if (!nearVillage && this.humans.length) {
      for (const h of this.humans) this.group.remove(h.m.root);
      this.humans = [];
    }
    // Hewan darat
    this.animals = this.animals.filter((a) => {
      if (a.pos.distanceTo(P) > 230) { this.group.remove(a.obj); return false; }
      return true;
    });
    if (this.animals.length < this.caps.animals) {
      const a = this.rand() * Math.PI * 2, d = 60 + this.rand() * 110;
      const x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d;
      const h = heightAt(x, z);
      if (waterHeightAt(x, z, h) === -Infinity && h > 1.5) {
        const b = biomeAt(x, z, h);
        let kind: Animal['kind'] | null = null;
        if (b === 'meadow' || b === 'flowers') kind = this.rand() < 0.75 ? 'rabbit' : 'deer';
        else if (b === 'forest') kind = this.rand() < 0.6 ? 'deer' : 'rabbit';
        else if (b === 'village' && this.animals.filter((x) => x.kind === 'cat').length < 3) kind = 'cat';
        if (kind) {
          const obj = kind === 'rabbit' ? makeRabbit() : kind === 'deer' ? makeDeer(this.rand() < 0.4) : makeCat([0xd98a3a, 0x3a3a3a, 0xe8e0d0, 0x8a7a6a][Math.floor(this.rand() * 4)]);
          const pos = new THREE.Vector3(x, h, z);
          this.animals.push({ kind, obj, pos, target: pos.clone(), yaw: this.rand() * 6, t: this.rand() * 3, hop: 0, state: 'idle', home: pos.clone(), speed: 0 });
          this.group.add(obj);
        }
      }
    }
    // Ikan di air terdekat
    this.fish = this.fish.filter((f) => f.alive && Math.hypot(f.c.x - P.x, f.c.z - P.z) < 140);
    for (let tries = 0; tries < 4 && this.fish.length < 12; tries++) {
      const a = this.rand() * Math.PI * 2, d = 20 + this.rand() * 90;
      const x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d;
      const g = heightAt(x, z), w = waterHeightAt(x, z, g);
      if (w > g + 1.2) this.fish.push({ pos: new THREE.Vector3(x, w - 0.7, z), ang: this.rand() * 6, r: 3 + this.rand() * 5, c: new THREE.Vector3(x, w, z), wy: w, jump: 4 + this.rand() * 10, vy: 0, alive: true });
    }
    // Kupu-kupu di padang bunga
    const pb = biomeAt(P.x, P.z);
    if (this.butterData.length < 24 && (pb === 'flowers' || pb === 'meadow' || pb === 'village')) {
      const x = P.x + (this.rand() - 0.5) * 80, z = P.z + (this.rand() - 0.5) * 80;
      if (biomeAt(x, z) === 'flowers' || this.rand() < 0.3) this.butterData.push({ c: new THREE.Vector3(x, heightAt(x, z) + 1.2, z), ph: this.rand() * 10 });
    }
    this.butterData = this.butterData.filter((b) => Math.hypot(b.c.x - P.x, b.c.z - P.z) < 110);
  }

  private updateFlocks(dt: number, t: number, player: Player, world: World, dashing: boolean) {
    const P = player.pos;
    let bi = 0, wi = 0;
    this.followers = 0;
    const hawkNear = (p: THREE.Vector3) => this.hawks.some((h) => h.pos.distanceTo(p) < 60);
    for (const f of this.flocks) {
      f.t -= dt;
      const d = f.def;
      const gy = heightAt(d.x, d.z);
      const lead = f.birds[0]?.pos ?? f.anchor;
      if (f.state !== 'flee' && f.state !== 'follow' && (hawkNear(lead) || (dashing && lead.distanceTo(P) < 10))) {
        f.state = 'flee'; f.t = 6;
        for (const b of f.birds) { b.sit = false; b.perch = null; }
      }
      if (f.t <= 0) {
        const r = this.rand();
        const prev = f.state;
        f.state = prev === 'fly' ? (r < 0.5 ? 'ground' : 'perch') : 'fly';
        f.t = f.state === 'fly' ? 18 + this.rand() * 20 : 14 + this.rand() * 14;
        for (const b of f.birds) {
          b.sit = false; b.perch = null;
          if (f.state === 'perch') {
            const pr = world.nearestPerch(d.x + b.off.x * 3, gy + 6, d.z + b.off.z * 3, 40);
            if (pr) b.perch = new THREE.Vector3(pr.x + (this.rand() - 0.5) * 0.6, pr.y, pr.z + (this.rand() - 0.5) * 0.6);
          }
        }
      }
      if (f.state === 'fly') {
        f.ang += dt * 0.35;
        f.anchor.set(d.x + Math.cos(f.ang) * 55, Math.max(gy, waterHeightAt(d.x, d.z)) + f.alt + Math.sin(f.ang * 2) * 6, d.z + Math.sin(f.ang) * 55);
      } else if (f.state === 'flee') {
        f.anchor.y += dt * 8;
        if (f.t < 4 && f.t > 3.9) f.anchor.set(lead.x + (lead.x - P.x) * 2, lead.y + 30, lead.z + (lead.z - P.z) * 2);
      } else if (f.state === 'follow') {
        this.followers += f.birds.length;
        const fw = player.forwardDir;
        f.anchor.set(P.x - fw.x * 6, P.y + 1.5, P.z - fw.z * 6);
        if (f.t <= 0) { f.state = 'fly'; f.t = 20; }
      } else f.anchor.set(d.x, gy, d.z);

      for (const b of f.birds) {
        let target: THREE.Vector3;
        let landing = false;
        if (f.state === 'ground') {
          const tx = d.x + b.off.x * 1.2, tz = d.z + b.off.z * 1.2;
          const ty = heightAt(tx, tz);
          target = this.v.set(tx, Math.max(ty, waterHeightAt(tx, tz, ty) > ty ? 1e9 : ty), tz);
          if (target.y > 1e8) { target.y = ty + 20; } else landing = true;
        } else if (f.state === 'perch' && b.perch) { target = b.perch; landing = true; }
        else if (f.state === 'perch') { target = this.v.copy(f.anchor).add(b.off); target.y = heightAt(target.x, target.z) + 0; landing = true; }
        else {
          const spread = f.state === 'follow' ? 0.6 : 1;
          target = this.v.copy(f.anchor).addScaledVector(b.off, spread);
          target.x += Math.sin(t * 0.7 + b.phase) * 2; target.y += Math.cos(t * 0.9 + b.phase) * 1.2;
        }
        if (b.sit) {
          if (!landing) b.sit = false;
          else if (this.rand() < dt * 0.3) b.phase = t; // ganti arah sesekali
        }
        if (!b.sit) {
          const dx = target.x - b.pos.x, dy = target.y - b.pos.y, dz = target.z - b.pos.z;
          const dist = Math.hypot(dx, dy, dz) || 1;
          const maxS = f.state === 'follow' ? Math.max(14, player.speed + 6) : f.state === 'flee' ? 20 : 12;
          const sp = Math.min(maxS, dist * 1.6);
          this.s.set((dx / dist) * sp, (dy / dist) * sp, (dz / dist) * sp);
          b.vel.x = damp(b.vel.x, this.s.x, 2.5, dt); b.vel.y = damp(b.vel.y, this.s.y, 2.5, dt); b.vel.z = damp(b.vel.z, this.s.z, 2.5, dt);
          b.pos.addScaledVector(b.vel, dt);
          const g = heightAt(b.pos.x, b.pos.z);
          if (!landing && b.pos.y < g + 2) b.pos.y = g + 2;
          if (landing && dist < 0.6) { b.sit = true; b.pos.copy(target); b.vel.set(0, 0, 0); }
          if (Math.hypot(b.vel.x, b.vel.z) > 0.3) b.yaw = Math.atan2(b.vel.x, b.vel.z);
        }
        // ---- render ----
        if (bi >= 64) continue;
        const sc = 0.9 * d.size;
        const flying = !b.sit;
        const pitch = flying ? -clamp(b.vel.y / 12, -0.6, 0.6) : (Math.sin(t * 3 + b.phase) > 0.6 && f.state === 'ground' ? 0.6 : 0);
        this.e.set(pitch, b.yaw, 0, 'YXZ');
        this.q.setFromEuler(this.e);
        this.s.set(sc, sc, sc);
        this.m.compose(b.pos, this.q, this.s);
        this.bodyIM.setMatrixAt(bi, this.m);
        this.bodyIM.setColorAt(bi, d.color);
        bi++;
        const flapA = flying ? Math.sin(t * (f.state === 'follow' ? 9 : 11) + b.phase) * (b.vel.y > 0.5 || f.state === 'flee' ? 1 : 0.5) : -1.3;
        for (const side of [-1, 1]) {
          if (wi >= 128) break;
          this.e.set(0, flying ? 0 : side * 1.2, side * (flying ? flapA : -0.3), 'YXZ');
          this.q.setFromEuler(this.e);
          this.m2.compose(this.v.set(side * 0.18, 0.08, 0.05), this.q, this.s.set(side, 1, 1));
          this.m2.premultiply(this.m);
          this.wingIM.setMatrixAt(wi, this.m2);
          this.wingIM.setColorAt(wi, d.wing);
          wi++;
        }
      }
    }
    this.bodyIM.count = bi; this.wingIM.count = wi;
    this.bodyIM.instanceMatrix.needsUpdate = this.wingIM.instanceMatrix.needsUpdate = true;
    if (this.bodyIM.instanceColor) this.bodyIM.instanceColor.needsUpdate = true;
    if (this.wingIM.instanceColor) this.wingIM.instanceColor.needsUpdate = true;
  }

  private routeTo(h: Human, dest: THREE.Vector3) {
    const c = new THREE.Vector3(VILLAGE.x, 0, VILLAGE.z + 3);
    c.y = heightAt(c.x, c.z);
    h.route = [c, dest.clone()];
    h.task = 'walk';
  }

  private updateHumans(dt: number, player: Player, world: World) {
    const L = world.landmarks;
    const P = player.pos;
    for (const h of this.humans) {
      h.t -= dt; h.feedCd -= dt;
      if (h.task === 'walk') {
        const tgt = h.route[0];
        if (!tgt) { h.task = 'stand'; h.t = 5; continue; }
        const dx = tgt.x - h.pos.x, dz = tgt.z - h.pos.z, dist = Math.hypot(dx, dz);
        if (dist < 0.6) {
          h.route.shift();
          if (!h.route.length) {
            const atBench = L.benches.some((b) => b.distanceTo(h.pos) < 2);
            const atGarden = L.gardens.some((g) => g.distanceTo(h.pos) < 3);
            h.task = atBench ? 'sit' : atGarden ? 'garden' : 'stand';
            h.t = 10 + this.rand() * 15;
          }
        } else {
          h.yaw = Math.atan2(dx, dz);
          h.pos.x += (dx / dist) * 1.4 * dt; h.pos.z += (dz / dist) * 1.4 * dt;
          h.pos.y = heightAt(h.pos.x, h.pos.z);
          h.phase += dt * 7;
        }
      } else if (h.t <= 0) {
        const r = this.rand();
        const dest = r < 0.35 && L.gardens.length ? L.gardens[Math.floor(this.rand() * L.gardens.length)]
          : r < 0.7 && L.benches.length ? L.benches[Math.floor(this.rand() * L.benches.length)] : h.home;
        this.routeTo(h, dest);
      }
      // memberi makan burung bila pemain dekat di tanah/bertengger
      const pd = h.pos.distanceTo(P);
      if (h.task !== 'walk' && h.feedCd <= 0 && pd < 16 && player.mode !== 'fly') {
        h.feedCd = 35 + this.rand() * 25;
        h.yaw = Math.atan2(P.x - h.pos.x, P.z - h.pos.z);
        this.onFeed?.(h.pos.x + (P.x - h.pos.x) * 0.5, h.pos.z + (P.z - h.pos.z) * 0.5);
        h.phase = 100;
      }
      // pose
      const m = h.m;
      m.root.position.copy(h.pos);
      m.root.rotation.y = h.yaw;
      const walking = h.task === 'walk';
      const sw = walking ? Math.sin(h.phase) * 0.6 : 0;
      m.legL.rotation.x = sw; m.legR.rotation.x = -sw;
      m.armL.rotation.x = -sw * 0.8; m.armR.rotation.x = sw * 0.8;
      m.body.position.y = 0; m.body.rotation.x = 0;
      if (h.task === 'sit') { m.legL.rotation.x = m.legR.rotation.x = -1.4; m.body.position.y = -0.35; }
      if (h.task === 'garden') { m.body.rotation.x = 0.6 + Math.sin(performance.now() / 300) * 0.1; m.armR.rotation.x = -1 + Math.sin(performance.now() / 250) * 0.4; m.armL.rotation.x = -1; }
      if (h.phase > 99 && h.phase < 100.8) { m.armR.rotation.x = -2.2 + (h.phase - 100) * 2; h.phase += dt; }
    }
  }

  private updateAnimals(dt: number, player: Player, world: World) {
    const P = player.pos;
    const pg = player.mode !== 'fly';
    const pLow = P.y - heightAt(P.x, P.z) < 5;
    for (const a of this.animals) {
      a.t -= dt;
      const pd = Math.hypot(P.x - a.pos.x, P.z - a.pos.z);
      if (a.kind === 'cat') {
        if (!this.relaxed && pg && pd < 14 && a.state !== 'pounce' && player.mode === 'ground') { a.state = 'stalk'; }
        if (a.state === 'stalk') {
          a.target.copy(P);
          a.speed = 1.4;
          if (!pg || pd > 20) { a.state = 'idle'; a.t = 3; }
          else if (pd < 4) { a.state = 'pounce'; a.t = 0.6; this.onMeow?.(); }
        } else if (a.state === 'pounce') {
          a.target.copy(P); a.speed = 9;
          if (pd < 1.0 && pg && !player.invulnerable) { this.onHit?.(18, 'kucing'); a.state = 'idle'; a.t = 8; a.target.copy(a.home); }
          if (a.t <= 0) { a.state = 'idle'; a.t = 5; }
        } else if (a.t <= 0) {
          a.state = this.rand() < 0.5 ? 'move' : 'idle';
          a.t = 3 + this.rand() * 6;
          a.target.set(a.home.x + (this.rand() - 0.5) * 30, 0, a.home.z + (this.rand() - 0.5) * 30);
          a.speed = 1.1;
          if (this.rand() < 0.1) this.onMeow?.();
        }
      } else {
        const scareR = a.kind === 'deer' ? (pg ? 16 : 9) : pg ? 7 : 4;
        if ((pd < scareR && (pg || pLow)) && a.state !== 'flee') {
          a.state = 'flee'; a.t = 3;
          const dx = a.pos.x - P.x, dz = a.pos.z - P.z, l = Math.hypot(dx, dz) || 1;
          a.target.set(a.pos.x + (dx / l) * 25, 0, a.pos.z + (dz / l) * 25);
          a.speed = a.kind === 'deer' ? 8 : 6.5;
        } else if (a.t <= 0) {
          if (a.state === 'flee' || this.rand() < 0.45) { a.state = 'idle'; a.t = 2 + this.rand() * 5; a.speed = 0; }
          else {
            a.state = 'move'; a.t = 3 + this.rand() * 3;
            a.target.set(a.pos.x + (this.rand() - 0.5) * 16, 0, a.pos.z + (this.rand() - 0.5) * 16);
            a.speed = a.kind === 'deer' ? 1.3 : 2.2;
          }
        }
      }
      if (a.state !== 'idle') {
        const dx = a.target.x - a.pos.x, dz = a.target.z - a.pos.z, l = Math.hypot(dx, dz);
        if (l > 0.5) {
          const nx = a.pos.x + (dx / l) * a.speed * dt, nz = a.pos.z + (dz / l) * a.speed * dt;
          const ny = heightAt(nx, nz);
          if (waterHeightAt(nx, nz, ny) < ny) { a.pos.set(nx, ny, nz); a.yaw = damp(a.yaw, a.yaw + wrapAngle(Math.atan2(dx, dz) - a.yaw), 8, dt); }
          else a.t = 0;
          a.hop += dt * (a.kind === 'rabbit' ? 9 : 6) * (a.speed > 3 ? 1.6 : 1);
        } else if (a.kind !== 'cat' || a.state === 'move') a.t = Math.min(a.t, 0.2);
      } else a.pos.y = heightAt(a.pos.x, a.pos.z);
      a.obj.position.copy(a.pos);
      if (a.kind === 'rabbit') a.obj.position.y += a.state !== 'idle' ? Math.abs(Math.sin(a.hop)) * 0.35 : 0;
      if (a.kind === 'deer') a.obj.rotation.x = a.state === 'idle' ? 0.12 : 0;
      a.obj.rotation.y = a.yaw;
      void world;
    }
  }

  /** Coba tangkap ikan di dekat titik jatuh. */
  tryCatchFish(x: number, z: number, r: number): boolean {
    for (const f of this.fish) {
      if (f.alive && Math.hypot(f.pos.x - x, f.pos.z - z) < r) { f.alive = false; return true; }
    }
    return false;
  }
  fishNear(x: number, z: number, r: number) { return this.fish.some((f) => f.alive && Math.hypot(f.pos.x - x, f.pos.z - z) < r); }
  fishPositions() { return this.fish.filter((f) => f.alive).map((f) => f.pos); }

  private updateFish(dt: number, t: number, player: Player) {
    let n = 0;
    for (const f of this.fish) {
      if (!f.alive) continue;
      f.ang += dt * 0.5;
      f.jump -= dt;
      let y = f.wy - 0.7;
      if (f.jump < 0) {
        if (f.vy === 0) f.vy = 6;
        f.vy -= 18 * dt;
        y = f.pos.y + f.vy * dt;
        if (y < f.wy - 0.7 && f.vy < 0) { f.vy = 0; f.jump = 6 + Math.random() * 12; y = f.wy - 0.7; }
      }
      f.pos.set(f.c.x + Math.cos(f.ang) * f.r, y, f.c.z + Math.sin(f.ang) * f.r);
      this.e.set(f.vy ? -f.vy * 0.1 : 0, -f.ang, 0);
      this.q.setFromEuler(this.e);
      this.m.compose(f.pos, this.q, this.s.set(1.2, 1.2, 1.2));
      if (n < 16) this.fishIM.setMatrixAt(n++, this.m);
    }
    this.fishIM.count = n;
    this.fishIM.instanceMatrix.needsUpdate = true;
    void t; void player;
  }

  private updateButterflies(dt: number, t: number, P: THREE.Vector3, night: number) {
    let n = 0;
    this.butterMat.color.set(night > 0.5 ? 0xfff27a : 0xffb3d9);
    for (const b of this.butterData) {
      if (n >= 30) break;
      const ph = b.ph;
      this.v.set(b.c.x + Math.sin(t * 0.6 + ph) * 3, b.c.y + Math.sin(t * 1.7 + ph) * 0.6 + (night > 0.5 ? 1.2 : 0), b.c.z + Math.cos(t * 0.5 + ph) * 3);
      this.e.set(0, t + ph, Math.sin(t * 18 + ph) * 0.9);
      this.q.setFromEuler(this.e);
      this.m.compose(this.v, this.q, this.s.set(1, 1, 1));
      this.butterIM.setMatrixAt(n++, this.m);
    }
    this.butterIM.count = n;
    this.butterIM.instanceMatrix.needsUpdate = true;
    void dt; void P;
  }

  private updateHawks(dt: number, player: Player, world: World, night: number) {
    const P = player.pos;
    this.threat = null;
    for (const h of this.hawks) {
      h.t -= dt;
      const tr = h.terr;
      const pIn = Math.hypot(P.x - tr.x, P.z - tr.z) < tr.r;
      const d = h.pos.distanceTo(P);
      const hidden = player.sp.id === 'hantu' && night > 0.5;
      const ignore = this.relaxed || player.sp.id === 'elang' || hidden || player.mode === 'perch';
      if (h.state === 'patrol') {
        h.ang += dt * 0.25;
        const tgt = this.v.set(tr.x + Math.cos(h.ang) * tr.r * 0.5, heightAt(tr.x, tr.z) * 0.3 + Math.max(heightAt(h.pos.x, h.pos.z), 0) * 0.7 + 70, tr.z + Math.sin(h.ang) * tr.r * 0.5);
        this.steer(h, tgt, 16, dt);
        if (!ignore && pIn && d < 170 && h.t <= 0) { h.state = 'chase'; h.t = 14; this.onScreech?.(); }
      } else if (h.state === 'chase') {
        const lead = this.v.copy(P).addScaledVector(player.vel, clamp(d / 30, 0, 1.2));
        this.steer(h, lead, 30, dt);
        this.threat = { x: h.pos.x, z: h.pos.z, d };
        if (player.invulnerable && d < 9) { h.state = 'retreat'; h.t = 7; this.onDodge?.(); }
        else if (d < 2.4) {
          if (!ignore) this.onHit?.(30, 'elang');
          h.state = 'retreat'; h.t = 10;
        }
        if (h.t <= 0 || !pIn && Math.hypot(P.x - tr.x, P.z - tr.z) > tr.r * 1.25 || ignore) { h.state = 'retreat'; h.t = 8; }
      } else {
        this.steer(h, this.v.set(tr.x, heightAt(tr.x, tr.z) + 120, tr.z), 20, dt);
        if (h.t <= 0) { h.state = 'patrol'; h.t = 6; }
      }
      const g = heightAt(h.pos.x, h.pos.z);
      if (h.pos.y < g + 3) h.pos.y = g + 3;
      h.model.root.position.copy(h.pos);
      const hs = Math.hypot(h.vel.x, h.vel.z);
      h.yaw = Math.atan2(h.vel.x, h.vel.z);
      h.model.root.rotation.set(-Math.atan2(h.vel.y, hs) * 0.8, h.yaw, 0, 'YXZ');
      h.model.animate({ mode: 'fly', flap: h.state === 'chase' ? 0.7 : h.vel.y > 1 ? 0.6 : 0.05, flapSpeed: 2.2, fold: h.state === 'chase' && h.vel.y < -5 ? 0.7 : 0, flare: 0, bank: 0, walk: 0, peck: 0, roll: 0, carry: 0 }, dt);
      void world;
    }
  }

  private steer(h: Hawk, tgt: THREE.Vector3, speed: number, dt: number) {
    const dx = tgt.x - h.pos.x, dy = tgt.y - h.pos.y, dz = tgt.z - h.pos.z, l = Math.hypot(dx, dy, dz) || 1;
    h.vel.x = damp(h.vel.x, (dx / l) * speed, 1.6, dt);
    h.vel.y = damp(h.vel.y, (dy / l) * speed, 1.6, dt);
    h.vel.z = damp(h.vel.z, (dz / l) * speed, 1.6, dt);
    h.pos.addScaledVector(h.vel, dt);
  }

  setRelaxed(r: boolean) { this.relaxed = r; }
}
