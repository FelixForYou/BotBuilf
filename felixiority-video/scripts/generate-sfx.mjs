/**
 * Sintesis sound effects FELIXIORITY secara prosedural (deterministik, tanpa aset/layanan luar).
 * Output: public/sfx/*.wav — 48 kHz, 16-bit, stereo.
 *
 *   node scripts/generate-sfx.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SR = 48000;
const OUT = path.resolve('public/sfx');
fs.mkdirSync(OUT, {recursive: true});

// --- util -----------------------------------------------------------------
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const buf = (sec) => [new Float32Array(Math.ceil(sec * SR)), new Float32Array(Math.ceil(sec * SR))];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);

/** State-variable filter (Chamberlin), returns per-sample processor. */
function svf() {
  let low = 0, band = 0;
  return (x, cutoff, q, mode = 'band') => {
    const f = 2 * Math.sin((Math.PI * clamp(cutoff, 20, SR / 6)) / SR);
    const high = x - low - q * band;
    band += f * high;
    low += f * band;
    return mode === 'low' ? low : mode === 'high' ? high : band;
  };
}

function writeWav(name, [L, R], gain = 1) {
  let peak = 0;
  for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const norm = peak > 0 ? (0.89 * gain) / peak : 1;
  const n = L.length;
  const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    // 2ms fade di ujung untuk mencegah klik
    const edge = Math.min(1, i / (SR * 0.002), (n - 1 - i) / (SR * 0.002));
    b.writeInt16LE(Math.round(clamp(L[i] * norm * edge, -1, 1) * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(clamp(R[i] * norm * edge, -1, 1) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(path.join(OUT, name + '.wav'), b);
  console.log('✓', name, (n / SR).toFixed(2) + 's');
}

/** Noise whoosh: band-pass sweep + envelope + stereo pan. */
function whoosh({dur, f0, f1, peakAt = 0.55, q = 0.9, pan0 = -0.6, pan1 = 0.6, seed = 1, air = 0.25}) {
  const [L, R] = buf(dur);
  const r = rng(seed);
  const fa = svf(), fb = svf(), fc = svf();
  for (let i = 0; i < L.length; i++) {
    const t = i / L.length;
    const env = t < peakAt ? Math.pow(t / peakAt, 2.2) : Math.pow(1 - (t - peakAt) / (1 - peakAt), 1.6);
    const cut = f0 * Math.pow(f1 / f0, smooth(t));
    const n = r() * 2 - 1;
    let s = fa(n, cut, q) * 0.8 + fb(n, cut * 2.3, q * 1.4) * 0.35;
    s += fc(n, 7000, 1.2, 'high') * air * env;
    s *= env;
    const p = pan0 + (pan1 - pan0) * smooth(t);
    L[i] = s * Math.cos(((p + 1) * Math.PI) / 4);
    R[i] = s * Math.sin(((p + 1) * Math.PI) / 4);
  }
  return [L, R];
}

function mix(dst, src, offsetSec = 0, g = 1) {
  const o = Math.round(offsetSec * SR);
  for (let i = 0; i < src[0].length && i + o < dst[0].length; i++) {
    dst[0][i + o] += src[0][i] * g;
    dst[1][i + o] += src[1][i] * g;
  }
  return dst;
}

function tone({dur, f0, f1 = f0, attack = 0.002, decay = 0.2, harm = [1], pan = 0, vib = 0}) {
  const [L, R] = buf(dur);
  let ph = 0;
  for (let i = 0; i < L.length; i++) {
    const t = i / SR;
    const f = f0 * Math.pow(f1 / f0, Math.min(1, t / dur));
    ph += (2 * Math.PI * f * (1 + vib * Math.sin(2 * Math.PI * 6 * t))) / SR;
    const env = t < attack ? t / attack : Math.exp(-(t - attack) / decay);
    let s = 0;
    harm.forEach((a, k) => (s += a * Math.sin(ph * (k + 1))));
    s *= env;
    L[i] = s * Math.cos(((pan + 1) * Math.PI) / 4);
    R[i] = s * Math.sin(((pan + 1) * Math.PI) / 4);
  }
  return [L, R];
}

function noiseBurst({dur, cutoff, q = 1, decay = 0.01, seed = 3, mode = 'band'}) {
  const [L, R] = buf(dur);
  const r = rng(seed);
  const f = svf();
  for (let i = 0; i < L.length; i++) {
    const t = i / SR;
    const s = f(r() * 2 - 1, cutoff, q, mode) * Math.exp(-t / decay);
    L[i] = s; R[i] = s;
  }
  return [L, R];
}

// --- sounds ---------------------------------------------------------------
// 1. Soft cinematic whoosh
writeWav('whoosh-soft', whoosh({dur: 0.9, f0: 300, f1: 2400, seed: 11}), 0.8);
// 2. Smooth camera sweep (lebih panjang, rendah)
writeWav('camera-sweep', whoosh({dur: 1.4, f0: 160, f1: 1300, peakAt: 0.6, q: 0.7, seed: 21, air: 0.12}), 0.75);
// 3. Layered transition swoosh
{
  const out = buf(1.1);
  mix(out, whoosh({dur: 1.0, f0: 220, f1: 3200, seed: 31, pan0: 0.7, pan1: -0.7}), 0);
  mix(out, whoosh({dur: 0.7, f0: 900, f1: 5200, peakAt: 0.5, seed: 32, q: 1.3, pan0: 0.5, pan1: -0.5}), 0.22, 0.5);
  mix(out, tone({dur: 0.6, f0: 90, f1: 55, decay: 0.18, harm: [1, 0.3]}), 0.45, 0.35);
  writeWav('swoosh-layered', out, 0.85);
}
// 4. Reverse-in whoosh (masuk, memuncak di akhir) untuk push-in
writeWav('whoosh-in', whoosh({dur: 1.0, f0: 200, f1: 3800, peakAt: 0.93, q: 0.8, seed: 41, pan0: 0, pan1: 0, air: 0.3}), 0.8);
// 5. Premium UI click
{
  const out = buf(0.12);
  mix(out, noiseBurst({dur: 0.05, cutoff: 4200, q: 0.6, decay: 0.0025, seed: 51}), 0, 0.9);
  mix(out, tone({dur: 0.1, f0: 2100, f1: 1500, decay: 0.012, harm: [1, 0.2]}), 0.001, 0.55);
  mix(out, tone({dur: 0.1, f0: 340, f1: 260, decay: 0.02}), 0, 0.35);
  writeWav('ui-click', out, 0.6);
}
// 6. Subtle digital pop
{
  const out = buf(0.22);
  mix(out, tone({dur: 0.2, f0: 520, f1: 1240, attack: 0.001, decay: 0.045, harm: [1, 0.15, 0.05]}), 0);
  mix(out, noiseBurst({dur: 0.03, cutoff: 6000, decay: 0.002, seed: 61}), 0, 0.25);
  writeWav('digital-pop', out, 0.55);
}
// 7. Soft pop (lebih rendah, untuk bubble chat)
{
  const out = buf(0.2);
  mix(out, tone({dur: 0.18, f0: 380, f1: 760, attack: 0.001, decay: 0.04, harm: [1, 0.1]}), 0);
  writeWav('bubble-pop', out, 0.5);
}
// 8. Soft mechanical movement (servo + rattle)
{
  const out = buf(0.55);
  const r = rng(71);
  const f = svf();
  const [L, R] = out;
  let ph = 0;
  for (let i = 0; i < L.length; i++) {
    const t = i / SR;
    const env = Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 1.5;
    const fr = 140 + 60 * Math.sin(t * 9);
    ph += (2 * Math.PI * fr) / SR;
    const saw = ((ph / (2 * Math.PI)) % 1) * 2 - 1;
    const n = f(r() * 2 - 1, 1800, 1.5);
    const s = (saw * 0.18 + n * 0.25) * env;
    L[i] = s; R[i] = s * 0.9;
  }
  mix(out, noiseBurst({dur: 0.06, cutoff: 2600, q: 2, decay: 0.006, seed: 72}), 0.47, 0.8);
  mix(out, tone({dur: 0.08, f0: 180, decay: 0.02}), 0.47, 0.5);
  writeWav('mechanical', out, 0.5);
}
// 9. Mechanical tick (pendek, untuk objek mendarat)
{
  const out = buf(0.12);
  mix(out, noiseBurst({dur: 0.06, cutoff: 1900, q: 2.5, decay: 0.006, seed: 81}), 0);
  mix(out, tone({dur: 0.1, f0: 210, f1: 150, decay: 0.02}), 0, 0.6);
  writeWav('tick', out, 0.45);
}
// 10. Light sparkle (lonceng tinggi, acak deterministik)
{
  const out = buf(1.2);
  const r = rng(91);
  const notes = [2637, 3136, 3520, 3951, 4699, 5274];
  for (let k = 0; k < 7; k++) {
    const f = notes[Math.floor(r() * notes.length)];
    mix(out, tone({dur: 0.9, f0: f, attack: 0.002, decay: 0.22, harm: [1, 0, 0.12], pan: r() * 1.4 - 0.7}), k * 0.055 + r() * 0.02, 0.45 * (1 - k * 0.08));
  }
  mix(out, whoosh({dur: 0.6, f0: 4000, f1: 9000, q: 1.5, seed: 92, air: 0.6}), 0, 0.12);
  writeWav('sparkle', out, 0.45);
}
// 11. Low-frequency impact (brand reveal)
{
  const out = buf(2.4);
  mix(out, tone({dur: 2.3, f0: 78, f1: 34, attack: 0.004, decay: 0.55, harm: [1, 0.35, 0.1]}), 0);
  mix(out, noiseBurst({dur: 0.5, cutoff: 260, q: 0.8, decay: 0.09, seed: 101, mode: 'low'}), 0, 1.2);
  mix(out, noiseBurst({dur: 0.15, cutoff: 3200, q: 0.7, decay: 0.012, seed: 102}), 0, 0.25);
  mix(out, whoosh({dur: 1.6, f0: 120, f1: 60, peakAt: 0.05, q: 0.6, seed: 103, pan0: 0, pan1: 0, air: 0}), 0, 0.35);
  writeWav('impact-low', out, 0.9);
}
// 12. Outro chime (penutup memuaskan)
{
  const out = buf(3.0);
  const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  chord.forEach((f, k) => mix(out, tone({dur: 2.9, f0: f, attack: 0.004, decay: 0.9 - k * 0.08, harm: [1, 0.08, 0.04], pan: (k - 2) * 0.25}), k * 0.035, 0.32));
  mix(out, tone({dur: 2.0, f0: 130.8, attack: 0.01, decay: 0.6}), 0, 0.3);
  writeWav('outro-chime', out, 0.7);
}
// 13. Riser halus (sebelum reveal)
writeWav('riser', whoosh({dur: 1.6, f0: 250, f1: 5200, peakAt: 0.97, q: 1.1, seed: 111, pan0: -0.2, pan1: 0.2, air: 0.4}), 0.55);
// 14. Data blip (pendek, tinggi)
{
  const out = buf(0.1);
  mix(out, tone({dur: 0.09, f0: 1760, f1: 2350, attack: 0.001, decay: 0.018, harm: [1, 0.1]}), 0);
  writeWav('data-blip', out, 0.35);
}
// 15. Typing (rangkaian ketukan lembut, 1 detik)
{
  const out = buf(1.0);
  const r = rng(121);
  for (let k = 0; k < 11; k++) mix(out, noiseBurst({dur: 0.04, cutoff: 3000 + r() * 1500, q: 1.8, decay: 0.004, seed: 130 + k}), k * 0.085 + r() * 0.02, 0.5 + r() * 0.4);
  writeWav('typing', out, 0.3);
}
// 16. Success chime (dua nada naik)
{
  const out = buf(0.8);
  mix(out, tone({dur: 0.6, f0: 1046.5, decay: 0.16, harm: [1, 0.1]}), 0, 0.6);
  mix(out, tone({dur: 0.7, f0: 1568, decay: 0.22, harm: [1, 0.1]}), 0.09, 0.6);
  writeWav('success', out, 0.45);
}
