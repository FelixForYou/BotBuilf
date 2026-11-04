// Pengendali terbang burung: momentum ringan, meluncur, menukik, mengerem, mendarat, berjalan, bertengger.
import * as THREE from 'three';
import { clamp, damp, lerp, wrapAngle } from '../core/noise';
import type { Input } from '../core/input';
import type { World } from '../world/world';
import type { Species } from '../gameplay/species';
import type { BirdPose } from './birdModel';

export type Mode = 'fly' | 'ground' | 'perch' | 'landing';

export interface PassiveMods { stamina: number; glide: number; agility: number; vision: number; carry: number; }

export class Player {
  pos = new THREE.Vector3(0, 60, 200);
  prev = new THREE.Vector3();
  vel = new THREE.Vector3();
  yaw = 0; pitch = 0; speed = 12; bank = 0;
  mode: Mode = 'fly';
  stamina = 100; maxStamina = 100; exhausted = false;
  health = 100;
  carry = 0;
  dashT = 0; rollT = 0; rollDir = 1; stunT = 0;
  updraftNow = 0; lift = 0;
  flapping = false; gliding = false; diving = false; braking = false;
  relaxed = true;
  staminaMul = 1; // dikali oleh kebutuhan lapar
  private landFrom = new THREE.Vector3();
  private landTo = new THREE.Vector3();
  private landT = 0;
  private landDur = 0.6;
  private flapAnim = 0;
  peck = 0;
  sp!: Species;
  mods: PassiveMods = { stamina: 0, glide: 0, agility: 0, vision: 0, carry: 0 };
  windVel = new THREE.Vector3();
  boundaryWarn = false;
  // callback ke audio/gameplay
  onLand: ((surface: 'ground' | 'perch') => void) | null = null;
  onTakeoff: (() => void) | null = null;
  onSplash: ((speed: number, x: number, y: number, z: number) => void) | null = null;
  onCrash: ((v: number) => void) | null = null;
  onFlap: (() => void) | null = null;
  private flapClock = 0;

  get radius() { return 0.3 * this.sp.size; }
  get forwardDir() { return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  get capacity() { return 2 + this.mods.carry; }
  get cruise() { return 15 * this.sp.speed; }

  setSpecies(sp: Species, mods: PassiveMods) {
    this.sp = sp; this.mods = mods;
    this.maxStamina = sp.stamina * (1 + mods.stamina * 0.2);
    this.stamina = Math.min(this.stamina, this.maxStamina);
  }

  takeoff(boost = 1) {
    if (this.mode === 'fly') return;
    this.mode = 'fly';
    this.speed = 8 * boost;
    this.pitch = 0.6;
    this.pos.y += 0.6;
    this.onTakeoff?.();
  }

  startLanding(x: number, y: number, z: number, perch: boolean) {
    this.mode = 'landing';
    this.landFrom.copy(this.pos);
    this.landTo.set(x, y, z);
    this.landT = 0;
    this.landDur = clamp(this.pos.distanceTo(this.landTo) / 14, 0.35, 1.1);
    this.landPerch = perch;
  }
  private landPerch = false;

  dash() {
    if (this.mode !== 'fly') this.takeoff(1.6);
    this.dashT = 0.55;
    this.speed = Math.max(this.speed, this.cruise) + 18 * (this.sp.id === 'layang' ? 1.3 : 1);
  }
  updraftBoost(power: number) {
    if (this.mode !== 'fly') this.takeoff(1.2);
    this.lift += power;
  }
  roll(dir: number) {
    if (this.mode !== 'fly') return false;
    this.rollT = 0.55; this.rollDir = dir || 1;
    return true;
  }
  get invulnerable() { return this.rollT > 0; }

  useStamina(a: number) {
    this.stamina = Math.max(0, this.stamina - a * (this.relaxed ? 0.45 : 1));
    if (this.stamina <= 0) this.exhausted = true;
  }

  update(dt: number, input: Input, world: World) {
    this.prev.copy(this.pos);
    if (this.stunT > 0) this.stunT -= dt;
    if (this.exhausted && this.stamina > this.maxStamina * 0.25) this.exhausted = false;
    this.dashT = Math.max(0, this.dashT - dt);
    this.rollT = Math.max(0, this.rollT - dt);
    this.peck = Math.max(0, this.peck - dt);
    const agility = this.sp.agility * (1 + this.mods.agility * 0.12);
    const wind = world.sky.windDir, ws = world.sky.windStrength;

    if (this.mode === 'landing') {
      this.landT += dt / this.landDur;
      const t = clamp(this.landT, 0, 1), e = 1 - (1 - t) * (1 - t);
      this.pos.lerpVectors(this.landFrom, this.landTo, e);
      this.pos.y += Math.sin(t * Math.PI) * 1.2;
      const dx = this.landTo.x - this.landFrom.x, dz = this.landTo.z - this.landFrom.z;
      if (Math.hypot(dx, dz) > 0.5) this.yaw = damp(this.yaw, this.yaw + wrapAngle(Math.atan2(dx, dz) - this.yaw), 6, dt);
      this.speed = damp(this.speed, 0, 6, dt);
      if (t >= 1) {
        this.mode = this.landPerch ? 'perch' : 'ground';
        this.speed = 0;
        this.onLand?.(this.landPerch ? 'perch' : 'ground');
      }
      return;
    }

    if (this.mode === 'ground' || this.mode === 'perch') {
      this.yaw -= input.mouseYaw + input.turn * 2.4 * dt;
      this.stamina = Math.min(this.maxStamina, this.stamina + (this.mode === 'perch' ? 28 : 18) * dt * this.staminaMul);
      if (input.ascend && this.stunT <= 0) { this.takeoff(); this.useStamina(4); return; }
      if (this.mode === 'perch') {
        if (input.forward > 0.5) { this.takeoff(1.3); return; }
        return;
      }
      // berjalan / melompat kecil
      const f = this.forwardDir;
      const sp = input.forward * 2.6;
      if (Math.abs(sp) > 0.05) {
        const nx = this.pos.x + f.x * sp * dt, nz = this.pos.z + f.z * sp * dt;
        const ny = world.surfaceAt(nx, nz, this.pos.y + 0.5);
        const wy = world.waterAt(nx, nz);
        if (ny - this.pos.y < 0.8 && wy < ny + 0.15) { this.pos.x = nx; this.pos.z = nz; this.pos.y = ny; }
        else if (ny - this.pos.y < -2) { this.mode = 'fly'; this.speed = 5; this.pitch = -0.2; }
      } else {
        this.pos.y = world.surfaceAt(this.pos.x, this.pos.z, this.pos.y + 0.5);
      }
      this.speed = Math.abs(sp);
      return;
    }

    // ---------------- TERBANG ----------------
    const canFlap = !this.exhausted && this.stamina > 0 && this.stunT <= 0;
    const steer = clamp(input.mouseYaw, -0.08, 0.08) / Math.max(dt, 0.001) / 2.2 + input.turn;
    const speedFactor = 1 - clamp((this.speed - 22) / 60, 0, 0.4);
    const turnRate = 1.75 * agility * speedFactor;
    const steerC = clamp(steer, -1.4, 1.4);
    this.yaw = wrapAngle(this.yaw - steerC * turnRate * dt); // kanan = yaw berkurang
    this.bank = damp(this.bank, steerC * 0.75, 6, dt);

    this.diving = input.descend;
    this.braking = input.forward < -0.2;
    this.flapping = input.ascend && canFlap;
    this.gliding = input.glide && !this.flapping && !this.diving;
    const forwardFlap = input.forward > 0.2 && canFlap && !this.diving;
    const glideEff = this.sp.glide * (1 + this.mods.glide * 0.15);

    let targetPitch = -0.07;
    if (this.diving) targetPitch = -1.0;
    else if (this.flapping) targetPitch = 0.32 + clamp((this.speed - this.cruise) / 45, 0, 0.45);
    else if (this.braking) targetPitch = 0.18;
    else if (this.gliding) targetPitch = -0.035;
    if (this.speed < 6 && !this.flapping) targetPitch = -0.45; // stall
    this.pitch = damp(this.pitch, targetPitch, this.diving ? 3 : 3.5, dt);

    const g = 11.5;
    this.speed += -g * Math.sin(this.pitch) * dt;
    let drag = 0.35;
    if (this.diving) drag = 0.06 / this.sp.dive;
    else if (this.braking) drag = 1.6;
    else if (this.gliding) drag = 0.22;
    const maxFlap = 21 * this.sp.speed;
    if (this.flapping) {
      this.speed += 8.5 * dt * (this.speed < maxFlap ? 1 : 0);
      this.useStamina(10 * dt);
    }
    if (forwardFlap) {
      this.speed += 7 * input.forward * dt * (this.speed < maxFlap ? 1 : 0);
      if (!this.flapping) this.useStamina(4 * dt);
    }
    const restSpeed = this.braking ? 4 : this.cruise * (this.gliding ? 0.9 : 1);
    if (this.speed > restSpeed || this.braking) this.speed -= (this.speed - restSpeed) * drag * dt;
    else if (!this.diving) this.speed += (restSpeed - this.speed) * 0.25 * dt; // peluncur kembali ke kecepatan jelajah
    if (this.dashT > 0) this.speed = Math.max(this.speed, this.cruise + 14);
    this.speed = clamp(this.speed, 2.5, 52 * this.sp.dive);

    // gaya angkat & arus udara
    const sink = this.gliding ? 0.9 / glideEff : this.braking ? 3.4 : 2.0 / glideEff;
    this.updraftNow = world.updraftAt(this.pos.x, this.pos.y, this.pos.z) * (this.sp.id === 'camar' ? 1.35 : 1) * (this.gliding ? 1.25 : 1);
    let vy = this.flapping ? 4.2 : -sink;
    if (this.pos.y > 650) vy = Math.min(vy, -0.5); // udara tipis
    this.lift = damp(this.lift, 0, 2.2, dt);
    vy += this.updraftNow + this.lift;
    if (!this.flapping && !this.diving) {
      // regenerasi stamina saat meluncur
      this.stamina = Math.min(this.maxStamina, this.stamina + (this.gliding ? 7 : 4) * dt * this.staminaMul);
    }

    const cp = Math.cos(this.pitch);
    this.vel.set(Math.sin(this.yaw) * cp * this.speed, Math.sin(this.pitch) * this.speed + vy, Math.cos(this.yaw) * cp * this.speed);
    // angin mendorong burung — terbang searah angin terasa lebih cepat
    this.windVel.set(wind.x * ws * 0.6, 0, wind.y * ws * 0.6);
    this.vel.add(this.windVel);
    if (this.rollT > 0) {
      const side = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      this.vel.addScaledVector(side, -this.rollDir * 16 * (this.rollT / 0.55));
    }
    // batas dunia
    this.boundaryWarn = world.outOfBounds(this.pos.x, this.pos.z);
    if (this.boundaryWarn) {
      const back = new THREE.Vector3(-this.pos.x, 0, -this.pos.z).normalize();
      this.vel.addScaledVector(back, 14);
      this.yaw = damp(this.yaw, this.yaw + wrapAngle(Math.atan2(back.x, back.z) - this.yaw), 0.8, dt);
    }
    this.pos.addScaledVector(this.vel, dt);

    // kepakan untuk audio
    this.flapClock += dt * (this.flapping ? 5 : forwardFlap ? 3 : 0);
    if (this.flapClock > 1) { this.flapClock -= 1; this.onFlap?.(); }
    this.flapAnim = this.flapping ? 1 : forwardFlap ? 0.6 : 0;

    // ---------- tabrakan ----------
    const r = this.radius;
    const water = world.waterAt(this.pos.x, this.pos.z);
    const ground = world.height(this.pos.x, this.pos.z);
    if (water > ground && this.pos.y < water + r) {
      const vSpeed = -this.vel.y;
      this.onSplash?.(vSpeed, this.pos.x, water, this.pos.z);
      this.pos.y = water + r + 0.05;
      if (this.pitch < 0) this.pitch = 0.25;
      this.speed *= 0.85;
      this.lift += 3;
      return;
    }
    if (this.pos.y < ground + r) {
      this.pos.y = ground + r;
      const impact = -this.vel.y;
      if (this.speed < 17 || this.braking) { this.mode = 'ground'; this.speed = 0; this.pos.y = ground; this.onLand?.('ground'); return; }
      this.pitch = Math.max(this.pitch, 0.3);
      this.speed *= 0.75;
      if (impact > 14) { this.onCrash?.(impact); this.stunT = 0.6; }
    }
    const c = world.collide(this.pos, this.prev, r);
    if (c.hit) {
      if (c.ground && (this.speed < 17 || this.braking)) {
        this.pos.y -= r;
        this.mode = 'perch'; this.speed = 0;
        this.onLand?.('perch');
        return;
      }
      if (!c.ground) {
        const into = this.vel.dot(c.normal);
        if (into < -12) { this.onCrash?.(-into); this.stunT = 0.5; }
        this.speed *= 0.7;
        // belokkan menjauh dari dinding
        const away = Math.atan2(c.normal.x, c.normal.z);
        this.yaw = damp(this.yaw, this.yaw + wrapAngle(away - this.yaw), 4, dt);
      } else this.pitch = Math.max(this.pitch, 0.2);
    }
  }

  /** Pose untuk animasi model. */
  pose(): BirdPose {
    const flying = this.mode === 'fly' || this.mode === 'landing';
    const landing = this.mode === 'landing';
    return {
      mode: flying ? 'fly' : this.mode === 'perch' ? 'perch' : 'ground',
      flap: landing ? 0.5 : this.dashT > 0 ? 1 : this.flapAnim,
      flapSpeed: landing ? 5 : this.dashT > 0 ? 6 : this.flapping ? 4.2 : 3,
      fold: this.diving ? clamp((this.speed - 12) / 20, 0.3, 1) : this.dashT > 0 ? 0.4 : 0,
      flare: landing ? 1 : this.braking ? 0.8 : 0,
      bank: this.bank,
      walk: this.mode === 'ground' ? clamp(this.speed / 2.6, 0, 1) : 0,
      peck: this.peck > 0 ? Math.abs(Math.sin(this.peck * 12)) : 0,
      roll: this.rollT > 0 ? (1 - this.rollT / 0.55) * Math.PI * 2 * this.rollDir : 0,
      carry: this.carry,
    };
  }

  /** Untuk visual: pitch model mengikuti arah gerak. */
  get visualPitch() { return this.mode === 'fly' ? -this.pitch * 0.9 + (this.flapping ? -0.1 : 0) : 0; }
  get altitude() { return this.pos.y; }
}

export const lerpAngle = (a: number, b: number, t: number) => a + wrapAngle(b - a) * t;
export { lerp };
