// Antarmuka minimal: HUD, kompas, skill bar, menu, peta, mode foto.
import * as THREE from 'three';
import type { Game } from '../game';
import { ACTIVES, PASSIVES, MAX_ACTIVE, MAX_PASSIVE, type ActiveId } from '../gameplay/skills';
import { SPECIES, COLOR_PRESETS } from '../gameplay/species';
import { xpToNext, GRID } from '../gameplay/progress';
import { NEST_NAMES, NEST_LEVELS } from '../gameplay/nest';
import { QUALITY } from '../quality';
import type { GameMode, QualityName, SaveData } from '../save/save';
import { loadSave } from '../save/save';
import { wrapAngle } from '../core/noise';

const $ = <T extends HTMLElement = HTMLElement>(root: ParentNode, sel: string) => root.querySelector(sel) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export class UI {
  private hud = document.getElementById('hud')!;
  private screens = document.getElementById('screens')!;
  private markers = document.getElementById('markers')!;
  private touch = document.getElementById('touch')!;
  private el: Record<string, HTMLElement> = {};
  private skillBtns: Partial<Record<ActiveId, HTMLButtonElement>> = {};
  private hudHidden = false;
  private hudT = 0;
  private markerPool: HTMLElement[] = [];
  private mapImg: HTMLCanvasElement | null = null;
  private device: 'pc' | 'touch' = 'pc';
  private v = new THREE.Vector3();
  private lastPrompt = '';
  private lastTut = '';

  constructor(private g: Game) {
    this.buildHud();
  }

  setDevice(d: 'pc' | 'touch') {
    this.device = d;
    document.body.classList.toggle('touch', d === 'touch');
    if (this.g.state === 'playing' || this.g.state === 'paused') this.touch.classList.toggle('hidden', d !== 'touch' || this.hudHidden);
    for (const a of ACTIVES) { const b = this.skillBtns[a.id]; if (b) $(b, '.key').textContent = d === 'touch' ? '' : a.key; }
    this.lastTut = '';
  }

  // ---------------- HUD ----------------
  private buildHud() {
    this.hud.innerHTML = `
      <div class="stats">
        <div class="lvl"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="19" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="3"/><circle class="xpc" cx="21" cy="21" r="19" fill="none" stroke="#ffd36e" stroke-width="3" stroke-dasharray="119.4" stroke-dashoffset="119.4" stroke-linecap="round"/></svg><span class="lvn">1</span></div>
        <div class="bars">
          <div class="bar-label">⚡<div class="bar st"><i></i></div></div>
          <div class="bar-label need">🍃<div class="bar hu"><i></i></div></div>
          <div class="bar-label need">💧<div class="bar th"><i></i></div></div>
          <div class="bar-label hpw">❤<div class="bar hp"><i></i></div></div>
        </div>
      </div>
      <div class="carry hidden"></div>
      <div class="compass"></div>
      <div class="topbtns">
        <button class="ibtn" data-a="map" aria-label="Peta">🗺</button>
        <button class="ibtn" data-a="photo" aria-label="Mode foto">📷</button>
        <button class="ibtn" data-a="pause" aria-label="Menu">☰</button>
      </div>
      <div class="region"></div>
      <div class="toasts"></div>
      <div class="tutorial hidden"></div>
      <div class="challenge hidden"><div class="t">0.0</div><div class="n"></div></div>
      <div class="warning hidden"></div>
      <div class="prompt hidden"></div>
      <div class="info"><span class="alt"></span><span class="spd"></span><span>angin <span class="wind">➤</span></span><span class="saved"></span></div>
      <div class="fps hidden"></div>
      <div class="skills"></div>`;
    for (const k of ['carry', 'compass', 'region', 'toasts', 'tutorial', 'challenge', 'warning', 'prompt', 'fps', 'skills']) this.el[k] = $(this.hud, '.' + k);
    this.el.alt = $(this.hud, '.alt'); this.el.spd = $(this.hud, '.spd'); this.el.wind = $(this.hud, '.wind'); this.el.saved = $(this.hud, '.saved');
    this.el.lvn = $(this.hud, '.lvn'); this.el.xpc = $(this.hud, '.xpc');
    this.hud.querySelectorAll<HTMLElement>('[data-a]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.a!;
      if (a === 'map') { this.g.state = 'paused'; this.showMap(); }
      if (a === 'photo') this.g.enterPhoto();
      if (a === 'pause') this.g.pause();
    }));
    for (const a of ACTIVES) {
      const b = document.createElement('button');
      b.className = 'sk';
      b.setAttribute('aria-label', a.name);
      b.innerHTML = `<span>${a.icon}</span><i class="cd"></i><span class="lv"></span><span class="key">${a.key}</span>`;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.g.useSkill(a.id); });
      this.el.skills.appendChild(b);
      this.skillBtns[a.id] = b;
    }
    this.el.tutorial.style.pointerEvents = 'auto';
  }

  toggleHud() {
    this.hudHidden = !this.hudHidden;
    this.hud.classList.toggle('hidden', this.hudHidden);
    this.touch.classList.toggle('hidden', this.hudHidden || this.device !== 'touch');
    this.markers.classList.toggle('hidden', this.hudHidden);
  }

  enterGame() {
    this.hideScreens();
    this.hudHidden = false;
    this.hud.classList.remove('hidden');
    this.markers.classList.remove('hidden');
    this.touch.classList.toggle('hidden', this.device !== 'touch');
    const relaxed = this.g.player.relaxed;
    this.hud.querySelectorAll<HTMLElement>('.hpw').forEach((e) => e.classList.toggle('hidden', relaxed));
  }

  toast(msg: string, big = false) {
    const t = document.createElement('div');
    t.className = 'toast' + (big ? ' big' : '');
    t.textContent = msg;
    this.el.toasts.appendChild(t);
    while (this.el.toasts.children.length > 5) this.el.toasts.firstChild!.remove();
    setTimeout(() => t.remove(), big ? 4500 : 3000);
  }

  region(name: string, hour: number) {
    const part = hour < 5 ? 'Malam' : hour < 10 ? 'Pagi' : hour < 15 ? 'Siang' : hour < 19 ? 'Senja' : 'Malam';
    this.el.region.innerHTML = `${esc(name)}<small>${part} · ${this.g.world.sky.weather}</small>`;
    this.el.region.classList.add('show');
    clearTimeout((this.el.region as unknown as { _t: number })._t);
    (this.el.region as unknown as { _t: number })._t = window.setTimeout(() => this.el.region.classList.remove('show'), 3200);
  }

  setPrompt(t: string | null) {
    const key = t ?? '';
    const actBtn = this.touch.querySelector('.act');
    actBtn?.classList.toggle('hint', !!t);
    if (key === this.lastPrompt) return;
    this.lastPrompt = key;
    this.el.prompt.classList.toggle('hidden', !t);
    if (t) this.el.prompt.innerHTML = `<kbd>E</kbd>${esc(t)}`;
  }

  saved(ok: boolean) {
    this.el.saved.textContent = ok ? '💾' : '⚠ gagal simpan';
    setTimeout(() => (this.el.saved.textContent = ''), 1500);
  }

  updateHud(dt: number) {
    const g = this.g, p = g.player;
    // tutorial
    const tut = g.tutorialText();
    if (tut !== this.lastTut) {
      this.lastTut = tut ?? '';
      this.el.tutorial.classList.toggle('hidden', !tut);
      if (tut) {
        const step = g.tutorialStep;
        this.el.tutorial.innerHTML = `<div class="step">TUTORIAL ${step < 7 ? `${step + 1}/7` : ''}</div>${tut}<div style="margin-top:6px"><button class="sw" data-skip>Lewati tutorial</button></div>`;
        $(this.el.tutorial, '[data-skip]').addEventListener('click', () => g.skipTutorial());
      }
    }
    // skill bar setiap frame (murah)
    for (const a of ACTIVES) {
      const b = this.skillBtns[a.id]!;
      const cd = g.skills.cooldown[a.id], max = g.skills.maxCd(a.id);
      b.style.setProperty('--p', `${(cd / max) * 100}%`);
      b.classList.toggle('ready', cd <= 0);
      b.classList.toggle('active', (a.id === 'vision' && g.skills.visionT > 0) || (a.id === 'call' && g.skills.callT > 0));
    }
    this.updateCompass();
    this.updateMarkers();
    // challenge
    const ch = g.challenges;
    this.el.challenge.classList.toggle('hidden', !ch.active);
    if (ch.active) {
      $(this.el.challenge, '.t').textContent = ch.time.toFixed(1);
      $(this.el.challenge, '.n').textContent = `${ch.active.name} · cincin ${ch.next}/${ch.active.rings.length - 1} · 🥇 ${ch.active.medals[0]} dtk`;
    }
    const th = g.npcs.threat;
    this.el.warning.classList.toggle('hidden', !th);
    if (th) {
      const rel = wrapAngle(Math.atan2(th.x - p.pos.x, th.z - p.pos.z) - p.yaw);
      const dir = Math.abs(rel) < 0.6 ? 'di depan' : Math.abs(rel) > 2.5 ? 'di belakang' : rel > 0 ? 'di kiri' : 'di kanan';
      this.el.warning.textContent = `⚠ Elang mengejar ${dir}! (${this.device === 'touch' ? '🌀' : 'F'} untuk berguling)`;
    }
    this.hudT -= dt;
    if (this.hudT > 0) return;
    this.hudT = 0.12;
    const set = (sel: string, v: number) => { const b = $(this.hud, `.bar.${sel}`); ($(b, 'i') as HTMLElement).style.width = `${Math.max(0, Math.min(100, v))}%`; b.classList.toggle('low', v < 20); };
    set('st', (p.stamina / p.maxStamina) * 100);
    set('hu', g.hunger); set('th', g.thirst); set('hp', p.health);
    this.el.lvn.textContent = String(g.progress.level);
    this.el.xpc.setAttribute('stroke-dashoffset', String(119.4 * (1 - g.progress.xp / xpToNext(g.progress.level))));
    this.el.alt.textContent = `↑ ${Math.round(p.pos.y)} m`;
    this.el.spd.textContent = `${Math.round(p.speed * 3.6)} km/j`;
    const wd = g.world.sky.windDir;
    const rel = wrapAngle(Math.atan2(wd.x, wd.y) - g.camera.heading);
    this.el.wind.style.transform = `rotate(${-rel * 57.3 - 90}deg)`;
    this.el.carry.classList.toggle('hidden', p.carry === 0);
    this.el.carry.textContent = `🪵 ${p.carry}/${p.capacity}`;
    this.el.fps.classList.toggle('hidden', !g.settings.showFps);
    if (g.settings.showFps) { const s = g.stats; this.el.fps.textContent = `${s.fps} FPS · logika ${s.cpuMs.toFixed(1)} ms · ${s.drawCalls} draw · ${(s.triangles / 1000).toFixed(0)}k tri · pr ${s.pixelRatio.toFixed(2)} · ${s.viewDist} m`; }
    for (const a of ACTIVES) $(this.skillBtns[a.id]!, '.lv').textContent = '•'.repeat(g.skills.levels[a.id]);
  }

  private compassMarks: HTMLElement[] = [];
  private updateCompass() {
    const g = this.g, p = g.player, heading = g.camera.heading;
    const items: { a: number; t: string; cls: string }[] = [];
    for (const [a, t] of [[Math.PI, 'U'], [Math.PI / 2, 'T'], [0, 'S'], [-Math.PI / 2, 'B']] as [number, string][]) items.push({ a, t, cls: 'm dir' });
    const add = (x: number, z: number, t: string, cls = 'm') => {
      const d = Math.hypot(x - p.pos.x, z - p.pos.z);
      if (d < 8) return;
      items.push({ a: Math.atan2(x - p.pos.x, z - p.pos.z), t: t + (d > 60 ? `<small style="font-size:9px;opacity:.8"> ${d > 1000 ? (d / 1000).toFixed(1) + 'km' : Math.round(d) + 'm'}</small>` : ''), cls });
    };
    for (const poi of g.world.landmarks.pois) if (g.progress.found.has(poi.id) && poi.kind === 'landmark') add(poi.x, poi.z, poi.icon);
    if (g.nest.data) add(g.nest.data.x, g.nest.data.z, '🪺');
    const nr = g.challenges.nextRing;
    if (nr) add(nr.x, nr.z, '◎', 'm next');
    for (const c of g.rescue.chicks) if (c.state === 'follow') add(c.home.x, c.home.z, '🏠');
    const W = this.el.compass.clientWidth || 300;
    while (this.compassMarks.length < items.length) { const e = document.createElement('div'); this.el.compass.appendChild(e); this.compassMarks.push(e); }
    this.compassMarks.forEach((e, i) => {
      const it = items[i];
      if (!it) { e.style.display = 'none'; return; }
      const rel = wrapAngle(it.a - heading);
      if (Math.abs(rel) > Math.PI / 2) { e.style.display = 'none'; return; }
      e.style.display = '';
      e.className = it.cls;
      e.style.left = `${50 - (rel / (Math.PI / 2)) * 50}%`;
      if (e.innerHTML !== it.t) e.innerHTML = it.t;
    });
    void W;
  }

  private updateMarkers() {
    const g = this.g;
    const list = g.skills.visionT > 0 ? g.visionMarkers() : [];
    // cincin tantangan selalu ditandai
    const nr = g.challenges.nextRing;
    if (nr) list.push({ x: nr.x, y: nr.y, z: nr.z, icon: '◎', cls: undefined, label: `${Math.round(nr.distanceTo(g.player.pos))} m` });
    const cam = g.camera.cam;
    const W = innerWidth, H = innerHeight;
    let n = 0;
    for (const m of list) {
      this.v.set(m.x, m.y, m.z).project(cam);
      if (this.v.z > 1 || Math.abs(this.v.x) > 1.05 || Math.abs(this.v.y) > 1.05) continue;
      let e = this.markerPool[n];
      if (!e) { e = document.createElement('div'); this.markers.appendChild(e); this.markerPool.push(e); }
      e.style.display = '';
      e.className = 'vm' + (m.cls ? ' ' + m.cls : '');
      const html = m.icon + (m.label ? `<small>${m.label}</small>` : '');
      if (e.innerHTML !== html) e.innerHTML = html;
      e.style.left = `${((this.v.x + 1) / 2) * W}px`;
      e.style.top = `${((1 - this.v.y) / 2) * H}px`;
      n++;
    }
    for (let i = n; i < this.markerPool.length; i++) this.markerPool[i].style.display = 'none';
  }

  // ---------------- layar ----------------
  hideScreens() { this.screens.innerHTML = ''; }
  private screen(html: string, cls = 'dim'): HTMLElement {
    this.screens.innerHTML = `<div class="screen ${cls}">${html}</div>`;
    return this.screens.firstElementChild as HTMLElement;
  }

  showLoading(p: number) {
    let bar = this.screens.querySelector<HTMLElement>('.loadbar i');
    if (!bar) {
      this.screen(`<div class="title-wrap"><h1 class="logo"><span>dunia terbuka</span>Wings of the Wild</h1><div class="loadbar"><i></i></div><p class="tagline">Membangun lembah, hutan, dan pegunungan…</p></div>`, 'title-screen');
      bar = this.screens.querySelector<HTMLElement>('.loadbar i')!;
    }
    bar.style.width = `${Math.round(p * 100)}%`;
  }

  showTitle(hasSave: boolean) {
    this.hud.classList.add('hidden');
    this.touch.classList.add('hidden');
    this.markers.classList.add('hidden');
    const s = hasSave ? loadSave() : null;
    const sub = s ? `Level ${s.level} · ${s.mode === 'santai' ? 'Santai' : 'Petualangan'} · ${SPECIES.find((x) => x.id === s.species)?.name ?? ''}` : '';
    const el = this.screen(`
      <div class="title-wrap">
        <h1 class="logo"><span>dunia terbuka</span>Wings of the Wild</h1>
        <p class="tagline">Terbang bebas, cari makan, bangun sarang, dan temukan rahasia lembah.</p>
        ${s ? `<button class="btn primary" data-a="continue">Lanjutkan<br><small style="font-weight:400;font-size:12px">${esc(sub)}</small></button>` : ''}
        <button class="btn ${s ? '' : 'primary'}" data-a="new">Permainan Baru</button>
        <button class="btn" data-a="settings">Pengaturan</button>
        <button class="btn" data-a="help">Kontrol</button>
      </div>
      <div class="ver">v0.1 · Three.js · progres disimpan otomatis di perangkat ini</div>`, 'title-screen');
    el.querySelector('[data-a=continue]')?.addEventListener('click', () => { this.g.audio.init(); this.g.continueGame(); });
    $(el, '[data-a=new]').addEventListener('click', () => {
      this.g.audio.init();
      if (!s) { this.showNewGame(); return; }
      const c = this.screen(`<div class="panel"><h2>Mulai dari awal?</h2><p>Progres lama (level ${s.level}) akan ditimpa saat permainan baru dimulai.</p>
        <div class="row"><button class="btn" data-a="no">Batal</button><button class="btn primary" data-a="yes">Ya, mulai baru</button></div></div>`);
      $(c, '[data-a=no]').addEventListener('click', () => this.showTitle(true));
      $(c, '[data-a=yes]').addEventListener('click', () => this.showNewGame());
    });
    $(el, '[data-a=settings]').addEventListener('click', () => this.showSettings(() => this.showTitle(hasSave)));
    $(el, '[data-a=help]').addEventListener('click', () => this.showHelp(() => this.showTitle(hasSave)));
  }

  private showNewGame() {
    let mode: GameMode = 'santai';
    const sp = SPECIES[0];
    let colors = { ...sp.colors };
    const el = this.screen(`
      <div class="panel">
        <button class="close" data-a="back">✕</button>
        <h2>Burung Baru</h2>
        <p>Pilih cara bermain. Kamu bisa membuka jenis burung lain nanti.</p>
        <h3>Mode</h3>
        <div class="row">
          <button class="card sel" data-mode="santai"><b>🌤 Santai</b><small>Lapar & haus tidak menghukum, predator tidak menyerang. Fokus menjelajah.</small></button>
          <button class="card" data-mode="petualangan"><b>🦅 Petualangan</b><small>Stamina, lapar, haus, dan predator yang menjaga wilayahnya.</small></button>
        </div>
        <h3>Warna bulu — ${sp.name}</h3>
        <div class="swatches"></div>
        <div class="colors"></div>
        <button class="btn primary" data-a="start" style="margin-top:18px">Mulai Terbang</button>
      </div>`);
    el.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode as GameMode;
      el.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('sel', x === b));
    }));
    this.colorPicker($(el, '.swatches'), $(el, '.colors'), sp.colors, colors, (c) => (colors = c));
    $(el, '[data-a=back]').addEventListener('click', () => this.showTitle(!!loadSave()));
    $(el, '[data-a=start]').addEventListener('click', () => this.g.newGame(mode, sp.id, colors));
  }

  private colorPicker(sw: HTMLElement, inputs: HTMLElement, base: SaveData['colors'], cur: SaveData['colors'], onChange: (c: SaveData['colors']) => void) {
    const render = () => {
      sw.innerHTML = COLOR_PRESETS.map((p, i) => {
        const c = p.body ? p : base;
        return `<button class="sw" data-i="${i}"><i style="background:${c.body}"></i><i style="background:${c.wing}"></i><i style="background:${c.belly}"></i>${p.name}</button>`;
      }).join('');
      inputs.innerHTML = (['body', 'wing', 'belly', 'beak'] as const).map((k) => `<label>${{ body: 'Badan', wing: 'Sayap', belly: 'Perut', beak: 'Paruh' }[k]}<input type="color" data-k="${k}" value="${cur[k]}"></label>`).join('');
      sw.querySelectorAll<HTMLElement>('[data-i]').forEach((b) => b.addEventListener('click', () => {
        const p = COLOR_PRESETS[+b.dataset.i!];
        cur = p.body ? { body: p.body, wing: p.wing, belly: p.belly, beak: p.beak } : { ...base };
        onChange(cur); render();
      }));
      inputs.querySelectorAll<HTMLInputElement>('input').forEach((inp) => inp.addEventListener('input', () => {
        cur = { ...cur, [inp.dataset.k!]: inp.value };
        onChange(cur);
      }));
    };
    render();
  }

  showPause() {
    const g = this.g;
    const pts = g.progress.skillPoints;
    const el = this.screen(`
      <div class="panel">
        <h2>Jeda</h2>
        <p>Level ${g.progress.level} · ${Math.round(g.progress.exploredPct() * 100)}% dunia terjelajah · ${g.secretsFound()}/6 rahasia · ${g.progress.rescued.size}/5 burung tertolong</p>
        <button class="btn primary" data-a="resume">Lanjutkan Terbang</button>
        <button class="btn" data-a="skills">Skill ${pts ? `<span style="color:var(--accent)">· ${pts} poin tersedia</span>` : ''}</button>
        <button class="btn" data-a="bird">Burung & Warna</button>
        <button class="btn" data-a="map">Peta</button>
        <button class="btn" data-a="settings">Pengaturan</button>
        <button class="btn" data-a="help">Kontrol</button>
        <button class="btn" data-a="quit">Simpan & ke Menu Utama</button>
      </div>`);
    $(el, '[data-a=resume]').addEventListener('click', () => g.resume());
    $(el, '[data-a=skills]').addEventListener('click', () => this.showSkills());
    $(el, '[data-a=bird]').addEventListener('click', () => this.showBird());
    $(el, '[data-a=map]').addEventListener('click', () => this.showMap());
    $(el, '[data-a=settings]').addEventListener('click', () => this.showSettings(() => this.showPause()));
    $(el, '[data-a=help]').addEventListener('click', () => this.showHelp(() => this.showPause()));
    $(el, '[data-a=quit]').addEventListener('click', () => g.quitToTitle());
  }

  showSkills() {
    const g = this.g;
    const pts = g.progress.skillPoints;
    const row = (icon: string, name: string, desc: string, lvl: number, max: number, extra: string, id: string, kind: string) => `
      <div class="skillrow"><div class="ic">${icon}</div><div class="tx"><b>${name} <span class="dots">${'●'.repeat(lvl)}${'○'.repeat(max - lvl)}</span></b><small>${desc}${extra ? ' · ' + extra : ''}</small></div>
      <button class="btn ${pts > 0 && lvl < max ? 'primary' : ''}" data-${kind}="${id}" ${pts > 0 && lvl < max ? '' : 'disabled'}>${lvl >= max ? 'Maks' : '+1'}</button></div>`;
    const el = this.screen(`
      <div class="panel wide">
        <button class="close" data-a="back">✕</button>
        <h2>Skill</h2>
        <p>Poin skill: <b style="color:var(--accent)">${pts}</b> — dapatkan 1 poin setiap naik level (XP dari eksplorasi, tantangan, menolong burung, dan membangun sarang).</p>
        <h3>Aktif</h3>
        ${ACTIVES.map((a) => row(a.icon, `${a.name} <small style="font-weight:400;color:var(--ink-soft)">[${a.key}]</small>`, a.desc, g.skills.levels[a.id], MAX_ACTIVE, `${a.levelText[g.skills.levels[a.id] - 1]} · cooldown ${g.skills.maxCd(a.id)} dtk${a.cost ? ` · stamina ${a.cost}` : ''}`, a.id, 'act')).join('')}
        <h3>Pasif</h3>
        ${PASSIVES.map((p) => row(p.icon, p.name, p.desc, g.skills.passives[p.id], MAX_PASSIVE, p.perLevel, p.id, 'pas')).join('')}
      </div>`);
    $(el, '[data-a=back]').addEventListener('click', () => (g.state === 'paused' ? this.showPause() : g.resume()));
    el.querySelectorAll<HTMLElement>('[data-act]').forEach((b) => b.addEventListener('click', () => { g.upgradeActive(b.dataset.act as ActiveId); this.showSkills(); }));
    el.querySelectorAll<HTMLElement>('[data-pas]').forEach((b) => b.addEventListener('click', () => { g.upgradePassive(b.dataset.pas as never); this.showSkills(); }));
  }

  private showBird() {
    const g = this.g;
    const save = g.save!;
    const cur = SPECIES.find((s) => s.id === save.species) ?? SPECIES[0];
    const el = this.screen(`
      <div class="panel wide">
        <button class="close" data-a="back">✕</button>
        <h2>Burung & Warna</h2>
        <h3>Jenis burung</h3>
        <div class="grid3">${SPECIES.map((s) => {
          const un = g.isUnlocked(s);
          return `<button class="card ${s.id === cur.id ? 'sel' : ''} ${un ? '' : 'locked'}" data-sp="${s.id}" ${un ? '' : 'disabled'}><b>${un ? '' : '🔒 '}${s.name}</b><small>${s.desc}</small><small style="margin-top:4px">${un ? '✦ ' + s.special : s.unlock.text}</small></button>`;
        }).join('')}</div>
        <h3>Warna bulu</h3>
        <div class="swatches"></div>
        <div class="colors"></div>
      </div>`);
    el.querySelectorAll<HTMLElement>('[data-sp]').forEach((b) => b.addEventListener('click', () => {
      g.setSpecies(b.dataset.sp!);
      const sp = SPECIES.find((s) => s.id === b.dataset.sp)!;
      g.setColors({ ...sp.colors });
      this.showBird();
    }));
    this.colorPicker($(el, '.swatches'), $(el, '.colors'), cur.colors, { ...save.colors, body: save.colors.body || cur.colors.body, wing: save.colors.wing || cur.colors.wing, belly: save.colors.belly || cur.colors.belly, beak: save.colors.beak || cur.colors.beak }, (c) => g.setColors(c));
    $(el, '[data-a=back]').addEventListener('click', () => this.showPause());
  }

  showSettings(back: () => void) {
    const g = this.g, s = g.settings;
    const el = this.screen(`
      <div class="panel">
        <button class="close" data-a="back">✕</button>
        <h2>Pengaturan</h2>
        <h3>Grafis</h3>
        <div class="set"><label>Preset</label><div class="seg">${(['low', 'medium', 'high'] as QualityName[]).map((q) => `<button data-q="${q}" class="${s.quality === q ? 'on' : ''}">${QUALITY[q].label}</button>`).join('')}</div></div>
        <div class="set"><label>Jarak pandang adaptif</label><input type="checkbox" data-k="adaptive" ${s.adaptive ? 'checked' : ''}></div>
        <div class="set"><label>Tampilkan FPS</label><input type="checkbox" data-k="showFps" ${s.showFps ? 'checked' : ''}></div>
        <h3>Audio</h3>
        <div class="set"><label>Volume utama</label><input type="range" min="0" max="1" step="0.05" data-r="master" value="${s.master}"></div>
        <div class="set"><label>Efek suara</label><input type="range" min="0" max="1" step="0.05" data-r="sfx" value="${s.sfx}"></div>
        <div class="set"><label>Suasana (angin, air, hewan)</label><input type="range" min="0" max="1" step="0.05" data-r="ambient" value="${s.ambient}"></div>
        <h3>Kontrol</h3>
        <div class="set"><label>Sensitivitas kamera</label><input type="range" min="0.3" max="2.5" step="0.1" data-r="sensitivity" value="${s.sensitivity}"></div>
        <div class="set"><label>Balik sumbu Y kamera</label><input type="checkbox" data-k="invertY" ${s.invertY ? 'checked' : ''}></div>
        <h3>Dunia</h3>
        <div class="set"><label>Lama satu hari</label><div class="seg">${[10, 20, 40].map((m) => `<button data-d="${m}" class="${s.dayMinutes === m ? 'on' : ''}">${m} mnt</button>`).join('')}</div></div>
        <button class="btn danger" data-a="reset" style="margin-top:16px">Hapus semua progres</button>
      </div>`);
    el.querySelectorAll<HTMLElement>('[data-q]').forEach((b) => b.addEventListener('click', () => { s.quality = b.dataset.q as QualityName; g.applySettings(); this.showSettings(back); }));
    el.querySelectorAll<HTMLElement>('[data-d]').forEach((b) => b.addEventListener('click', () => { s.dayMinutes = +b.dataset.d!; g.applySettings(); this.showSettings(back); }));
    el.querySelectorAll<HTMLInputElement>('[data-k]').forEach((i) => i.addEventListener('change', () => { (s as unknown as Record<string, boolean>)[i.dataset.k!] = i.checked; g.applySettings(); }));
    el.querySelectorAll<HTMLInputElement>('[data-r]').forEach((i) => i.addEventListener('input', () => { (s as unknown as Record<string, number>)[i.dataset.r!] = +i.value; g.applySettings(); }));
    let armed = false;
    $(el, '[data-a=reset]').addEventListener('click', (e) => {
      if (!armed) { armed = true; (e.target as HTMLElement).textContent = 'Klik sekali lagi untuk menghapus permanen'; return; }
      g.resetProgress();
    });
    $(el, '[data-a=back]').addEventListener('click', back);
  }

  showHelp(back: () => void) {
    const el = this.screen(`
      <div class="panel">
        <button class="close" data-a="back">✕</button>
        <h2>Kontrol</h2>
        <h3>PC</h3>
        <div class="keys">
          <kbd>W / S</kbd><span>Kepak maju / mengerem</span>
          <kbd>A / D · Mouse</kbd><span>Berbelok (klik layar untuk mengunci mouse)</span>
          <kbd>Space</kbd><span>Mengepak naik · lepas landas</span>
          <kbd>Ctrl / C</kbd><span>Menukik (hindari Ctrl+W: menutup tab)</span>
          <kbd>Q</kbd><span>Meluncur hemat stamina</span>
          <kbd>E</kbd><span>Interaksi: bertengger, makan, minum, ranting, sarang</span>
          <kbd>Shift / 1</kbd><span>Wind Dash</span>
          <kbd>2 / V</kbd><span>Sky Vision</span>
          <kbd>3 / R</kbd><span>Updraft</span>
          <kbd>4</kbd><span>Flock Call</span>
          <kbd>5 / F</kbd><span>Evasive Roll</span>
          <kbd>M</kbd><span>Peta</span>
          <kbd>K / Tab</kbd><span>Skill</span>
          <kbd>P · H</kbd><span>Mode foto · sembunyikan UI</span>
          <kbd>Esc</kbd><span>Jeda</span>
        </div>
        <h3>HP</h3>
        <div class="keys">
          <kbd>Joystick kiri</kbd><span>Kiri/kanan berbelok · atas mengepak maju · bawah mengerem</span>
          <kbd>▲ / ▼</kbd><span>Naik / menukik</span>
          <kbd>Luncur</kbd><span>Aktif/nonaktif meluncur</span>
          <kbd>E</kbd><span>Interaksi (menyala bila ada yang bisa dilakukan)</span>
          <kbd>Geser kanan</kbd><span>Putar kamera</span>
        </div>
        <h3>Tips</h3>
        <p>Arus udara naik muncul di lereng & tebing yang menghadap angin, serta kolom termal di siang hari (partikel putih). Terbang searah angin lebih cepat. Bayangan bulat di bawahmu membantu mendarat.</p>
      </div>`);
    $(el, '[data-a=back]').addEventListener('click', back);
  }

  // ---------------- peta ----------------
  setMapImage(img: Uint8ClampedArray, size: number) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(img), size, size), 0, 0);
    this.mapImg = c;
  }

  showMap() {
    document.exitPointerLock?.();
    const g = this.g;
    const d = g.mapData();
    const el = this.screen(`
      <div>
        <div class="map-side">
          <div class="map-wrap"><canvas width="640" height="640"></canvas></div>
          <div class="panel map-legend">
            <button class="close" data-a="back">✕</button>
            <h2>Peta</h2>
            <p>${Math.round(g.progress.exploredPct() * 100)}% terjelajah</p>
            <div>➤ Posisimu</div>
            <div>🪺 ${d.nest ? `${NEST_NAMES[Math.max(0, d.nest.level - 1)]} (${d.nest.twigs}/${NEST_LEVELS[Math.min(4, d.nest.level)]} ranting)` : 'Belum ada sarang — kumpulkan 2 ranting'}</div>
            <div>◎ Tantangan (${Object.keys(g.progress.courses).length}/${g.challenges.courses.length} selesai)</div>
            <div>✨ Rahasia: ${g.secretsFound()}/6</div>
            <div>🐤 Burung tertolong: ${g.progress.rescued.size}/5</div>
            <h3>Tantangan</h3>
            ${g.challenges.courses.map((c) => `<div>${g.progress.courses[c.id] !== undefined ? '✔' : '○'} ${c.name}${g.progress.courses[c.id] !== undefined ? ` · ${g.progress.courses[c.id].toFixed(1)} dtk` : ''}</div>`).join('')}
            <button class="btn primary" data-a="close" style="margin-top:14px">Kembali terbang</button>
          </div>
        </div>
      </div>`);
    const cv = $(el, 'canvas') as HTMLCanvasElement;
    const ctx = cv.getContext('2d')!;
    const S = cv.width;
    const toPx = (x: number, z: number) => [((x + 2048) / 4096) * S, ((z + 2048) / 4096) * S];
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(0, 0, S, S);
    if (this.mapImg) { ctx.imageSmoothingEnabled = true; ctx.drawImage(this.mapImg, 0, 0, S, S); }
    // kabut area belum terjelajah
    const cs = S / GRID;
    for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
      if (d.explored[j * GRID + i]) continue;
      ctx.fillStyle = (i + j) % 2 ? '#e3d6b8' : '#e8dcc0';
      ctx.fillRect(i * cs - 0.5, j * cs - 0.5, cs + 1, cs + 1);
    }
    ctx.font = '18px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const c of d.courses) { const [x, y] = toPx(c.x, c.z); ctx.fillStyle = c.best !== undefined ? '#2a8a4a' : '#c9861a'; ctx.fillText('◎', x, y); }
    for (const p of d.pois) { const [x, y] = toPx(p.x, p.z); ctx.fillText(p.icon, x, y); ctx.font = '11px system-ui'; ctx.fillStyle = '#2a2a2a'; ctx.fillText(p.name, x, y + 15); ctx.font = '18px system-ui'; }
    if (d.nest) { const [x, y] = toPx(d.nest.x, d.nest.z); ctx.fillText('🪺', x, y); }
    for (const c of d.chicks) { const [x, y] = toPx(c.x, c.z); ctx.fillText('🏠', x, y); }
    const [px, py] = toPx(d.player.x, d.player.z);
    ctx.save(); ctx.translate(px, py); ctx.rotate(-d.yaw + Math.PI);
    ctx.fillStyle = '#d2403a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(7, 8); ctx.lineTo(0, 4); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#2a2a2a'; ctx.font = 'bold 14px system-ui'; ctx.fillText('U', S / 2, 12);
    const close = () => { this.g.state = 'playing'; this.hideScreens(); };
    $(el, '[data-a=back]').addEventListener('click', close);
    $(el, '[data-a=close]').addEventListener('click', close);
  }

  // ---------------- mode foto ----------------
  showPhoto() {
    this.hud.classList.add('hidden');
    this.touch.classList.add('hidden');
    this.markers.classList.add('hidden');
    const sky = this.g.world.sky;
    const el = this.screen(`
      <div class="flash"></div>
      <div class="photobar">
        <button data-a="exit">✕ Keluar</button>
        <button data-a="shot">📸 Ambil foto</button>
        <button data-a="ui">👁 Sembunyikan bar</button>
        <label>Jam <input type="range" min="0" max="24" step="0.25" value="${sky.timeOfDay}" data-a="tod"></label>
        <label>Zoom <input type="range" min="2" max="30" step="0.5" value="${this.g.camera.photoDist}" data-a="zoom"></label>
      </div>`, '');
    el.style.pointerEvents = 'none';
    el.style.alignItems = 'end';
    // geser layar untuk memutar kamera di mode foto
    let drag: { id: number; x: number; y: number } | null = null;
    const cv = this.g.renderer.domElement;
    const down = (e: PointerEvent) => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      this.g.input.camDX += (e.clientX - drag.x) * 0.006; this.g.input.camDY += (e.clientY - drag.y) * 0.005;
      drag.x = e.clientX; drag.y = e.clientY;
    };
    const up = () => (drag = null);
    const wheel = (e: WheelEvent) => { this.g.camera.photoDist = Math.max(2, Math.min(30, this.g.camera.photoDist + e.deltaY * 0.01)); };
    cv.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); cv.addEventListener('wheel', wheel, { passive: true });
    this.photoCleanup = () => { cv.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); cv.removeEventListener('wheel', wheel); };
    const bar = $(el, '.photobar');
    $(el, '[data-a=exit]').addEventListener('click', () => this.g.exitPhoto());
    $(el, '[data-a=ui]').addEventListener('click', () => { bar.style.opacity = '0'; setTimeout(() => (bar.style.opacity = '1'), 4000); });
    $(el, '[data-a=shot]').addEventListener('click', () => {
      bar.style.visibility = 'hidden';
      const url = this.g.capturePhoto();
      bar.style.visibility = '';
      const a = document.createElement('a');
      a.href = url; a.download = `wings-of-the-wild-${Date.now()}.png`; a.click();
      const f = $(el, '.flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 50);
    });
    ($(el, '[data-a=tod]') as HTMLInputElement).addEventListener('input', (e) => { sky.timeOfDay = +(e.target as HTMLInputElement).value; });
    ($(el, '[data-a=zoom]') as HTMLInputElement).addEventListener('input', (e) => { this.g.camera.photoDist = +(e.target as HTMLInputElement).value; });
  }
  private photoCleanup: (() => void) | null = null;
  hidePhoto() {
    this.photoCleanup?.(); this.photoCleanup = null;
    this.hideScreens();
    this.enterGame();
  }
}
