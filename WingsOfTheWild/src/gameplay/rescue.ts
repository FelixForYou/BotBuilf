// Menolong burung kecil yang tersesat: temukan, ajak ikut (E / Flock Call), antar ke kawanannya.
import * as THREE from 'three';
import { heightAt } from '../world/terrain';
import { BirdModel } from '../player/birdModel';
import { SPECIES } from './species';
import type { Player } from '../player/player';

export interface Chick { id: string; name: string; spot: THREE.Vector3; home: THREE.Vector3; homeName: string; model: BirdModel | null; pos: THREE.Vector3; state: 'lost' | 'follow' | 'home'; t: number; yaw: number; }

const DEFS: Array<[string, string, number, number, number, number, string]> = [
  ['c1', 'Anak pipit', -320, -40, 40, 300, 'Padang Bunga'],
  ['c2', 'Anak layang-layang', 620, -560, VILLAGE_X(), 120, 'Desa Lembah'],
  ['c3', 'Anak camar', -420, 1300, 1450, 1300, 'Pulau Mercusuar'],
  ['c4', 'Anak burung hutan', -1300, 200, -760, 300, 'Reruntuhan Kuno'],
  ['c5', 'Anak burung gunung', 300, -1000, 250, -400, 'Danau Cermin'],
];
function VILLAGE_X() { return 880; }

export class Rescue {
  readonly group = new THREE.Group();
  chicks: Chick[] = [];
  onPeep: (() => void) | null = null;
  onRescued: ((c: Chick) => void) | null = null;
  onJoin: ((c: Chick) => void) | null = null;
  private peepT = 0;

  constructor(rescued: Set<string>) {
    for (const [id, name, sx, sz, hx, hz, homeName] of DEFS) {
      const spot = new THREE.Vector3(sx, heightAt(sx, sz), sz);
      const home = new THREE.Vector3(hx, Math.max(heightAt(hx, hz), 0) + 2, hz);
      const st = rescued.has(id) ? 'home' : 'lost';
      this.chicks.push({ id, name, spot, home, homeName, model: null, pos: spot.clone(), state: st, t: 0, yaw: 0 });
    }
  }

  get following() { return this.chicks.filter((c) => c.state === 'follow'); }
  get lostCount() { return this.chicks.filter((c) => c.state !== 'home').length; }

  nearLost(p: THREE.Vector3, r: number) { return this.chicks.find((c) => c.state === 'lost' && c.pos.distanceTo(p) < r) ?? null; }

  join(c: Chick) { c.state = 'follow'; this.onJoin?.(c); }
  callAll(p: THREE.Vector3, r: number) {
    let n = 0;
    for (const c of this.chicks) if (c.state === 'lost' && c.pos.distanceTo(p) < r) { this.join(c); n++; }
    return n;
  }

  update(dt: number, t: number, player: Player) {
    const P = player.pos;
    this.peepT -= dt;
    for (const c of this.chicks) {
      const near = c.pos.distanceTo(P) < 220;
      if (c.state === 'home' && !c.model) continue;
      if (near && !c.model && c.state !== 'home') {
        const sp = SPECIES[0];
        c.model = new BirdModel(sp, { body: '#c9a47a', wing: '#8a6a4a', belly: '#f6ead2', beak: '#e8a838' });
        c.model.root.scale.setScalar(0.55);
        this.group.add(c.model.root);
      } else if (!near && c.model && c.state !== 'follow') {
        this.group.remove(c.model.root); c.model = null;
      }
      if (c.state === 'lost') {
        if (c.pos.distanceTo(P) < 60 && this.peepT <= 0) { this.peepT = 2.5; this.onPeep?.(); }
      } else if (c.state === 'follow') {
        const fw = player.forwardDir;
        const tgt = new THREE.Vector3(P.x - fw.x * 3 + Math.sin(t * 2) * 0.6, P.y + 0.8, P.z - fw.z * 3);
        if (player.mode !== 'fly') tgt.y = P.y + 0.2;
        const d = tgt.distanceTo(c.pos);
        c.pos.lerp(tgt, 1 - Math.exp(-dt * (d > 30 ? 6 : 3)));
        const g = heightAt(c.pos.x, c.pos.z);
        if (c.pos.y < g) c.pos.y = g;
        if (d > 0.3) c.yaw = Math.atan2(tgt.x - c.pos.x, tgt.z - c.pos.z);
        if (Math.hypot(c.pos.x - c.home.x, c.pos.z - c.home.z) < 30) {
          c.state = 'home'; c.t = 4;
          this.onRescued?.(c);
        }
      } else if (c.state === 'home' && c.model) {
        c.t -= dt;
        c.pos.y += dt * 6; c.pos.x += Math.sin(c.yaw) * dt * 8; c.pos.z += Math.cos(c.yaw) * dt * 8;
        if (c.t <= 0) { this.group.remove(c.model.root); c.model = null; }
      }
      if (c.model) {
        const flying = c.state !== 'lost' && (player.mode === 'fly' || c.state === 'home');
        c.model.root.position.copy(c.pos);
        if (!flying) c.model.root.position.y += 0.25;
        c.model.root.rotation.set(0, c.yaw + (c.state === 'lost' ? Math.sin(t * 0.7) * 0.8 : 0), 0);
        c.model.animate({ mode: flying ? 'fly' : 'ground', flap: flying ? 1 : 0, flapSpeed: 7, fold: 0, flare: 0, bank: 0, walk: 0, peck: c.state === 'lost' ? Math.max(0, Math.sin(t * 3)) * 0.4 : 0, roll: 0, carry: 0 }, dt);
      }
    }
  }
}
