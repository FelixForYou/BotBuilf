// Uji alur lengkap di browser sungguhan (Chromium headless):
// buka → game baru → terbang → belok → menukik → skill → mendarat/bertengger → makan → sarang
// → tantangan → simpan → muat ulang → lanjutkan → verifikasi progres. Juga mengukur FPS.
// Pakai: npm run build && npm run e2e   (atau: node scripts/e2e.mjs http://localhost:5173/)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

let url = process.argv[2];
let server;
if (!url) {
  server = spawn('npx', ['vite', 'preview', '--port', '4317', '--strictPort'], { stdio: 'pipe' });
  url = 'http://localhost:4317/';
  await new Promise((r) => setTimeout(r, 2500));
}
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__wotw?.state === 'title', null, { timeout: 120000 });
  check('Layar judul tampil', true);
  await page.click('[data-a=new]');
  await page.click('[data-mode=petualangan]');
  await page.click('[data-a=start]');
  await page.waitForFunction(() => window.__wotw.state === 'playing');
  check('Game baru dimulai (mode Petualangan)', true);
  const G = (fn, arg) => page.evaluate(fn, arg);
  const frames = (n = 2) => page.evaluate((n) => new Promise((r) => { const f = () => (n-- <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };

  // Terbang naik
  const y0 = await G(() => window.__wotw.player.pos.y);
  await hold('Space', 2500);
  const y1 = await G(() => window.__wotw.player.pos.y);
  check('Mengepak menambah ketinggian', y1 > y0 + 5, `${y0.toFixed(1)} → ${y1.toFixed(1)} m`);
  // Belok
  // akumulasi perubahan arah (dipantau tiap 100 ms agar tidak terpengaruh pembungkusan sudut ±π)
  await page.keyboard.down('KeyD');
  let turned = 0, prevYaw = await G(() => window.__wotw.player.yaw);
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(100);
    const y = await G(() => window.__wotw.player.yaw);
    let d = y - prevYaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    turned += d; prevYaw = y;
  }
  await page.keyboard.up('KeyD');
  check('Berbelok ke kanan dengan D', turned < -0.4, `Δyaw ${turned.toFixed(2)} rad (negatif = kanan)`);
  // Menukik
  await G(() => { const p = window.__wotw.player; p.pos.y += 120; });
  await page.keyboard.down('ControlLeft');
  await page.waitForTimeout(2500);
  const dive = await G(() => window.__wotw.player.speed);
  await page.keyboard.up('ControlLeft');
  check('Menukik menambah kecepatan', dive > 25, `${(dive * 3.6).toFixed(0)} km/j`);
  // Skill
  await page.keyboard.press('ShiftLeft');
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(300);
  const sk = await G(() => ({ dash: window.__wotw.skills.cooldown.dash, vis: window.__wotw.skills.visionT, marks: document.querySelectorAll('#markers .vm:not([style*="none"])').length }));
  check('Wind Dash & Sky Vision aktif dengan cooldown', sk.dash > 0 && sk.vis > 0, `cooldown dash ${sk.dash.toFixed(1)} dtk, ${sk.marks} penanda`);
  await page.keyboard.press('Digit3');
  await page.waitForTimeout(200);
  check('Updraft dipakai', await G(() => window.__wotw.skills.cooldown.updraft > 0));
  // Bertengger otomatis dengan E di dekat pohon
  const perch = await G(() => {
    const g = window.__wotw, p = g.player;
    const pr = g.world.landmarks.perches.find((q) => q.y > 3) ;
    p.pos.set(pr.x - 4, pr.y + 3, pr.z - 4); p.speed = 8; p.mode = 'fly';
    p.yaw = Math.atan2(4, 4);
    return pr;
  });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(1600);
  const pm = await G(() => ({ mode: window.__wotw.player.mode, pos: window.__wotw.player.pos.toArray() }));
  const dPerch = Math.hypot(pm.pos[0] - perch.x, pm.pos[2] - perch.z);
  check('Bantuan mendarat: bertengger dengan E', pm.mode === 'perch', `mode=${pm.mode}, jarak ${dPerch.toFixed(1)} m`);
  // Lepas landas & mendarat di tanah dengan mengerem
  await hold('Space', 400);
  await G(() => { const g = window.__wotw, p = g.player; p.pos.set(40, g.world.height(40, 300) + 4, 300); p.speed = 10; p.mode = 'fly'; });
  await hold('KeyS', 3500);
  const gm = await G(() => window.__wotw.player.mode);
  check('Mengerem lalu mendarat di tanah', gm === 'ground', `mode=${gm}`);
  // Makan
  const hu0 = await G(() => { const g = window.__wotw, p = g.player; g.hunger = 40; g.pickups.spawnDynamic('crumb', p.pos.x + 0.8, p.pos.y, p.pos.z); return g.hunger; });
  await page.waitForTimeout(400);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(400);
  const hu1 = await G(() => window.__wotw.hunger);
  check('Makan menambah rasa kenyang', hu1 > hu0 + 5, `${hu0.toFixed(0)} → ${hu1.toFixed(0)}`);
  // Ranting & sarang
  await G(() => { const g = window.__wotw, p = g.player; p.carry = 0; g.pickups.spawnDynamic('twig', p.pos.x + 0.5, p.pos.y, p.pos.z); });
  await page.waitForTimeout(300); await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
  const c1 = await G(() => window.__wotw.player.carry);
  check('Mengambil ranting', c1 === 1, `membawa ${c1}`);
  await G(() => { window.__wotw.player.carry = 2; });
  await page.waitForTimeout(300); await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
  const nest = await G(() => window.__wotw.nest.data);
  check('Membangun sarang dari ranting', !!nest && nest.level >= 1, nest ? `level ${nest.level}, ${nest.twigs} ranting` : '');
  // Tantangan: Balap Lembah — lintasi cincin berurutan
  await G(() => { window.__wotw.challenges.cooldown = 0; });
  const course = await G(() => window.__wotw.challenges.courses.find((c) => c.id === 'race-valley').rings.map((r) => r.toArray()));
  for (let i = 0; i < course.length; i++) {
    const [x, y, z] = course[i];
    const [nx, ny, nz] = course[Math.min(course.length - 1, i + 1)];
    const dx = nx - x, dy = ny - y, dz = nz - z, l = Math.hypot(dx, dy, dz) || 1;
    await G(([x, y, z, dx, dy, dz]) => { const p = window.__wotw.player; p.mode = 'fly'; p.speed = 2.5; p.pos.set(x - dx * 2, y - dy * 2, z - dz * 2); }, [x, y, z, dx / l, dy / l, dz / l]);
    await frames(2);
    await G(([x, y, z, dx, dy, dz]) => { const p = window.__wotw.player; p.pos.set(x + dx * 2, y + dy * 2, z + dz * 2); }, [x, y, z, dx / l, dy / l, dz / l]);
    await frames(2);
  }
  const best = await G(() => window.__wotw.progress.courses['race-valley']);
  check('Menyelesaikan tantangan Balap Lembah', typeof best === 'number', best ? `${best.toFixed(1)} dtk` : 'belum selesai');
  // Penemuan landmark
  await G(() => { const g = window.__wotw, l = g.world.landmarks.pois.find((p) => p.id === 'windmill'); g.player.pos.set(l.x + 10, l.y + 5, l.z); g.player.mode = 'fly'; });
  await page.waitForTimeout(1200);
  check('Menemukan landmark (Kincir Angin)', await G(() => window.__wotw.progress.found.has('windmill')));
  // Peta
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(400);
  check('Peta terbuka', await G(() => !!document.querySelector('.map-wrap canvas')));
  await page.click('[data-a=close]');
  // Mode foto
  await page.keyboard.press('KeyP'); await page.waitForTimeout(300);
  const photo = await G(() => window.__wotw.state);
  await page.click('[data-a=exit]');
  check('Mode foto', photo === 'photo');
  // Simpan
  const before = await G(() => { const g = window.__wotw; g.player.mode = 'perch'; g.saveNow(); return { xp: g.progress.xp, level: g.progress.level, pos: g.player.pos.toArray(), nest: g.nest.data, courses: { ...g.progress.courses }, found: [...g.progress.found], skills: { ...g.skills.levels } }; });
  check('Progres tersimpan ke localStorage', await G(() => !!localStorage.getItem('wotw-save-v1')));
  // Muat ulang & lanjutkan
  await page.reload();
  await page.waitForFunction(() => window.__wotw?.state === 'title', null, { timeout: 120000 });
  await page.click('[data-a=continue]');
  await page.waitForFunction(() => window.__wotw.state === 'playing');
  const after = await G(() => { const g = window.__wotw; return { xp: g.progress.xp, level: g.progress.level, pos: g.player.pos.toArray(), nest: g.nest.data, courses: { ...g.progress.courses }, found: [...g.progress.found], mode: g.player.relaxed ? 'santai' : 'petualangan' }; });
  const dpos = Math.hypot(after.pos[0] - before.pos[0], after.pos[2] - before.pos[2]);
  check('Memuat posisi', dpos < 3, `selisih ${dpos.toFixed(2)} m`);
  check('Memuat XP & level', after.xp === before.xp && after.level === before.level, `level ${after.level}, ${after.xp} XP`);
  check('Memuat sarang', JSON.stringify(after.nest) === JSON.stringify(before.nest));
  check('Memuat rekor tantangan & penemuan', after.courses['race-valley'] === before.courses['race-valley'] && after.found.length === before.found.length);
  check('Memuat mode permainan', after.mode === 'petualangan');

  // Ukur FPS: preset Rendah di viewport HP (catatan: SwiftShader = render CPU, jauh lebih lambat dari GPU HP)
  const mobile = await browser.newContext({ ...devices['Pixel 5'] });
  const mp = await mobile.newPage();
  await mp.goto(url);
  await mp.evaluate(() => { localStorage.setItem('wotw-settings-v1', JSON.stringify({ quality: 'low', showFps: true, adaptive: false })); });
  await mp.reload();
  await mp.waitForFunction(() => window.__wotw?.state === 'title', null, { timeout: 120000 });
  await mp.tap('[data-a=new]'); await mp.tap('[data-a=start]');
  await mp.waitForTimeout(4000);
  const samples = [];
  for (let i = 0; i < 6; i++) { await mp.waitForTimeout(1000); samples.push(await mp.evaluate(() => ({ ...window.__wotw.stats }))); }
  const avg = samples.reduce((a, s) => a + s.fps, 0) / samples.length;
  const s = samples[samples.length - 1];
  console.log(`ℹ FPS (Low, Pixel 5 viewport, SwiftShader CPU): rata-rata ${avg.toFixed(1)} · logika game ${s.cpuMs.toFixed(2)} ms/frame · ${s.drawCalls} draw call · ${(s.triangles / 1000).toFixed(0)}k segitiga · pixel ratio ${s.pixelRatio}`);
  check('Kontrol sentuh tampil di HP', await mp.evaluate(() => !document.getElementById('touch').classList.contains('hidden')));
  await mp.screenshot({ path: 'test-results/mobile.png' }).catch(() => {});
  await mobile.close();
  check('Tidak ada error JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('Uji berjalan tanpa crash', false, String(e));
} finally {
  await browser.close();
  server?.kill();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} pemeriksaan lolos`);
process.exit(failed ? 1 : 0);
