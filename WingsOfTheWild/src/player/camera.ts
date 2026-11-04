// Kamera orang ketiga yang halus, tidak menembus tanah/objek, dengan mode foto.
import * as THREE from 'three';
import { clamp, damp, dampAngle } from '../core/noise';
import type { Player } from './player';
import type { World } from '../world/world';
import type { Input } from '../core/input';

export class FollowCamera {
  readonly cam: THREE.PerspectiveCamera;
  private yaw = 0;
  private pitch = 0.22;
  private orbitYaw = 0;
  private orbitPitch = 0;
  private idle = 0;
  private dist = 7;
  private target = new THREE.Vector3();
  private desired = new THREE.Vector3();
  photo = false;
  photoDist = 8;
  shake = 0;

  constructor(aspect: number) {
    this.cam = new THREE.PerspectiveCamera(65, aspect, 0.2, 2000);
  }

  snap(p: Player) {
    this.yaw = p.yaw;
    this.update(p, null, null, 1);
  }

  update(p: Player, world: World | null, input: Input | null, dt: number) {
    const size = p.sp?.size ?? 1;
    if (input) {
      const flying = p.mode === 'fly';
      this.orbitYaw += input.camDX + (this.photo ? input.mouseYaw : 0);
      this.orbitPitch = clamp(this.orbitPitch + input.camDY, -0.55, 1.1);
      if (Math.abs(input.camDX) + Math.abs(input.camDY) > 0.0001) this.idle = 0;
      else this.idle += dt;
      if (this.idle > (flying ? 1.2 : 4) && !this.photo) {
        this.orbitYaw = damp(this.orbitYaw, 0, 2, dt);
        this.orbitPitch = damp(this.orbitPitch, 0, 1.5, dt);
      }
    }
    this.yaw = dampAngle(this.yaw, p.yaw, p.mode === 'fly' ? 4.5 : 3, dt);
    const basePitch = p.mode === 'fly' ? 0.2 + clamp(-p.pitch * 0.35, -0.1, 0.35) : 0.3;
    this.pitch = damp(this.pitch, basePitch, 3, dt);
    const yaw = this.yaw + this.orbitYaw + Math.PI;
    const pitch = clamp(this.pitch + this.orbitPitch, -0.45, 1.35);
    const speed = p.mode === 'fly' ? p.speed : 0;
    const wantDist = this.photo ? this.photoDist : (p.mode === 'fly' ? 6.2 + speed * 0.07 : 4.2) * Math.max(0.8, size);
    this.dist = damp(this.dist, wantDist, 3, dt);
    const fwd = p.mode === 'fly' ? 1.5 : 0.3;
    this.target.set(p.pos.x + Math.sin(p.yaw) * fwd, p.pos.y + (p.mode === 'fly' ? 0.7 : 0.9) * size, p.pos.z + Math.cos(p.yaw) * fwd);
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    // tabrakan kamera: perpendek jarak bila terhalang
    let d = this.dist;
    if (world) {
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const t = (i / steps) * this.dist;
        const x = this.target.x + dir.x * t, y = this.target.y + dir.y * t, z = this.target.z + dir.z * t;
        if (world.solidAt(x, y, z)) { d = Math.max(0.8, t - 0.8); break; }
      }
    }
    this.desired.copy(this.target).addScaledVector(dir, d);
    if (world) {
      const gy = world.height(this.desired.x, this.desired.z) + 0.7;
      const wy = world.waterAt(this.desired.x, this.desired.z) + 0.5;
      this.desired.y = Math.max(this.desired.y, gy, wy);
    }
    const k = 1 - Math.exp(-12 * dt);
    if (dt >= 1 || this.cam.position.distanceToSquared(this.desired) > 2500) this.cam.position.copy(this.desired);
    else this.cam.position.lerp(this.desired, k);
    if (world) {
      // jaminan akhir: jangan pernah di bawah tanah
      const gy = world.height(this.cam.position.x, this.cam.position.z) + 0.5;
      if (this.cam.position.y < gy) this.cam.position.y = gy;
    }
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2);
      this.cam.position.x += (Math.random() - 0.5) * this.shake * 0.3;
      this.cam.position.y += (Math.random() - 0.5) * this.shake * 0.3;
    }
    this.cam.lookAt(this.target);
    const fov = 62 + clamp(speed - 15, 0, 35) * 0.45;
    if (Math.abs(this.cam.fov - fov) > 0.05) { this.cam.fov = damp(this.cam.fov, fov, 4, dt); this.cam.updateProjectionMatrix(); }
  }

  get heading() { return this.yaw + this.orbitYaw; }
}
