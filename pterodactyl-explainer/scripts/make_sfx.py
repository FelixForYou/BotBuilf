#!/usr/bin/env python3
"""
Sintesis SFX prosedural (dibuat sendiri, tanpa sampel pihak ketiga).
Hasil: public/audio/sfx/*.wav (48 kHz, mono, 16-bit).
Setiap jenis punya beberapa varian (seed berbeda) agar bunyi tidak identik berulang.
"""
import os
import numpy as np
import soundfile as sf

SR = 48000
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public/audio/sfx')
os.makedirs(OUT, exist_ok=True)


def t(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.005, r=0.1, shape=4.0):
    x = np.arange(n) / SR
    att = np.clip(x / max(a, 1e-4), 0, 1)
    dec = np.exp(-np.maximum(x - a, 0) / max(r, 1e-4) * (shape / 4))
    return att * dec


def biquad_bp(x, f0, q):
    # band-pass RBJ
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = np.array([alpha, 0, -alpha]); a = np.array([1 + alpha, -2 * np.cos(w0), 1 - alpha])
    return lfilt(b / a[0], a / a[0], x)


def biquad_lp(x, f0, q=0.707):
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    b = np.array([(1 - c) / 2, 1 - c, (1 - c) / 2]); a = np.array([1 + alpha, -2 * c, 1 - alpha])
    return lfilt(b / a[0], a / a[0], x)


def biquad_hp(x, f0, q=0.707):
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    b = np.array([(1 + c) / 2, -(1 + c), (1 + c) / 2]); a = np.array([1 + alpha, -2 * c, 1 - alpha])
    return lfilt(b / a[0], a / a[0], x)


def lfilt(b, a, x):
    from scipy.signal import lfilter
    return lfilter(b, a, x)


def sweep_bp(noise, f_start, f_end, q, block=256):
    """band-pass dengan frekuensi tengah yang bergeser (diproses per blok)."""
    from scipy.signal import lfilter, lfilter_zi
    out = np.zeros_like(noise)
    n = len(noise)
    zi = None
    for i in range(0, n, block):
        fr = f_start * (f_end / f_start) ** (i / max(1, n))
        w0 = 2 * np.pi * fr / SR
        alpha = np.sin(w0) / (2 * q)
        b = np.array([alpha, 0, -alpha]) / (1 + alpha)
        a = np.array([1, -2 * np.cos(w0) / (1 + alpha), (1 - alpha) / (1 + alpha)])
        if zi is None:
            zi = lfilter_zi(b, a) * 0
        seg, zi = lfilter(b, a, noise[i:i + block], zi=zi)
        out[i:i + block] = seg
    return out


def norm(x, peak=0.9):
    m = np.max(np.abs(x))
    return x / m * peak if m > 0 else x


def fade(x, fi=0.002, fo=0.01):
    n = len(x)
    a = int(fi * SR); b = int(fo * SR)
    if a: x[:a] *= np.linspace(0, 1, a)
    if b: x[-b:] *= np.linspace(1, 0, b)
    return x


def save(name, x, peak=0.9):
    x = fade(norm(np.asarray(x, dtype=np.float64), peak))
    sf.write(os.path.join(OUT, name + '.wav'), x.astype(np.float32), SR, subtype='PCM_16')


rng = np.random.default_rng


# --- klik lembut (UI) ---
for i, (f0, d) in enumerate([(2400, 0.05), (1800, 0.06), (3100, 0.045), (1300, 0.07)]):
    r = rng(10 + i)
    n = int(d * SR)
    x = biquad_bp(r.standard_normal(n), f0, 3) * env(n, 0.0008, 0.012)
    x += 0.35 * np.sin(2 * np.pi * f0 * 0.5 * t(d)) * env(n, 0.0005, 0.008)
    save(f'click_{i+1}', x, 0.8)

# --- tik kecil (indikator, chip) ---
for i, f0 in enumerate([2600, 3400, 2100]):
    d = 0.04
    n = int(d * SR)
    x = np.sin(2 * np.pi * f0 * t(d)) * env(n, 0.0005, 0.006)
    save(f'tick_{i+1}', x, 0.6)

# --- ketikan singkat (burst tombol keyboard) ---
for i, (count, dur) in enumerate([(6, 0.7), (10, 1.1), (4, 0.45), (14, 1.6)]):
    r = rng(30 + i)
    x = np.zeros(int(dur * SR))
    pos = np.sort(r.uniform(0, dur - 0.05, count))
    for k, p0 in enumerate(pos):
        n = int(0.035 * SR)
        f0 = r.uniform(1800, 3600)
        c = biquad_bp(r.standard_normal(n), f0, 2.2) * env(n, 0.0005, 0.007)
        c += 0.5 * biquad_lp(r.standard_normal(n), 600) * env(n, 0.0005, 0.01)
        a = int(p0 * SR)
        x[a:a + n] += c * r.uniform(0.6, 1.0)
    save(f'type_{i+1}', x, 0.7)

# --- gerak panel: hembusan udara (material: kaca / kertas / berat) ---
slides = [
    ('slide_glass_1', 0.55, 1800, 5200, 1.6, 0.35),
    ('slide_glass_2', 0.75, 2400, 6800, 1.8, 0.45),
    ('slide_paper_1', 0.5, 700, 2200, 0.9, 0.4),
    ('slide_paper_2', 0.65, 900, 1800, 0.8, 0.5),
    ('slide_heavy_1', 0.9, 180, 520, 0.7, 0.55),
    ('slide_heavy_2', 1.1, 140, 420, 0.6, 0.6),
    ('slide_soft_1', 0.8, 1200, 900, 1.1, 0.5),
    ('slide_soft_2', 0.6, 2000, 1400, 1.2, 0.45),
]
for k, (name, d, f1, f2, q, peakpos) in enumerate(slides):
    r = rng(50 + k)
    n = int(d * SR)
    x = sweep_bp(r.standard_normal(n), f1, f2, q)
    tt = np.linspace(0, 1, n)
    e = np.where(tt < peakpos, (tt / peakpos) ** 2, np.exp(-(tt - peakpos) / (1 - peakpos) * 4))
    x = x * e
    if 'heavy' in name:
        x += 0.5 * np.sin(2 * np.pi * (f1 * 0.4) * t(d)) * e
    save(name, x, 0.75)

# --- reverse slide (tarikan ke dalam) ---
for k in range(2):
    r = rng(70 + k)
    d = 0.7 + 0.2 * k
    n = int(d * SR)
    x = sweep_bp(r.standard_normal(n), 600 + 400 * k, 4200 + 1200 * k, 1.2)
    tt = np.linspace(0, 1, n)
    x *= tt ** 2.5 * (1 - np.clip((tt - 0.96) / 0.04, 0, 1))
    save(f'suck_{k+1}', x, 0.65)

# --- dentum lembut (lapisan mendarat) ---
for k, (f0, d) in enumerate([(70, 0.6), (95, 0.5), (58, 0.8)]):
    r = rng(80 + k)
    n = int(d * SR)
    tt = t(d)
    fr = f0 * (1 + 0.6 * np.exp(-tt * 30))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    x = np.sin(ph) * env(n, 0.002, 0.16)
    x += 0.25 * biquad_lp(r.standard_normal(n), 900) * env(n, 0.001, 0.03)
    save(f'thud_{k+1}', x, 0.85)

# --- pop gelembung pesan ---
for k, (a, b, d) in enumerate([(380, 1100, 0.09), (300, 900, 0.1), (460, 1300, 0.08), (520, 820, 0.11)]):
    n = int(d * SR)
    tt = t(d)
    fr = a + (b - a) * (1 - np.exp(-tt * 60))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(n, 0.002, 0.03)
    save(f'pop_{k+1}', x, 0.7)

# --- aliran data (butiran kecil) ---
for k, (dur, dens) in enumerate([(1.2, 18), (1.8, 24), (0.9, 12)]):
    r = rng(90 + k)
    x = np.zeros(int(dur * SR))
    for j in range(dens):
        p0 = r.uniform(0, dur - 0.05)
        d = 0.025
        n = int(d * SR)
        f0 = r.choice([1760, 2093, 2349, 2637, 3136]) * r.uniform(0.98, 1.02)
        g = np.sin(2 * np.pi * f0 * t(d)) * env(n, 0.001, 0.006)
        a = int(p0 * SR)
        amp = np.sin(np.pi * p0 / dur) ** 0.7
        x[a:a + n] += g * amp * r.uniform(0.4, 1)
    save(f'data_{k+1}', x, 0.55)

# --- kilau logo (parsial lembut, bukan nada notifikasi) ---
for k, base in enumerate([523.25, 392.0]):
    d = 2.2
    n = int(d * SR)
    r = rng(100 + k)
    x = np.zeros(n)
    for j, mul in enumerate([1, 2.01, 3.03, 4.2, 5.4]):
        x += (0.6 ** j) * np.sin(2 * np.pi * base * mul * t(d) + r.uniform(0, 6)) * env(n, 0.08 + j * 0.03, 0.5 - j * 0.05)
    x += 0.15 * sweep_bp(r.standard_normal(n), 3000, 9000, 2) * env(n, 0.3, 0.4)
    save(f'shimmer_{k+1}', x, 0.5)

# --- riser pendek menuju transisi ---
for k, d in enumerate([1.0, 1.4]):
    r = rng(110 + k)
    n = int(d * SR)
    x = sweep_bp(r.standard_normal(n), 300, 3800, 1.4)
    tt = np.linspace(0, 1, n)
    x *= tt ** 2
    save(f'riser_{k+1}', x, 0.6)

# --- error lembut ---
d = 0.32
n = int(d * SR)
tt = t(d)
x = np.zeros(n)
for st in (0.0, 0.14):
    a = int(st * SR); m = int(0.12 * SR)
    seg = np.sign(np.sin(2 * np.pi * 196 * tt[:m])) * 0.3 + np.sin(2 * np.pi * 196 * tt[:m])
    x[a:a + m] += biquad_lp(seg, 1400) * env(m, 0.003, 0.05)
save('error_1', x, 0.55)

# --- konfirmasi (dua tik naik) ---
d = 0.25
x = np.zeros(int(d * SR))
for st, f0 in ((0.0, 1318.5), (0.08, 1760.0)):
    m = int(0.09 * SR); a = int(st * SR)
    x[a:a + m] += np.sin(2 * np.pi * f0 * t(0.09)) * env(m, 0.001, 0.025)
save('confirm_1', x, 0.5)

# --- saklar / toggle ---
for k, f0 in enumerate([900, 1300]):
    r = rng(120 + k)
    d = 0.08
    n = int(d * SR)
    x = biquad_bp(r.standard_normal(n), f0 * 2, 4) * env(n, 0.0005, 0.01)
    x[int(0.035 * SR):] += 0.7 * biquad_bp(r.standard_normal(n - int(0.035 * SR)), f0 * 3, 5) * env(n - int(0.035 * SR), 0.0005, 0.008)
    save(f'switch_{k+1}', x, 0.7)

# --- goresan garis (stroke draw) ---
for k, d in enumerate([0.6, 1.0]):
    r = rng(130 + k)
    n = int(d * SR)
    x = biquad_bp(r.standard_normal(n), 5200, 1.5)
    tt = np.linspace(0, 1, n)
    x *= (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt + 1)) * np.sin(np.pi * tt) ** 0.8
    save(f'draw_{k+1}', x, 0.35)

# --- klak plastik/kartu (snap) ---
for k, f0 in enumerate([1500, 1100, 1900]):
    r = rng(140 + k)
    d = 0.09
    n = int(d * SR)
    x = biquad_bp(r.standard_normal(n), f0, 1.4) * env(n, 0.0004, 0.018)
    x += 0.4 * np.sin(2 * np.pi * f0 * 0.25 * t(d)) * env(n, 0.0005, 0.03)
    save(f'snap_{k+1}', x, 0.7)

# --- dengung aktif (mesin menyala), sangat pelan ---
d = 1.6
n = int(d * SR)
r = rng(150)
x = (np.sin(2 * np.pi * 110 * t(d)) * 0.5 + np.sin(2 * np.pi * 220 * t(d)) * 0.2 + 0.15 * biquad_lp(r.standard_normal(n), 400))
tt = np.linspace(0, 1, n)
x *= np.sin(np.pi * tt) ** 1.5
save('powerup_1', x, 0.5)

print('SFX:', sorted(os.listdir(OUT)))
