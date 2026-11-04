// Laut, danau, sungai & air terjun — satu material ringan dengan gelombang di vertex shader.
import * as THREE from 'three';
import { LAKE, RIVER } from './terrain';

export class Water {
  readonly group = new THREE.Group();
  readonly uniforms = { uTime: { value: 0 } };
  private sea: THREE.Mesh;
  private foamMat: THREE.MeshBasicMaterial;
  readonly falls: THREE.Vector3[] = [];

  constructor() {
    const mat = new THREE.MeshPhongMaterial({ color: 0x2f8fb0, shininess: 70, specular: 0x9fd6e8, transparent: true, opacity: 0.84, flatShading: true });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.uniforms.uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 wp = modelMatrix * vec4(position, 1.0);
        transformed.y += sin(wp.x * 0.07 + uTime * 1.3) * 0.25 + cos(wp.z * 0.09 + uTime * 1.1) * 0.25;`,
      );
    };
    // Laut: grid yang mengikuti pemain
    const seaGeo = new THREE.PlaneGeometry(9000, 9000, 90, 90);
    seaGeo.rotateX(-Math.PI / 2);
    this.sea = new THREE.Mesh(seaGeo, mat);
    this.sea.position.y = 0;
    this.group.add(this.sea);
    // Danau
    const lakeGeo = new THREE.CircleGeometry(LAKE.r * 1.6, 40);
    lakeGeo.rotateX(-Math.PI / 2);
    const lake = new THREE.Mesh(lakeGeo, mat);
    lake.position.set(LAKE.x, LAKE.level, LAKE.z);
    this.group.add(lake);
    // Sungai: pita mengikuti jalur
    const riverMat = mat.clone();
    riverMat.color.set(0x3c9cc0);
    riverMat.onBeforeCompile = mat.onBeforeCompile;
    this.foamMat = new THREE.MeshBasicMaterial({ color: 0xf2fbff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    for (const path of RIVER) {
      const pos: number[] = [], idx: number[] = [];
      for (let i = 0; i < path.length; i++) {
        const p = path[i], q = path[Math.min(path.length - 1, i + 1)], o = path[Math.max(0, i - 1)];
        let dx = q.x - o.x, dz = q.z - o.z;
        const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        const w = p.w * 1.25;
        pos.push(p.x - dz * w, p.h - 0.15, p.z + dx * w, p.x + dz * w, p.h - 0.15, p.z - dx * w);
        if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
        // Air terjun: segmen yang sangat curam
        if (i > 0) {
          const pr = path[i - 1];
          const slope = (pr.h - p.h) / Math.hypot(p.x - pr.x, p.z - pr.z);
          if (slope > 0.9) this.addFoam(pr, p);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, riverMat);
      this.group.add(m);
    }
  }

  private addFoam(a: { x: number; z: number; h: number; w: number }, b: { x: number; z: number; h: number; w: number }) {
    const w = a.w * 2.2;
    const g = new THREE.PlaneGeometry(w, Math.max(2, a.h - b.h + 1.5), 3, 4);
    const m = new THREE.Mesh(g, this.foamMat);
    m.position.set((a.x + b.x) / 2, (a.h + b.h) / 2, (a.z + b.z) / 2);
    m.lookAt(b.x + (b.x - a.x) * 5, (a.h + b.h) / 2, b.z + (b.z - a.z) * 5);
    this.group.add(m);
    this.falls.push(new THREE.Vector3(b.x, b.h, b.z));
  }

  update(t: number, px: number, pz: number) {
    this.uniforms.uTime.value = t;
    this.sea.position.x = Math.round(px / 100) * 100;
    this.sea.position.z = Math.round(pz / 100) * 100;
    this.foamMat.opacity = 0.65 + Math.sin(t * 8) * 0.08;
  }
}
