// Denah satu ruangan. Semua koordinat dalam tile (16 px) kecuali disebut px.
// Setiap ruangan memakai denah yang sama; kapasitas = jumlah kursi.

export const TILE = 16;
export const COLS = 32;
export const ROWS = 22;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

/** Area lantai yang dapat dipijak (di luar dinding). */
export const FLOOR = { x0: 1, y0: 3, x1: 30, y1: 20 };

export type Facing = "down" | "up" | "left" | "right";

export interface Seat {
  tx: number;
  ty: number;
  face: Facing;
  /** 0 = meja kiri, 1 = meja kanan dalam satu pasangan (untuk menata label agar tidak bertumpuk) */
  lane: 0 | 1;
}

export interface FurnitureItem {
  frame: string;
  /** posisi px kiri-atas sprite */
  x: number;
  y: number;
  /** urutan kedalaman (px y dasar objek) */
  sortY: number;
  /** tile yang tidak bisa dilalui */
  blocks?: [number, number][];
  /** frame animasi bergantian (mis. LED rak server) */
  anim?: string[];
}

export interface Poi {
  tx: number;
  ty: number;
  face: Facing;
}

const CLUSTER_X = [3, 12, 21];
const CLUSTER_Y = [5, 12];

export const SEATS: Seat[] = [];
export const FURNITURE: FurnitureItem[] = [];
/** Dekorasi dinding (tidak memblok, selalu di belakang) */
export const WALL_DECOR: { frame: string; x: number; y: number }[] = [];

function rect(tx: number, ty: number, w: number, h: number): [number, number][] {
  const out: [number, number][] = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([tx + i, ty + j]);
  return out;
}

// Kluster meja: 2 meja di atas (laptop, kursi di atas menghadap bawah)
// dan 2 meja di bawah (monitor menghadap kita, kursi di bawah menghadap atas).
for (const cy of CLUSTER_Y) {
  for (const cx of CLUSTER_X) {
    for (const dx of [0, 3]) {
      SEATS.push({ tx: cx + dx + 1, ty: cy, face: "down", lane: dx ? 1 : 0 });
    }
    for (const dx of [0, 3]) {
      SEATS.push({ tx: cx + dx + 1, ty: cy + 3, face: "up", lane: dx ? 1 : 0 });
    }
    for (const dx of [0, 3]) {
      FURNITURE.push({
        frame: "desk_back",
        x: (cx + dx) * TILE,
        y: (cy + 1) * TILE - 14,
        sortY: (cy + 2) * TILE - 1,
        blocks: rect(cx + dx, cy + 1, 3, 1),
      });
      FURNITURE.push({
        frame: "desk_screen",
        x: (cx + dx) * TILE,
        y: (cy + 2) * TILE - 14,
        sortY: (cy + 3) * TILE - 2,
        blocks: rect(cx + dx, cy + 2, 3, 1),
      });
    }
  }
}
// Urutkan kursi baris demi baris agar penempatan awal rapi.
SEATS.sort((a, b) => a.ty - b.ty || a.tx - b.tx);

export const ROOM_CAPACITY = SEATS.length; // 24

// Kursi (digambar di bawah karakter)
export const CHAIRS = SEATS.map((s) => ({
  x: s.tx * TILE + 1,
  y: s.ty * TILE + (s.face === "down" ? -4 : 0),
  sortY: s.ty * TILE + (s.face === "down" ? 2 : 4),
}));

function place(frame: string, tx: number, ty: number, w: number, h: number, spriteH: number, opts: Partial<FurnitureItem> = {}) {
  // sprite berdiri di tile (tx..tx+w-1, ty..ty+h-1), dasar sprite = bawah tile terakhir
  const bottom = (ty + h) * TILE;
  FURNITURE.push({
    frame,
    x: tx * TILE + (opts.x ?? 0),
    y: bottom - spriteH + (opts.y ?? 0),
    sortY: bottom - 1,
    blocks: rect(tx, ty, w, h),
    anim: opts.anim,
  });
}

// Dinding atas: rak buku, rak server, tanaman, lemari
place("bookshelf", 1, 3, 2, 1, 36);
place("plant_small", 10, 3, 1, 1, 20, { x: 1 });
place("plant_small", 19, 3, 1, 1, 20, { x: 1 });
place("cabinet", 25, 3, 1, 1, 22);
place("rack0", 27, 3, 1, 1, 40, { anim: ["rack0", "rack1", "rack2"] });
place("rack1", 28, 3, 1, 1, 40, { anim: ["rack1", "rack2", "rack0"] });
place("rack2", 29, 3, 1, 1, 40, { anim: ["rack2", "rack0", "rack1"] });
place("plant_big", 30, 3, 1, 1, 30, { x: -1 });
// Sisi kanan
place("dispenser", 30, 9, 1, 1, 32, { x: 1 });
place("plant_small", 30, 14, 1, 1, 20, { x: 1 });
// Sisi kiri
place("cabinet", 1, 9, 1, 1, 22);
place("plant_small", 1, 14, 1, 1, 20, { x: 1 });
// Lounge kanan bawah
place("sofa", 23, 17, 3, 1, 26, { y: 2 });
place("coffee_table", 23, 19, 2, 1, 16, { x: 9 });
place("plant_big", 30, 20, 1, 1, 30, { x: -1 });
place("plant_big", 1, 20, 1, 1, 30, { x: -1 });

WALL_DECOR.push(
  { frame: "window", x: 4 * TILE + 6, y: 20 },
  { frame: "whiteboard", x: 9 * TILE + 4, y: 20 },
  { frame: "sign", x: 14 * TILE + 4, y: 24 },
  { frame: "window", x: 19 * TILE + 6, y: 20 },
  { frame: "clock", x: 23 * TILE + 2, y: 22 },
);

/** Area karpet lounge (tile) */
export const RUG = { tx: 21, ty: 16, w: 8, h: 5 };

export const POIS: Poi[] = [
  { tx: 29, ty: 9, face: "right" }, // dispenser
  { tx: 27, ty: 4, face: "up" }, // rak server
  { tx: 29, ty: 4, face: "up" },
  { tx: 2, ty: 4, face: "up" }, // rak buku
  { tx: 10, ty: 4, face: "up" }, // papan tulis
  { tx: 5, ty: 4, face: "up" }, // jendela
  { tx: 20, ty: 4, face: "up" },
  { tx: 24, ty: 18, face: "down" }, // lounge
  { tx: 27, ty: 19, face: "left" },
  { tx: 22, ty: 19, face: "right" },
  { tx: 2, ty: 9, face: "left" }, // lemari
  { tx: 15, ty: 18, face: "down" },
  { tx: 8, ty: 18, face: "down" },
];

// ---------------------------------------------------------------------------
// Grid lantai
// ---------------------------------------------------------------------------
export const BLOCKED: boolean[][] = Array.from({ length: ROWS }, (_, y) =>
  Array.from({ length: COLS }, (_, x) => x < FLOOR.x0 || x > FLOOR.x1 || y < FLOOR.y0 || y > FLOOR.y1),
);
for (const f of FURNITURE) for (const [x, y] of f.blocks ?? []) BLOCKED[y][x] = true;

export const SEAT_KEY = new Set(SEATS.map((s) => `${s.tx},${s.ty}`));

export function isWalkable(tx: number, ty: number): boolean {
  return tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS && !BLOCKED[ty][tx];
}

/** Tile kosong untuk tujuan jalan-jalan acak (bukan kursi). */
export const WANDER_TILES: [number, number][] = [];
for (let y = FLOOR.y0; y <= FLOOR.y1; y++)
  for (let x = FLOOR.x0; x <= FLOOR.x1; x++)
    if (!BLOCKED[y][x] && !SEAT_KEY.has(`${x},${y}`)) WANDER_TILES.push([x, y]);
