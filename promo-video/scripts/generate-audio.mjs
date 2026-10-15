// Membuat musik latar & efek suara secara prosedural (sintesis murni, tanpa sampel pihak ketiga).
// Hasilnya karya orisinal proyek ini, jadi aman dipakai tanpa lisensi tambahan.
// Tempo 120 BPM -> 1 ketukan = 0,5 detik = 30 frame @60 FPS. Pergantian adegan
// (4 s, 10 s, 17 s, 24 s) jatuh tepat di ketukan.
//
// Jalankan: npm run audio   (menulis ke public/audio/*.wav)

import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 48000;
const BPM = 120;
const BEAT = 60 / BPM;
const DURATION = 30;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');

// PRNG deterministik agar hasil selalu identik.
const rng = (seed) => () => {
	seed = (seed * 1664525 + 1013904223) >>> 0;
	return seed / 4294967296;
};
const noise = (() => {
	const r = rng(1234);
	return () => r() * 2 - 1;
})();

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function writeWav(name, L, R, peakTarget) {
	let peak = 0;
	for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
	const g = peak > 0 ? peakTarget / peak : 1;
	const n = L.length;
	const buf = Buffer.alloc(44 + n * 4);
	buf.write('RIFF', 0);
	buf.writeUInt32LE(36 + n * 4, 4);
	buf.write('WAVE', 8);
	buf.write('fmt ', 12);
	buf.writeUInt32LE(16, 16);
	buf.writeUInt16LE(1, 20);
	buf.writeUInt16LE(2, 22);
	buf.writeUInt32LE(SR, 24);
	buf.writeUInt32LE(SR * 4, 28);
	buf.writeUInt16LE(4, 32);
	buf.writeUInt16LE(16, 34);
	buf.write('data', 36);
	buf.writeUInt32LE(n * 4, 40);
	for (let i = 0; i < n; i++) {
		buf.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), 44 + i * 4);
		buf.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), 46 + i * 4);
	}
	mkdirSync(OUT, {recursive: true});
	writeFileSync(join(OUT, name), buf);
	console.log(`${name}: ${(n / SR).toFixed(2)} s, puncak ${(20 * Math.log10(peakTarget)).toFixed(1)} dBFS`);
}

// ---------------------------------------------------------------- musik
function music() {
	const N = SR * DURATION;
	const L = new Float32Array(N);
	const R = new Float32Array(N);
	const add = (i, l, r = l) => {
		if (i >= 0 && i < N) {
			L[i] += l;
			R[i] += r;
		}
	};
	const at = (sec) => Math.round(sec * SR);

	// Progresi Am - F - C - G (1 bar = 4 ketukan = 2 detik)
	const chords = [
		[57, 60, 64],
		[53, 57, 60],
		[48, 52, 55],
		[55, 59, 62],
	];
	const roots = [45, 41, 48, 43];
	const chordAt = (t) => Math.floor(t / (BEAT * 4)) % 4;

	// Amplop sidechain dari kick (untuk efek "pump")
	const duck = new Float32Array(N).fill(1);
	const kickTimes = [];

	const totalBeats = DURATION / BEAT;
	for (let b = 0; b < totalBeats; b++) {
		const t = b * BEAT;
		const full = t >= 4 && t < 29.5;
		const breakdown = t >= 22 && t < 24; // jeda sebelum drop CTA
		if (full && !breakdown) kickTimes.push(t);
		if (t >= 2 && t < 4 && b % 2 === 0) kickTimes.push(t); // kick tipis di intro
	}
	kickTimes.push(24); // drop

	// Kick
	for (const t of kickTimes) {
		const s = at(t);
		const len = at(0.32);
		let ph = 0;
		for (let i = 0; i < len; i++) {
			const x = i / SR;
			const f = 45 + 110 * Math.exp(-x * 30);
			ph += f / SR;
			const v = Math.sin(2 * Math.PI * ph) * Math.exp(-x * 9) * 0.9;
			const click = i < 120 ? noise() * 0.25 * (1 - i / 120) : 0;
			add(s + i, v + click);
		}
		for (let i = 0; i < at(0.3); i++) {
			const k = s + i;
			if (k < N) duck[k] = Math.min(duck[k], 0.35 + 0.65 * (i / at(0.3)));
		}
	}

	// Clap di ketukan 2 & 4, hi-hat di offbeat
	for (let b = 0; b < totalBeats; b++) {
		const t = b * BEAT;
		const full = t >= 4 && t < 29.5;
		if (full && b % 2 === 1 && !(t >= 22 && t < 24)) {
			const s = at(t);
			let lp = 0;
			for (let i = 0; i < at(0.2); i++) {
				const x = i / SR;
				const n = noise();
				lp += 0.35 * (n - lp);
				const env = Math.exp(-x * 22) * (x < 0.01 ? 0.6 + 0.4 * Math.sin(x * 900) : 1);
				add(s + i, (n - lp) * env * 0.32, (n - lp) * env * 0.3);
			}
		}
		if (t >= 0.5 && t < 29.5) {
			const s = at(t + BEAT / 2);
			const amp = t < 4 ? 0.07 : 0.12;
			let lp = 0;
			for (let i = 0; i < at(0.06); i++) {
				const n = noise();
				lp += 0.6 * (n - lp);
				const v = (n - lp) * Math.exp(-(i / SR) * 70) * amp;
				add(s + i, v * 0.8, v);
			}
		}
	}

	// Bass offbeat (saw + lowpass satu kutub)
	let bassLp = 0;
	let bassPh = 0;
	for (let i = at(4); i < at(29.5); i++) {
		const t = i / SR;
		if (t >= 22 && t < 24) continue;
		const pos = (t / (BEAT / 2)) % 2; // 0..2 per ketukan
		if (pos < 1) continue; // hanya offbeat
		const x = (pos - 1) * (BEAT / 2);
		const f = midi(roots[chordAt(t)] - 12);
		bassPh += f / SR;
		const raw = saw(bassPh % 1);
		const cutoff = 0.04 + 0.12 * Math.exp(-x * 12);
		bassLp += cutoff * (raw - bassLp);
		const env = Math.min(1, x * 400) * Math.exp(-x * 3);
		add(i, bassLp * env * 0.55 * duck[i]);
	}

	// Pad (saw detune, filter membuka pelan)
	const padPh = new Float64Array(6);
	let padLpL = 0;
	let padLpR = 0;
	for (let i = 0; i < N; i++) {
		const t = i / SR;
		const ch = chords[chordAt(t)];
		let l = 0;
		let r = 0;
		for (let v = 0; v < 3; v++) {
			for (let d = 0; d < 2; d++) {
				const k = v * 2 + d;
				padPh[k] += (midi(ch[v]) * (d ? 1.004 : 0.996)) / SR;
				const s = saw(padPh[k] % 1);
				if (d) r += s;
				else l += s;
			}
		}
		const open = t < 4 ? 0.015 + 0.03 * (t / 4) : 0.05;
		padLpL += open * (l - padLpL);
		padLpR += open * (r - padLpR);
		const level = (t < 1 ? t : 1) * (t >= 22 && t < 24 ? 1.3 : 1) * 0.11;
		add(i, padLpL * level * duck[i], padLpR * level * duck[i]);
	}

	// Arpeggio pluck 16-an (mulai dari intro, ping-pong stereo)
	const step = BEAT / 4;
	const pattern = [0, 1, 2, 1, 0, 2, 1, 2];
	for (let k = 0; k * step < 29.5; k++) {
		const t = k * step;
		if (t < 1) continue;
		const ch = chords[chordAt(t)];
		const note = ch[pattern[k % 8]] + 12 + (k % 16 >= 8 && t >= 10 ? 12 : 0);
		const f = midi(note);
		const s = at(t);
		const amp = t < 4 ? 0.07 : 0.09;
		const pan = k % 2 ? 0.7 : 1;
		let ph = 0;
		let lp = 0;
		for (let i = 0; i < at(0.18); i++) {
			const x = i / SR;
			ph += f / SR;
			const sq = (ph % 1) < 0.5 ? 1 : -1;
			lp += (0.08 + 0.3 * Math.exp(-x * 30)) * (sq - lp);
			const v = lp * Math.exp(-x * 16) * amp;
			add(s + i, v * pan, v * (1.7 - pan));
		}
	}

	// Riser sebelum drop (22-24 s) + crash di 24 s, riser kecil 3-4 s
	const riser = (from, to, amp) => {
		let lp = 0;
		for (let i = at(from); i < at(to); i++) {
			const p = (i - at(from)) / (at(to) - at(from));
			const n = noise();
			lp += (0.01 + 0.4 * p * p) * (n - lp);
			add(i, lp * p * p * amp, lp * p * p * amp * 0.9);
		}
	};
	riser(3, 4, 0.5);
	riser(22, 24, 0.6);
	for (const tc of [4, 24]) {
		let hp = 0;
		for (let i = 0; i < at(1.6); i++) {
			const n = noise();
			hp += 0.5 * (n - hp);
			const v = (n - hp) * Math.exp(-(i / SR) * 2.6) * 0.18;
			add(at(tc) + i, v, v * 0.95);
		}
	}

	// Fade in sangat singkat & fade out di akhir
	for (let i = 0; i < N; i++) {
		const t = i / SR;
		const g = Math.min(1, t / 0.02) * (t > 28.6 ? Math.max(0, (30 - t) / 1.4) : 1);
		L[i] *= g;
		R[i] *= g;
	}
	writeWav('music.wav', L, R, 0.63); // ~ -4 dBFS, ruang untuk SFX
}

// ---------------------------------------------------------------- SFX
function sfx(name, seconds, fn, peak) {
	const N = Math.round(SR * seconds);
	const L = new Float32Array(N);
	const R = new Float32Array(N);
	for (let i = 0; i < N; i++) {
		const [l, r] = fn(i / SR, i / N);
		L[i] = l;
		R[i] = r ?? l;
	}
	writeWav(name, L, R, peak);
}

let lp1 = 0;
sfx(
	'click.wav',
	0.09,
	(x) => {
		const n = noise();
		lp1 += 0.5 * (n - lp1);
		const v = Math.sin(2 * Math.PI * 2400 * x) * Math.exp(-x * 120) + (n - lp1) * Math.exp(-x * 400);
		return [v];
	},
	0.5,
);

let lp2 = 0;
sfx(
	'type.wav',
	0.06,
	(x) => {
		const n = noise();
		lp2 += 0.25 * (n - lp2);
		const v = lp2 * Math.exp(-x * 160) + Math.sin(2 * Math.PI * 180 * x) * Math.exp(-x * 90) * 0.4;
		return [v];
	},
	0.35,
);

let lp3 = 0;
sfx(
	'whoosh.wav',
	0.8,
	(x, p) => {
		const n = noise();
		const c = 0.01 + 0.25 * Math.sin(Math.PI * Math.min(1, p * 1.2)) ** 2;
		lp3 += c * (n - lp3);
		const env = Math.sin(Math.PI * Math.min(1, p * 1.15)) ** 2;
		return [lp3 * env * (1 - p * 0.4), lp3 * env * (0.6 + p * 0.4)];
	},
	0.45,
);

music();
