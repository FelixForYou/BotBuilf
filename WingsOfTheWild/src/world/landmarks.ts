// Landmark & struktur statis: desa, pohon raksasa, mercusuar, reruntuhan, gua, puncak, dll.
import * as THREE from 'three';
import { heightAt, VILLAGE, ISLANDS, PEAK, LAKE, roadDist, RIVER, CAVE } from './terrain';
import { colored, at, merge, rockGeo } from './models';
import { mulberry32 } from '../core/noise';

export interface BoxCollider { type: 'box'; minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number; }
export interface CylCollider { type: 'cyl'; x: number; z: number; r: number; y0: number; y1: number; }
export interface SphereCollider { type: 'sphere'; x: number; y: number; z: number; r: number; }
export interface ShellCollider { type: 'shell'; x: number; y: number; z: number; r: number; openDir: THREE.Vector3; openCos: number; }
export type Collider = BoxCollider | CylCollider | SphereCollider | ShellCollider;

export interface POI { id: string; name: string; x: number; y: number; z: number; kind: 'landmark' | 'secret'; radius: number; icon: string; }
export interface Perch { x: number; y: number; z: number; }
export interface House { x: number; z: number; y: number; rot: number; door: THREE.Vector3; }

export class Landmarks {
  readonly group = new THREE.Group();
  readonly colliders: Collider[] = [];
  readonly perches: Perch[] = [];
  readonly pois: POI[] = [];
  readonly houses: House[] = [];
  readonly benches: THREE.Vector3[] = [];
  readonly gardens: THREE.Vector3[] = [];
  private glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  private blades: THREE.Mesh;
  private beam: THREE.Mesh;
  private crystals: THREE.Mesh | null = null;
  private parts: THREE.BufferGeometry[] = [];
  private glow: THREE.BufferGeometry[] = [];
  waterfallPos = new THREE.Vector3();

  constructor(falls: THREE.Vector3[]) {
    const rand = mulberry32(4242);
    this.buildVillage(rand);
    this.buildGreatTree();
    // Mercusuar di pulau timur
    const isl = ISLANDS[2];
    const lx = isl.x - 20, lz = isl.z - 10, ly = heightAt(lx, lz) - 1;
    for (let i = 0; i < 6; i++) {
      const r0 = 4.2 - i * 0.3;
      this.parts.push(colored(at(new THREE.CylinderGeometry(r0 - 0.3, r0, 6, 10), lx, ly + 3 + i * 6, lz), i % 2 ? 0xd2403a : 0xf4f1ea));
    }
    this.parts.push(colored(at(new THREE.CylinderGeometry(3.4, 3.4, 0.6, 10), lx, ly + 36.3, lz), 0x333a44));
    this.glow.push(colored(at(new THREE.CylinderGeometry(1.8, 1.8, 3, 8), lx, ly + 38, lz), 0xfff0b0));
    this.parts.push(colored(at(new THREE.ConeGeometry(2.6, 2.6, 8), lx, ly + 40.8, lz), 0xd2403a));
    this.colliders.push({ type: 'cyl', x: lx, z: lz, r: 4.4, y0: ly - 5, y1: ly + 42 });
    this.perches.push({ x: lx, y: ly + 42.1, z: lz }, { x: lx + 3, y: ly + 36.7, z: lz });
    this.poi('lighthouse', 'Mercusuar Karang', lx, ly + 42, lz, 'landmark', 40, '🗼');
    const beamGeo = new THREE.ConeGeometry(6, 70, 12, 1, true);
    beamGeo.translate(0, -35, 0); beamGeo.rotateZ(Math.PI / 2);
    this.beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    this.beam.position.set(lx, ly + 38, lz);
    this.group.add(this.beam);

    // Reruntuhan kuno
    const rx = -700, rz = 350, ry = heightAt(rx, rz);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, px = rx + Math.cos(a) * 24, pz = rz + Math.sin(a) * 24;
      const h = [9, 4, 9, 7, 2.5, 9, 9, 5, 9, 3][i];
      const py = heightAt(px, pz);
      this.parts.push(colored(at(new THREE.CylinderGeometry(1.2, 1.4, h, 7), px, py + h / 2 - 0.5, pz), 0xc9c0a8, 0.12, i));
      this.colliders.push({ type: 'cyl', x: px, z: pz, r: 1.5, y0: py - 2, y1: py + h - 0.5 });
      this.perches.push({ x: px, y: py + h - 0.4, z: pz });
      if (h === 9 && i < 9 && [9, 4, 9, 7, 2.5, 9, 9, 5, 9, 3][i + 1] === 9) {
        const a2 = ((i + 1) / 10) * Math.PI * 2, qx = rx + Math.cos(a2) * 24, qz = rz + Math.sin(a2) * 24;
        const len = Math.hypot(qx - px, qz - pz);
        this.parts.push(colored(at(new THREE.BoxGeometry(len + 2.5, 1.2, 2.2), (px + qx) / 2, py + 9, (pz + qz) / 2, 0, -Math.atan2(qz - pz, qx - px)), 0xbfb59b));
      }
    }
    // Menara runtuh
    for (let i = 0; i < 5; i++) {
      this.parts.push(colored(at(new THREE.CylinderGeometry(5 - i * 0.4, 5.4 - i * 0.4, 5.5, 8, 1, i === 4), rx + 40, ry + 2.75 + i * 5.5, rz - 30, 0, i * 0.3), 0xb8ae94, 0.15, 20 + i));
    }
    this.colliders.push({ type: 'cyl', x: rx + 40, z: rz - 30, r: 5.4, y0: ry - 3, y1: ry + 27 });
    this.perches.push({ x: rx + 40, y: ry + 27.6, z: rz - 30 });
    this.glow.push(colored(at(new THREE.OctahedronGeometry(1.1, 0), rx, ry + 1.6, rz), 0x8ff0ff));
    this.parts.push(colored(at(new THREE.BoxGeometry(4, 1, 4), rx, ry + 0.3, rz), 0x9d947e));
    this.poi('ruins', 'Reruntuhan Kuno', rx + 40, ry + 28, rz - 30, 'landmark', 50, '🏛');
    this.poi('ruins-secret', 'Altar Batu Bercahaya', rx, ry + 2, rz, 'secret', 8, '✦');

    // Gua kristal di pegunungan
    const gx = CAVE.x, gz = CAVE.z, gy = CAVE.floor - 6;
    const shell = new THREE.IcosahedronGeometry(24, 1);
    const openDir = new THREE.Vector3(0, 0.2, -1).normalize();
    // buang segitiga yang menghadap pintu masuk
    const sp = shell.getAttribute('position');
    const keep: number[] = [];
    const tmp = new THREE.Vector3();
    for (let f = 0; f < sp.count; f += 3) {
      tmp.set(0, 0, 0);
      for (let v = 0; v < 3; v++) tmp.add(new THREE.Vector3(sp.getX(f + v), sp.getY(f + v), sp.getZ(f + v)));
      tmp.normalize();
      if (tmp.dot(openDir) > 0.82) continue;
      for (let v = 0; v < 3; v++) keep.push(sp.getX(f + v), sp.getY(f + v), sp.getZ(f + v));
    }
    const cave = new THREE.BufferGeometry();
    cave.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
    cave.computeVertexNormals();
    const caveMesh = new THREE.Mesh(colored(cave, 0x6f6a72, 0.25, 77), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }));
    caveMesh.position.set(gx, gy, gz);
    this.group.add(caveMesh);
    this.colliders.push({ type: 'shell', x: gx, y: gy, z: gz, r: 24, openDir, openCos: 0.84 });
    const cr: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39, d = 6 + (i % 4) * 3.5;
      const cxp = gx + Math.cos(a) * d, czp = gz + Math.sin(a) * d + 4;
      cr.push(colored(at(new THREE.OctahedronGeometry(1, 0), cxp, gy + 7 + (i % 3), czp, 0.2 * i, i, 0.1 * i, [0.7, 2.4 + (i % 3), 0.7]), i % 2 ? 0x9b7cff : 0x6fe3ff));
    }
    this.crystals = new THREE.Mesh(merge(cr), this.glowMat);
    this.group.add(this.crystals);
    this.perches.push({ x: gx, y: gy + 24.5, z: gz });
    this.poi('cave', 'Gua Kristal', gx, gy + 8, gz, 'secret', 16, '💎');

    // Puncak
    const py = heightAt(PEAK.x, PEAK.z);
    this.parts.push(rockGeo(9).applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(PEAK.x, py + 1, PEAK.z), new THREE.Quaternion(), new THREE.Vector3(3, 2.4, 3))));
    this.parts.push(colored(at(new THREE.CylinderGeometry(0.15, 0.15, 7, 5), PEAK.x, py + 6, PEAK.z), 0x6b4a32));
    this.parts.push(colored(at(new THREE.BoxGeometry(3, 1.8, 0.1), PEAK.x + 1.5, py + 8.5, PEAK.z), 0xe85d3a));
    this.perches.push({ x: PEAK.x, y: py + 3.4, z: PEAK.z });
    this.poi('peak', 'Puncak Elang', PEAK.x, py + 4, PEAK.z, 'secret', 30, '⛰');

    // Kuil pulau barat: lingkaran batu tegak
    const wi = ISLANDS[3];
    const wy = heightAt(wi.x, wi.z);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2, sx = wi.x + Math.cos(a) * 14, sz = wi.z + Math.sin(a) * 14;
      const sy = heightAt(sx, sz);
      this.parts.push(colored(at(new THREE.BoxGeometry(2, 7, 1.2), sx, sy + 3, sz, 0, -a), 0x8d8f99, 0.15, i));
      this.colliders.push({ type: 'cyl', x: sx, z: sz, r: 1.3, y0: sy - 2, y1: sy + 6.5 });
      this.perches.push({ x: sx, y: sy + 6.6, z: sz });
    }
    this.glow.push(colored(at(new THREE.IcosahedronGeometry(1.4, 0), wi.x, wy + 2.5, wi.z), 0xffd36e));
    this.poi('shrine', 'Lingkaran Batu Pulau', wi.x, wy + 3, wi.z, 'secret', 14, '🔆');

    // Gerbang karang di pulau selatan (celah untuk tantangan)
    const si = ISLANDS[1];
    const ax = si.x + 90, az = si.z - 20;
    for (const sx of [-9, 9]) this.parts.push(colored(at(new THREE.BoxGeometry(5, 26, 6), ax + sx, 8, az, 0, 0, sx * 0.008), 0x9a8f86, 0.2, sx + 50));
    this.parts.push(colored(at(new THREE.BoxGeometry(24, 5, 6), ax, 22, az), 0x8f857c, 0.2, 61));
    this.colliders.push({ type: 'box', minX: ax - 11.5, maxX: ax - 6.5, minY: -10, maxY: 24.5, minZ: az - 3, maxZ: az + 3 });
    this.colliders.push({ type: 'box', minX: ax + 6.5, maxX: ax + 11.5, minY: -10, maxY: 24.5, minZ: az - 3, maxZ: az + 3 });
    this.colliders.push({ type: 'box', minX: ax - 12, maxX: ax + 12, minY: 19.5, maxY: 24.5, minZ: az - 3, maxZ: az + 3 });
    this.perches.push({ x: ax, y: 24.6, z: az });
    this.poi('arch', 'Gerbang Karang', ax, 22, az, 'landmark', 30, '⛩');

    // Air terjun
    if (falls.length) {
      const f = falls.reduce((a, b) => (b.y > a.y ? b : a), falls[0]);
      this.waterfallPos.copy(f);
      this.poi('waterfall', 'Air Terjun Pelangi', f.x, f.y + 10, f.z, 'landmark', 40, '💧');
      // ceruk rahasia di dekat kaki air terjun
      const up = RIVER[0][0];
      const dx = up.x - f.x, dz = up.z - f.z, l = Math.hypot(dx, dz);
      const sxp = f.x + (dx / l) * 6 + (dz / l) * 14, szp = f.z + (dz / l) * 6 - (dx / l) * 14;
      const syp = heightAt(sxp, szp);
      this.glow.push(colored(at(new THREE.OctahedronGeometry(0.9, 0), sxp, syp + 1.4, szp), 0x9cf7c5));
      this.poi('falls-secret', 'Ceruk Balik Air Terjun', sxp, syp + 1.5, szp, 'secret', 9, '✧');
    } else this.waterfallPos.set(-120, 120, -900);

    // Danau: pulau kecil dengan satu pohon
    const lx2 = LAKE.x + 40, lz2 = LAKE.z + 20;
    this.parts.push(colored(at(new THREE.CylinderGeometry(9, 12, 4, 9), lx2, LAKE.level - 1.2, lz2), 0x6f9a48, 0.1, 3));
    this.parts.push(colored(at(new THREE.CylinderGeometry(0.4, 0.6, 7, 6), lx2, LAKE.level + 4, lz2), 0x775235));
    this.parts.push(colored(at(new THREE.IcosahedronGeometry(4, 0), lx2, LAKE.level + 9, lz2), 0x6db04a, 0.2, 8));
    this.perches.push({ x: lx2, y: LAKE.level + 13, z: lz2 }, { x: lx2 + 5, y: LAKE.level + 0.9, z: lz2 });
    this.colliders.push({ type: 'cyl', x: lx2, z: lz2, r: 10, y0: LAKE.level - 5, y1: LAKE.level + 0.8 });
    this.poi('lake', 'Danau Cermin', LAKE.x, LAKE.level + 2, LAKE.z, 'landmark', 120, '🌊');

    const world = new THREE.Mesh(merge(this.parts), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    world.castShadow = true; world.receiveShadow = true;
    this.group.add(world);
    this.group.add(new THREE.Mesh(merge(this.glow), this.glowMat));
    // Bilah kincir
    const wmx = VILLAGE.x + 120, wmz = VILLAGE.z - 90, wmy = heightAt(wmx, wmz);
    const bl: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      const g = at(new THREE.BoxGeometry(1.4, 9, 0.2), 0, 5, 0);
      bl.push(colored(at(g, 0, 0, 0, 0, 0, (i * Math.PI) / 2), 0xf4ead6));
    }
    this.blades = new THREE.Mesh(merge(bl), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    this.blades.position.set(wmx, wmy + 17, wmz + 3.4);
    this.group.add(this.blades);
    this.parts = []; this.glow = [];
  }

  private poi(id: string, name: string, x: number, y: number, z: number, kind: POI['kind'], radius: number, icon: string) {
    this.pois.push({ id, name, x, y, z, kind, radius, icon });
  }

  private buildGreatTree() {
    const x = -1000, z = -200, y = heightAt(x, z) - 1;
    this.parts.push(colored(at(new THREE.CylinderGeometry(3.5, 6.5, 52, 9), x, y + 26, z), 0x6d4b30, 0.1, 1));
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      this.parts.push(colored(at(new THREE.CylinderGeometry(0.6, 1.6, 12, 6), x + Math.cos(a) * 4, y + 2, z + Math.sin(a) * 4, Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8), 0x6d4b30));
    }
    const crowns: Array<[number, number, number, number]> = [[0, 58, 0, 20], [14, 50, -6, 13], [-13, 48, 8, 12], [5, 46, 15, 11], [-6, 52, -14, 12], [0, 70, 0, 12]];
    for (const [cx, cy, cz, r] of crowns) {
      this.parts.push(colored(at(new THREE.IcosahedronGeometry(r, 1), x + cx, y + cy, z + cz, 0, 0, 0, [1, 0.75, 1]), 0x4d9442, 0.18, r));
      this.perches.push({ x: x + cx, y: y + cy + r * 0.75 + 0.2, z: z + cz });
    }
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25 + 0.3;
      const bx = x + Math.cos(a) * 12, bz = z + Math.sin(a) * 12, by = y + 30 + i * 3;
      this.parts.push(colored(at(new THREE.CylinderGeometry(0.6, 1, 16, 5), (x + bx) / 2, by - 3, (z + bz) / 2, Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2), 0x6d4b30));
      this.perches.push({ x: bx, y: by + 1.5, z: bz });
    }
    this.colliders.push({ type: 'cyl', x, z, r: 6, y0: y - 5, y1: y + 46 });
    this.colliders.push({ type: 'sphere', x, y: y + 58, z, r: 17 });
    this.poi('greattree', 'Pohon Raksasa', x, y + 75, z, 'landmark', 45, '🌳');
    this.poi('tree-secret', 'Sarang Kuno di Mahkota', x, y + 82, z, 'secret', 10, '🪺');
    this.parts.push(colored(at(new THREE.TorusGeometry(1.6, 0.6, 5, 9), x, y + 82.2, z, Math.PI / 2), 0x8a6a42));
    this.perches.push({ x, y: y + 82.5, z });
  }

  private buildVillage(rand: () => number) {
    const placed: Array<[number, number]> = [];
    const roads: Array<[number, number, number, number]> = [
      [VILLAGE.x - 240, VILLAGE.z, VILLAGE.x + 240, VILLAGE.z + 30],
      [VILLAGE.x, VILLAGE.z - 230, VILLAGE.x - 20, VILLAGE.z + 240],
    ];
    const roofCols = [0xc4553f, 0x9c4a3a, 0x5a6f9c, 0xd2873c, 0x6b8a4a];
    const wallCols = [0xf2e6cf, 0xe9d8b8, 0xf6efe2, 0xdcc7a3];
    for (const [ax, az, bx, bz] of roads) {
      const len = Math.hypot(bx - ax, bz - az);
      const dx = (bx - ax) / len, dz = (bz - az) / len;
      for (let t = 25; t < len - 20; t += 27) {
        for (const side of [-1, 1]) {
          if (rand() < 0.2) continue;
          const off = 13 + rand() * 3;
          const hx = ax + dx * t - dz * off * side, hz = az + dz * t + dx * off * side;
          if (Math.hypot(hx - VILLAGE.x, hz - VILLAGE.z) < 22) continue;
          if (placed.some(([px, pz]) => Math.hypot(px - hx, pz - hz) < 16)) continue;
          if (roadDist(hx, hz) < 9) continue;
          placed.push([hx, hz]);
          const rot = Math.atan2(dx, dz) + (side > 0 ? Math.PI / 2 : -Math.PI / 2);
          this.addHouse(hx, hz, rot, wallCols[Math.floor(rand() * wallCols.length)], roofCols[Math.floor(rand() * roofCols.length)], 0.9 + rand() * 0.35);
        }
      }
    }
    // Sumur di alun-alun
    const wy = heightAt(VILLAGE.x, VILLAGE.z);
    this.parts.push(colored(at(new THREE.CylinderGeometry(2, 2.2, 1.4, 10), VILLAGE.x + 8, wy + 0.7, VILLAGE.z + 8), 0x9a9690));
    this.parts.push(colored(at(new THREE.ConeGeometry(2.8, 1.6, 4), VILLAGE.x + 8, wy + 4, VILLAGE.z + 8, 0, Math.PI / 4), 0xa04b38));
    for (const s of [-1.8, 1.8]) this.parts.push(colored(at(new THREE.BoxGeometry(0.25, 3.2, 0.25), VILLAGE.x + 8 + s, wy + 2, VILLAGE.z + 8), 0x6b4a32));
    this.perches.push({ x: VILLAGE.x + 8, y: wy + 4.8, z: VILLAGE.z + 8 });
    this.colliders.push({ type: 'cyl', x: VILLAGE.x + 8, z: VILLAGE.z + 8, r: 2.4, y0: wy - 2, y1: wy + 1.4 });
    // Bangku & kebun
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3 + 0.4;
      const bx = VILLAGE.x + Math.cos(a) * 26, bz = VILLAGE.z + Math.sin(a) * 26, by = heightAt(bx, bz);
      this.parts.push(colored(at(new THREE.BoxGeometry(3, 0.25, 1), bx, by + 0.8, bz, 0, -a), 0x8a5f3a));
      this.parts.push(colored(at(new THREE.BoxGeometry(3, 0.8, 0.2), bx - Math.cos(a) * 0.5, by + 1.3, bz - Math.sin(a) * 0.5, 0, -a + Math.PI / 2 - Math.PI / 2), 0x7a5232));
      this.benches.push(new THREE.Vector3(bx, by, bz));
      this.perches.push({ x: bx, y: by + 1.75, z: bz });
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const gx = VILLAGE.x + Math.cos(a) * VILLAGE.r * 0.62, gz = VILLAGE.z + Math.sin(a) * VILLAGE.r * 0.62;
      if (roadDist(gx, gz) < 8) continue;
      this.gardens.push(new THREE.Vector3(gx, heightAt(gx, gz), gz));
    }
    // Pagar ladang
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const fx = VILLAGE.x + Math.cos(a) * VILLAGE.r * 1.12, fz = VILLAGE.z + Math.sin(a) * VILLAGE.r * 1.12;
      if (roadDist(fx, fz) < 6) continue;
      const fy = heightAt(fx, fz);
      this.parts.push(colored(at(new THREE.BoxGeometry(0.25, 1.4, 0.25), fx, fy + 0.7, fz), 0x8a6a48));
      this.parts.push(colored(at(new THREE.BoxGeometry(0.12, 0.15, 27), fx, fy + 1.1, fz, 0, -a), 0x9a7a58));
    }
    // Kincir angin
    const wmx = VILLAGE.x + 120, wmz = VILLAGE.z - 90, wmy = heightAt(wmx, wmz);
    this.parts.push(colored(at(new THREE.CylinderGeometry(2.6, 4.2, 17, 8), wmx, wmy + 8.5, wmz), 0xeee2c8));
    this.parts.push(colored(at(new THREE.ConeGeometry(3.4, 4, 8), wmx, wmy + 19, wmz), 0x9c4a3a));
    this.colliders.push({ type: 'cyl', x: wmx, z: wmz, r: 4.2, y0: wmy - 2, y1: wmy + 19 });
    this.perches.push({ x: wmx, y: wmy + 21.1, z: wmz });
    this.poi('windmill', 'Kincir Angin Desa', wmx, wmy + 21, wmz, 'landmark', 60, '🌾');
  }

  private addHouse(x: number, z: number, rot: number, wall: number, roof: number, s: number) {
    const y = Math.min(heightAt(x - 4, z - 4), heightAt(x + 4, z + 4), heightAt(x, z)) - 0.3;
    const w = 8 * s, d = 6.5 * s, h = 4 * s, rh = 3 * s;
    const c = Math.cos(rot), si = Math.sin(rot);
    this.parts.push(colored(at(new THREE.BoxGeometry(w, h + 0.6, d), x, y + (h + 0.6) / 2, z, 0, rot), wall, 0.05, 3));
    const roofGeo = new THREE.CylinderGeometry(rh * 1.25, rh * 1.25, w + 1, 3, 1);
    roofGeo.rotateX(-Math.PI / 2);
    roofGeo.rotateY(Math.PI / 2);
    roofGeo.scale(1, 0.85, (d / 2 + 0.6) / (rh * 1.25 * 0.866));
    this.parts.push(colored(at(roofGeo, x, y + h + 0.6 + rh * 0.53, z, 0, rot), roof, 0.08, 4));
    // pintu & jendela (jendela menyala di malam hari)
    const fx = Math.sin(rot), fz = Math.cos(rot); // arah depan lokal +z diputar
    this.parts.push(colored(at(new THREE.BoxGeometry(1.4 * s, 2.4 * s, 0.2), x + fx * (d / 2 + 0.05), y + 1.2 * s + 0.3, z + fz * (d / 2 + 0.05), 0, rot), 0x6b4a32));
    for (const o of [-2.3, 2.3]) {
      this.glow.push(colored(at(new THREE.BoxGeometry(1.2 * s, 1.1 * s, 0.15), x + fx * (d / 2 + 0.06) + c * o * s, y + 2.6 * s, z + fz * (d / 2 + 0.06) - si * o * s, 0, rot), 0xffd27a));
    }
    // cerobong
    this.parts.push(colored(at(new THREE.BoxGeometry(0.9, 2.4, 0.9), x + c * w * 0.28, y + h + rh * 0.9, z - si * w * 0.28), 0x8a6a5a));
    // collider (badan rumah + atap disederhanakan)
    const hw = Math.abs(c) * w / 2 + Math.abs(si) * d / 2, hd = Math.abs(si) * w / 2 + Math.abs(c) * d / 2;
    this.colliders.push({ type: 'box', minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd, minY: y - 2, maxY: y + h + 0.6 + rh * 0.55 });
    const ridgeY = y + h + 0.6 + rh * 1.6 + 0.1;
    for (const o of [-0.3, 0.3]) this.perches.push({ x: x + c * o * w, y: ridgeY, z: z - si * o * w });
    this.houses.push({ x, z, y, rot, door: new THREE.Vector3(x + fx * (d / 2 + 2.5), y + 0.3, z + fz * (d / 2 + 2.5)) });
  }

  update(t: number, dt: number, night: number) {
    this.blades.rotation.z += dt * 0.6;
    this.beam.visible = night > 0.3;
    this.beam.rotation.y = t * 0.6;
    this.glowMat.color.setScalar(0.45 + night * 0.75);
    if (this.crystals) this.crystals.rotation.y = 0;
  }
}
