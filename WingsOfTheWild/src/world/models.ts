// Model low-poly prosedural (tanpa aset eksternal).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../core/noise';

export function colored(geo: THREE.BufferGeometry, color: number | THREE.Color, jitter = 0, seed = 1): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute('uv');
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  const c = new THREE.Color(color);
  const n = g.getAttribute('position').count;
  const arr = new Float32Array(n * 3);
  const rand = mulberry32(seed);
  for (let f = 0; f < n; f += 3) {
    const j = 1 + (rand() - 0.5) * jitter;
    for (let v = 0; v < 3; v++) { arr[(f + v) * 3] = c.r * j; arr[(f + v) * 3 + 1] = c.g * j; arr[(f + v) * 3 + 2] = c.b * j; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

export function at(g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s: number | [number, number, number] = 1) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    Array.isArray(s) ? new THREE.Vector3(...s) : new THREE.Vector3(s, s, s),
  );
  g.applyMatrix4(m);
  return g;
}

export const merge = (gs: THREE.BufferGeometry[]) => mergeGeometries(gs, false)!;

function jitterVerts(g: THREE.BufferGeometry, amt: number, seed: number) {
  const p = g.getAttribute('position');
  const rand = mulberry32(seed);
  // geser vertex dengan kunci posisi agar tetap tertutup
  const map = new Map<string, [number, number, number]>();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    let o = map.get(k);
    if (!o) map.set(k, (o = [(rand() - 0.5) * amt, (rand() - 0.5) * amt, (rand() - 0.5) * amt]));
    p.setXYZ(i, p.getX(i) + o[0], p.getY(i) + o[1], p.getZ(i) + o[2]);
  }
  g.computeVertexNormals();
  return g;
}

export function rockGeo(seed = 3) {
  return colored(jitterVerts(new THREE.IcosahedronGeometry(1, 0), 0.35, seed), 0x8a8790, 0.18, seed);
}

export function propGeometry(type: string): THREE.BufferGeometry {
  switch (type) {
    case 'pine':
    case 'snowpine': {
      const leaf = type === 'snowpine' ? 0x3f6b55 : 0x2f6e46;
      const parts = [colored(at(new THREE.CylinderGeometry(0.25, 0.4, 3, 5), 0, 1.5, 0), 0x6b4a32)];
      parts.push(colored(at(new THREE.ConeGeometry(3.2, 5, 7), 0, 4.5, 0), leaf, 0.15, 2));
      parts.push(colored(at(new THREE.ConeGeometry(2.4, 4.2, 7), 0, 7.2, 0, 0, 0.4), leaf, 0.15, 3));
      parts.push(colored(at(new THREE.ConeGeometry(1.5, 3.4, 6), 0, 9.6, 0, 0, 0.8), type === 'snowpine' ? 0xeef3f7 : leaf, 0.12, 4));
      return merge(parts);
    }
    case 'tree':
    case 'fruit': {
      const parts = [colored(at(new THREE.CylinderGeometry(0.3, 0.5, 4, 6), 0, 2, 0), 0x775235)];
      const leaf = type === 'fruit' ? 0x4f8f3a : 0x5c9a3c;
      parts.push(colored(jitterVerts(at(new THREE.IcosahedronGeometry(3, 0), 0, 5.6, 0, 0, 0, 0, [1, 0.8, 1]), 0.6, 9), leaf, 0.2, 5));
      parts.push(colored(jitterVerts(at(new THREE.IcosahedronGeometry(2, 0), 1.6, 4.6, 1, 0.5), 0.4, 10), leaf, 0.2, 6));
      if (type === 'fruit') {
        for (let i = 0; i < 6; i++) {
          const a = i * 1.1;
          parts.push(colored(at(new THREE.OctahedronGeometry(0.35, 0), Math.cos(a) * 2.6, 4.6 + (i % 3) * 0.7, Math.sin(a) * 2.6), 0xf08a2c));
        }
      }
      return merge(parts);
    }
    case 'palm': {
      const parts: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 4; i++) parts.push(colored(at(new THREE.CylinderGeometry(0.28 - i * 0.03, 0.34 - i * 0.03, 2.4, 6), i * 0.25, 1.2 + i * 2.3, 0, 0, 0, -0.08), 0x8c6b47));
      for (let i = 0; i < 6; i++) {
        const leaf = at(new THREE.ConeGeometry(0.8, 4.5, 3), 0, 0, 0, Math.PI / 2 + 0.4, 0, 0, [1, 1, 0.25]);
        at(leaf, 0, 0, 2.2);
        parts.push(colored(at(leaf, 0.9, 9.4, 0, 0, (i / 6) * Math.PI * 2), 0x4c9a45, 0.15, i));
      }
      return merge(parts);
    }
    case 'bush': {
      const parts = [colored(jitterVerts(at(new THREE.IcosahedronGeometry(1.2, 0), 0, 0.9, 0, 0, 0, 0, [1.2, 0.8, 1.2]), 0.3, 4), 0x3f7f3a, 0.2, 7)];
      for (let i = 0; i < 5; i++) parts.push(colored(at(new THREE.OctahedronGeometry(0.18, 0), Math.cos(i * 1.3) * 1.2, 1.1 + (i % 2) * 0.3, Math.sin(i * 1.3) * 1.1), 0xc8324b));
      return merge(parts);
    }
    case 'rock':
      return rockGeo(5);
    case 'flower': {
      // ringan: 4 bunga, tiap bunga = 1 segitiga batang + 2 segitiga kelopak
      const parts: THREE.BufferGeometry[] = [];
      const cols = [0xf4a3c4, 0xfde26a, 0xffffff, 0xc59cf4, 0xff8a5c];
      for (let i = 0; i < 4; i++) {
        const x = Math.cos(i * 2.4) * 0.6, z = Math.sin(i * 2.4) * 0.6;
        parts.push(colored(at(new THREE.CircleGeometry(0.05, 1), x, 0.3, z, 0, i, 0, [1, 6, 1]), 0x4f8a33));
        parts.push(colored(at(new THREE.CircleGeometry(0.2, 4), x, 0.62, z, -Math.PI / 2 + 0.3, i * 0.8, 0), cols[i]));
      }
      return merge(parts.map((g) => { g.deleteAttribute('normal'); g.computeVertexNormals(); return g; }));
    }
    case 'reed': {
      const parts: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 6; i++) {
        const x = Math.cos(i * 2.1) * 0.5, z = Math.sin(i * 2.1) * 0.5;
        parts.push(colored(at(new THREE.ConeGeometry(0.06, 2.2, 3), x, 1.1, z, (i - 3) * 0.06, 0, (i % 2 - 0.5) * 0.15), 0x7a9a45));
        if (i % 2 === 0) parts.push(colored(at(new THREE.CylinderGeometry(0.09, 0.09, 0.45, 4), x, 1.9, z), 0x6b4a2e));
      }
      return merge(parts);
    }
  }
  return colored(new THREE.BoxGeometry(1, 1, 1), 0xff00ff);
}

export function pickupGeometry(kind: string): THREE.BufferGeometry {
  switch (kind) {
    case 'seed': return merge([0, 1, 2].map((i) => colored(at(new THREE.OctahedronGeometry(0.16, 0), (i - 1) * 0.3, 0.12, (i % 2) * 0.2, 0, 0, 0, [1, 0.6, 1]), 0xe6c26e)));
    case 'berry': return merge([0, 1, 2].map((i) => colored(at(new THREE.IcosahedronGeometry(0.17, 0), (i - 1) * 0.25, 0.18, (i % 2) * 0.2), 0xd2304a)));
    case 'fruit': return merge([colored(at(new THREE.IcosahedronGeometry(0.35, 0), 0, 0.35, 0), 0xf08a2c), colored(at(new THREE.ConeGeometry(0.1, 0.3, 3), 0, 0.75, 0), 0x3f7f3a)]);
    case 'insect': return merge([colored(at(new THREE.OctahedronGeometry(0.12, 0), 0, 0, 0), 0x2b2b2b), colored(at(new THREE.PlaneGeometry(0.4, 0.25), 0.2, 0.05, 0, -Math.PI / 2), 0xffe27a), colored(at(new THREE.PlaneGeometry(0.4, 0.25), -0.2, 0.05, 0, -Math.PI / 2), 0xffe27a)]);
    case 'twig': return merge([colored(at(new THREE.CylinderGeometry(0.05, 0.06, 1.4, 4), 0, 0.06, 0, 0, 0, Math.PI / 2), 0x8a5f3a), colored(at(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 4), 0.2, 0.15, 0.15, 0.3, 0.6, Math.PI / 2.6), 0x8a5f3a)]);
    case 'crumb': return merge([0, 1, 2, 3].map((i) => colored(at(new THREE.BoxGeometry(0.14, 0.1, 0.14), Math.cos(i * 1.7) * 0.35, 0.05, Math.sin(i * 1.7) * 0.35, 0, i), 0xd9b27c)));
  }
  return new THREE.BoxGeometry(0.3, 0.3, 0.3);
}
