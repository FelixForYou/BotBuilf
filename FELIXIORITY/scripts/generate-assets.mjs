// FELIXIORITY — generator aset pixel.
// Semua aset dibuat dari kode ini (karya asli, lisensi MIT seperti proyek).
// Menghasilkan sprite atlas PNG + JSON (format spritesheet PixiJS) ke public/assets.
// Jalankan: npm run assets
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "assets");

// ---------------------------------------------------------------------------
// PNG encoder minimal (RGBA 8-bit)
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(img) {
  const { w, h, data } = img;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Kanvas pixel
// ---------------------------------------------------------------------------
function hex(c) {
  if (Array.isArray(c)) return c;
  const s = c.replace("#", "");
  const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) : 255;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16), a];
}
class Img {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4);
  }
  px(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || c == null) return;
    const [r, g, b, a] = hex(c);
    const i = (y * this.w + x) * 4;
    if (a === 255) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
    } else {
      const ia = a / 255;
      this.data[i] = Math.round(r * ia + this.data[i] * (1 - ia));
      this.data[i + 1] = Math.round(g * ia + this.data[i + 1] * (1 - ia));
      this.data[i + 2] = Math.round(b * ia + this.data[i + 2] * (1 - ia));
      this.data[i + 3] = Math.max(this.data[i + 3], a);
    }
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }
  frame(x, y, w, h, c) {
    this.rect(x, y, w, 1, c);
    this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c);
    this.rect(x + w - 1, y, 1, h, c);
  }
  get(x, y) {
    const i = (y * this.w + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }
  alpha(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }
  // Tambahkan garis tepi otomatis di sekitar piksel terisi.
  outline(c) {
    const pts = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y)) continue;
        if (this.alpha(x - 1, y) || this.alpha(x + 1, y) || this.alpha(x, y - 1) || this.alpha(x, y + 1)) pts.push([x, y]);
      }
    for (const [x, y] of pts) this.px(x, y, c);
  }
  blit(src, dx, dy) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const p = src.get(x, y);
        if (p[3]) this.px(dx + x, dy + y, p);
      }
  }
}

// ---------------------------------------------------------------------------
// Atlas packer (shelf) dengan padding + extrude tepi agar tidak ada seam
// ---------------------------------------------------------------------------
function pack(sprites, name, width = 512) {
  const PAD = 2;
  let x = PAD,
    y = PAD,
    rowH = 0;
  const placed = [];
  const sorted = [...sprites].sort((a, b) => b.img.h - a.img.h);
  for (const s of sorted) {
    if (x + s.img.w + PAD > width) {
      x = PAD;
      y += rowH + PAD * 2;
      rowH = 0;
    }
    placed.push({ ...s, x, y });
    x += s.img.w + PAD * 2;
    rowH = Math.max(rowH, s.img.h);
  }
  let height = y + rowH + PAD;
  height = Math.pow(2, Math.ceil(Math.log2(height)));
  const atlas = new Img(width, height);
  const frames = {};
  for (const p of placed) {
    const { img } = p;
    // extrude 1px
    for (let j = -1; j <= img.h; j++)
      for (let i = -1; i <= img.w; i++) {
        const sx = Math.min(img.w - 1, Math.max(0, i));
        const sy = Math.min(img.h - 1, Math.max(0, j));
        const c = img.get(sx, sy);
        if (c[3]) atlas.px(p.x + i, p.y + j, c);
      }
    frames[p.name] = {
      frame: { x: p.x, y: p.y, w: img.w, h: img.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: img.w, h: img.h },
      sourceSize: { w: img.w, h: img.h },
      ...(p.anchor ? { anchor: p.anchor } : {}),
    };
  }
  const dir = join(ROOT, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.png`), encodePNG(atlas));
  writeFileSync(
    join(dir, `${name}.json`),
    JSON.stringify(
      {
        frames,
        meta: {
          app: "felixiority/scripts/generate-assets.mjs",
          image: `${name}.png`,
          format: "RGBA8888",
          size: { w: width, h: height },
          scale: "1",
        },
      },
      null,
      0,
    ),
  );
  console.log(`  ${name}: ${placed.length} frame, atlas ${width}x${height}`);
}

// ---------------------------------------------------------------------------
// KARAKTER — dibuat berlapis (grayscale) agar dapat diwarnai (tint) per user
// ---------------------------------------------------------------------------
const OUT = "#1b1633";
const L = "#ffffff"; // terang
const M = "#c9c9c9"; // sedang
const D = "#9a9a9a"; // bayangan
const FW = 16,
  FH = 24;
const DIRS = ["down", "up", "side"];
const FRAMES = ["idle0", "idle1", "walk0", "walk1", "walk2", "walk3"];
const HAIR_STYLES = 6;
const SHIRT_STYLES = 3;

function frameParams(f) {
  // bob: badan turun 1px; leg: -1 kiri maju, 1 kanan maju; arm: ayunan
  switch (f) {
    case "idle0":
      return { bob: 0, leg: 0, arm: 0 };
    case "idle1":
      return { bob: 1, leg: 0, arm: 0 };
    case "walk0":
      return { bob: 0, leg: -1, arm: 1 };
    case "walk1":
      return { bob: 1, leg: 0, arm: 0 };
    case "walk2":
      return { bob: 0, leg: 1, arm: -1 };
    case "walk3":
      return { bob: 1, leg: 0, arm: 0 };
  }
}

// Melukis satu frame ke dalam set lapisan.
function paintCharacter(dir, f, hair, shirtStyle) {
  const layers = {
    skin: new Img(FW, FH),
    hair: new Img(FW, FH),
    shirt: new Img(FW, FH),
    pants: new Img(FW, FH),
    shoes: new Img(FW, FH),
    detail: new Img(FW, FH), // warna tetap (mata, kaos dalam)
  };
  const { bob, leg, arm } = frameParams(f);
  const { skin, shirt, pants, shoes, detail } = layers;
  const hy = 2 + bob; // atas kepala

  if (dir === "down" || dir === "up") {
    // kaki & sepatu
    const lUp = leg === -1 ? 1 : 0;
    const rUp = leg === 1 ? 1 : 0;
    pants.rect(4, 18 + bob, 8, 2 - bob, M);
    pants.rect(4, 19, 3, 3 - lUp, M);
    pants.rect(9, 19, 3, 3 - rUp, M);
    pants.rect(4, 19, 1, 3 - lUp, D);
    pants.rect(11, 19, 1, 3 - rUp, D);
    shoes.rect(4, 22 - lUp, 3, 2, M);
    shoes.rect(9, 22 - rUp, 3, 2, M);
    shoes.rect(4, 22 - lUp, 3, 1, L);
    shoes.rect(9, 22 - rUp, 3, 1, L);
    // badan
    const ty = 12 + bob;
    shirt.rect(4, ty, 8, 6, L);
    shirt.rect(4, ty + 4, 8, 2, M);
    shirt.rect(4, ty, 1, 6, M);
    // lengan
    const la = arm,
      ra = -arm;
    shirt.rect(3, ty, 1, 4 + Math.max(0, la), M);
    shirt.rect(12, ty, 1, 4 + Math.max(0, ra), M);
    skin.rect(3, ty + 4 + Math.max(0, la), 1, 2 + Math.min(0, la), L);
    skin.rect(12, ty + 4 + Math.max(0, ra), 1, 2 + Math.min(0, ra), L);
    if (dir === "down") {
      if (shirtStyle === 1) {
        // hoodie: tali + kantong
        shirt.rect(4, ty, 8, 1, D);
        shirt.rect(6, ty + 1, 1, 3, "#ffffff");
        shirt.rect(9, ty + 1, 1, 3, "#ffffff");
      } else if (shirtStyle === 2) {
        // jaket terbuka: kaos dalam putih
        detail.rect(7, ty, 2, 6, "#eef0f8");
        detail.rect(7, ty + 4, 2, 2, "#c9cde0");
        shirt.rect(6, ty, 1, 6, D);
        shirt.rect(9, ty, 1, 6, D);
      } else {
        shirt.rect(6, ty, 4, 1, D); // kerah
      }
    } else if (shirtStyle === 1) {
      shirt.rect(5, ty, 6, 2, M); // tudung hoodie dari belakang
    }
    // kepala
    skin.rect(3, hy, 10, 10, L);
    skin.rect(3, hy + 8, 10, 2, M);
    skin.rect(6, hy + 10, 4, 1, D); // leher
    if (dir === "down") {
      detail.rect(5, hy + 5, 1, 2, OUT);
      detail.rect(10, hy + 5, 1, 2, OUT);
      detail.px(5, hy + 5, "#3b3560");
      detail.px(10, hy + 5, "#3b3560");
      skin.rect(4, hy + 7, 1, 1, "#f0b0b0"); // pipi
      skin.rect(11, hy + 7, 1, 1, "#f0b0b0");
    }
  } else {
    // samping (menghadap kanan)
    const ty = 12 + bob;
    if (leg === 0) {
      pants.rect(6, 18 + bob, 4, 4 - bob, M);
      pants.rect(6, 18, 1, 4, D);
      shoes.rect(6, 22, 5, 2, M);
      shoes.rect(6, 22, 5, 1, L);
    } else {
      const front = leg === -1;
      pants.rect(6, 18 + bob, 4, 2 - bob, M);
      // kaki depan & belakang
      pants.rect(8, 19, 2, 3, front ? M : D);
      pants.rect(10, 20, 1, 2, front ? M : D);
      pants.rect(5, 19, 2, 3, front ? D : M);
      pants.rect(4, 20, 1, 2, front ? D : M);
      shoes.rect(10, 22, 3, 2, M);
      shoes.rect(3, 22, 3, 2, D);
    }
    shirt.rect(5, ty, 6, 6, L);
    shirt.rect(5, ty + 4, 6, 2, M);
    shirt.rect(5, ty, 1, 6, M);
    if (shirtStyle === 1) shirt.rect(4, ty, 2, 3, M); // tudung
    if (shirtStyle === 2) detail.rect(10, ty, 1, 5, "#eef0f8");
    // lengan berayun
    const ax = 7 + arm;
    shirt.rect(ax, ty + 1, 2, 4, D);
    skin.rect(ax, ty + 5, 2, 1, L);
    // kepala
    skin.rect(4, hy, 9, 10, L);
    skin.rect(4, hy + 8, 9, 2, M);
    skin.rect(7, hy + 10, 3, 1, D);
    skin.px(13, hy + 6, L); // hidung
    detail.rect(10, hy + 5, 1, 2, OUT);
    detail.px(10, hy + 5, "#3b3560");
    skin.px(11, hy + 7, "#f0b0b0");
  }
  paintHair(layers.hair, dir, hair, hy);
  return layers;
}

function paintHair(h, dir, style, hy) {
  if (dir === "down") {
    if (style === 5) {
      h.rect(3, hy, 10, 2, M); // cepak
      h.rect(4, hy, 8, 1, L);
      return;
    }
    if (style === 4) {
      // topi
      h.rect(3, hy - 1, 10, 4, L);
      h.rect(3, hy + 2, 10, 1, M);
      h.rect(2, hy + 3, 12, 1, D);
      h.rect(3, hy + 4, 1, 2, D);
      h.rect(12, hy + 4, 1, 2, D);
      return;
    }
    h.rect(3, hy, 10, 3, L);
    h.rect(3, hy + 3, 3, 1, M);
    h.rect(10, hy + 3, 3, 1, M);
    h.rect(3, hy + 3, 1, 3, M);
    h.rect(12, hy + 3, 1, 3, M);
    h.rect(4, hy, 6, 1, "#ffffff");
    if (style === 1) {
      // runcing
      for (const x of [3, 6, 9, 12]) h.px(x, hy - 1, L);
      h.px(7, hy - 1, M);
    } else if (style === 2) {
      // panjang
      h.rect(2, hy + 2, 2, 11, M);
      h.rect(12, hy + 2, 2, 11, M);
      h.rect(2, hy + 10, 1, 3, D);
      h.rect(13, hy + 10, 1, 3, D);
    } else if (style === 3) {
      // cepol
      h.rect(6, hy - 3, 4, 3, M);
      h.rect(7, hy - 3, 2, 1, L);
    } else {
      h.rect(6, hy + 3, 2, 1, M); // poni
    }
  } else if (dir === "up") {
    if (style === 5) {
      h.rect(3, hy, 10, 6, M);
      return;
    }
    if (style === 4) {
      h.rect(3, hy - 1, 10, 4, L);
      h.rect(3, hy + 3, 10, 5, M);
      return;
    }
    h.rect(3, hy, 10, 9, M);
    h.rect(4, hy, 8, 3, L);
    h.rect(3, hy + 7, 10, 2, D);
    if (style === 1) for (const x of [3, 6, 9, 12]) h.px(x, hy - 1, L);
    if (style === 2) {
      h.rect(2, hy + 2, 12, 11, M);
      h.rect(3, hy + 9, 10, 4, D);
    }
    if (style === 3) {
      h.rect(6, hy - 3, 4, 3, M);
      h.rect(7, hy - 3, 2, 1, L);
    }
  } else {
    if (style === 5) {
      h.rect(4, hy, 9, 2, M);
      h.rect(4, hy, 2, 5, M);
      return;
    }
    if (style === 4) {
      h.rect(4, hy - 1, 9, 4, L);
      h.rect(4, hy + 2, 9, 1, M);
      h.rect(9, hy + 3, 6, 1, D); // brim depan
      h.rect(4, hy + 3, 2, 3, D);
      return;
    }
    h.rect(4, hy, 9, 3, L);
    h.rect(4, hy + 3, 3, 5, M);
    h.rect(11, hy + 3, 2, 1, M);
    if (style === 1) for (const x of [4, 7, 10]) h.px(x, hy - 1, L);
    if (style === 2) h.rect(3, hy + 2, 3, 11, M);
    if (style === 3) {
      h.rect(2, hy + 1, 3, 3, M);
      h.px(2, hy + 1, L);
    }
  }
}

function buildCharacters() {
  const sprites = [];
  for (const dir of DIRS)
    for (const f of FRAMES) {
      // outline bergantung bentuk rambut + gaya baju
      for (let hs = 0; hs < HAIR_STYLES; hs++) {
        const layers = paintCharacter(dir, f, hs, 0);
        const sil = new Img(FW, FH);
        for (const k of Object.keys(layers)) sil.blit(layers[k], 0, 0);
        const out = new Img(FW, FH);
        // salin silhouette -> outline saja
        const tmp = new Img(FW, FH);
        tmp.blit(sil, 0, 0);
        tmp.outline(OUT);
        for (let y = 0; y < FH; y++)
          for (let x = 0; x < FW; x++) if (tmp.alpha(x, y) && !sil.alpha(x, y)) out.px(x, y, OUT);
        sprites.push({ name: `outline${hs}_${dir}_${f}`, img: out });
        sprites.push({ name: `hair${hs}_${dir}_${f}`, img: layers.hair });
      }
      const base = paintCharacter(dir, f, 0, 0);
      sprites.push({ name: `skin_${dir}_${f}`, img: base.skin });
      sprites.push({ name: `pants_${dir}_${f}`, img: base.pants });
      sprites.push({ name: `shoes_${dir}_${f}`, img: base.shoes });
      for (let ss = 0; ss < SHIRT_STYLES; ss++) {
        const l = paintCharacter(dir, f, 0, ss);
        sprites.push({ name: `shirt${ss}_${dir}_${f}`, img: l.shirt });
        sprites.push({ name: `detail${ss}_${dir}_${f}`, img: l.detail });
      }
      // aksesori
      const { bob } = frameParams(f);
      const hy = 2 + bob;
      const glasses = new Img(FW, FH);
      const headset = new Img(FW, FH);
      if (dir === "down") {
        glasses.rect(4, hy + 5, 3, 2, "#1b1633");
        glasses.rect(9, hy + 5, 3, 2, "#1b1633");
        glasses.px(5, hy + 5, "#9fd0ff");
        glasses.px(10, hy + 5, "#9fd0ff");
        glasses.rect(7, hy + 5, 2, 1, "#1b1633");
        headset.rect(2, hy + 4, 2, 4, "#2a2f45");
        headset.rect(12, hy + 4, 2, 4, "#2a2f45");
        headset.rect(3, hy - 1, 10, 1, "#2a2f45");
        headset.px(2, hy + 5, "#4f7cff");
        headset.px(13, hy + 5, "#4f7cff");
        headset.rect(12, hy + 8, 1, 1, "#2a2f45");
        headset.rect(10, hy + 9, 2, 1, "#2a2f45");
      } else if (dir === "up") {
        headset.rect(2, hy + 4, 2, 4, "#2a2f45");
        headset.rect(12, hy + 4, 2, 4, "#2a2f45");
        headset.rect(3, hy - 1, 10, 1, "#2a2f45");
      } else {
        glasses.rect(9, hy + 5, 4, 2, "#1b1633");
        glasses.px(10, hy + 5, "#9fd0ff");
        headset.rect(6, hy + 4, 3, 4, "#2a2f45");
        headset.px(7, hy + 5, "#4f7cff");
        headset.rect(7, hy - 1, 1, 5, "#2a2f45");
      }
      sprites.push({ name: `glasses_${dir}_${f}`, img: glasses });
      sprites.push({ name: `headset_${dir}_${f}`, img: headset });
    }
  // penanda pilihan (cincin di bawah kaki)
  const ring = new Img(22, 10);
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 22; x++) {
      const dx = (x + 0.5 - 11) / 11,
        dy = (y + 0.5 - 5) / 5;
      const d = dx * dx + dy * dy;
      if (d <= 1 && d >= 0.3) ring.px(x, y, "#ffffff");
    }
  sprites.push({ name: "select_ring", img: ring });
  const shadow = new Img(14, 6);
  for (let y = 0; y < 6; y++)
    for (let x = 0; x < 14; x++) {
      const dx = (x + 0.5 - 7) / 7,
        dy = (y + 0.5 - 3) / 3;
      if (dx * dx + dy * dy <= 1) shadow.px(x, y, "#000000");
    }
  sprites.push({ name: "shadow", img: shadow });
  pack(sprites, "characters", 1024);
}

// ---------------------------------------------------------------------------
// TILE
// ---------------------------------------------------------------------------
const WOOD = ["#c58b56", "#bb7f4b", "#cf9862", "#b37848"];
function buildTiles() {
  const sprites = [];
  // Papan kayu panjang: varian = kombinasi sambungan atas/bawah (bit0 atas, bit1 bawah).
  // Aplikasi memilih varian per tile sehingga papan tampak 3–4 tile panjangnya.
  const PLANK = ["#c58b56", "#bf844f"];
  for (let v = 0; v < 4; v++) {
    const t = new Img(16, 16);
    for (let p = 0; p < 2; p++) {
      const y0 = p * 8;
      t.rect(0, y0, 16, 8, PLANK[p]);
      t.rect(0, y0, 16, 1, "#d6a06a"); // kilap atas papan
      t.rect(0, y0 + 7, 16, 1, "#9e6a3c"); // celah antar papan
      t.rect(2 + p * 5, y0 + 3, 5, 1, "#b47a45"); // serat
      t.rect(10 - p * 3, y0 + 5, 3, 1, "#cc955e");
      if (v & (1 << p)) {
        t.rect(0, y0, 1, 7, "#9e6a3c"); // sambungan ujung papan
        t.rect(1, y0 + 1, 1, 6, "#d6a06a");
      }
    }
    sprites.push({ name: `floor${v}`, img: t });
  }
  // dinding depan (2 tile tinggi = 32px)
  for (let v = 0; v < 2; v++) {
    const w = new Img(16, 32);
    w.rect(0, 0, 16, 32, "#222b55");
    w.rect(0, 0, 16, 3, "#2f3a70");
    w.rect(0, 3, 16, 1, "#3b4787");
    for (let y = 8; y < 26; y += 6) w.rect(0, y, 16, 1, "#1d2550");
    if (v === 1) w.rect(8, 4, 1, 22, "#1d2550");
    w.rect(0, 26, 16, 1, "#3a3f6b");
    w.rect(0, 27, 16, 5, "#161c3a"); // plint
    w.rect(0, 27, 16, 1, "#4a3a8c");
    sprites.push({ name: `wall${v}`, img: w });
  }
  const top = new Img(16, 16);
  top.rect(0, 0, 16, 16, "#10152e");
  top.rect(0, 15, 16, 1, "#2a3363");
  sprites.push({ name: "wall_top", img: top });
  const side = new Img(16, 16);
  side.rect(0, 0, 16, 16, "#131a38");
  side.rect(0, 0, 2, 16, "#0c1128");
  side.rect(14, 0, 2, 16, "#0c1128");
  sprites.push({ name: "wall_side", img: side });
  const bottom = new Img(16, 16);
  bottom.rect(0, 0, 16, 6, "#1a2145");
  bottom.rect(0, 0, 16, 1, "#2f3a70");
  sprites.push({ name: "wall_bottom", img: bottom });
  // karpet (9-slice sederhana) — ungu/navy
  const rug = new Img(16, 16);
  rug.rect(0, 0, 16, 16, "#3b2f7a");
  for (let i = 0; i < 16; i += 4) rug.rect(i, i % 8 === 0 ? 2 : 10, 2, 2, "#4b3d97");
  sprites.push({ name: "rug_fill", img: rug });
  pack(sprites, "tiles", 256);
}

// ---------------------------------------------------------------------------
// FURNITUR
// ---------------------------------------------------------------------------
function desk(screenFacing) {
  // meja 48x30: permukaan + sisi depan + monitor
  const W = 48,
    H = 34;
  const d = new Img(W, H);
  const topY = 14;
  d.rect(0, topY, W, 12, "#dfe3ee");
  d.rect(0, topY, W, 1, "#f4f6fb");
  d.rect(0, topY + 11, W, 1, "#b9bfd2");
  d.rect(0, topY + 12, W, 6, "#8f96b2"); // sisi depan
  d.rect(0, topY + 12, W, 1, "#a8aec7");
  d.rect(2, topY + 17, 3, 3, "#3a3f58"); // kaki
  d.rect(W - 5, topY + 17, 3, 3, "#3a3f58");
  if (screenFacing) {
    // monitor menghadap kita
    d.rect(14, 0, 20, 14, "#1f2440");
    d.rect(15, 1, 18, 11, "#4f7cff");
    d.rect(15, 1, 18, 2, "#7aa0ff");
    d.rect(17, 4, 9, 1, "#c9d7ff");
    d.rect(17, 6, 12, 1, "#a7bcff");
    d.rect(17, 8, 7, 1, "#c9d7ff");
    d.rect(27, 8, 4, 2, "#8b5cf6");
    d.rect(22, 13, 4, 3, "#2a2f45");
    d.rect(19, 16, 10, 1, "#2a2f45");
    // keyboard & mouse
    d.rect(16, 19, 16, 4, "#3a3f58");
    d.rect(17, 20, 14, 2, "#5a6080");
    d.rect(35, 20, 3, 3, "#3a3f58");
    d.rect(5, 17, 6, 5, "#f2f2f2"); // kertas
    d.rect(6, 18, 4, 1, "#b8bcc9");
    d.rect(6, 20, 3, 1, "#b8bcc9");
  } else {
    // laptop dari belakang (rendah agar karakter di baliknya tetap terlihat)
    d.rect(16, 6, 16, 9, "#c3c8d6");
    d.rect(17, 7, 14, 7, "#d9dde8");
    d.rect(22, 9, 4, 3, "#8b5cf6");
    d.rect(15, 15, 18, 2, "#9aa1b8");
    d.rect(38, 15, 5, 5, "#e85d75"); // mug
    d.rect(43, 16, 1, 2, "#e85d75");
    d.rect(39, 15, 3, 1, "#5a3a26");
    d.rect(4, 17, 7, 5, "#f2a93b"); // buku
    d.rect(4, 17, 7, 1, "#f7c873");
  }
  d.outline("#1b1633");
  return d;
}
function chair() {
  const c = new Img(14, 16);
  c.rect(2, 0, 10, 7, "#5b4bb7");
  c.rect(3, 1, 8, 2, "#7564d6");
  c.rect(1, 7, 12, 4, "#4a3c99");
  c.rect(2, 7, 10, 1, "#6a59cf");
  c.rect(6, 11, 2, 3, "#2a2f45");
  c.rect(3, 14, 8, 1, "#2a2f45");
  c.outline("#1b1633");
  return c;
}
function plant(big) {
  const W = big ? 18 : 14,
    H = big ? 30 : 20;
  const p = new Img(W, H);
  const potH = big ? 9 : 7;
  const potY = H - potH;
  p.rect(2, potY, W - 4, potH, "#c9643b");
  p.rect(2, potY, W - 4, 2, "#e07c4f");
  p.rect(3, H - 2, W - 6, 2, "#a24d2c");
  const greens = ["#2b7a43", "#3fa35b", "#5cc174"];
  const leaves = big
    ? [
        [8, 2, 3, 8],
        [4, 5, 3, 8],
        [11, 4, 3, 9],
        [2, 10, 4, 6],
        [12, 11, 4, 6],
        [6, 8, 6, 9],
      ]
    : [
        [5, 2, 4, 6],
        [2, 6, 4, 6],
        [8, 5, 4, 7],
      ];
  p.rect(5, potY - 5, W - 10, 6, greens[0]);
  leaves.forEach(([x, y, w, h], i) => {
    p.rect(x, y, w, h, greens[i % 2]);
    p.rect(x, y, w, 1, greens[2]);
  });
  p.outline("#1b1633");
  return p;
}
function dispenser() {
  const d = new Img(14, 32);
  d.rect(4, 0, 6, 9, "#9fd0ff"); // galon
  d.rect(4, 0, 6, 2, "#cfe8ff");
  d.rect(5, 3, 1, 5, "#e8f4ff");
  d.rect(2, 9, 10, 23, "#e9ecf5");
  d.rect(2, 9, 10, 2, "#ffffff");
  d.rect(10, 11, 2, 21, "#c3c8d6");
  d.rect(4, 14, 6, 6, "#3a3f58");
  d.rect(5, 15, 1, 2, "#4f7cff"); // keran dingin
  d.rect(8, 15, 1, 2, "#e85d75"); // keran panas
  d.rect(4, 26, 6, 1, "#c3c8d6");
  d.outline("#1b1633");
  return d;
}
function rack(frame) {
  const r = new Img(16, 40);
  r.rect(0, 0, 16, 40, "#1b2035");
  r.rect(1, 1, 14, 1, "#2e3554");
  for (let i = 0; i < 6; i++) {
    const y = 4 + i * 6;
    r.rect(2, y, 12, 4, "#262c47");
    r.rect(3, y + 1, 6, 1, "#3a4166");
    r.rect(3, y + 2, 6, 1, "#151a2e");
    const on = (i + frame) % 3 !== 0;
    r.px(11, y + 1, on ? "#3ee08f" : "#1d5a3c");
    r.px(12, y + 1, (i + frame) % 2 ? "#4f7cff" : "#23356e");
    r.px(11, y + 2, (i * 7 + frame) % 4 === 0 ? "#f2a93b" : "#3a3020");
  }
  r.rect(0, 38, 16, 2, "#0d1020");
  r.outline("#0a0d1c");
  return r;
}
function bookshelf() {
  const b = new Img(32, 36);
  b.rect(0, 0, 32, 36, "#6e452c");
  b.rect(0, 0, 32, 2, "#8a5a3c");
  b.rect(2, 2, 28, 32, "#4a2e1f");
  const cols = ["#4f7cff", "#8b5cf6", "#e85d75", "#2fb38c", "#f2a93b", "#ececf3", "#3fbfdc"];
  for (let s = 0; s < 3; s++) {
    const y = 3 + s * 11;
    let x = 3;
    let k = s * 3;
    while (x < 28) {
      const w = 2 + ((k * 5) % 3);
      const h = 7 + ((k * 3) % 3);
      b.rect(x, y + 9 - h, w, h, cols[k % cols.length]);
      b.rect(x, y + 9 - h, w, 1, "#ffffff55");
      x += w + 1;
      k++;
    }
    b.rect(2, y + 9, 28, 2, "#8a5a3c");
  }
  b.outline("#1b1633");
  return b;
}
function windowSprite() {
  const w = new Img(36, 22);
  w.rect(0, 0, 36, 22, "#3a4677");
  w.rect(2, 2, 32, 18, "#2a3a7a");
  // langit malam gradien biru-ungu
  for (let y = 0; y < 18; y++) w.rect(2, 2 + y, 32, 1, y < 6 ? "#3a4fb0" : y < 12 ? "#4a55c0" : "#6a5ad0");
  for (const [x, y] of [
    [6, 4],
    [14, 7],
    [25, 5],
    [30, 10],
    [9, 12],
  ])
    w.px(x, y, "#ffffff");
  w.rect(26, 6, 3, 3, "#f5e6a8"); // bulan
  w.rect(4, 15, 6, 5, "#24306a");
  w.rect(11, 13, 5, 7, "#1d275c");
  w.rect(20, 14, 7, 6, "#24306a");
  w.rect(17, 2, 2, 18, "#3a4677");
  w.rect(2, 10, 32, 1, "#3a4677");
  w.rect(0, 20, 36, 2, "#56619b");
  w.outline("#0f1430");
  return w;
}
function whiteboard() {
  const b = new Img(44, 22);
  b.rect(0, 0, 44, 20, "#c3c8d6");
  b.rect(1, 1, 42, 18, "#f4f6fb");
  b.rect(4, 4, 14, 1, "#4f7cff");
  b.rect(4, 7, 20, 1, "#8b5cf6");
  b.rect(4, 10, 10, 1, "#4f7cff");
  // diagram kecil
  b.frame(28, 4, 6, 4, "#e85d75");
  b.frame(28, 12, 6, 4, "#2fb38c");
  b.rect(30, 8, 1, 4, "#3a3f58");
  b.rect(36, 6, 4, 1, "#3a3f58");
  b.rect(10, 20, 24, 2, "#8f96b2");
  b.outline("#0f1430");
  return b;
}
function sofa() {
  const s = new Img(48, 26);
  s.rect(2, 0, 44, 12, "#5b4bb7");
  s.rect(3, 1, 42, 2, "#7564d6");
  s.rect(0, 8, 6, 16, "#4a3c99");
  s.rect(42, 8, 6, 16, "#4a3c99");
  s.rect(6, 12, 36, 8, "#6a59cf");
  s.rect(6, 12, 36, 1, "#8a7be6");
  s.rect(23, 12, 1, 8, "#4a3c99");
  s.rect(0, 20, 48, 4, "#3b2f7a");
  s.rect(2, 24, 3, 2, "#2a2f45");
  s.rect(43, 24, 3, 2, "#2a2f45");
  s.outline("#1b1633");
  return s;
}
function coffeeTable() {
  const t = new Img(30, 16);
  t.rect(0, 0, 30, 9, "#8a5a3c");
  t.rect(0, 0, 30, 1, "#a06c48");
  t.rect(0, 9, 30, 3, "#6e452c");
  t.rect(2, 12, 2, 4, "#4a2e1f");
  t.rect(26, 12, 2, 4, "#4a2e1f");
  t.rect(5, 2, 4, 4, "#ececf3");
  t.rect(6, 3, 2, 2, "#5a3a26");
  t.rect(15, 3, 9, 4, "#4f7cff");
  t.rect(16, 4, 7, 1, "#c9d7ff");
  t.outline("#1b1633");
  return t;
}
function clock() {
  const c = new Img(12, 12);
  for (let y = 0; y < 12; y++)
    for (let x = 0; x < 12; x++) {
      const dx = x + 0.5 - 6,
        dy = y + 0.5 - 6;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 6) c.px(x, y, d > 4.8 ? "#3a4677" : "#f4f6fb");
    }
  c.rect(6, 3, 1, 3, "#1b1633");
  c.rect(6, 6, 3, 1, "#e85d75");
  return c;
}
function cabinet() {
  const c = new Img(16, 22);
  c.rect(0, 0, 16, 22, "#8f96b2");
  c.rect(0, 0, 16, 2, "#c3c8d6");
  for (let i = 0; i < 3; i++) {
    c.rect(1, 3 + i * 6, 14, 5, "#a8aec7");
    c.rect(6, 5 + i * 6, 4, 1, "#3a3f58");
  }
  c.outline("#1b1633");
  return c;
}
function printer() {
  const p = new Img(16, 12);
  p.rect(0, 3, 16, 9, "#dfe3ee");
  p.rect(0, 3, 16, 1, "#f4f6fb");
  p.rect(3, 0, 10, 4, "#f2f2f2");
  p.rect(2, 7, 12, 2, "#3a3f58");
  p.px(13, 5, "#3ee08f");
  p.outline("#1b1633");
  return p;
}
function sign() {
  // papan nama ruangan di dinding (teks dirender di atasnya oleh aplikasi)
  const s = new Img(56, 12);
  s.rect(0, 0, 56, 12, "#1b1633");
  s.rect(1, 1, 54, 10, "#2c2560");
  s.rect(1, 1, 54, 1, "#8b5cf6");
  s.rect(1, 10, 54, 1, "#4f7cff");
  return s;
}

function buildFurniture() {
  const sprites = [
    { name: "desk_screen", img: desk(true) },
    { name: "desk_back", img: desk(false) },
    { name: "chair", img: chair() },
    { name: "plant_big", img: plant(true) },
    { name: "plant_small", img: plant(false) },
    { name: "dispenser", img: dispenser() },
    { name: "rack0", img: rack(0) },
    { name: "rack1", img: rack(1) },
    { name: "rack2", img: rack(2) },
    { name: "bookshelf", img: bookshelf() },
    { name: "window", img: windowSprite() },
    { name: "whiteboard", img: whiteboard() },
    { name: "sofa", img: sofa() },
    { name: "coffee_table", img: coffeeTable() },
    { name: "clock", img: clock() },
    { name: "cabinet", img: cabinet() },
    { name: "printer", img: printer() },
    { name: "sign", img: sign() },
  ];
  pack(sprites, "furniture", 256);
}

console.log("Membuat aset pixel FELIXIORITY…");
buildCharacters();
buildTiles();
buildFurniture();

// Pratinjau (tidak dipakai aplikasi; berguna untuk review desain)
console.log("Selesai.");
