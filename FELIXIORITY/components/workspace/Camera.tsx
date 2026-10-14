"use client";
// Kamera ruangan: geser (pan), zoom, reset. Logika murni tanpa PixiJS
// sehingga bisa dipakai engine dan diuji terpisah.
import { IconMinus, IconPlus, IconReset } from "@/components/icons";

export interface CameraState {
  zoom: number;
  /** posisi layar (px) dari titik dunia (0,0) */
  x: number;
  y: number;
}

export class Camera {
  zoom = 2;
  x = 0;
  y = 0;
  /** tujuan animasi */
  private target: CameraState | null = null;
  viewW = 1;
  viewH = 1;
  /** true jika pengguna sudah menggeser/zoom manual */
  touched = false;

  constructor(
    public worldW: number,
    public worldH: number,
  ) {}

  get fitZoom(): number {
    let z = Math.min(this.viewW / this.worldW, this.viewH / this.worldH);
    // Layar sempit (HP): isi tinggi agar karakter & label terbaca; sisanya digeser.
    if (this.viewW < 640) z = Math.max(z, Math.min(this.viewH / this.worldH, 1.5));
    return Math.max(0.5, Math.floor(z * 8) / 8);
  }
  get minZoom(): number {
    return Math.max(0.5, Math.min(this.fitZoom, 1) * 0.75);
  }
  get maxZoom(): number {
    return 6;
  }

  resize(w: number, h: number) {
    this.viewW = Math.max(1, w);
    this.viewH = Math.max(1, h);
    if (!this.touched) this.reset(true);
    else this.clampNow();
  }

  /** Posisikan seluruh ruangan agar pas di layar. */
  reset(immediate = false) {
    this.touched = false;
    const zoom = this.fitZoom;
    const next = {
      zoom,
      x: Math.round((this.viewW - this.worldW * zoom) / 2),
      y: Math.round((this.viewH - this.worldH * zoom) / 2),
    };
    this.go(next, immediate);
  }

  private go(next: CameraState, immediate: boolean) {
    const c = this.clamp(next);
    if (immediate) {
      this.zoom = c.zoom;
      this.x = c.x;
      this.y = c.y;
      this.target = null;
    } else {
      this.target = c;
    }
  }

  private clamp(s: CameraState): CameraState {
    const zoom = Math.min(this.maxZoom, Math.max(this.minZoom, s.zoom));
    const ww = this.worldW * zoom;
    const wh = this.worldH * zoom;
    // Boleh menggeser hingga tepi dunia menyentuh tengah layar.
    const minX = Math.min(this.viewW / 2 - ww, (this.viewW - ww) / 2);
    const maxX = Math.max(this.viewW / 2, (this.viewW - ww) / 2);
    const minY = Math.min(this.viewH / 2 - wh, (this.viewH - wh) / 2);
    const maxY = Math.max(this.viewH / 2, (this.viewH - wh) / 2);
    return { zoom, x: Math.min(maxX, Math.max(minX, s.x)), y: Math.min(maxY, Math.max(minY, s.y)) };
  }

  private clampNow() {
    const c = this.clamp(this);
    this.zoom = c.zoom;
    this.x = c.x;
    this.y = c.y;
  }

  panBy(dx: number, dy: number) {
    this.touched = true;
    this.target = null;
    this.x += dx;
    this.y += dy;
    this.clampNow();
  }

  /** Zoom dengan titik layar (sx, sy) tetap di tempat. */
  zoomAt(factor: number, sx = this.viewW / 2, sy = this.viewH / 2, immediate = true) {
    this.touched = true;
    const base = this.target ?? this;
    const zoom = Math.min(this.maxZoom, Math.max(this.minZoom, base.zoom * factor));
    const wx = (sx - base.x) / base.zoom;
    const wy = (sy - base.y) / base.zoom;
    this.go({ zoom, x: sx - wx * zoom, y: sy - wy * zoom }, immediate);
  }

  zoomStep(dir: 1 | -1, immediate = false) {
    this.zoomAt(dir > 0 ? 1.25 : 0.8, this.viewW / 2, this.viewH / 2, immediate);
  }

  /** Pusatkan pada titik dunia; zoom minimal tertentu agar karakter terbaca. */
  centerOn(wx: number, wy: number, minZoom = 2.5, immediate = false) {
    this.touched = true;
    const zoom = Math.min(this.maxZoom, Math.max(this.zoom, minZoom));
    this.go({ zoom, x: this.viewW / 2 - wx * zoom, y: this.viewH / 2 - wy * zoom }, immediate);
  }

  /** Langkah animasi; mengembalikan true jika kamera berubah. */
  step(dt: number, reducedMotion: boolean): boolean {
    if (!this.target) return false;
    const t = reducedMotion ? 1 : 1 - Math.pow(0.001, dt / 350);
    this.zoom += (this.target.zoom - this.zoom) * t;
    this.x += (this.target.x - this.x) * t;
    this.y += (this.target.y - this.y) * t;
    if (
      Math.abs(this.target.zoom - this.zoom) < 0.001 &&
      Math.abs(this.target.x - this.x) < 0.5 &&
      Math.abs(this.target.y - this.y) < 0.5
    ) {
      this.zoom = this.target.zoom;
      this.x = this.target.x;
      this.y = this.target.y;
      this.target = null;
    }
    return true;
  }

  screenToWorld(sx: number, sy: number) {
    return { x: (sx - this.x) / this.zoom, y: (sy - this.y) / this.zoom };
  }
  worldToScreen(wx: number, wy: number) {
    return { x: wx * this.zoom + this.x, y: wy * this.zoom + this.y };
  }
}

export function CameraControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  const btn =
    "grid h-10 w-10 place-items-center text-ink-soft hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent";
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-panel/90 shadow-lg backdrop-blur">
      <button type="button" className={btn} onClick={onZoomIn} aria-label="Perbesar" title="Perbesar">
        <IconPlus />
      </button>
      <button type="button" className={`${btn} border-y border-line`} onClick={onZoomOut} aria-label="Perkecil" title="Perkecil">
        <IconMinus />
      </button>
      <button type="button" className={btn} onClick={onReset} aria-label="Reset kamera" title="Reset kamera">
        <IconReset />
      </button>
    </div>
  );
}
