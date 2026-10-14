// Sprite karakter PixiJS. Satu instance = satu user panel (berdasarkan ID).
// Gerakan murni animasi visual — BUKAN status online atau aktivitas user/server.
import { Container, Sprite, type Spritesheet, type Texture } from "pixi.js";
import { appearanceFor, type Appearance } from "@/lib/appearance";
import type { Facing, Seat } from "@/lib/workspace/layout";
import { TILE } from "@/lib/workspace/layout";
import type { Tile } from "@/lib/workspace/pathfinding";

type Dir = "down" | "up" | "side";
const IDLE = ["idle0", "idle1"] as const;
const WALK = ["walk0", "walk1", "walk2", "walk3"] as const;

export type CharState = "seated" | "walking" | "standing";

export interface Resident {
  id: number;
  username: string;
  serverCount: number;
  isAdmin: boolean;
  seatIndex: number;
}

export class Character {
  readonly id: number;
  readonly root = new Container();
  private body = new Container();
  private layers: { sprite: Sprite; key: string }[] = [];
  private shadow: Sprite;
  private ring: Sprite;
  private sheet: Spritesheet;
  readonly look: Appearance;

  resident: Resident;
  seat: Seat;
  /** posisi kaki (px dunia) */
  x = 0;
  y = 0;
  tile: Tile;
  facing: Facing;
  state: CharState = "seated";
  path: Tile[] = [];
  target: Tile | null = null;
  targetFace: Facing = "down";
  /** sedang menuju kursi */
  returning = false;
  timer = 0;
  waitTime = 0;
  stuckTime = 0;
  animTime: number;
  selected = false;
  hovered = false;
  dimmed = false;
  fade = 0;
  removing = false;
  private lastFrameKey = "";

  constructor(sheet: Spritesheet, resident: Resident, seat: Seat) {
    this.id = resident.id;
    this.sheet = sheet;
    this.resident = resident;
    this.seat = seat;
    this.look = appearanceFor(resident.id);
    this.tile = [seat.tx, seat.ty];
    this.facing = seat.face;
    this.animTime = (resident.id * 137) % 1000;

    this.shadow = new Sprite(sheet.textures["shadow"]);
    this.shadow.anchor.set(0.5, 0.5);
    this.shadow.alpha = 0.22;
    this.ring = new Sprite(sheet.textures["select_ring"]);
    this.ring.anchor.set(0.5, 0.5);
    this.ring.visible = false;

    const L = this.look;
    const stack: [string, number | null][] = [
      ["skin", L.skin],
      ["pants", L.pants],
      ["shoes", L.shoes],
      [`shirt${L.shirtStyle}`, L.shirt],
      [`detail${L.shirtStyle}`, null],
      [`hair${L.hairStyle}`, L.hair],
      [`outline${L.hairStyle}`, null],
    ];
    if (L.accessory !== "none") stack.push([L.accessory, null]);
    for (const [key, tint] of stack) {
      const s = new Sprite();
      s.anchor.set(0.5, 1);
      if (tint !== null) s.tint = tint;
      this.layers.push({ sprite: s, key });
      this.body.addChild(s);
    }
    this.root.addChild(this.shadow, this.ring, this.body);
    this.placeAtSeat();
    this.setFrame(this.facing, "idle0");
  }

  placeAtSeat() {
    this.tile = [this.seat.tx, this.seat.ty];
    this.x = this.seat.tx * TILE + TILE / 2;
    this.y = this.seat.ty * TILE + (this.seat.face === "down" ? 10 : 13);
    this.facing = this.seat.face;
    this.state = "seated";
    this.path = [];
    this.target = null;
    this.returning = false;
  }

  setFrame(facing: Facing, frame: string) {
    const dir: Dir = facing === "left" || facing === "right" ? "side" : facing;
    const key = `${dir}_${frame}_${facing}`;
    if (key === this.lastFrameKey) return;
    this.lastFrameKey = key;
    for (const l of this.layers) {
      const tex: Texture | undefined = this.sheet.textures[`${l.key}_${dir}_${frame}`];
      if (tex) l.sprite.texture = tex;
    }
    this.body.scale.x = facing === "left" ? -1 : 1;
  }

  /** Perbarui frame animasi & posisi tampilan. dt dalam ms. */
  render(dt: number, reducedMotion: boolean, now: number) {
    this.animTime += dt;
    let frame: string;
    if (this.state === "walking" && !reducedMotion) {
      frame = WALK[Math.floor(this.animTime / 160) % WALK.length];
    } else if (reducedMotion) {
      frame = "idle0";
    } else {
      frame = IDLE[Math.floor(this.animTime / 700) % IDLE.length];
    }
    this.setFrame(this.facing, frame);

    this.root.position.set(Math.round(this.x), Math.round(this.y));
    this.root.zIndex = this.y + (this.selected ? 0.5 : 0);
    this.shadow.position.set(0, -1);
    this.ring.position.set(0, -1);

    this.ring.visible = this.selected || this.hovered;
    this.ring.tint = this.selected ? 0xb69cff : 0x7aa0ff;
    this.ring.alpha = this.selected ? (reducedMotion ? 1 : 0.8 + Math.sin(now / 260) * 0.2) : 0.6;

    // fade masuk/keluar
    const targetAlpha = this.removing ? 0 : this.dimmed ? 0.28 : 1;
    const step = reducedMotion ? 1 : dt / 250;
    this.fade += Math.sign(targetAlpha - this.fade) * Math.min(Math.abs(targetAlpha - this.fade), step);
    this.root.alpha = this.fade;
  }

  /** Kotak klik (px dunia) — lebih besar dari sprite agar mudah dipilih. */
  hit(wx: number, wy: number): boolean {
    return wx >= this.x - 10 && wx <= this.x + 10 && wy >= this.y - 28 && wy <= this.y + 4;
  }

  labelAnchor(): { x: number; y: number } {
    return { x: this.x, y: this.y - 26 };
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}
