// Orkestrasi game: loop, sistem, kebutuhan, interaksi, progres, simpan/muat.
import * as THREE from 'three';
import { Input } from './core/input';
import { clamp, damp } from './core/noise';
import { ChunkManager } from './world/chunks';
import { World } from './world/world';
import { heightAt, waterHeightAt, LAKE } from './world/terrain';
import { Player } from './player/player';
import { BirdModel } from './player/birdModel';
import { FollowCamera } from './player/camera';
import { NPCs } from './ai/npcs';
import { Pickups, FOOD_VALUE, KIND_NAME, type Item } from './gameplay/pickups';
import { Challenges } from './gameplay/challenges';
import { Rescue } from './gameplay/rescue';
import { Nest, NEST_NAMES } from './gameplay/nest';
import { Progress } from './gameplay/progress';
import { Skills, type ActiveId, type PassiveId, MAX_ACTIVE, MAX_PASSIVE } from './gameplay/skills';
import { SPECIES, type Species } from './gameplay/species';
import { Audio } from './audio/audio';
import { UI } from './ui/ui';
import { QUALITY } from './quality';
import { loadSave, writeSave, newSave, loadSettings, writeSettings, type SaveData, type Settings, type GameMode, deleteSave } from './save/save';

export type GameState = 'loading' | 'title' | 'playing' | 'paused' | 'photo';

const TUTORIAL = [
  { pc: 'Tahan <b>Space</b> untuk mengepak sayap dan naik.', touch: 'Tahan tombol <b>▲</b> untuk mengepak sayap dan naik.' },
  { pc: 'Belok dengan <b>A / D</b> atau gerakkan <b>mouse</b> (klik layar untuk mengunci mouse).', touch: 'Geser <b>joystick kiri</b> ke kiri/kanan untuk berbelok. Geser layar kanan untuk melihat sekitar.' },
  { pc: 'Tahan <b>Ctrl</b> (atau C) untuk menukik dan menambah kecepatan.', touch: 'Tahan <b>▼</b> untuk menukik dan menambah kecepatan.' },
  { pc: 'Lepas lalu tahan <b>Space</b> untuk naik memakai momentum. Tahan <b>Q</b> untuk meluncur hemat stamina.', touch: 'Tekan <b>Luncur</b> untuk meluncur hemat stamina (tekan lagi untuk berhenti).' },
  { pc: 'Tekan <b>Shift</b> untuk <b>Wind Dash</b> — melesat cepat.', touch: 'Tekan <b>💨</b> untuk <b>Wind Dash</b> — melesat cepat.' },
  { pc: 'Mendarat: perlambat dengan <b>S</b> lalu sentuh tanah, atau tekan <b>E</b> di dekat dahan/atap untuk bertengger otomatis.', touch: 'Mendarat: tarik joystick ke <b>bawah</b> untuk mengerem lalu sentuh tanah, atau tekan <b>E</b> di dekat dahan untuk bertengger otomatis.' },
  { pc: 'Lapar? Tekan <b>2</b> (Sky Vision) untuk menandai makanan, lalu mendarat di dekatnya dan tekan <b>E</b>.', touch: 'Lapar? Tekan <b>👁</b> (Sky Vision) untuk menandai makanan, lalu mendarat di dekatnya dan tekan <b>E</b>.' },
];

export class Game {
  state: GameState = 'loading';
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly input: Input;
  readonly audio = new Audio();
  readonly chunks: ChunkManager;
  readonly world: World;
  readonly player = new Player();
  model!: BirdModel;
  readonly camera: FollowCamera;
  readonly npcs: NPCs;
  readonly pickups: Pickups;
  readonly challenges: Challenges;
  rescue!: Rescue;
  readonly nest = new Nest();
  progress = new Progress();
  skills = new Skills();
  save: SaveData | null = null;
  settings: Settings;
  readonly ui: UI;
  hunger = 85; thirst = 85;
  private time = 0;
  private last = performance.now();
  private blob: THREE.Mesh;
  private updraftFx: THREE.Points;
  private saveT = 0; private saveDirty = false;
  private exploreT = 0;
  private regionName = ''; private regionT = 0;
  private promptT = 0;
  tutorialStep = -1; private tutStart = new THREE.Vector3(); private tutAcc = 0;
  private fps = { frames: 0, t: 0, value: 60, scale: 1 };
  private yawPrev = 0;
  private lastDamage = 0;
  private skimT = 0;
  stats = { cpuMs: 0, fps: 0, drawCalls: 0, triangles: 0, pixelRatio: 1, viewDist: 0 };

  constructor(canvas: HTMLCanvasElement) {
    const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.settings = loadSettings(touch);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const q = QUALITY[this.settings.quality];
    this.chunks = new ChunkManager(q);
    this.world = new World(this.scene, this.chunks);
    this.camera = new FollowCamera(innerWidth / innerHeight);
    this.input = new Input(canvas, document.getElementById('touch')!);
    this.npcs = new NPCs(q.npc);
    this.pickups = new Pickups(this.chunks);
    this.challenges = new Challenges(this.world.landmarks);
    this.scene.add(this.npcs.group, this.pickups.group, this.challenges.group, this.nest.group);
    // bayangan bulat di bawah burung (membantu mendarat)
    const bc = document.createElement('canvas'); bc.width = bc.height = 64;
    const g = bc.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, depthWrite: false }));
    this.blob.renderOrder = 2;
    this.scene.add(this.blob);
    // partikel arus udara naik
    const up = new Float32Array(60 * 3);
    const ug = new THREE.BufferGeometry(); ug.setAttribute('position', new THREE.BufferAttribute(up, 3));
    this.updraftFx = new THREE.Points(ug, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.6, depthWrite: false }));
    this.updraftFx.frustumCulled = false;
    this.scene.add(this.updraftFx);
    this.ui = new UI(this);
    this.input.onDeviceChange = () => this.ui.setDevice(this.input.lastDevice);
    this.ui.setDevice(this.input.lastDevice);
    this.applySettings();
    this.bindEvents();
    addEventListener('resize', () => this.resize());
    this.resize();
    const persist = () => { if (this.save && (this.state === 'playing' || this.state === 'paused' || this.state === 'photo')) this.saveNow(); };
    addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { persist(); this.audio.suspend(true); if (this.state === 'playing') this.pause(); }
      else this.audio.suspend(false);
    });
  }

  // ---------------- siklus hidup ----------------
  async boot() {
    this.ui.showLoading(0);
    const s = loadSave();
    const start = s ? s.pos : [60, 70, 260];
    this.player.pos.set(start[0], start[1], start[2]);
    await this.chunks.preload(start[0], start[2], (p) => this.ui.showLoading(p * 0.9));
    // render pertama untuk mengompilasi shader
    this.setupPlayerModel(SPECIES[0], SPECIES[0].colors);
    this.camera.snap(this.player);
    this.renderer.compile(this.scene, this.camera.cam);
    this.ui.showLoading(1);
    this.state = 'title';
    this.ui.showTitle(!!s);
    this.loop();
    this.chunks.requestMap(256).then((img) => this.ui.setMapImage(img, 256));
  }

  private setupPlayerModel(sp: Species, colors: SaveData['colors']) {
    const cols = { body: colors.body || sp.colors.body, wing: colors.wing || sp.colors.wing, belly: colors.belly || sp.colors.belly, beak: colors.beak || sp.colors.beak };
    if (!this.model) { this.model = new BirdModel(sp, cols); this.scene.add(this.model.root); }
    else this.model.build(sp, cols);
    this.player.setSpecies(sp, { ...this.skills.passives });
  }

  newGame(mode: GameMode, species: string, colors: SaveData['colors']) {
    this.save = newSave(mode, species, colors);
    this.startFromSave(this.save);
    this.tutorialStep = 0;
    this.tutStart.copy(this.player.pos);
    this.saveNow();
  }

  continueGame() {
    const s = loadSave();
    if (!s) return;
    this.save = s;
    this.startFromSave(s);
  }

  private startFromSave(s: SaveData) {
    this.progress = new Progress();
    this.progress.xp = s.xp; this.progress.level = s.level; this.progress.skillPoints = s.skillPoints;
    this.progress.loadExplored(s.explored);
    this.progress.found = new Set(s.found);
    this.progress.courses = { ...s.courses };
    this.progress.rescued = new Set(s.rescued);
    this.progress.fish = s.fish; this.progress.eaten = s.eaten;
    this.progress.onLevelUp = (l) => { this.ui.toast(`⭐ Naik ke level ${l}! +1 poin skill`, true); this.audio.levelUp(); this.checkUnlocks(); this.markSave(); };
    this.progress.onXp = (n, r) => { if (r) this.ui.toast(`+${n} XP · ${r}`); };
    this.skills = new Skills();
    Object.assign(this.skills.levels, s.skills);
    Object.assign(this.skills.passives, s.passives);
    if (this.rescue) this.scene.remove(this.rescue.group);
    this.rescue = new Rescue(this.progress.rescued);
    this.scene.add(this.rescue.group);
    this.bindRescue();
    const sp = SPECIES.find((x) => x.id === s.species) ?? SPECIES[0];
    this.setupPlayerModel(sp, s.colors);
    const p = this.player;
    p.pos.set(s.pos[0], s.pos[1], s.pos[2]);
    const g = heightAt(p.pos.x, p.pos.z);
    if (p.pos.y < g + 1) p.pos.y = g + 1;
    p.yaw = s.yaw; p.mode = 'fly'; p.speed = 12; p.pitch = 0;
    p.stamina = s.stamina; p.health = s.health; p.carry = s.carry;
    p.relaxed = s.mode === 'santai';
    this.npcs.setRelaxed(p.relaxed);
    this.hunger = s.hunger; this.thirst = s.thirst;
    this.nest.set(s.nest ? { ...s.nest } : null);
    this.world.sky.timeOfDay = s.time;
    this.tutorialStep = s.tutorialDone ? -1 : 0;
    this.tutStart.copy(p.pos);
    this.camera.snap(p);
    this.state = 'playing';
    this.ui.enterGame();
    this.audio.init();
    this.regionName = '';
    this.challenges.cancel('');
  }

  quitToTitle() {
    this.saveNow();
    this.state = 'title';
    this.ui.showTitle(true);
  }

  resetProgress() { deleteSave(); this.save = null; this.state = 'title'; this.ui.showTitle(false); }

  pause() { if (this.state !== 'playing') return; this.state = 'paused'; this.input.clearPressed(); document.exitPointerLock?.(); this.ui.showPause(); }
  resume() { this.state = 'playing'; this.ui.hideScreens(); this.last = performance.now(); }

  // ---------------- pengaturan ----------------
  applySettings() {
    const s = this.settings;
    const q = QUALITY[s.quality];
    this.chunks.setQuality(q);
    this.npcs.caps = q.npc;
    this.renderer.shadowMap.enabled = q.shadows;
    this.world.sky.sun.castShadow = q.shadows;
    this.model?.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = q.shadows; });
    this.scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m) m.needsUpdate = true; });
    this.fps.scale = 1;
    this.applyScale();
    this.input.sensitivity = s.sensitivity;
    this.input.invertY = s.invertY;
    this.audio.setVolumes({ master: s.master, sfx: s.sfx, ambient: s.ambient });
    this.world.sky.dayLength = s.dayMinutes * 60;
    writeSettings(s);
  }

  private applyScale() {
    const q = QUALITY[this.settings.quality];
    const pr = Math.min(devicePixelRatio || 1, q.pixelRatioCap) * (0.7 + 0.3 * this.fps.scale);
    this.renderer.setPixelRatio(pr);
    const vd = q.viewDist * (0.6 + 0.4 * this.fps.scale) * (1 + this.skills.passives.vision * 0.15);
    this.world.sky.viewDist = vd;
    this.camera.cam.far = vd + 600;
    this.camera.cam.updateProjectionMatrix();
    this.chunks.q = { ...this.chunks.q, viewDist: vd };
    this.stats.pixelRatio = pr; this.stats.viewDist = Math.round(vd);
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.cam.aspect = innerWidth / innerHeight;
    this.camera.cam.updateProjectionMatrix();
  }

  // ---------------- event dari subsistem ----------------
  private bindEvents() {
    const p = this.player;
    p.onFlap = () => this.audio.flap();
    p.onTakeoff = () => this.audio.flap();
    p.onLand = (s) => {
      this.audio.flap();
      if (this.tutorialStep === 5) this.advanceTutorial();
      if (s === 'perch' && this.nest.near(p.pos)) this.ui.toast('🪺 Di sarangmu — tekan E untuk beristirahat');
    };
    p.onCrash = (v) => {
      this.audio.crash();
      this.camera.shake = 1;
      if (!p.relaxed && v > 18) this.damage(Math.min(20, (v - 14) * 1.5), 'benturan');
    };
    p.onSplash = (vs, x, y, z) => {
      if (vs > 4 || p.speed > 20) {
        this.audio.splash();
        if (this.npcs.tryCatchFish(x, z, p.diving || vs > 8 ? 4 : 2.5)) {
          this.progress.fish++;
          const mult = p.sp.id === 'raja-udang' ? 2 : 1;
          this.eat('fish', FOOD_VALUE.fish * mult);
          this.ui.toast('🐟 Ikan tertangkap!', true);
          this.progress.addXp(10, 'menangkap ikan');
          this.checkUnlocks();
        }
      }
      void y;
    };
    const n = this.npcs;
    n.onFeed = (x, z) => {
      for (let i = 0; i < 4; i++) {
        const fx = x + (Math.random() - 0.5) * 4, fz = z + (Math.random() - 0.5) * 4;
        this.pickups.spawnDynamic('crumb', fx, heightAt(fx, fz) + 0.05, fz);
      }
      this.ui.toast('🍞 Seorang warga menaburkan remah roti untukmu');
    };
    n.onHit = (dmg, what) => {
      if (this.player.invulnerable) return;
      this.damage(dmg, what);
      this.audio.hurt();
      this.camera.shake = 1.5;
      if (this.player.mode === 'fly') this.player.speed *= 0.6;
      else { this.player.takeoff(1.4); }
    };
    n.onDodge = () => { this.ui.toast('🌀 Berhasil menghindar!', true); this.progress.addXp(15, 'menghindari predator'); };
    n.onScreech = () => { this.audio.screech(); this.ui.toast('⚠ Elang menjaga wilayah ini!'); };
    n.onMeow = () => this.audio.meow();
    const c = this.challenges;
    c.onStart = (co) => { this.ui.toast(`🏁 ${co.name} dimulai!`, true); this.audio.ring(); };
    c.onRing = () => this.audio.ring();
    c.onFail = (co, r) => { if (r) { this.ui.toast(`✖ ${co.name}: ${r}`); this.audio.fail(); } };
    c.onFinish = (co, t, medal) => {
      const best = this.progress.courses[co.id];
      const first = best === undefined;
      if (first || t < best) this.progress.courses[co.id] = t;
      const mult = medal === 'emas' ? 1.6 : medal === 'perak' ? 1.3 : medal === 'perunggu' ? 1.1 : 0.7;
      this.audio.discover();
      this.ui.toast(`${medal === 'emas' ? '🥇' : medal === 'perak' ? '🥈' : medal === 'perunggu' ? '🥉' : '✔'} ${co.name}: ${t.toFixed(1)} dtk${first ? '' : best && t < best ? ' · rekor baru!' : ''}`, true);
      this.progress.addXp(Math.round(co.xp * mult * (first ? 1 : 0.4)), co.name);
      this.markSave();
    };
  }

  private bindRescue() {
    const r = this.rescue;
    r.onPeep = () => this.audio.peep();
    r.onJoin = (c) => { this.ui.toast(`🐤 ${c.name} mengikutimu! Antar ke ${c.homeName}`, true); this.audio.peep(); };
    r.onRescued = (c) => {
      this.progress.rescued.add(c.id);
      this.ui.toast(`💛 ${c.name} kembali ke kawanannya!`, true);
      this.audio.discover();
      this.progress.addXp(100, 'menolong burung');
      this.markSave();
    };
  }

  private damage(d: number, what: string) {
    const p = this.player;
    if (p.relaxed) { p.useStamina(d * 0.5); return; }
    p.health = Math.max(0, p.health - d);
    this.lastDamage = this.time;
    this.ui.toast(`💥 Terluka oleh ${what} (-${Math.round(d)})`);
    if (p.health <= 0) this.faint();
  }

  private faint() {
    const p = this.player;
    const n = this.nest.data;
    const dest = n ? new THREE.Vector3(n.x, n.y, n.z) : new THREE.Vector3(60, heightAt(60, 260) + 1, 260);
    p.pos.copy(dest); p.mode = n ? 'perch' : 'ground'; p.speed = 0;
    if (!n) p.pos.y = heightAt(dest.x, dest.z);
    p.health = 60; p.stamina = p.maxStamina * 0.6; p.carry = 0;
    this.hunger = Math.max(this.hunger, 40); this.thirst = Math.max(this.thirst, 40);
    this.camera.snap(p);
    this.ui.toast(n ? '😵 Kamu pingsan dan terbangun di sarang. Ranting yang dibawa hilang.' : '😵 Kamu pingsan dan terbangun di padang. Bangun sarang sebagai titik kembali!', true);
    this.challenges.cancel('');
  }

  private eat(kind: string, value: number) {
    this.hunger = Math.min(100, this.hunger + value);
    this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + (this.player.sp.id === 'pipit' ? 25 : 15));
    this.player.health = Math.min(100, this.player.health + 5);
    this.progress.eaten++;
    this.audio.pickup();
    if (this.tutorialStep === 6) this.advanceTutorial();
    void kind;
  }

  private markSave() { this.saveDirty = true; }

  saveNow() {
    if (!this.save) return;
    const s = this.save, p = this.player;
    s.pos = [p.pos.x, p.mode === 'fly' ? p.pos.y : p.pos.y + 0.5, p.pos.z];
    s.yaw = p.yaw;
    s.species = p.sp.id;
    s.xp = this.progress.xp; s.level = this.progress.level; s.skillPoints = this.progress.skillPoints;
    s.skills = { ...this.skills.levels }; s.passives = { ...this.skills.passives };
    s.nest = this.nest.data ? { ...this.nest.data } : null;
    s.carry = p.carry; s.hunger = this.hunger; s.thirst = this.thirst; s.health = p.health; s.stamina = p.stamina;
    s.explored = this.progress.serializeExplored();
    s.found = [...this.progress.found];
    s.courses = { ...this.progress.courses };
    s.rescued = [...this.progress.rescued];
    s.fish = this.progress.fish; s.eaten = this.progress.eaten;
    s.time = this.world.sky.timeOfDay;
    s.tutorialDone = this.tutorialStep < 0;
    const ok = writeSave(s);
    this.saveDirty = false; this.saveT = 0;
    this.ui.saved(ok);
  }

  // ---------------- progres & kustomisasi ----------------
  isUnlocked(sp: Species): boolean {
    const u = sp.unlock;
    if (u.type === 'start') return true;
    if (u.type === 'level') return this.progress.level >= u.value;
    if (u.type === 'fish') return this.progress.fish >= u.value;
    return this.secretsFound() >= u.value;
  }
  secretsFound() { return this.world.landmarks.pois.filter((p) => p.kind === 'secret' && this.progress.found.has(p.id)).length; }
  private unlockedCache = new Set<string>();
  checkUnlocks() {
    for (const sp of SPECIES) {
      const u = this.isUnlocked(sp);
      if (u && !this.unlockedCache.has(sp.id)) {
        if (this.unlockedCache.size > 0 && sp.unlock.type !== 'start') this.ui.toast(`🔓 Jenis burung baru: ${sp.name}! (Menu → Burung & Warna)`, true);
        this.unlockedCache.add(sp.id);
      }
    }
  }

  setSpecies(id: string) {
    const sp = SPECIES.find((s) => s.id === id);
    if (!sp || !this.isUnlocked(sp) || !this.save) return;
    this.save.species = id;
    this.setupPlayerModel(sp, this.save.colors);
    this.applySettings();
    this.markSave();
  }
  setColors(c: SaveData['colors']) {
    if (!this.save) return;
    this.save.colors = c;
    this.setupPlayerModel(this.player.sp, c);
    this.markSave();
  }

  upgradeActive(id: ActiveId) {
    if (this.progress.skillPoints < 1 || this.skills.levels[id] >= MAX_ACTIVE) return;
    this.skills.levels[id]++; this.progress.skillPoints--;
    this.markSave();
  }
  upgradePassive(id: PassiveId) {
    if (this.progress.skillPoints < 1 || this.skills.passives[id] >= MAX_PASSIVE) return;
    this.skills.passives[id]++; this.progress.skillPoints--;
    this.player.setSpecies(this.player.sp, { ...this.skills.passives });
    if (id === 'vision') this.applyScale();
    this.markSave();
  }

  // ---------------- tutorial ----------------
  tutorialText(): string | null {
    if (this.tutorialStep < 0) return null;
    if (this.tutorialStep >= TUTORIAL.length) return 'Selamat terbang! Bangun sarang dari ranting, ikuti cincin emas untuk tantangan, dan temukan rahasia. Buka peta dengan <b>M</b> / <b>🗺</b>.';
    const t = TUTORIAL[this.tutorialStep];
    return this.input.lastDevice === 'touch' ? t.touch : t.pc;
  }
  advanceTutorial() {
    if (this.tutorialStep < 0) return;
    this.tutorialStep++;
    this.tutStart.copy(this.player.pos);
    this.tutAcc = 0;
    this.audio.ring();
    if (this.tutorialStep === TUTORIAL.length) {
      this.progress.addXp(30, 'tutorial selesai');
      setTimeout(() => { if (this.tutorialStep >= TUTORIAL.length) { this.tutorialStep = -1; this.markSave(); } }, 9000);
    }
  }
  skipTutorial() { this.tutorialStep = -1; this.markSave(); }

  private updateTutorial(dt: number) {
    const s = this.tutorialStep, p = this.player;
    if (s < 0 || s >= TUTORIAL.length) return;
    if (s === 0) { if (p.flapping) this.tutAcc += dt; if (this.tutAcc > 1.4 || p.pos.y - this.tutStart.y > 12) this.advanceTutorial(); }
    else if (s === 1) { this.tutAcc += Math.abs(p.yaw - this.yawPrev) % 1; if (this.tutAcc > 2.2) this.advanceTutorial(); }
    else if (s === 2 && p.speed > 27) this.advanceTutorial();
    else if (s === 3) { if (p.gliding || (p.flapping && p.speed > 20)) this.tutAcc += dt; if (this.tutAcc > 1.5) this.advanceTutorial(); }
    else if (s === 6 && this.hunger > 98) this.advanceTutorial();
  }

  // ---------------- skill ----------------
  useSkill(id: ActiveId) {
    const p = this.player, sk = this.skills;
    if (!sk.ready(id) || this.state !== 'playing') return;
    const def = sk.def(id);
    if (def.cost > 0 && p.stamina < def.cost * 0.5) { this.ui.toast('Stamina tidak cukup'); return; }
    switch (id) {
      case 'dash': p.dash(); this.audio.whoosh(); this.camera.shake = 0.4; if (this.tutorialStep === 4) this.advanceTutorial(); break;
      case 'vision': sk.visionT = sk.visionDuration(); this.audio.skill(); break;
      case 'updraft': p.updraftBoost(sk.updraftPower()); this.audio.whoosh(); break;
      case 'call': {
        sk.callT = sk.callDuration();
        this.audio.myCall();
        const n = this.npcs.callFlock(p.pos, sk.callRadius(), sk.callDuration());
        const c = this.rescue.callAll(p.pos, sk.callRadius());
        this.ui.toast(n + c > 0 ? `🎶 ${n} burung ${c ? `dan ${c} anak burung ` : ''}ikut terbang bersamamu` : '🎶 Tidak ada burung di dekatmu');
        break;
      }
      case 'roll': if (!p.roll(this.input.turn >= 0 ? 1 : -1)) return; this.audio.whoosh(); break;
    }
    p.useStamina(def.cost);
    sk.trigger(id);
  }

  // ---------------- interaksi (E) ----------------
  /** Mengembalikan teks prompt & aksi yang akan dijalankan. */
  private interaction(): { text: string; run: () => void } | null {
    const p = this.player, w = this.world;
    if (p.mode === 'fly') {
      const perch = w.nearestPerch(p.pos.x, p.pos.y, p.pos.z, 14, p.forwardDir);
      if (perch) return { text: 'Bertengger', run: () => p.startLanding(perch.x, perch.y, perch.z, true) };
      const g = w.surfaceAt(p.pos.x, p.pos.z, p.pos.y);
      if (p.pos.y - g < 12 && w.waterAt(p.pos.x, p.pos.z) < g) return { text: 'Mendarat', run: () => p.startLanding(p.pos.x + Math.sin(p.yaw) * 3, w.surfaceAt(p.pos.x + Math.sin(p.yaw) * 3, p.pos.z + Math.cos(p.yaw) * 3, p.pos.y), p.pos.z + Math.cos(p.yaw) * 3, false) };
      return null;
    }
    if (p.mode === 'landing') return null;
    const chick = this.rescue.nearLost(p.pos, 7);
    if (chick) return { text: `Ajak ${chick.name}`, run: () => this.rescue.join(chick) };
    const nd = this.nest.data;
    if (nd && this.nest.near(p.pos) && p.carry > 0) return {
      text: `Tambahkan ${p.carry} ranting ke sarang`, run: () => {
        const up = this.nest.add(p.carry);
        this.progress.addXp(p.carry * 4, 'membangun sarang');
        p.carry = 0; this.audio.twig();
        if (up) { this.ui.toast(`🪺 ${NEST_NAMES[this.nest.data!.level - 1]}! (level ${this.nest.data!.level})`, true); this.progress.addXp(50, 'sarang meningkat'); this.audio.levelUp(); }
        this.markSave();
      },
    };
    const item = this.pickups.nearest(p.pos.x, p.pos.y, p.pos.z, 2.8);
    if (item) {
      if (item.kind === 'twig') {
        if (p.carry >= p.capacity) return { text: `Paruh penuh (${p.carry}/${p.capacity}) — bawa ke sarang`, run: () => { } };
        return { text: `Ambil ranting (${p.carry}/${p.capacity})`, run: () => { this.pickups.take(item); p.carry++; p.peck = 0.4; this.audio.twig(); this.progress.addXp(2, ''); } };
      }
      return { text: `Makan ${KIND_NAME[item.kind]}`, run: () => this.eatItem(item) };
    }
    const nearWater = this.nearWater(p.pos.x, p.pos.z, 3);
    if (nearWater && this.thirst < 97) return { text: 'Minum', run: () => { this.thirst = Math.min(100, this.thirst + 35); p.peck = 0.6; this.audio.splash(); } };
    if (!nd && p.carry >= 2) return {
      text: 'Bangun sarang di sini', run: () => {
        this.nest.build(p.pos.x, p.pos.y, p.pos.z, p.carry);
        p.carry = 0;
        this.ui.toast('🪺 Sarang dibangun! Kumpulkan ranting untuk meningkatkannya.', true);
        this.progress.addXp(60, 'sarang pertama');
        this.audio.levelUp();
        this.markSave();
      },
    };
    if (nd && p.carry >= 2 && !this.nest.near(p.pos, 30)) return {
      text: 'Pindahkan sarang ke sini', run: () => { this.nest.build(p.pos.x, p.pos.y, p.pos.z, nd.twigs + p.carry); p.carry = 0; this.ui.toast('🪺 Sarang dipindahkan'); this.markSave(); },
    };
    if (nd && this.nest.near(p.pos)) return {
      text: this.world.sky.isNight ? 'Tidur sampai pagi' : 'Beristirahat', run: () => {
        p.stamina = p.maxStamina; p.health = 100;
        if (this.world.sky.isNight) { this.world.sky.skipToMorning(); this.ui.toast('☀ Selamat pagi! Stamina & kesehatan pulih.', true); }
        else this.ui.toast('😌 Beristirahat sejenak — stamina pulih');
        this.saveNow();
      },
    };
    if (p.carry > 0 && !nd) return { text: `Butuh 2 ranting untuk sarang (${p.carry}/2)`, run: () => { } };
    return null;
  }

  private eatItem(item: Item) {
    this.pickups.take(item);
    this.player.peck = 0.6;
    this.eat(item.kind, FOOD_VALUE[item.kind] ?? 10);
    this.progress.addXp(3, '');
  }

  private nearWater(x: number, z: number, r: number) {
    for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) if (waterHeightAt(x + dx, z + dz) > heightAt(x + dx, z + dz)) return true;
    return false;
  }

  // ---------------- loop ----------------
  private loop = () => {
    requestAnimationFrame(this.loop);
    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    this.fps.frames++; this.fps.t += dt;
    if (this.fps.t >= 1) {
      this.fps.value = this.fps.frames / this.fps.t;
      this.stats.fps = Math.round(this.fps.value);
      this.fps.frames = 0; this.fps.t = 0;
      if (this.settings.adaptive && this.state === 'playing') {
        if (this.fps.value < 27 && this.fps.scale > 0) { this.fps.scale = Math.max(0, this.fps.scale - 0.15); this.applyScale(); }
        else if (this.fps.value > 52 && this.fps.scale < 1) { this.fps.scale = Math.min(1, this.fps.scale + 0.05); this.applyScale(); }
      }
    }
    this.input.update();
    const t0 = performance.now();
    if (this.state === 'playing') this.update(dt);
    else if (this.state === 'photo') this.updatePhoto(dt);
    else if (this.state === 'title' || this.state === 'loading') this.updateTitle(dt);
    this.stats.cpuMs = this.stats.cpuMs * 0.9 + (performance.now() - t0) * 0.1;
    this.renderer.render(this.scene, this.camera.cam);
    const info = this.renderer.info.render;
    this.stats.drawCalls = info.calls; this.stats.triangles = info.triangles;
    this.input.endFrame();
  };

  private updateTitle(dt: number) {
    // kamera sinematik perlahan mengitari lembah
    this.time += dt;
    const a = this.time * 0.03;
    const c = this.camera.cam;
    c.position.set(Math.cos(a) * 420 + 100, 190, Math.sin(a) * 420 - 100);
    c.lookAt(LAKE.x, 60, LAKE.z);
    this.world.sky.update(dt, c.position, new THREE.Vector3(100, 0, -100), true);
    this.world.water.update(this.time, c.position.x, c.position.z);
    this.world.landmarks.update(this.time, dt, 1 - this.world.sky.daylight);
    this.chunks.update(c.position.x, c.position.z, this.time);
    this.model.root.visible = false;
  }

  private updatePhoto(dt: number) {
    this.camera.update(this.player, this.world, this.input, dt);
    this.world.sky.update(0, this.camera.cam.position, this.player.pos, true);
  }

  private update(dt: number) {
    this.time += dt;
    const p = this.player, input = this.input, sk = this.skills;
    this.model.root.visible = true;
    this.yawPrev = p.yaw;
    // aksi diskrit
    if (input.consume('pause')) { this.pause(); return; }
    if (input.consume('map')) { this.ui.showMap(); this.state = 'paused'; document.exitPointerLock?.(); return; }
    if (input.consume('skills')) { this.state = 'paused'; document.exitPointerLock?.(); this.ui.showSkills(); return; }
    if (input.consume('photo')) { this.enterPhoto(); return; }
    if (input.consume('hideui')) this.ui.toggleHud();
    if (input.consume('dash')) this.useSkill('dash');
    if (input.consume('vision')) this.useSkill('vision');
    if (input.consume('updraft')) this.useSkill('updraft');
    if (input.consume('call')) this.useSkill('call');
    if (input.consume('roll')) this.useSkill('roll');
    const act = this.interaction();
    if (input.consume('interact') && act) act.run();
    input.consume('sleep');

    sk.update(dt);
    const followers = this.npcs.followers;
    const glideBonus = followers > 0 ? 0.25 : 0;
    p.mods = { ...sk.passives, glide: sk.passives.glide + glideBonus * 2 };
    p.update(dt, input, this.world);
    // posisi model
    const grounded = p.mode === 'ground' || p.mode === 'perch';
    const size = p.sp.size * 0.9;
    this.model.root.position.set(p.pos.x, p.pos.y + (grounded ? 0.45 * size : 0), p.pos.z);
    this.model.root.rotation.set(p.visualPitch, p.yaw, 0, 'YXZ');
    this.model.animate(p.pose(), dt);
    // bayangan bulat
    const sy = this.world.surfaceAt(p.pos.x, p.pos.z, p.pos.y + 0.5);
    const wy = this.world.waterAt(p.pos.x, p.pos.z);
    const h = p.pos.y - Math.max(sy, wy);
    this.blob.visible = h < 40;
    this.blob.position.set(p.pos.x, Math.max(sy, wy) + 0.08, p.pos.z);
    this.blob.scale.setScalar(clamp(1.4 - h * 0.02, 0.4, 1.4) * size);
    (this.blob.material as THREE.MeshBasicMaterial).opacity = clamp(1 - h / 40, 0, 1);

    this.updateNeeds(dt);
    this.updateUpdraftFx(dt);
    // tangkap serangga di udara / minum sambil terbang rendah
    if (p.mode === 'fly') {
      const ins = this.pickups.nearest(p.pos.x, p.pos.y, p.pos.z, 2.6, (k) => k === 'insect');
      if (ins) { this.eatItem(ins); this.ui.toast('🦋 Serangga tertangkap di udara!'); }
      if (wy > -Infinity && p.pos.y - wy < 1.6 && wy > heightAt(p.pos.x, p.pos.z)) {
        this.thirst = Math.min(100, this.thirst + 10 * dt);
        this.skimT += dt;
        if (this.skimT > 1.2) { this.skimT = 0; this.audio.splash(); }
      }
    }
    const night = 1 - this.world.sky.daylight;
    this.npcs.update(dt, this.time, p, this.world, night, p.dashT > 0);
    this.rescue.update(dt, this.time, p);
    this.pickups.update(dt, p.pos.x, p.pos.z);
    this.challenges.update(dt, p.pos, p.mode === 'fly' || p.mode === 'landing', this.time);
    this.chunks.update(p.pos.x, p.pos.z, this.time);
    this.world.water.update(this.time, p.pos.x, p.pos.z);
    this.world.landmarks.update(this.time, dt, night);
    this.camera.update(p, this.world, input, dt);
    this.world.sky.update(dt, this.camera.cam.position, p.pos);
    // audio ambien
    this.updateAudio(dt);
    // eksplorasi & penemuan
    this.exploreT -= dt;
    if (this.exploreT <= 0) {
      this.exploreT = 0.5;
      const n = this.progress.explore(p.pos.x, p.pos.z, sk.passives.vision >= 2 ? 2 : 1);
      if (n > 0 && this.time > 2) { this.progress.addXp(n * 3, ''); this.markSave(); }
      for (const poi of this.world.landmarks.pois) {
        if (this.progress.found.has(poi.id)) continue;
        const d = Math.hypot(p.pos.x - poi.x, (p.pos.y - poi.y) * (poi.kind === 'secret' ? 1 : 0.3), p.pos.z - poi.z);
        if (d < poi.radius + (poi.kind === 'secret' ? 0 : 25)) {
          this.progress.found.add(poi.id);
          this.audio.discover();
          this.progress.explore(poi.x, poi.z, 2);
          if (poi.kind === 'secret') { this.ui.toast(`✨ Lokasi rahasia: ${poi.name}!`, true); this.progress.addXp(120, 'rahasia ditemukan'); }
          else { this.ui.toast(`${poi.icon} Landmark ditemukan: ${poi.name}`, true); this.progress.addXp(40, 'landmark'); }
          this.checkUnlocks();
          this.markSave();
        }
      }
      const rn = this.world.regionName(p.pos.x, p.pos.z);
      if (rn !== this.regionName) {
        this.regionT += 0.5;
        if (this.regionT > 1.5) { this.regionName = rn; this.regionT = 0; this.ui.region(rn, this.world.sky.timeOfDay); }
      } else this.regionT = 0;
    }
    this.updateTutorial(dt);
    // autosave
    this.saveT += dt;
    if ((this.saveDirty && this.saveT > 3) || this.saveT > 20) this.saveNow();
    // UI
    this.promptT -= dt;
    if (this.promptT <= 0) { this.promptT = 0.15; this.ui.setPrompt(act ? act.text : null); }
    this.ui.updateHud(dt);
  }

  private updateNeeds(dt: number) {
    const p = this.player;
    const relaxed = p.relaxed;
    const fly = p.mode === 'fly' ? 1.3 : 1;
    this.hunger = Math.max(0, this.hunger - (relaxed ? 0.07 : 0.2) * fly * dt);
    this.thirst = Math.max(0, this.thirst - (relaxed ? 0.08 : 0.24) * fly * dt);
    if (relaxed) { p.staminaMul = 1; p.health = 100; return; }
    const starving = this.hunger < 20 || this.thirst < 20;
    p.staminaMul = starving ? 0.4 : 1;
    const capMul = starving ? 0.7 : 1;
    const nestBonus = this.nest.data ? 1 + this.nest.data.level * 0.04 : 1;
    p.maxStamina = p.sp.stamina * (1 + this.skills.passives.stamina * 0.2) * capMul * nestBonus;
    p.stamina = Math.min(p.stamina, p.maxStamina);
    if (this.hunger <= 0 || this.thirst <= 0) { p.health -= 0.8 * dt; if (p.health <= 0) this.faint(); }
    else if (p.mode !== 'fly' && this.hunger > 40 && this.thirst > 40 && this.time - this.lastDamage > 5) p.health = Math.min(100, p.health + 1.5 * dt);
  }

  private updateUpdraftFx(dt: number) {
    const p = this.player;
    const pos = this.updraftFx.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const strong = p.updraftNow > 2.5 && p.mode === 'fly';
    (this.updraftFx.material as THREE.PointsMaterial).opacity = damp((this.updraftFx.material as THREE.PointsMaterial).opacity, strong ? 0.7 : 0, 3, dt);
    for (let i = 0; i < 60; i++) {
      arr[i * 3 + 1] += dt * (4 + p.updraftNow);
      if (arr[i * 3 + 1] > p.pos.y + 12 || Math.abs(arr[i * 3] - p.pos.x) > 25 || Math.abs(arr[i * 3 + 2] - p.pos.z) > 25) {
        arr[i * 3] = p.pos.x + (Math.random() - 0.5) * 40;
        arr[i * 3 + 1] = p.pos.y - 15 + Math.random() * 10;
        arr[i * 3 + 2] = p.pos.z + (Math.random() - 0.5) * 40;
      }
    }
    pos.needsUpdate = true;
  }

  private waterProx = 0; private waterT = 0;
  private updateAudio(dt: number) {
    const p = this.player;
    this.waterT -= dt;
    if (this.waterT <= 0) {
      this.waterT = 0.5;
      let w = 0;
      for (const [dx, dz] of [[0, 0], [25, 0], [-25, 0], [0, 25], [0, -25], [50, 50], [-50, -50]]) {
        const wy = waterHeightAt(p.pos.x + dx, p.pos.z + dz);
        if (wy > -Infinity) w += Math.max(0, 1 - (p.pos.y - wy) / 60) / 7;
      }
      const f = this.world.landmarks.waterfallPos;
      w += Math.max(0, 1 - f.distanceTo(p.pos) / 150) * 1.5;
      this.waterProx = Math.min(1, w);
    }
    const sky = this.world.sky;
    this.audio.update(dt, p.speed, p.mode === 'fly', this.waterProx, sky.rainAmount, sky.daylight, 1 - sky.daylight, this.npcs.activeBirds.length);
  }

  // ---------------- mode foto ----------------
  enterPhoto() {
    this.state = 'photo';
    this.camera.photo = true;
    this.camera.photoDist = 6;
    this.ui.showPhoto();
  }
  exitPhoto() {
    this.camera.photo = false;
    this.state = 'playing';
    this.ui.hidePhoto();
    this.last = performance.now();
  }
  capturePhoto(): string {
    this.renderer.render(this.scene, this.camera.cam);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /** Data untuk peta. */
  mapData() {
    return {
      player: this.player.pos, yaw: this.player.yaw,
      pois: this.world.landmarks.pois.filter((p) => this.progress.found.has(p.id)),
      nest: this.nest.data,
      courses: this.challenges.courses.map((c) => ({ x: c.rings[0].x, z: c.rings[0].z, name: c.name, best: this.progress.courses[c.id] })),
      chicks: this.rescue.chicks.filter((c) => c.state === 'follow').map((c) => ({ x: c.home.x, z: c.home.z, name: c.homeName })),
      explored: this.progress.explored,
    };
  }

  /** Untuk Sky Vision. */
  visionMarkers() {
    const p = this.player.pos, r = this.skills.visionRadius();
    const out: { x: number; y: number; z: number; icon: string; cls?: string; label?: string }[] = [];
    const icons: Record<string, string> = { seed: '🌾', berry: '🍒', fruit: '🍊', insect: '🦋', twig: '🪵', crumb: '🍞' };
    let n = 0;
    this.pickups.forEach(p.x, p.z, Math.min(r, 160), (it) => { if (n++ < 24) out.push({ x: it.x, y: it.y + 0.6, z: it.z, icon: icons[it.kind] }); });
    for (const f of this.npcs.fishPositions()) if (f.distanceTo(p) < r) out.push({ x: f.x, y: f.y + 1, z: f.z, icon: '🐟' });
    for (const m of this.npcs.markers()) if (Math.hypot(m.x - p.x, m.z - p.z) < r) out.push({ x: m.x, y: m.y + 1, z: m.z, icon: m.type === 'danger' ? '⚠' : '🐦', cls: m.type === 'danger' ? 'danger' : undefined });
    if (this.nest.data && Math.hypot(this.nest.data.x - p.x, this.nest.data.z - p.z) < r * 2) out.push({ x: this.nest.data.x, y: this.nest.data.y + 1.5, z: this.nest.data.z, icon: '🪺', label: 'Sarang' });
    for (const c of this.rescue.chicks) if (c.state === 'lost' && c.pos.distanceTo(p) < r * 1.5) out.push({ x: c.pos.x, y: c.pos.y + 1.2, z: c.pos.z, icon: '🐤', label: 'Tersesat' });
    for (const poi of this.world.landmarks.pois) if (poi.kind === 'secret' && !this.progress.found.has(poi.id) && Math.hypot(poi.x - p.x, poi.z - p.z) < r) out.push({ x: poi.x, y: poi.y + 2, z: poi.z, icon: '✨', label: '???' });
    return out;
  }
}
