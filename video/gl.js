// Layer 3D (Three.js): latar 3D di belakang UI + objek 3D di depan UI.
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 1920, H = 1080;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, t0, d) => clamp((t - t0) / d);
const eOut = (x) => 1 - Math.pow(1 - x, 3);
const eIn = (x) => x * x * x;
const eBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const smooth = (x) => x * x * (3 - 2 * x);

const STEPS = [14.17, 33.95, 63.80, 77.47, 103.20, 117.35];

function makeRenderer(id) {
  const canvas = document.getElementById(id);
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(W, H, false);
  r.setClearColor(0x000000, 0);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  return r;
}

const font = new FontLoader().parse(await (await fetch('node_modules/three/examples/fonts/helvetiker_bold.typeface.json')).json());
const text = (str, size, depth, mats) => {
  const g = new TextGeometry(str, { font, size, depth, curveSegments: 8, bevelEnabled: true, bevelThickness: Math.min(8, depth * 0.15), bevelSize: Math.min(5, size * 0.03), bevelSegments: 3 });
  g.computeBoundingBox();
  const b = g.boundingBox;
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
  return new THREE.Mesh(g, mats);
};
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.25, ...o });

/* =========================== FOREGROUND =========================== */
const fg = makeRenderer('glfg');
const fs = new THREE.Scene();
fs.environment = new THREE.PMREMGenerator(fg).fromScene(new RoomEnvironment(), 0.04).texture;
const fcam = new THREE.PerspectiveCamera(30, W / H, 10, 10000);
fcam.position.set(0, 0, 540 / Math.tan(THREE.MathUtils.degToRad(15)));
fs.add(new THREE.HemisphereLight(0xcfe3ff, 0x1a1030, 1.1));
const dl = new THREE.DirectionalLight(0xffffff, 2.4); dl.position.set(700, 900, 1600); fs.add(dl);
const pl = new THREE.PointLight(0x9b7bff, 2.5, 0, 0); pl.position.set(-900, -300, 900); fs.add(pl);
const px = (x, y) => [x - W / 2, H / 2 - y];

function telegramCoin() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(90, 90, 26, 64), std(0x2aabee, { metalness: 0.35 }));
  disc.rotation.x = Math.PI / 2; g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(90, 6, 16, 64), std(0x1b86c4, { metalness: 0.6 }));
  rim.position.z = 0; g.add(rim);
  const pts = [[14, 31.5], [47, 18.6], [49.5, 21.4], [43.9, 47.9], [40.8, 49.3], [32.2, 43], [28.1, 47], [26.4, 47.8], [27, 39], [43, 24.5], [41.9, 24.1], [22.4, 37.6], [13.9, 34.9]];
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2((x - 32) * 2.6, -(y - 32) * 2.6)));
  const plane = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 10, bevelEnabled: true, bevelThickness: 3, bevelSize: 2, bevelSegments: 2 }), std(0xffffff, { roughness: 0.2 }));
  plane.position.set(-4, 2, 13); g.add(plane);
  const back = plane.clone(); back.rotation.y = Math.PI; back.position.z = -13; back.position.x = 4; g.add(back);
  return g;
}
function nodeHex() {
  const g = new THREE.Group();
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(100, 100, 30, 6), std(0x5fa04e, { metalness: 0.3 }));
  hex.rotation.x = Math.PI / 2; g.add(hex);
  const js = text('JS', 62, 14, std(0xffffff, { roughness: 0.25 })); js.position.z = 20; g.add(js);
  const js2 = js.clone(); js2.rotation.y = Math.PI; js2.position.z = -20; g.add(js2);
  return g;
}
const leds = [];
function serverRack() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const y = 66 - i * 66;
    const box = new THREE.Mesh(new RoundedBoxGeometry(230, 56, 150, 4, 8), std(0x2b3644, { metalness: 0.55, roughness: 0.3 }));
    box.position.y = y; g.add(box);
    for (let k = 0; k < 3; k++) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(110, 5, 4), std(0x10161d));
      slot.position.set(-35, y + 12 - k * 12, 76); g.add(slot);
    }
    const col = i === 2 ? 0x2b8ef0 : 0x3ccf7e;
    const led = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2 }));
    led.position.set(80, y, 76); g.add(led); leds.push([led, i]);
    const led2 = led.clone(); led2.material = led.material.clone(); led2.position.x = 56; g.add(led2); leds.push([led2, i + 3]);
  }
  return g;
}
function zipBox() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(170, 210, 70, 4, 14), std(0xf5b72f, { metalness: 0.45, roughness: 0.28 })));
  const zip = new THREE.Mesh(new THREE.BoxGeometry(22, 212, 74), std(0x7a4d00, { metalness: 0.6 }));
  g.add(zip);
  for (let i = 0; i < 9; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 76), std(0xd9d9d9, { metalness: 0.9, roughness: 0.2 }));
    tooth.position.y = 90 - i * 22; g.add(tooth);
  }
  const pull = new THREE.Mesh(new RoundedBoxGeometry(34, 54, 12, 2, 5), std(0xe6e6e6, { metalness: 0.9, roughness: 0.15 }));
  pull.position.set(0, 60, 44); g.add(pull);
  return g;
}

const intro = [telegramCoin(), nodeHex(), serverRack()];
intro.forEach((o) => fs.add(o));
const outro = [telegramCoin(), nodeHex(), serverRack()];
outro.forEach((o) => fs.add(o));
const zipObj = zipBox(); fs.add(zipObj);

const digitMats = [std(0x6ab3f3, { emissive: 0x1d4f8f, emissiveIntensity: 0.6, metalness: 0.5 }), std(0x7c5cff, { metalness: 0.6 })];
const digits = STEPS.map((s, i) => {
  const g = new THREE.Group();
  g.add(text(String(i + 1), 300, 80, digitMats));
  const lab = text('LANGKAH', 52, 14, std(0xffffff, { emissive: 0x334466, emissiveIntensity: 0.4 }));
  lab.position.y = 250; g.add(lab);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(300, 9, 16, 96), new THREE.MeshStandardMaterial({ color: 0x4ea8ff, emissive: 0x4ea8ff, emissiveIntensity: 1.5 }));
  g.add(ring); g.userData.ring = ring;
  fs.add(g);
  return g;
});

function flyIn(o, t, t0, base, sc, i, tExit) {
  const p = prog(t, t0, 1.1);
  o.visible = t >= t0 - 0.01;
  if (!o.visible) return;
  const e = eOut(p);
  o.position.set(base[0], base[1] + Math.sin(t * 1.3 + i) * 10, -2600 * (1 - e));
  o.rotation.set(Math.sin(t * 0.7 + i) * 0.15 + 0.12, (1 - e) * Math.PI * 3 + Math.sin(t * 0.9 + i * 1.7) * 0.45, 0);
  o.scale.setScalar(sc);
  if (tExit !== undefined) {
    const q = eIn(prog(t, tExit, 0.9));
    o.position.z += q * 2300; o.position.y += q * (120 + i * 40);
    if (q >= 1) o.visible = false;
  }
}

/* =========================== BACKGROUND =========================== */
const bg = makeRenderer('glbg');
const bs = new THREE.Scene();
bs.fog = new THREE.Fog(0x0b1120, 900, 7000);
const bcam = new THREE.PerspectiveCamera(55, W / H, 1, 9000);
bs.add(new THREE.HemisphereLight(0x8fb3ff, 0x221133, 1.2));
const bdl = new THREE.DirectionalLight(0xffffff, 1.4); bdl.position.set(1, 2, 1); bs.add(bdl);
const grid = new THREE.GridHelper(40000, 200, 0x4a6cff, 0x24356b);
grid.material.transparent = true; grid.material.opacity = 0.55; grid.position.y = -520; bs.add(grid);
const grid2 = new THREE.GridHelper(40000, 200, 0x7c5cff, 0x2a1f55);
grid2.material.transparent = true; grid2.material.opacity = 0.25; grid2.position.y = 2200; bs.add(grid2);
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const geos = [new THREE.IcosahedronGeometry(60, 0), new THREE.OctahedronGeometry(60, 0), new RoundedBoxGeometry(90, 90, 90, 2, 10), new THREE.CylinderGeometry(55, 55, 26, 6), new THREE.TorusGeometry(50, 14, 12, 40)];
const cols = [0x4ea8ff, 0x7c5cff, 0x3ccf7e, 0x2aabee, 0xffb547];
const floaters = [];
for (let i = 0; i < 70; i++) {
  const c = cols[i % cols.length];
  const wire = rnd() < 0.45;
  const m = new THREE.Mesh(geos[i % geos.length], wire
    ? new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: 0.55 })
    : std(c, { emissive: c, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 }));
  const side = rnd() < 0.5 ? -1 : 1;
  m.position.set(side * (700 + rnd() * 2600), -350 + rnd() * 1700, 600 - rnd() * 24000);
  m.scale.setScalar(0.6 + rnd() * 1.6);
  m.userData = { rx: rnd() * 0.8 - 0.4, ry: rnd() * 0.8 - 0.4, ph: rnd() * 6 };
  bs.add(m); floaters.push(m);
}
const starG = new THREE.BufferGeometry();
const sp = new Float32Array(2400 * 3);
for (let i = 0; i < 2400; i++) { sp[i * 3] = (rnd() - 0.5) * 9000; sp[i * 3 + 1] = -400 + rnd() * 3200; sp[i * 3 + 2] = 1000 - rnd() * 26000; }
starG.setAttribute('position', new THREE.BufferAttribute(sp, 3));
bs.add(new THREE.Points(starG, new THREE.PointsMaterial({ color: 0x9cc2ff, size: 5, transparent: true, opacity: 0.8, sizeAttenuation: true })));

/* =========================== UPDATE =========================== */
let fgCleared = false;
function update(t) {
  // latar: kamera maju terus, dengan "whoosh" tiap pergantian langkah
  let boost = 0;
  for (const s of STEPS) boost += 900 * smooth(prog(t, s - 0.25, 1.3));
  boost += 600 * smooth(prog(t, 134.4, 1.3)) + 600 * smooth(prog(t, 158.5, 1.3)) + 600 * smooth(prog(t, 176.9, 1.3));
  bcam.position.set(Math.sin(t * 0.11) * 160, 60 + Math.sin(t * 0.17) * 40, -t * 75 - boost);
  bcam.rotation.set(-0.06 + Math.sin(t * 0.13) * 0.02, Math.sin(t * 0.09) * 0.05, Math.sin(t * 0.07) * 0.02);
  floaters.forEach((m) => { const u = m.userData; m.rotation.set(t * u.rx + u.ph, t * u.ry, 0); });
  bg.render(bs, bcam);

  // depan
  let any = false;
  const B = [[-300, 215], [0, 215], [300, 215]];
  intro.forEach((o, i) => { flyIn(o, t, [0.25, 0.6, 0.95][i], B[i], i === 1 ? 0.9 : 1, i, 13.45); if (t > 14.5) o.visible = false; any ||= o.visible; });
  const BO = [[-190, 235], [0, 235], [190, 235]];
  outro.forEach((o, i) => { flyIn(o, t, 186.4 + i * 0.15, BO[i], i === 1 ? 0.6 : 0.68, i); o.visible = t >= 186.39; any ||= o.visible; });
  leds.forEach(([l, i]) => { l.material.emissiveIntensity = 0.6 + 2 * (Math.sin(t * 6 + i * 1.9) > 0.2 ? 1 : 0.15); });

  // zip 3D
  zipObj.visible = t >= 80.5 && t < 85.45;
  if (zipObj.visible) {
    const [x, y] = px(1160, 455);
    let s = eBack(prog(t, 80.5, 0.6));
    for (const a of [81.65, 82.05, 82.45]) { const r = prog(t, a, 0.3); if (r > 0 && r < 1) s += 0.14 * Math.sin(r * Math.PI); }
    s *= 1 - eIn(prog(t, 84.95, 0.45));
    zipObj.position.set(x, y + Math.sin(t * 1.5) * 8, 0);
    zipObj.rotation.set(0.15 + Math.sin(t * 0.8) * 0.08, -0.5 + Math.sin(t * 0.9) * 0.45, 0);
    zipObj.scale.setScalar(Math.max(s, 0.001));
    any = true;
  }

  // angka langkah 3D terbang melewati kamera
  digits.forEach((g, i) => {
    const p = prog(t, STEPS[i] - 0.15, 1.7);
    g.visible = p > 0 && p < 1;
    if (!g.visible) return;
    let z;
    if (p < 0.38) z = -3200 + 3200 * eOut(p / 0.38);
    else if (p < 0.68) z = 260 * ((p - 0.38) / 0.3);
    else z = 260 + 1900 * eIn((p - 0.68) / 0.32);
    g.position.set(0, 0, z);
    g.rotation.set(0.12 * Math.sin(p * 6), -0.9 * (1 - p) + 0.4 * p, 0);
    g.userData.ring.rotation.set(0.9 + p * 0.6, p * 1.2, p * 3);
    g.userData.ring.scale.setScalar(0.8 + p * 0.5);
    any = true;
  });

  if (any) { fg.render(fs, fcam); fgCleared = false; }
  else if (!fgCleared) { fg.clear(); fgCleared = true; }
}
window.gl3d = { update };
window.gl3dReady = true;
