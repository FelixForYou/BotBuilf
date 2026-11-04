// Model sederhana untuk NPC (manusia & hewan).
import * as THREE from 'three';
import { colored, at, merge } from '../world/models';

export const npcMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

export interface HumanModel { root: THREE.Group; legL: THREE.Mesh; legR: THREE.Mesh; armL: THREE.Mesh; armR: THREE.Mesh; body: THREE.Group; }
export function makeHuman(shirt: number, pants: number, skin: number, hat: boolean): HumanModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const torso = new THREE.Mesh(merge([
    colored(at(new THREE.CylinderGeometry(0.28, 0.32, 0.75, 6), 0, 1.15, 0), shirt),
    colored(at(new THREE.IcosahedronGeometry(0.22, 1), 0, 1.75, 0), skin),
    ...(hat ? [colored(at(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8), 0, 1.92, 0), 0xc9a44a), colored(at(new THREE.CylinderGeometry(0.18, 0.22, 0.2, 8), 0, 2.02, 0), 0xc9a44a)] : [colored(at(new THREE.IcosahedronGeometry(0.2, 0), 0, 1.86, -0.04, 0, 0, 0, [1.1, 0.6, 1.1]), 0x3a2a20)]),
  ]), npcMat);
  body.add(torso);
  const limb = (c: number, len: number, r: number) => {
    const g = colored(new THREE.CylinderGeometry(r, r * 0.9, len, 5), c);
    g.translate(0, -len / 2, 0);
    return new THREE.Mesh(g, npcMat);
  };
  const legL = limb(pants, 0.8, 0.11), legR = limb(pants, 0.8, 0.11);
  legL.position.set(-0.13, 0.8, 0); legR.position.set(0.13, 0.8, 0);
  const armL = limb(shirt, 0.65, 0.08), armR = limb(shirt, 0.65, 0.08);
  armL.position.set(-0.36, 1.48, 0); armR.position.set(0.36, 1.48, 0);
  body.add(legL, legR, armL, armR);
  return { root, legL, legR, armL, armR, body };
}

export function makeRabbit(): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge([
    colored(at(new THREE.IcosahedronGeometry(0.28, 0), 0, 0.28, 0, 0, 0, 0, [0.9, 0.85, 1.3]), 0xb89a7a),
    colored(at(new THREE.IcosahedronGeometry(0.17, 0), 0, 0.5, 0.3), 0xb89a7a),
    colored(at(new THREE.BoxGeometry(0.06, 0.3, 0.1), -0.07, 0.75, 0.27, -0.2), 0xd8bfa5),
    colored(at(new THREE.BoxGeometry(0.06, 0.3, 0.1), 0.07, 0.75, 0.27, -0.2), 0xd8bfa5),
    colored(at(new THREE.IcosahedronGeometry(0.09, 0), 0, 0.33, -0.36), 0xffffff),
  ]), npcMat));
  return g;
}

export function makeDeer(antlers: boolean): THREE.Group {
  const g = new THREE.Group();
  const parts = [
    colored(at(new THREE.BoxGeometry(0.55, 0.6, 1.4), 0, 1.25, 0), 0xa0703f),
    colored(at(new THREE.BoxGeometry(0.25, 0.7, 0.3), 0, 1.7, 0.7, -0.5), 0xa0703f),
    colored(at(new THREE.BoxGeometry(0.28, 0.3, 0.5), 0, 2.05, 0.95), 0x8f6236),
    colored(at(new THREE.IcosahedronGeometry(0.12, 0), 0, 1.4, -0.75), 0xf2e6d6),
  ];
  for (const [x, z] of [[-0.2, 0.55], [0.2, 0.55], [-0.2, -0.55], [0.2, -0.55]]) parts.push(colored(at(new THREE.CylinderGeometry(0.06, 0.05, 1, 4), x, 0.5, z), 0x6b4a2e));
  if (antlers) for (const s of [-1, 1]) {
    parts.push(colored(at(new THREE.CylinderGeometry(0.03, 0.04, 0.6, 3), s * 0.15, 2.45, 0.9, 0, 0, -s * 0.4), 0xd9c7a2));
    parts.push(colored(at(new THREE.CylinderGeometry(0.025, 0.03, 0.35, 3), s * 0.3, 2.55, 1.0, 0.5, 0, -s * 0.9), 0xd9c7a2));
  }
  g.add(new THREE.Mesh(merge(parts), npcMat));
  return g;
}

export function makeCat(color: number): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge([
    colored(at(new THREE.BoxGeometry(0.3, 0.3, 0.7), 0, 0.38, 0), color),
    colored(at(new THREE.BoxGeometry(0.28, 0.26, 0.26), 0, 0.6, 0.42), color),
    colored(at(new THREE.ConeGeometry(0.06, 0.14, 3), -0.09, 0.79, 0.42), color),
    colored(at(new THREE.ConeGeometry(0.06, 0.14, 3), 0.09, 0.79, 0.42), color),
    colored(at(new THREE.CylinderGeometry(0.04, 0.03, 0.6, 4), 0, 0.6, -0.5, -0.8), color),
    ...[[-0.1, 0.25], [0.1, 0.25], [-0.1, -0.25], [0.1, -0.25]].map(([x, z]) => colored(at(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 4), x, 0.14, z), color)),
  ]), npcMat));
  return g;
}

/** Geometri burung NPC: badan & sayap terpisah agar bisa dianimasikan lewat instancing. */
export function npcBirdBody() {
  return merge([
    colored(at(new THREE.IcosahedronGeometry(0.3, 0), 0, 0, 0, 0, 0, 0, [0.8, 0.75, 1.5]), 0xffffff),
    colored(at(new THREE.IcosahedronGeometry(0.17, 0), 0, 0.12, 0.38), 0xffffff),
    colored(at(new THREE.ConeGeometry(0.05, 0.16, 3), 0, 0.1, 0.58, Math.PI / 2), 0xf2b33d),
    colored(at(new THREE.ConeGeometry(0.16, 0.4, 3), 0, 0.02, -0.5, -Math.PI / 2, 0, 0, [1, 1, 0.3]), 0xdddddd),
  ]);
}
export function npcBirdWing() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.15); s.lineTo(0.9, -0.05); s.lineTo(0.6, -0.22); s.lineTo(0, -0.22);
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(Math.PI / 2);
  return colored(g, 0xdddddd);
}
