// Penampilan karakter deterministik berdasarkan ID user panel (stabil, tidak acak tiap polling).

export const SKIN = [0xf5d0b0, 0xe8b894, 0xd29a6c, 0xa86f48, 0x7a4b30, 0x5c3824];
export const HAIR = [0x2b2233, 0x4a3022, 0x7b4a2a, 0xb07a3c, 0xe3c27a, 0xd9d9e3, 0xc0392b, 0x3b6fd6, 0x8e5bd6, 0xe07ab0, 0x1f8a70, 0x1a1a1a];
export const SHIRT = [0x4f7cff, 0x8b5cf6, 0xe85d75, 0x2fb38c, 0xf2a93b, 0x3fbfdc, 0xececf3, 0x3a3f58, 0xd4573b, 0x6c8f3a, 0xb05cc9, 0x1f5fae, 0xf06a3c, 0x55c0a0];
export const PANTS = [0x2a3150, 0x3d4766, 0x4a3a2e, 0x23262f, 0x5b6b8a, 0x3a2f5c];
export const SHOES = [0x1d1f29, 0x5a3d2b, 0xe9e9ef, 0x7b2d2d, 0x2f3a70];

export const HAIR_STYLES = 6;
export const SHIRT_STYLES = 3;

export type Accessory = "none" | "glasses" | "headset";

export interface Appearance {
  skin: number;
  hair: number;
  hairStyle: number;
  shirt: number;
  shirtStyle: number;
  pants: number;
  shoes: number;
  accessory: Accessory;
}

/** Hash integer 32-bit (mirip splitmix) — sama untuk ID yang sama di setiap perangkat. */
export function hashId(id: number, salt = 0): number {
  let x = (id ^ (salt * 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

export function appearanceFor(id: number): Appearance {
  const pick = <T,>(arr: readonly T[], salt: number) => arr[hashId(id, salt) % arr.length];
  const accRoll = hashId(id, 8) % 10;
  return {
    skin: pick(SKIN, 1),
    hair: pick(HAIR, 2),
    hairStyle: hashId(id, 3) % HAIR_STYLES,
    shirt: pick(SHIRT, 4),
    shirtStyle: hashId(id, 5) % SHIRT_STYLES,
    pants: pick(PANTS, 6),
    shoes: pick(SHOES, 7),
    accessory: accRoll < 6 ? "none" : accRoll < 8 ? "glasses" : "headset",
  };
}

export function hexColor(n: number): string {
  return `#${n.toString(16).padStart(6, "0")}`;
}
