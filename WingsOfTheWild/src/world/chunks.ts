// Streaming chunk: terrain ber-LOD dibangun di Web Worker, properti di-instancing.
import * as THREE from 'three';
import { CHUNK, CHUNKS_PER_SIDE, chunkOrigin, PROP_TYPES, type PropData, type TerrainData } from './chunkGen';
import { propGeometry } from './models';
import ChunkWorker from './chunkWorker?worker&inline';

export interface Chunk {
  cx: number; cz: number; idx: number;
  centerX: number; centerZ: number;
  mesh: THREE.Mesh | null;
  lod: number; wantedLod: number; pending: boolean;
  props: PropData | null; propsPending: boolean;
}

export interface QualityParams { viewDist: number; propRadius: number; density: number; lodSegs: number[]; shadows: boolean; }

export class ChunkManager {
  readonly chunks: Chunk[] = [];
  readonly group = new THREE.Group();
  readonly propGroup = new THREE.Group();
  private worker: Worker;
  private nextId = 1;
  private callbacks = new Map<number, (d: unknown) => void>();
  private inflight = 0;
  private terrainMat: THREE.MeshLambertMaterial;
  private propMeshes: Record<string, THREE.InstancedMesh> = {};
  private propGeos: Record<string, THREE.BufferGeometry> = {};
  private propMat: THREE.MeshLambertMaterial;
  private activeKey = '';
  private dirtyProps = false;
  private lastPropBuild = 0;
  activeChunks: Chunk[] = [];
  q: QualityParams;
  onPropsChanged: (() => void) | null = null;

  constructor(q: QualityParams) {
    this.q = q;
    this.worker = new ChunkWorker();
    this.worker.onmessage = (ev) => {
      const cb = this.callbacks.get(ev.data.id);
      this.callbacks.delete(ev.data.id);
      this.inflight--;
      cb?.(ev.data.data);
    };
    this.terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    this.propMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
    for (let cz = 0; cz < CHUNKS_PER_SIDE; cz++) for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {
      this.chunks.push({
        cx, cz, idx: cz * CHUNKS_PER_SIDE + cx,
        centerX: chunkOrigin(cx) + CHUNK / 2, centerZ: chunkOrigin(cz) + CHUNK / 2,
        mesh: null, lod: -1, wantedLod: 3, pending: false, props: null, propsPending: false,
      });
    }
    for (const t of PROP_TYPES) this.propGeos[t] = propGeometry(t);
    this.group.add(this.propGroup);
  }

  private request<T>(msg: Record<string, unknown>): Promise<T> {
    const id = this.nextId++;
    this.inflight++;
    return new Promise<T>((res) => {
      this.callbacks.set(id, res as (d: unknown) => void);
      this.worker.postMessage({ id, ...msg });
    });
  }

  requestMap(size: number) { return this.request<Uint8ClampedArray>({ kind: 'map', size }); }

  /** Muat awal: semua chunk LOD terendah agar landmark & cakrawala langsung terlihat. */
  async preload(px: number, pz: number, onProgress: (p: number) => void) {
    let done = 0;
    const total = this.chunks.length;
    const order = [...this.chunks].sort((a, b) => Math.hypot(a.centerX - px, a.centerZ - pz) - Math.hypot(b.centerX - px, b.centerZ - pz));
    const tasks = order.map(async (c) => {
      const lod = this.lodFor(c, px, pz);
      const d = await this.request<TerrainData>({ kind: 'terrain', cx: c.cx, cz: c.cz, segs: this.q.lodSegs[lod] });
      this.applyTerrain(c, d, lod);
      onProgress(++done / total);
    });
    await Promise.all(tasks);
    this.inflight = 0;
  }

  private lodFor(c: Chunk, px: number, pz: number) {
    const d = Math.hypot(c.centerX - px, c.centerZ - pz);
    return d < 330 ? 0 : d < 700 ? 1 : d < 1250 ? 2 : 3;
  }

  private applyTerrain(c: Chunk, d: TerrainData, lod: number) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(d.positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(d.colors, 3));
    g.setIndex(new THREE.BufferAttribute(d.index, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    g.computeBoundingBox();
    if (c.mesh) {
      c.mesh.geometry.dispose();
      c.mesh.geometry = g;
    } else {
      c.mesh = new THREE.Mesh(g, this.terrainMat);
      c.mesh.matrixAutoUpdate = false;
      c.mesh.receiveShadow = true;
      this.group.add(c.mesh);
    }
    c.lod = lod;
    c.pending = false;
  }

  setQuality(q: QualityParams) {
    const lodChanged = q.lodSegs.join() !== this.q.lodSegs.join();
    const densChanged = q.density !== this.q.density;
    this.q = q;
    for (const c of this.chunks) {
      if (lodChanged) c.lod = -1;
      if (densChanged && !c.propsPending) c.props = null;
    }
    this.activeKey = '';
    for (const t in this.propMeshes) this.propMeshes[t].castShadow = q.shadows;
  }

  update(px: number, pz: number, now: number) {
    const viewR = this.q.viewDist + 260;
    let best: Chunk | null = null, bestD = Infinity;
    const active: Chunk[] = [];
    for (const c of this.chunks) {
      const d = Math.hypot(c.centerX - px, c.centerZ - pz);
      if (c.mesh) c.mesh.visible = d < viewR;
      const lod = this.lodFor(c, px, pz);
      c.wantedLod = lod;
      if (c.lod !== lod && !c.pending && d < viewR + 200 && d < bestD) { best = c; bestD = d; }
      if (d < this.q.propRadius + CHUNK * 0.71) active.push(c);
    }
    if (best && this.inflight < 2) {
      const c = best, lod = c.wantedLod;
      c.pending = true;
      this.request<TerrainData>({ kind: 'terrain', cx: c.cx, cz: c.cz, segs: this.q.lodSegs[lod] }).then((d) => this.applyTerrain(c, d, lod));
    }
    for (const c of active) {
      if (!c.props && !c.propsPending && this.inflight < 3) {
        c.propsPending = true;
        const dens = this.q.density;
        this.request<PropData>({ kind: 'props', cx: c.cx, cz: c.cz, density: dens }).then((d) => {
          c.props = d; c.propsPending = false; this.dirtyProps = true;
        });
      }
    }
    const key = active.map((c) => c.idx).join(',');
    if (key !== this.activeKey) { this.activeKey = key; this.dirtyProps = true; }
    this.activeChunks = active;
    if (this.dirtyProps && now - this.lastPropBuild > 0.4) {
      this.dirtyProps = false;
      this.lastPropBuild = now;
      this.rebuildProps();
    }
  }

  private rebuildProps() {
    for (const t of PROP_TYPES) {
      let total = 0;
      for (const c of this.activeChunks) if (c.props) total += c.props.mats[t].length / 16;
      let mesh = this.propMeshes[t];
      if (!mesh || mesh.instanceMatrix.count < total) {
        if (mesh) { this.propGroup.remove(mesh); mesh.dispose(); }
        const cap = Math.max(64, Math.ceil(total * 1.3));
        mesh = new THREE.InstancedMesh(this.propGeos[t], this.propMat, cap);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3);
        mesh.castShadow = this.q.shadows && t !== 'flower' && t !== 'reed';
        mesh.frustumCulled = false;
        this.propMeshes[t] = mesh;
        this.propGroup.add(mesh);
      }
      let o = 0;
      const mArr = mesh.instanceMatrix.array as Float32Array;
      const cArr = mesh.instanceColor!.array as Float32Array;
      for (const c of this.activeChunks) {
        if (!c.props) continue;
        const m = c.props.mats[t], tc = c.props.tints[t];
        mArr.set(m, o * 16);
        cArr.set(tc, o * 3);
        o += m.length / 16;
      }
      mesh.count = o;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
    }
    this.onPropsChanged?.();
  }

  chunkAt(x: number, z: number): Chunk | null {
    const cx = Math.floor((x + 2048) / CHUNK), cz = Math.floor((z + 2048) / CHUNK);
    if (cx < 0 || cz < 0 || cx >= CHUNKS_PER_SIDE || cz >= CHUNKS_PER_SIDE) return null;
    return this.chunks[cz * CHUNKS_PER_SIDE + cx];
  }

  /** Iterasi chunk di sekitar titik (radius dalam meter). */
  forNear(x: number, z: number, r: number, fn: (c: Chunk) => void) {
    const x0 = Math.floor((x - r + 2048) / CHUNK), x1 = Math.floor((x + r + 2048) / CHUNK);
    const z0 = Math.floor((z - r + 2048) / CHUNK), z1 = Math.floor((z + r + 2048) / CHUNK);
    for (let cz = Math.max(0, z0); cz <= Math.min(CHUNKS_PER_SIDE - 1, z1); cz++)
      for (let cx = Math.max(0, x0); cx <= Math.min(CHUNKS_PER_SIDE - 1, x1); cx++) fn(this.chunks[cz * CHUNKS_PER_SIDE + cx]);
  }
}
