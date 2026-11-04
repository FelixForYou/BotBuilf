// Input terpadu: keyboard+mouse (PC) dan joystick virtual+tombol (HP).
export type Action = 'interact' | 'dash' | 'vision' | 'updraft' | 'call' | 'roll' | 'map' | 'photo' | 'hideui' | 'pause' | 'skills' | 'sleep';

export class Input {
  turn = 0; forward = 0; ascend = false; descend = false; glide = false;
  mouseYaw = 0; camDX = 0; camDY = 0;
  private keys = new Set<string>();
  private pressed = new Set<Action>();
  private touchGlide = false;
  private joy = { id: -1, x0: 0, y0: 0, x: 0, y: 0 };
  private camTouch = { id: -1, x: 0, y: 0 };
  private btnHeld = new Set<string>();
  isTouch = false;
  pointerLocked = false;
  enabled = true;
  sensitivity = 1;
  invertY = false;
  lastDevice: 'pc' | 'touch' = 'pc';
  onDeviceChange: (() => void) | null = null;
  private joyEl: HTMLElement | null = null;
  private knobEl: HTMLElement | null = null;

  constructor(canvas: HTMLCanvasElement, private touchRoot: HTMLElement) {
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (this.isTouch) this.lastDevice = 'touch';
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => { this.keys.clear(); this.btnHeld.clear(); });
    canvas.addEventListener('mousedown', () => {
      if (!this.enabled || this.isTouchActive()) return;
      if (!this.pointerLocked) canvas.requestPointerLock?.();
    });
    document.addEventListener('pointerlockchange', () => { this.pointerLocked = document.pointerLockElement === canvas; });
    window.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked || !this.enabled) return;
      this.mouseYaw += e.movementX * 0.0022 * this.sensitivity;
      this.camDY += e.movementY * 0.0025 * this.sensitivity * (this.invertY ? -1 : 1);
    });
    this.buildTouch();
  }

  private isTouchActive() { return this.lastDevice === 'touch'; }

  private onKey(e: KeyboardEvent, down: boolean) {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT') return;
    const k = e.code;
    if (this.lastDevice !== 'pc') { this.lastDevice = 'pc'; this.onDeviceChange?.(); }
    if (['Space', 'ControlLeft', 'ControlRight', 'Tab', 'ShiftLeft', 'KeyQ'].includes(k)) e.preventDefault();
    if (down && !this.keys.has(k)) {
      const map: Record<string, Action> = {
        KeyE: 'interact', ShiftLeft: 'dash', ShiftRight: 'dash', Digit1: 'dash', Digit2: 'vision', KeyV: 'vision', Digit3: 'updraft', KeyR: 'updraft',
        Digit4: 'call', Digit5: 'roll', KeyF: 'roll', KeyM: 'map', KeyP: 'photo', KeyH: 'hideui', Escape: 'pause', KeyK: 'skills', Tab: 'skills', KeyZ: 'sleep',
      };
      const a = map[k];
      if (a) this.pressed.add(a);
    }
    if (down) this.keys.add(k); else this.keys.delete(k);
  }

  private buildTouch() {
    const root = this.touchRoot;
    root.innerHTML = `
      <div class="joy-zone"><div class="joy"><div class="knob"></div></div></div>
      <div class="cam-zone"></div>
      <div class="tbtns">
        <button class="tb big up" data-hold="ascend" aria-label="Naik">▲</button>
        <button class="tb big down" data-hold="descend" aria-label="Turun">▼</button>
        <button class="tb glide" data-tap="glide" aria-label="Meluncur">Luncur</button>
        <button class="tb act" data-act="interact" aria-label="Interaksi">E</button>
      </div>`;
    this.joyEl = root.querySelector('.joy');
    this.knobEl = root.querySelector('.knob');
    const zone = root.querySelector('.joy-zone') as HTMLElement;
    const cam = root.querySelector('.cam-zone') as HTMLElement;
    const touched = () => { if (this.lastDevice !== 'touch') { this.lastDevice = 'touch'; this.onDeviceChange?.(); } };
    zone.addEventListener('pointerdown', (e) => {
      touched();
      if (this.joy.id !== -1) return;
      this.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0 };
      zone.setPointerCapture(e.pointerId);
      if (this.joyEl) { this.joyEl.style.left = e.clientX + 'px'; this.joyEl.style.top = e.clientY + 'px'; this.joyEl.classList.add('on'); }
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.joy.id) return;
      const dx = e.clientX - this.joy.x0, dy = e.clientY - this.joy.y0;
      const r = 55, l = Math.hypot(dx, dy), k = l > r ? r / l : 1;
      this.joy.x = (dx * k) / r; this.joy.y = (dy * k) / r;
      if (this.knobEl) this.knobEl.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    });
    const endJoy = (e: PointerEvent) => {
      if (e.pointerId !== this.joy.id) return;
      this.joy = { id: -1, x0: 0, y0: 0, x: 0, y: 0 };
      if (this.knobEl) this.knobEl.style.transform = '';
      this.joyEl?.classList.remove('on');
    };
    zone.addEventListener('pointerup', endJoy); zone.addEventListener('pointercancel', endJoy);
    cam.addEventListener('pointerdown', (e) => { touched(); this.camTouch = { id: e.pointerId, x: e.clientX, y: e.clientY }; cam.setPointerCapture(e.pointerId); });
    cam.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.camTouch.id) return;
      this.camDX += (e.clientX - this.camTouch.x) * 0.006 * this.sensitivity;
      this.camDY += (e.clientY - this.camTouch.y) * 0.005 * this.sensitivity * (this.invertY ? -1 : 1);
      this.camTouch.x = e.clientX; this.camTouch.y = e.clientY;
    });
    const endCam = (e: PointerEvent) => { if (e.pointerId === this.camTouch.id) this.camTouch.id = -1; };
    cam.addEventListener('pointerup', endCam); cam.addEventListener('pointercancel', endCam);
    root.querySelectorAll<HTMLElement>('[data-hold]').forEach((b) => {
      const n = b.dataset.hold!;
      b.addEventListener('pointerdown', (e) => { touched(); e.preventDefault(); this.btnHeld.add(n); b.classList.add('held'); b.setPointerCapture(e.pointerId); });
      const up = () => { this.btnHeld.delete(n); b.classList.remove('held'); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    });
    root.querySelectorAll<HTMLElement>('[data-tap]').forEach((b) => {
      b.addEventListener('pointerdown', (e) => { touched(); e.preventDefault(); this.touchGlide = !this.touchGlide; b.classList.toggle('held', this.touchGlide); });
    });
    root.querySelectorAll<HTMLElement>('[data-act]').forEach((b) => {
      b.addEventListener('pointerdown', (e) => { touched(); e.preventDefault(); this.press(b.dataset.act as Action); });
    });
  }

  /** Dipakai tombol UI lain (skill bar, menu). */
  press(a: Action) { this.pressed.add(a); }
  consume(a: Action) { const h = this.pressed.has(a); this.pressed.delete(a); return h; }
  clearPressed() { this.pressed.clear(); }
  setTouchGlide(v: boolean) { this.touchGlide = v; this.touchRoot.querySelector('.glide')?.classList.toggle('held', v); }

  update() {
    const k = this.keys;
    if (!this.enabled) {
      this.turn = this.forward = 0; this.ascend = this.descend = this.glide = false;
      this.mouseYaw = this.camDX = this.camDY = 0;
      return;
    }
    let turn = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    if (this.joy.id !== -1) {
      const dz = (v: number) => (Math.abs(v) < 0.12 ? 0 : (v - Math.sign(v) * 0.12) / 0.88);
      turn += dz(this.joy.x);
      fwd += -dz(this.joy.y);
    }
    this.turn = Math.max(-1, Math.min(1, turn));
    this.forward = Math.max(-1, Math.min(1, fwd));
    this.ascend = k.has('Space') || this.btnHeld.has('ascend');
    this.descend = k.has('ControlLeft') || k.has('ControlRight') || k.has('KeyC') || this.btnHeld.has('descend');
    this.glide = k.has('KeyQ') || this.touchGlide;
  }

  /** Setelah dibaca setiap frame. */
  endFrame() { this.mouseYaw = 0; this.camDX = 0; this.camDY = 0; }
}
