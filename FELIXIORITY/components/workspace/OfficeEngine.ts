// Mesin ruangan PixiJS. Dipisah dari React: React hanya memberi data saat
// roster berubah; posisi, animasi, dan label diperbarui imperatif per frame
// tanpa render ulang React.
import { Application, Assets, Container, Graphics, Sprite, TextureSource, type Spritesheet, type Ticker } from "pixi.js";
import { hashId } from "@/lib/appearance";
import {
  CHAIRS,
  COLS,
  FLOOR,
  FURNITURE,
  POIS,
  ROWS,
  RUG,
  SEATS,
  SEAT_KEY,
  TILE,
  WALL_DECOR,
  WANDER_TILES,
  WORLD_H,
  WORLD_W,
  type Facing,
} from "@/lib/workspace/layout";
import { findPath, type Tile } from "@/lib/workspace/pathfinding";
import { Camera } from "./Camera";
import { Character, type Resident } from "./Character";

export type LabelMode = "auto" | "always" | "selected";

export interface EngineCallbacks {
  onSelect: (id: number | null) => void;
}

interface Sheets {
  chars: Spritesheet;
  tiles: Spritesheet;
  furniture: Spritesheet;
}

let sheetsPromise: Promise<Sheets> | null = null;
function loadSheets(): Promise<Sheets> {
  if (!sheetsPromise) {
    TextureSource.defaultOptions.scaleMode = "nearest";
    sheetsPromise = Promise.all([
      Assets.load<Spritesheet>("/assets/characters/characters.json"),
      Assets.load<Spritesheet>("/assets/tiles/tiles.json"),
      Assets.load<Spritesheet>("/assets/furniture/furniture.json"),
    ])
      .then(([chars, tiles, furniture]) => ({ chars, tiles, furniture }))
      .catch((e) => {
        sheetsPromise = null;
        throw e;
      });
  }
  return sheetsPromise;
}

const RUG_PALETTES = [
  { fill: 0x3b2f7a, border: 0x8b5cf6 },
  { fill: 0x1f3f74, border: 0x4f7cff },
  { fill: 0x2a4a5a, border: 0x3fbfdc },
  { fill: 0x5a2a4a, border: 0xe07ab0 },
];

const key = (x: number, y: number) => `${x},${y}`;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const WALK_SPEED = 22; // px/detik — pelan

export class OfficeEngine {
  private app: Application;
  private sheets: Sheets;
  private world = new Container();
  private staticLayer = new Container();
  private actors = new Container();
  private animated: { sprite: Sprite; frames: string[] }[] = [];
  private chars = new Map<number, Character>();
  private labels = new Map<number, HTMLElement>();
  private labelCache = new Map<number, string>();
  private occ = new Map<string, number>();
  private destReserved = new Map<string, number>();
  readonly camera = new Camera(WORLD_W, WORLD_H);
  private roomIndex = -1;
  private selectedId: number | null = null;
  private hoveredId: number | null = null;
  private matches: Set<number> | null = null;
  private reducedMotion = false;
  private labelMode: LabelMode = "auto";
  private now = 0;
  private animClock = 0;
  private destroyed = false;
  private cleanup: (() => void)[] = [];
  private host: HTMLElement;
  private cb: EngineCallbacks;

  private constructor(app: Application, sheets: Sheets, host: HTMLElement, cb: EngineCallbacks) {
    this.app = app;
    this.sheets = sheets;
    this.host = host;
    this.cb = cb;
    this.actors.sortableChildren = true;
    this.world.addChild(this.staticLayer, this.actors);
    app.stage.addChild(this.world);
    app.stage.eventMode = "none";
    app.stage.interactiveChildren = false;
  }

  static async create(host: HTMLElement, cb: EngineCallbacks): Promise<OfficeEngine> {
    const sheets = await loadSheets();
    const app = new Application();
    await app.init({
      width: Math.max(1, host.clientWidth),
      height: Math.max(1, host.clientHeight),
      backgroundAlpha: 0,
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      roundPixels: true,
      preference: "webgl",
    });
    app.canvas.style.display = "block";
    app.canvas.style.width = "100%";
    app.canvas.style.height = "100%";
    host.appendChild(app.canvas);
    const engine = new OfficeEngine(app, sheets, host, cb);
    engine.attach();
    return engine;
  }

  // -------------------------------------------------------------------------
  // Siklus hidup
  // -------------------------------------------------------------------------
  private attach() {
    const { app, host } = this;
    this.camera.resize(host.clientWidth, host.clientHeight);
    const ro = new ResizeObserver(() => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      app.renderer.resize(w, h);
      this.camera.resize(w, h);
    });
    ro.observe(host);
    this.cleanup.push(() => ro.disconnect());

    const tick = (t: Ticker) => this.update(t.deltaMS);
    app.ticker.add(tick);
    this.cleanup.push(() => app.ticker.remove(tick));

    // Hentikan animasi saat tab tidak aktif.
    const onVis = () => {
      if (document.visibilityState === "visible") app.ticker.start();
      else app.ticker.stop();
    };
    document.addEventListener("visibilitychange", onVis);
    this.cleanup.push(() => document.removeEventListener("visibilitychange", onVis));

    this.attachPointer();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cleanup.forEach((f) => f());
    for (const c of this.chars.values()) c.destroy();
    this.chars.clear();
    this.app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
  }

  // -------------------------------------------------------------------------
  // Input: geser, zoom (roda/pinch), ketuk untuk memilih, keyboard
  // -------------------------------------------------------------------------
  private attachPointer() {
    const el = this.host;
    const pointers = new Map<number, { x: number; y: number }>();
    let dragged = false;
    let downAt: { x: number; y: number } | null = null;
    let pinchDist = 0;
    let pinchMid = { x: 0, y: 0 };

    const local = (e: PointerEvent | WheelEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      el.setPointerCapture(e.pointerId);
      const p = local(e);
      pointers.set(e.pointerId, p);
      if (pointers.size === 1) {
        dragged = false;
        downAt = p;
      } else if (pointers.size === 2) {
        dragged = true;
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      if (!pointers.has(e.pointerId)) {
        if (e.pointerType === "mouse") this.setHover(this.pick(p.x, p.y));
        return;
      }
      const prev = pointers.get(e.pointerId)!;
      pointers.set(e.pointerId, p);
      if (pointers.size === 1) {
        if (!dragged && downAt && Math.hypot(p.x - downAt.x, p.y - downAt.y) > 6) dragged = true;
        if (dragged) {
          this.camera.panBy(p.x - prev.x, p.y - prev.y);
          el.style.cursor = "grabbing";
        }
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (pinchDist > 0) this.camera.zoomAt(dist / pinchDist, mid.x, mid.y);
        this.camera.panBy(mid.x - pinchMid.x, mid.y - pinchMid.y);
        pinchDist = dist;
        pinchMid = mid;
      }
    };
    const onUp = (e: PointerEvent) => {
      const p = local(e);
      const wasSingle = pointers.size === 1;
      pointers.delete(e.pointerId);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (wasSingle && !dragged && e.type === "pointerup") {
        this.cb.onSelect(this.pick(p.x, p.y));
      }
      if (pointers.size === 0) {
        downAt = null;
        el.style.cursor = "";
      }
      if (pointers.size === 1) {
        const [only] = [...pointers.values()];
        downAt = only;
        pinchDist = 0;
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e);
      const factor = Math.exp(-Math.max(-120, Math.min(120, e.deltaY)) * 0.0025);
      this.camera.zoomAt(factor, p.x, p.y);
    };
    const onLeave = () => this.setHover(null);
    const onKey = (e: KeyboardEvent) => {
      const step = 40;
      const map: Record<string, () => void> = {
        ArrowLeft: () => this.camera.panBy(step, 0),
        ArrowRight: () => this.camera.panBy(-step, 0),
        ArrowUp: () => this.camera.panBy(0, step),
        ArrowDown: () => this.camera.panBy(0, -step),
        "+": () => this.camera.zoomStep(1),
        "=": () => this.camera.zoomStep(1),
        "-": () => this.camera.zoomStep(-1),
        "0": () => this.camera.reset(),
        Escape: () => this.cb.onSelect(null),
      };
      const fn = map[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("keydown", onKey);
    this.cleanup.push(() => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("keydown", onKey);
    });
  }

  private pick(sx: number, sy: number): number | null {
    const w = this.camera.screenToWorld(sx, sy);
    let best: Character | null = null;
    for (const c of this.chars.values()) {
      if (c.removing) continue;
      if (c.hit(w.x, w.y) && (!best || c.y > best.y)) best = c;
    }
    return best?.id ?? null;
  }

  private setHover(id: number | null) {
    if (id === this.hoveredId) return;
    if (this.hoveredId !== null) {
      const prev = this.chars.get(this.hoveredId);
      if (prev) prev.hovered = false;
    }
    this.hoveredId = id;
    if (id !== null) {
      const c = this.chars.get(id);
      if (c) c.hovered = true;
    }
    this.host.style.cursor = id !== null ? "pointer" : "";
  }

  // -------------------------------------------------------------------------
  // API untuk React
  // -------------------------------------------------------------------------
  setRoom(roomIndex: number, residents: Resident[]) {
    if (roomIndex !== this.roomIndex) {
      this.roomIndex = roomIndex;
      for (const c of this.chars.values()) c.destroy();
      this.chars.clear();
      this.occ.clear();
      this.destReserved.clear();
      this.labelCache.clear();
      this.buildStatic(roomIndex);
      this.hoveredId = null;
    }
    this.syncResidents(residents);
  }

  private syncResidents(residents: Resident[]) {
    const incoming = new Map(residents.map((r) => [r.id, r]));
    // Dihapus: hilang perlahan setelah sinkronisasi berhasil.
    for (const c of this.chars.values()) {
      if (!incoming.has(c.id) && !c.removing) {
        c.removing = true;
        this.release(c);
      }
    }
    for (const r of residents) {
      const seat = SEATS[r.seatIndex];
      if (!seat) continue;
      const existing = this.chars.get(r.id);
      if (existing && !existing.removing) {
        existing.resident = r;
        if (existing.seat !== seat) {
          this.release(existing);
          existing.seat = seat;
          existing.placeAtSeat();
          this.occ.set(key(seat.tx, seat.ty), existing.id);
        }
        continue;
      }
      if (existing) {
        existing.destroy();
        this.chars.delete(r.id);
      }
      const c = new Character(this.sheets.chars, r, seat);
      c.fade = this.reducedMotion ? 1 : 0;
      c.timer = rand(3000, 25000);
      c.selected = r.id === this.selectedId;
      c.dimmed = !!this.matches && !this.matches.has(r.id);
      this.chars.set(r.id, c);
      this.actors.addChild(c.root);
      this.occ.set(key(seat.tx, seat.ty), c.id);
    }
  }

  registerLabel(id: number, el: HTMLElement | null) {
    if (el) this.labels.set(id, el);
    else this.labels.delete(id);
    this.labelCache.delete(id);
  }

  setSelected(id: number | null) {
    this.selectedId = id;
    for (const c of this.chars.values()) c.selected = c.id === id;
  }

  setMatches(ids: Set<number> | null) {
    this.matches = ids;
    for (const c of this.chars.values()) c.dimmed = !!ids && !ids.has(c.id);
  }

  setLabelMode(mode: LabelMode) {
    this.labelMode = mode;
    this.labelCache.clear();
  }

  setReducedMotion(v: boolean) {
    if (v === this.reducedMotion) return;
    this.reducedMotion = v;
    this.app.ticker.maxFPS = v ? 30 : 60;
    if (v) {
      // Semua kembali duduk; tidak ada gerakan.
      this.occ.clear();
      this.destReserved.clear();
      for (const c of this.chars.values()) {
        c.placeAtSeat();
        this.occ.set(key(c.seat.tx, c.seat.ty), c.id);
      }
    }
  }

  focus(id: number) {
    const c = this.chars.get(id);
    if (c) this.camera.centerOn(c.x, c.y - 12, 2.5, this.reducedMotion);
  }

  // -------------------------------------------------------------------------
  // Dunia statis
  // -------------------------------------------------------------------------
  private buildStatic(room: number) {
    const { tiles, furniture } = this.sheets;
    for (const ch of this.staticLayer.removeChildren()) ch.destroy({ children: true });
    // Karakter sudah dihancurkan oleh setRoom; sisa anak = furnitur ruangan lama.
    for (const a of this.actors.removeChildren()) a.destroy({ children: true });
    this.animated = [];

    const add = (frame: string, sheet: Spritesheet, x: number, y: number, parent: Container = this.staticLayer) => {
      const s = new Sprite(sheet.textures[frame]);
      s.position.set(x, y);
      parent.addChild(s);
      return s;
    };

    // lantai kayu
    for (let y = FLOOR.y0; y <= FLOOR.y1; y++)
      for (let x = FLOOR.x0; x <= FLOOR.x1; x++) {
        // sambungan papan atas/bawah bergeser per baris → papan panjang yang tersusun acak-rapi
        const off = hashId(y * 31 + room * 7919) % 4;
        const top = (x + off) % 4 === 0 ? 1 : 0;
        const bottom = (x + off + 2) % 4 === 0 ? 2 : 0;
        add(`floor${top | bottom}`, tiles, x * TILE, y * TILE);
      }
    // karpet lounge
    const pal = RUG_PALETTES[room % RUG_PALETTES.length];
    const rug = new Graphics();
    rug.rect(RUG.tx * TILE + 4, RUG.ty * TILE + 4, RUG.w * TILE - 8, RUG.h * TILE - 8).fill(pal.border);
    rug.rect(RUG.tx * TILE + 6, RUG.ty * TILE + 6, RUG.w * TILE - 12, RUG.h * TILE - 12).fill(pal.fill);
    rug.rect(RUG.tx * TILE + 9, RUG.ty * TILE + 9, RUG.w * TILE - 18, RUG.h * TILE - 18).stroke({ color: pal.border, width: 1, alpha: 0.6 });
    this.staticLayer.addChild(rug);
    // dinding
    for (let x = 0; x < COLS; x++) {
      add("wall_top", tiles, x * TILE, 0);
      add(`wall${(x + room) % 3 === 0 ? 1 : 0}`, tiles, x * TILE, TILE);
      add("wall_bottom", tiles, x * TILE, (ROWS - 1) * TILE);
    }
    for (let y = 0; y < ROWS; y++) {
      add("wall_side", tiles, 0, y * TILE);
      add("wall_side", tiles, (COLS - 1) * TILE, y * TILE);
    }
    for (const d of WALL_DECOR) {
      const s = add(d.frame, furniture, d.x, d.y);
      if (d.frame === "sign") s.tint = [0xffffff, 0xc7d2ff, 0xd8c7ff, 0xc7f0ff][room % 4];
    }
    // bayangan lembut di bawah dinding atas
    const shade = new Graphics();
    shade.rect(TILE, 3 * TILE, (COLS - 2) * TILE, 3).fill({ color: 0x000000, alpha: 0.18 });
    this.staticLayer.addChild(shade);

    // furnitur & kursi (diurutkan bersama karakter)
    for (const ch of CHAIRS) {
      const s = add("chair", furniture, ch.x, ch.y, this.actors);
      s.zIndex = ch.sortY;
    }
    for (const f of FURNITURE) {
      const s = add(f.frame, furniture, f.x, f.y, this.actors);
      s.zIndex = f.sortY;
      if (f.anim) this.animated.push({ sprite: s, frames: f.anim });
    }
  }

  // -------------------------------------------------------------------------
  // Loop per frame
  // -------------------------------------------------------------------------
  private update(deltaMS: number) {
    if (this.destroyed) return;
    const dt = Math.min(deltaMS, 100);
    this.now += dt;
    this.camera.step(dt, this.reducedMotion);
    this.world.scale.set(this.camera.zoom);
    this.world.position.set(Math.round(this.camera.x), Math.round(this.camera.y));

    if (!this.reducedMotion) {
      this.animClock += dt;
      if (this.animClock > 700) {
        this.animClock = 0;
        const phase = Math.floor(this.now / 700);
        for (const a of this.animated) a.sprite.texture = this.sheets.furniture.textures[a.frames[phase % a.frames.length]];
      }
      let walkers = 0;
      for (const c of this.chars.values()) if (c.state !== "seated") walkers++;
      const maxWalkers = Math.max(1, Math.ceil(this.chars.size * 0.3));
      for (const c of this.chars.values()) {
        if (c.removing) continue;
        const started = this.think(c, dt, walkers < maxWalkers);
        if (started) walkers++;
      }
    }

    for (const c of [...this.chars.values()]) {
      c.render(dt, this.reducedMotion, this.now);
      if (c.removing && c.fade <= 0.001) {
        c.destroy();
        this.chars.delete(c.id);
      }
    }
    this.updateLabels();
  }

  private updateLabels() {
    const zoom = this.camera.zoom;
    // Jarak antar kursi = 3 tile; label disembunyikan saat terlalu rapat agar tidak bertumpuk.
    const autoVisible = zoom >= 1.25;
    const seatGap = 3 * TILE * zoom;
    // Saat rapat, label meja kanan dinaikkan satu baris sehingga lebar label boleh 2× jarak kursi.
    const stagger = seatGap < 96;
    const maxW = Math.round(Math.max(64, Math.min(150, (stagger ? seatGap * 2 : seatGap) - 6)));
    for (const [id, el] of this.labels) {
      const c = this.chars.get(id);
      let css: string;
      if (!c || c.removing) {
        css = "hidden";
      } else {
        const focused = c.selected || c.hovered;
        const show =
          focused ||
          (!c.dimmed && (this.labelMode === "always" || (this.labelMode === "auto" && autoVisible)));
        if (!show) css = "hidden";
        else {
          const a = c.labelAnchor();
          const p = this.camera.worldToScreen(a.x, a.y);
          const lift = stagger && c.seat.lane === 1 && !focused ? 20 : 0;
          css = `${Math.round(p.x)},${Math.round(p.y) - lift},${focused ? 1 : 0},${focused ? 180 : maxW}`;
        }
      }
      if (this.labelCache.get(id) === css) continue;
      this.labelCache.set(id, css);
      if (css === "hidden") {
        el.style.visibility = "hidden";
      } else {
        const [x, y, f, w] = css.split(",");
        el.style.visibility = "visible";
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
        el.style.maxWidth = `${w}px`;
        el.style.zIndex = f === "1" ? "5" : "1";
        el.dataset.focused = f;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Perilaku jalan-jalan (visual saja)
  // -------------------------------------------------------------------------
  private blockedFor(c: Character) {
    const own = key(c.seat.tx, c.seat.ty);
    return (x: number, y: number) => {
      const k = key(x, y);
      if (k !== own && SEAT_KEY.has(k)) return true;
      const o = this.occ.get(k);
      return o !== undefined && o !== c.id;
    };
  }

  private release(c: Character) {
    for (const [k, id] of this.occ) if (id === c.id) this.occ.delete(k);
    for (const [k, id] of this.destReserved) if (id === c.id) this.destReserved.delete(k);
  }

  /** Mengembalikan true jika karakter mulai berjalan dari kursi. */
  private think(c: Character, dt: number, mayStart: boolean): boolean {
    switch (c.state) {
      case "seated":
        c.timer -= dt;
        if (c.timer > 0) return false;
        if (!mayStart) {
          c.timer = rand(2000, 6000);
          return false;
        }
        return this.startTrip(c);
      case "standing":
        c.timer -= dt;
        if (c.timer <= 0) this.goHome(c);
        return false;
      case "walking":
        this.walk(c, dt);
        return false;
    }
  }

  private startTrip(c: Character): boolean {
    let dest: Tile | null = null;
    let face: Facing = "down";
    for (let attempt = 0; attempt < 6 && !dest; attempt++) {
      if (Math.random() < 0.55) {
        const poi = POIS[Math.floor(Math.random() * POIS.length)];
        dest = [poi.tx, poi.ty];
        face = poi.face;
      } else {
        dest = WANDER_TILES[Math.floor(Math.random() * WANDER_TILES.length)];
        face = (["down", "left", "right"] as Facing[])[Math.floor(Math.random() * 3)];
      }
      const k = key(dest[0], dest[1]);
      if (this.destReserved.has(k) || this.occ.has(k)) dest = null;
    }
    if (!dest) {
      c.timer = rand(4000, 9000);
      return false;
    }
    const path = findPath(c.tile, dest, this.blockedFor(c));
    if (!path || !path.length) {
      c.timer = rand(4000, 9000);
      return false;
    }
    this.destReserved.set(key(dest[0], dest[1]), c.id);
    c.path = path;
    c.target = dest;
    c.targetFace = face;
    c.returning = false;
    c.state = "walking";
    c.stuckTime = 0;
    c.waitTime = 0;
    // langkah pertama: berdiri dari kursi ke tengah tile
    c.y = c.tile[1] * TILE + 13;
    return true;
  }

  private goHome(c: Character) {
    for (const [k, id] of this.destReserved) if (id === c.id) this.destReserved.delete(k);
    const seat: Tile = [c.seat.tx, c.seat.ty];
    const path = findPath(c.tile, seat, this.blockedFor(c)) ?? findPath(c.tile, seat);
    c.path = path ?? [];
    c.target = seat;
    c.returning = true;
    c.state = "walking";
    c.stuckTime = 0;
    c.waitTime = 0;
  }

  private walk(c: Character, dt: number) {
    if (!c.path.length) {
      this.arrive(c);
      return;
    }
    const [nx, ny] = c.path[0];
    const k = key(nx, ny);
    const occupant = this.occ.get(k);
    if (occupant !== undefined && occupant !== c.id) {
      // Tunggu giliran; setelah ~1 detik cari jalan lain agar tidak bertabrakan.
      c.waitTime += dt;
      if (c.waitTime > 900) {
        c.stuckTime += c.waitTime;
        c.waitTime = 0;
        const dest = c.target ?? [c.seat.tx, c.seat.ty];
        const p = findPath(c.tile, dest, this.blockedFor(c));
        if (p && p.length) c.path = p;
        else if (!c.returning && c.stuckTime > 5000) this.goHome(c);
      }
      return;
    }
    this.occ.set(k, c.id);
    c.waitTime = 0;
    const tx = nx * TILE + TILE / 2;
    const ty = ny * TILE + 13;
    const dx = tx - c.x;
    const dy = ty - c.y;
    if (Math.abs(dx) > Math.abs(dy)) c.facing = dx > 0 ? "right" : "left";
    else if (dy !== 0) c.facing = dy > 0 ? "down" : "up";
    const dist = Math.hypot(dx, dy);
    const stepLen = (WALK_SPEED * dt) / 1000;
    if (dist <= stepLen) {
      c.x = tx;
      c.y = ty;
      const prevK = key(c.tile[0], c.tile[1]);
      if (this.occ.get(prevK) === c.id) this.occ.delete(prevK);
      c.tile = [nx, ny];
      c.path.shift();
      if (!c.path.length) this.arrive(c);
    } else {
      c.x += (dx / dist) * stepLen;
      c.y += (dy / dist) * stepLen;
    }
  }

  private arrive(c: Character) {
    if (c.returning) {
      c.placeAtSeat();
      this.occ.set(key(c.seat.tx, c.seat.ty), c.id);
      c.timer = rand(14000, 45000);
    } else {
      c.state = "standing";
      c.facing = c.targetFace;
      c.timer = rand(3000, 8000);
    }
  }
}
