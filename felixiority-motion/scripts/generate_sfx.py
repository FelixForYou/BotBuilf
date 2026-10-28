"""Sintesis sound effects FELIXIORITY (tanpa musik, tanpa aset pihak ketiga).

Semua suara dibuat prosedural dengan numpy agar proyek bisa dirender ulang
tanpa unduhan apa pun. Seed tetap -> hasil deterministik.

Pemakaian: python3 scripts/generate_sfx.py public/sfx
"""
import os
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(20261027)


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def svf_bandpass(x, fc, q):
    """State-variable filter dengan cutoff yang boleh berubah per sampel."""
    fc = np.broadcast_to(np.asarray(fc, dtype=np.float64), x.shape)
    out_bp = np.empty_like(x)
    out_lp = np.empty_like(x)
    low = band = 0.0
    damp = 1.0 / q
    for i in range(len(x)):
        f = 2.0 * np.sin(np.pi * min(fc[i], SR / 6) / SR)
        high = x[i] - low - damp * band
        band += f * high
        low += f * band
        out_bp[i] = band
        out_lp[i] = low
    return out_bp, out_lp


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def env_ad(n, attack, release, curve=2.0):
    """Envelope attack/decay; attack & release dalam detik."""
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1) ** curve
    r = np.clip(1 - (t - attack) / max(release, 1e-4), 0, 1) ** curve
    return np.where(t < attack, a, r)


def fade(x, ms_in=2, ms_out=12):
    x = x.copy()
    ni, no = int(SR * ms_in / 1000), int(SR * ms_out / 1000)
    if ni:
        x[:ni] *= np.linspace(0, 1, ni)
    if no:
        x[-no:] *= np.linspace(1, 0, no)
    return x


def pan(mono, p):
    """p: -1 (kiri) .. 1 (kanan), boleh array."""
    p = np.broadcast_to(np.asarray(p, dtype=np.float64), mono.shape)
    ang = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(ang), mono * np.sin(ang)], axis=1)


def norm(st, peak_db):
    peak = np.max(np.abs(st)) or 1.0
    return st / peak * (10 ** (peak_db / 20))


def write(path, st):
    st = np.clip(st, -1, 1)
    data = (st * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def simple_reverb(st, mix=0.18, decay=0.45):
    """Reverb ringan (beberapa comb + diffusion) agar suara terasa 'ruang'."""
    out = st.copy()
    for ch in range(2):
        x = st[:, ch]
        wet = np.zeros_like(x)
        for d_ms, g in ((29.7, 0.75), (37.1, 0.72), (41.1, 0.7), (43.7, 0.68)):
            d = int(SR * (d_ms + ch * 1.3) / 1000)
            y = np.zeros(len(x) + d)
            y[: len(x)] = x
            for i in range(d, len(y)):
                y[i] += g * decay * y[i - d] * 1.6
            wet += y[: len(x)]
        out[:, ch] = x * (1 - mix) + lowpass(wet / 4, 6000) * mix
    return out


# ---------------------------------------------------------------- generators

def whoosh(dur=0.9, f0=300, f1=2600, peak=0.45, q=1.6, p0=-0.5, p1=0.5):
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # puncak di ~45% durasi, seperti objek lewat dekat kamera
    skew = np.clip(t / dur, 0, 1) ** 0.8
    shape = np.sin(np.pi * skew) ** 2.2
    fc = f0 + (f1 - f0) * np.sin(np.pi * np.clip(t / dur, 0, 1) * 0.5) ** 1.5
    bp, _ = svf_bandpass(noise, fc, q)
    mono = bp * shape
    st = pan(mono, np.linspace(p0, p1, n))
    return norm(fade_st(st), -6 + 20 * np.log10(peak / 0.5))


def fade_st(st):
    return np.stack([fade(st[:, 0]), fade(st[:, 1])], axis=1)


def layered_swoosh():
    a = whoosh(1.1, 220, 1800, 0.5, 1.2, -0.8, 0.7)
    b = whoosh(0.7, 900, 5200, 0.35, 2.4, -0.4, 0.9)
    out = a.copy()
    off = int(SR * 0.22)
    out[off : off + len(b)] += b[: len(out) - off] * 0.6
    return norm(simple_reverb(out, 0.15), -7)


def camera_sweep():
    dur = 1.6
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    fc = 180 + 1100 * np.sin(np.pi * t / dur) ** 2
    bp, lp = svf_bandpass(noise, fc, 0.9)
    body = (bp * 0.7 + lp * 0.5) * np.sin(np.pi * t / dur) ** 1.6
    tone = np.sin(2 * np.pi * np.cumsum(70 + 40 * t / dur) / SR) * 0.15 * np.sin(np.pi * t / dur) ** 2
    st = pan(body + tone, np.sin(np.linspace(-1.2, 1.2, n)) * 0.6)
    return norm(simple_reverb(fade_st(st), 0.2), -8)


def ui_click():
    dur = 0.09
    n = int(SR * dur)
    t = np.arange(n) / SR
    tr = rng.standard_normal(n) * np.exp(-t / 0.0015)
    bp, _ = svf_bandpass(tr, np.full(n, 4200.0), 3)
    body = np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.012) * 0.35
    low = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.02) * 0.25
    mono = bp * 1.4 + body + low
    return norm(pan(fade(mono, 0, 5), 0.05), -11)


def digital_pop():
    dur = 0.16
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 380 + 900 * np.exp(-t / 0.018)
    ph = 2 * np.pi * np.cumsum(f) / SR
    mono = np.sin(ph) * np.exp(-t / 0.045)
    mono += np.sin(ph * 2) * np.exp(-t / 0.02) * 0.2
    return norm(simple_reverb(pan(fade(mono, 1, 10), 0.0), 0.12), -10)


def soft_tick():
    dur = 0.05
    n = int(SR * dur)
    t = np.arange(n) / SR
    mono = np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.006)
    mono += rng.standard_normal(n) * np.exp(-t / 0.001) * 0.3
    return norm(pan(fade(mono, 0, 4), 0.0), -20)


def mech_move():
    dur = 0.75
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    bp, lp = svf_bandpass(noise, np.full(n, 520.0), 2.2)
    servo = np.sin(2 * np.pi * np.cumsum(140 + 90 * np.sin(np.pi * t / dur)) / SR)
    env = np.sin(np.pi * t / dur) ** 1.5
    mono = (bp * 0.5 + servo * 0.25) * env
    # "klak" penutup saat mendarat
    k0 = int(SR * 0.58)
    kt = t[: n - k0]
    clack = np.sin(2 * np.pi * 95 * kt) * np.exp(-kt / 0.05) + rng.standard_normal(n - k0) * np.exp(-kt / 0.004) * 0.4
    mono[k0:] += clack * 0.9
    return norm(simple_reverb(pan(fade(mono, 4, 20), -0.1), 0.18), -10)


def sparkle():
    dur = 1.4
    n = int(SR * dur)
    out = np.zeros((n, 2))
    notes = [2637, 3136, 3520, 3951, 4699, 5274, 6272]
    for k in range(11):
        start = int(SR * (0.02 + k * 0.075 + rng.uniform(0, 0.03)))
        f = notes[int(rng.integers(0, len(notes)))] * rng.uniform(0.995, 1.005)
        ln = n - start
        tt = np.arange(ln) / SR
        g = np.sin(2 * np.pi * f * tt) * np.exp(-tt / rng.uniform(0.08, 0.2))
        g += np.sin(2 * np.pi * f * 2.01 * tt) * np.exp(-tt / 0.04) * 0.2
        amp = 0.5 * (1 - k / 14)
        out[start:] += pan(g * amp, rng.uniform(-0.7, 0.7))
    return norm(simple_reverb(fade_st(out), 0.35), -14)


def low_impact():
    dur = 2.6
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 42 + 70 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    noise = rng.standard_normal(n)
    thump = lowpass(noise * np.exp(-t / 0.03), 900) * 2.2
    air = svf_bandpass(noise, np.full(n, 2500.0), 0.8)[0] * np.exp(-t / 0.35) * 0.18
    mono = sub * 1.0 + thump + air
    return norm(simple_reverb(pan(fade(mono, 1, 200), 0.0), 0.25), -4)


def notif():
    dur = 0.6
    n = int(SR * dur)
    t = np.arange(n) / SR
    a = np.sin(2 * np.pi * 1318.5 * t) * np.exp(-t / 0.12)
    t2 = np.clip(t - 0.085, 0, None)
    b = np.sin(2 * np.pi * 1975.5 * t2) * np.exp(-t2 / 0.18) * (t > 0.085)
    mono = (a * 0.6 + b * 0.55) * (1 - np.exp(-t / 0.002))
    return norm(simple_reverb(pan(fade(mono, 1, 30), 0.15), 0.2), -12)


def riser():
    dur = 1.1
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    fc = 400 + 5200 * (t / dur) ** 2
    bp, _ = svf_bandpass(noise, fc, 2.5)
    env = (t / dur) ** 2.2 * (1 - np.clip((t - dur + 0.04) / 0.04, 0, 1))
    return norm(simple_reverb(pan(bp * env, np.linspace(-0.3, 0.3, n)), 0.2), -12)


def outro_chime():
    dur = 3.2
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    # "ding" kristal: tiga parsial inharmonis, disebar stereo
    for i, (f, d, a, p) in enumerate(((1046.5, 1.4, 0.5, -0.3), (1568.0, 1.1, 0.35, 0.3), (2093.0, 0.8, 0.25, 0.0), (2793.8, 0.5, 0.12, -0.1))):
        off = int(SR * 0.04 * i)
        tt = t[: n - off]
        g = np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) + np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / (d * 0.2)) * 0.15
        out[off:] += pan(g * a * (1 - np.exp(-tt / 0.003)), p)
    return norm(simple_reverb(out, 0.4), -10)


def main(outdir):
    os.makedirs(outdir, exist_ok=True)
    sounds = {
        "whoosh-soft": lambda: whoosh(0.9, 260, 2400, 0.45, 1.4, -0.5, 0.5),
        "whoosh-fast": lambda: whoosh(0.55, 500, 4200, 0.45, 1.8, -0.7, 0.7),
        "swoosh-layered": layered_swoosh,
        "camera-sweep": camera_sweep,
        "ui-click": ui_click,
        "digital-pop": digital_pop,
        "soft-tick": soft_tick,
        "mech-move": mech_move,
        "sparkle": sparkle,
        "impact-low": low_impact,
        "notif": notif,
        "riser": riser,
        "outro-chime": outro_chime,
    }
    for name, fn in sounds.items():
        st = fn()
        write(os.path.join(outdir, f"{name}.wav"), st)
        print(f"{name}.wav  {len(st) / SR:.2f}s")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "public/sfx")
