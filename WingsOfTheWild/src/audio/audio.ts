// Audio sintesis WebAudio (tanpa file): angin, kepakan, air, hujan, kicau, jangkrik, efek.
export class Audio {
  ctx: AudioContext | null = null;
  private master!: GainNode; private sfx!: GainNode; private amb!: GainNode;
  private windG!: GainNode; private windF!: BiquadFilterNode;
  private waterG!: GainNode; private rainG!: GainNode;
  private noise!: AudioBuffer;
  vol = { master: 0.8, sfx: 0.8, ambient: 0.7 };
  private chirpT = 2; private cricketT = 1;

  /** Harus dipanggil dari gestur pengguna. */
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain(); this.master.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.connect(this.master);
    this.amb = ctx.createGain(); this.amb.connect(this.master);
    this.setVolumes(this.vol);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = w * 0.5 + b * 3; }
    const loop = (filterType: BiquadFilterType, freq: number, q: number) => {
      const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(this.amb); src.start();
      return { f, g };
    };
    const w = loop('bandpass', 400, 0.7); this.windG = w.g; this.windF = w.f;
    this.waterG = loop('lowpass', 700, 0.5).g;
    this.rainG = loop('highpass', 2500, 0.3).g;
  }

  setVolumes(v: { master: number; sfx: number; ambient: number }) {
    this.vol = { ...v };
    if (!this.ctx) return;
    this.master.gain.value = v.master;
    this.sfx.gain.value = v.sfx;
    this.amb.gain.value = v.ambient;
  }

  suspend(s: boolean) { if (!this.ctx) return; if (s) this.ctx.suspend(); else this.ctx.resume(); }

  update(dt: number, speed: number, flying: boolean, water: number, rain: number, day: number, night: number, birdsNear: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const ws = flying ? Math.min(1, 0.08 + speed / 45) : 0.04;
    this.windG.gain.setTargetAtTime(ws * 0.5, t, 0.2);
    this.windF.frequency.setTargetAtTime(250 + speed * 28, t, 0.3);
    this.waterG.gain.setTargetAtTime(water * 0.35, t, 0.4);
    this.rainG.gain.setTargetAtTime(rain * 0.12, t, 0.5);
    this.chirpT -= dt;
    if (this.chirpT <= 0) {
      this.chirpT = (day > 0.5 ? 1.5 : 6) + Math.random() * (birdsNear > 0 ? 2 : 5);
      if (day > 0.3) this.chirp(0.25 + Math.random() * 0.2);
    }
    this.cricketT -= dt;
    if (this.cricketT <= 0 && night > 0.5) { this.cricketT = 0.6 + Math.random() * 1.2; this.cricket(); }
  }

  private env(g: GainNode, a: number, peak: number, d: number) {
    const t = this.ctx!.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, dest?: AudioNode, delay = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest ?? this.sfx); o.start(t); o.stop(t + dur + 0.05);
  }
  private burst(type: BiquadFilterType, freq: number, dur: number, vol: number, dest?: AudioNode) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = 1;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(dest ?? this.sfx);
    this.env(g, 0.01, vol, dur);
    src.start(ctx.currentTime, Math.random()); src.stop(ctx.currentTime + dur + 0.1);
  }

  flap() { this.burst('lowpass', 500, 0.12, 0.35); }
  splash() { this.burst('lowpass', 1200, 0.5, 0.6); this.burst('highpass', 3000, 0.3, 0.2); }
  crash() { this.tone('sine', 120, 50, 0.25, 0.6); this.burst('lowpass', 300, 0.2, 0.4); }
  pickup() { this.tone('triangle', 660, 990, 0.12, 0.25); this.tone('triangle', 990, 1320, 0.12, 0.2, undefined, 0.07); }
  twig() { this.tone('square', 220, 180, 0.08, 0.08); this.burst('bandpass', 1500, 0.08, 0.2); }
  ring() { this.tone('sine', 880, 880, 0.25, 0.25); this.tone('sine', 1320, 1320, 0.3, 0.2, undefined, 0.08); }
  levelUp() { [523, 659, 784, 1046].forEach((f, i) => this.tone('triangle', f, f, 0.3, 0.25, undefined, i * 0.1)); }
  discover() { [392, 523, 659, 784, 1046].forEach((f, i) => this.tone('sine', f, f * 1.01, 0.5, 0.18, undefined, i * 0.12)); }
  whoosh() { this.burst('bandpass', 900, 0.35, 0.5); }
  skill() { this.tone('sine', 500, 1200, 0.25, 0.15); }
  fail() { this.tone('triangle', 400, 200, 0.4, 0.2); }
  hurt() { this.tone('sawtooth', 300, 120, 0.25, 0.2); }
  screech() { this.tone('sawtooth', 2600, 1300, 0.7, 0.12); this.tone('square', 2200, 1100, 0.6, 0.05, undefined, 0.05); }
  meow() { this.tone('triangle', 500, 800, 0.15, 0.12); this.tone('triangle', 800, 450, 0.3, 0.12, undefined, 0.15); }
  peep() { this.tone('sine', 2600, 3200, 0.08, 0.12); this.tone('sine', 2600, 3400, 0.08, 0.12, undefined, 0.15); }
  chirp(vol = 0.3) {
    const base = 2000 + Math.random() * 2000;
    const n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) this.tone('sine', base * (0.9 + Math.random() * 0.3), base * (1.1 + Math.random() * 0.4), 0.07 + Math.random() * 0.05, vol * 0.25, this.amb, i * 0.11);
  }
  myCall() { for (let i = 0; i < 4; i++) this.tone('sine', 1800 + i * 300, 2600 + i * 200, 0.12, 0.2, undefined, i * 0.13); }
  private cricket() { for (let i = 0; i < 3; i++) this.tone('sine', 4200, 4300, 0.04, 0.05, this.amb, i * 0.06); }
}
