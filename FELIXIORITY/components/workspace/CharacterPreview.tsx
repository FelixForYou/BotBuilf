"use client";
// Pratinjau karakter (kanvas 2D, tanpa PixiJS) untuk panel detail & daftar.
import { useEffect, useRef } from "react";
import { assetUrl } from "@/lib/api";
import { appearanceFor } from "@/lib/appearance";

interface Atlas {
  image: HTMLImageElement;
  frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
}
let atlasPromise: Promise<Atlas> | null = null;
function loadAtlas(): Promise<Atlas> {
  if (!atlasPromise) {
    atlasPromise = (async () => {
      const json = await fetch(assetUrl("/assets/characters/characters.json")).then((r) => r.json());
      const image = new Image();
      image.src = assetUrl("/assets/characters/characters.png");
      await image.decode();
      return { image, frames: json.frames };
    })().catch((e) => {
      atlasPromise = null;
      throw e;
    });
  }
  return atlasPromise;
}

const W = 16,
  H = 24;

export function drawCharacter(ctx: CanvasRenderingContext2D, atlas: Atlas, id: number) {
  const L = appearanceFor(id);
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
  const tmp = document.createElement("canvas");
  tmp.width = W;
  tmp.height = H;
  const t = tmp.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  for (const [name, tint] of stack) {
    const f = atlas.frames[`${name}_down_idle0`]?.frame;
    if (!f) continue;
    t.globalCompositeOperation = "source-over";
    t.clearRect(0, 0, W, H);
    t.drawImage(atlas.image, f.x, f.y, f.w, f.h, 0, 0, W, H);
    if (tint !== null) {
      t.globalCompositeOperation = "multiply";
      t.fillStyle = `#${tint.toString(16).padStart(6, "0")}`;
      t.fillRect(0, 0, W, H);
      t.globalCompositeOperation = "destination-in";
      t.drawImage(atlas.image, f.x, f.y, f.w, f.h, 0, 0, W, H);
    }
    ctx.drawImage(tmp, 0, 0);
  }
}

export function CharacterPreview({ id, scale = 4, className = "" }: { id: number; scale?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    loadAtlas()
      .then((atlas) => {
        const ctx = ref.current?.getContext("2d");
        if (alive && ctx) drawCharacter(ctx, atlas, id);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className={className}
      style={{ width: W * scale, height: H * scale, imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  );
}
