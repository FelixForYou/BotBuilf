// Langit, siklus hari, cuaca (cerah/berkabut/hujan), awan & bintang.
import * as THREE from 'three';
import { lerp, clamp, mulberry32 } from '../core/noise';

export type Weather = 'cerah' | 'berkabut' | 'hujan';
const KEYS: Array<[number, number, number, number, number]> = [
  // jam, warna atas, horizon, cahaya matahari, intensitas
  [0, 0x0b1430, 0x1d2c50, 0x6a7fb0, 0.25],
  [5, 0x1c2a55, 0x5f5a7a, 0x8a87b5, 0.3],
  [6.5, 0x5a87c4, 0xf2b38a, 0xffc79a, 0.75],
  [9, 0x5aa2e6, 0xbfe0f2, 0xfff1d6, 1.15],
  [15, 0x4d9be3, 0xc6e4f5, 0xfff4e0, 1.15],
  [17.8, 0x5f80c4, 0xf6a96e, 0xffb27a, 0.85],
  [19.3, 0x2b2f62, 0xb2647a, 0xd08a8a, 0.4],
  [21, 0x0e1736, 0x26355e, 0x6a7fb0, 0.25],
  [24, 0x0b1430, 0x1d2c50, 0x6a7fb0, 0.25],
];

export class Sky {
  readonly group = new THREE.Group();
  readonly sun = new THREE.DirectionalLight(0xffffff, 1.2);
  readonly hemi = new THREE.HemisphereLight(0xbfe3ff, 0x5a6b3a, 0.85);
  readonly fog: THREE.Fog;
  private dome: THREE.Mesh;
  private skyU = { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() } };
  private stars: THREE.Points;
  private clouds: THREE.InstancedMesh;
  private cloudData: { x: number; y: number; z: number; s: number }[] = [];
  private rain: THREE.LineSegments;
  private rainPos: Float32Array;
  weather: Weather = 'cerah';
  private weatherT = 0;
  private fogFactor = 1;
  private rainAmt = 0;
  timeOfDay = 8; // jam
  dayLength = 20 * 60; // detik nyata per hari
  viewDist = 900;
  windDir = new THREE.Vector2(1, 0.3).normalize();
  windStrength = 3;
  private rand = mulberry32(99);

  constructor() {
    this.fog = new THREE.Fog(0xbfe0f2, 200, 900);
    const g = new THREE.SphereGeometry(1, 24, 12);
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.skyU,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`,
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vDir;
        void main(){ float h = clamp(vDir.y, -0.2, 1.0); vec3 c = mix(horizon, top, pow(max(h,0.0), 0.55));
        float s = max(dot(normalize(vDir), sunDir), 0.0); c += sunCol * (pow(s, 600.0) * 1.6 + pow(s, 8.0) * 0.25);
        if (h < 0.0) c = mix(c, horizon*0.85, -h*4.0);
        gl_FragColor = vec4(c, 1.0); }`,
    });
    this.dome = new THREE.Mesh(g, m);
    this.dome.scale.setScalar(5000);
    this.dome.renderOrder = -10;
    this.dome.frustumCulled = false;
    this.group.add(this.dome);
    // Bintang
    const sp: number[] = [];
    for (let i = 0; i < 700; i++) {
      const u = this.rand() * 2 - 1, a = this.rand() * Math.PI * 2;
      const y = Math.abs(u), r = Math.sqrt(1 - y * y);
      sp.push(Math.cos(a) * r * 4500, y * 4500, Math.sin(a) * r * 4500);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }));
    this.stars.frustumCulled = false;
    this.group.add(this.stars);
    // Awan low-poly
    const cg = new THREE.IcosahedronGeometry(1, 0);
    this.clouds = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: 0.92 }), 160);
    for (let i = 0; i < 40; i++) {
      const cx = (this.rand() - 0.5) * 4200, cz = (this.rand() - 0.5) * 4200, cy = 420 + this.rand() * 220;
      for (let k = 0; k < 4; k++) this.cloudData.push({ x: cx + (k - 1.5) * 28 + this.rand() * 10, y: cy + this.rand() * 10, z: cz + this.rand() * 25, s: 22 + this.rand() * 18 });
    }
    this.clouds.count = this.cloudData.length;
    this.clouds.frustumCulled = false;
    this.group.add(this.clouds);
    // Hujan: segmen garis di sekitar kamera
    const RN = 900;
    this.rainPos = new Float32Array(RN * 6);
    for (let i = 0; i < RN; i++) this.resetDrop(i, 0, 0, 0, true);
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3));
    this.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xaecbe0, transparent: true, opacity: 0.55 }));
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.group.add(this.rain);
    // Matahari
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.near = 1; sc.far = 600;
    this.sun.shadow.bias = -0.0008;
    this.group.add(this.sun, this.sun.target, this.hemi);
  }

  private resetDrop(i: number, cx: number, cy: number, cz: number, init: boolean) {
    const x = cx + (this.rand() - 0.5) * 80, z = cz + (this.rand() - 0.5) * 80;
    const y = cy + (init ? (this.rand() - 0.3) * 60 : 30 + this.rand() * 20);
    const p = this.rainPos;
    p[i * 6] = x; p[i * 6 + 1] = y; p[i * 6 + 2] = z;
    p[i * 6 + 3] = x - 0.15; p[i * 6 + 4] = y - 1.4; p[i * 6 + 5] = z;
  }

  get isNight() { return this.timeOfDay < 5.8 || this.timeOfDay > 19.5; }
  get daylight() {
    const t = this.timeOfDay;
    return clamp(Math.min((t - 5) / 2, (20 - t) / 2), 0, 1);
  }
  get rainAmount() { return this.rainAmt; }

  setWeather(w: Weather) { this.weather = w; }

  update(dt: number, cam: THREE.Vector3, focus: THREE.Vector3, skipClock = false) {
    if (!skipClock) this.timeOfDay = (this.timeOfDay + (dt * 24) / this.dayLength) % 24;
    // Cuaca berganti sesekali
    this.weatherT -= dt;
    if (this.weatherT <= 0) {
      this.weatherT = 150 + this.rand() * 200;
      const r = this.rand();
      this.weather = r < 0.6 ? 'cerah' : r < 0.8 ? 'berkabut' : 'hujan';
      const a = this.rand() * Math.PI * 2;
      this.windDir.set(Math.cos(a), Math.sin(a));
      this.windStrength = 2 + this.rand() * 4;
    }
    const t = this.timeOfDay;
    let k = 0;
    while (k < KEYS.length - 2 && KEYS[k + 1][0] <= t) k++;
    const a = KEYS[k], b = KEYS[k + 1];
    const f = (t - a[0]) / (b[0] - a[0]);
    const top = new THREE.Color(a[1]).lerp(new THREE.Color(b[1]), f);
    const hor = new THREE.Color(a[2]).lerp(new THREE.Color(b[2]), f);
    const sunC = new THREE.Color(a[3]).lerp(new THREE.Color(b[3]), f);
    let inten = lerp(a[4], b[4], f);
    const targetFog = this.weather === 'berkabut' ? 0.35 : this.weather === 'hujan' ? 0.6 : 1;
    this.fogFactor = lerp(this.fogFactor, targetFog, 1 - Math.exp(-dt * 0.3));
    this.rainAmt = lerp(this.rainAmt, this.weather === 'hujan' ? 1 : 0, 1 - Math.exp(-dt * 0.4));
    const grey = new THREE.Color(0x9aa6b2).multiplyScalar(0.4 + this.daylight * 0.6);
    const overcast = (1 - this.fogFactor) * 0.8;
    top.lerp(grey, overcast); hor.lerp(grey, overcast * 0.9);
    inten *= 1 - overcast * 0.45;
    this.skyU.top.value.copy(top);
    this.skyU.horizon.value.copy(hor);
    // Arah matahari / bulan
    const ang = ((t - 6) / 12) * Math.PI;
    const sunDir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0.35).normalize();
    const lightDir = sunDir.y > -0.05 ? sunDir : sunDir.clone().negate(); // bulan di malam hari
    this.skyU.sunDir.value.copy(sunDir);
    this.skyU.sunCol.value.copy(sunC).multiplyScalar(sunDir.y > -0.1 ? 1 : 0);
    this.sun.color.copy(sunC);
    this.sun.intensity = inten * (this.isNight ? 0.5 : 1) * 1.6;
    this.sun.position.copy(focus).addScaledVector(lightDir, 300);
    this.sun.target.position.copy(focus);
    this.hemi.intensity = 0.45 + inten * 0.6;
    this.hemi.color.copy(top).lerp(new THREE.Color(0xffffff), 0.5);
    this.fog.color.copy(hor);
    this.fog.near = this.viewDist * 0.25 * this.fogFactor;
    this.fog.far = this.viewDist * (0.45 + 0.55 * this.fogFactor);
    this.dome.position.copy(cam);
    this.stars.position.copy(cam);
    (this.stars.material as THREE.PointsMaterial).opacity = clamp(1 - this.daylight * 1.5, 0, 1) * this.fogFactor;
    // Awan
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const drift = this.windDir;
    for (let i = 0; i < this.cloudData.length; i++) {
      const c = this.cloudData[i];
      c.x += drift.x * dt * 2; c.z += drift.y * dt * 2;
      if (c.x > 2400) c.x -= 4800; if (c.x < -2400) c.x += 4800; if (c.z > 2400) c.z -= 4800; if (c.z < -2400) c.z += 4800;
      p.set(c.x, c.y, c.z); s.set(c.s * 1.3, c.s * 0.55, c.s);
      m.compose(p, q, s);
      this.clouds.setMatrixAt(i, m);
    }
    this.clouds.instanceMatrix.needsUpdate = true;
    (this.clouds.material as THREE.MeshLambertMaterial).color.copy(new THREE.Color(0xffffff).lerp(grey, overcast * 0.8));
    // Hujan
    this.rain.visible = this.rainAmt > 0.05;
    if (this.rain.visible) {
      const n = Math.floor((this.rainPos.length / 6) * this.rainAmt);
      this.rain.geometry.setDrawRange(0, n * 2);
      const p2 = this.rainPos;
      for (let i = 0; i < n; i++) {
        p2[i * 6 + 1] -= dt * 38; p2[i * 6 + 4] -= dt * 38;
        if (p2[i * 6 + 1] < cam.y - 30 || Math.abs(p2[i * 6] - cam.x) > 45 || Math.abs(p2[i * 6 + 2] - cam.z) > 45) this.resetDrop(i, cam.x, cam.y, cam.z, false);
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }
  }

  /** Untuk tidur di sarang: lompat ke pagi. */
  skipToMorning() { this.timeOfDay = 6.5; }
}
