"""Procedural SFX for the explainer — every sound is synthesised here from scratch
(noise + oscillators + envelopes), so there are no third-party audio licences.
Usage: python3 scripts/gen_sfx.py   -> public/audio/sfx/*.wav (48 kHz, 16-bit, mono)
"""
import os
import wave
import numpy as np

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio", "sfx")
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a, r, curve=4.0):
    """attack seconds, release shape: exp decay over rest"""
    x = np.arange(n) / SR
    na = max(1, int(a * SR))
    e = np.ones(n)
    e[:na] = (np.arange(na) / na) ** 1.5
    rest = x[na:] - x[na] if n > na else np.array([])
    if len(rest):
        e[na:] = np.exp(-curve * rest / max(rest[-1], 1e-6))
    return e


def bandpass(sig, lo, hi, soft=0.15):
    f = np.fft.rfft(sig)
    fr = np.fft.rfftfreq(len(sig), 1 / SR)
    w = 1 / (1 + np.exp(np.clip(-(fr - lo) / (lo * soft + 1), -60, 60))) * (1 / (1 + np.exp(np.clip((fr - hi) / (hi * soft + 1), -60, 60))))
    return np.fft.irfft(f * w, len(sig))


def sweep_filter(sig, f0, f1, q=0.35, frames=64):
    """time-varying band emphasis via overlapping FFT blocks"""
    n = len(sig)
    out = np.zeros(n)
    hop = n // frames
    win = 2 * hop
    hann = np.hanning(win)
    for i in range(frames):
        s = i * hop
        blk = np.zeros(win)
        seg = sig[s:s + win]
        blk[:len(seg)] = seg
        p = i / (frames - 1)
        fc = f0 * (f1 / f0) ** p
        out_blk = bandpass(blk * hann, fc * (1 - q), fc * (1 + q))
        e = min(len(seg), win)
        out[s:s + e] += out_blk[:e]
    return out


def norm(x, peak=0.8):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def fade(x, ms=4):
    n = int(SR * ms / 1000)
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    return x


def save(name, x, peak=0.8):
    x = fade(norm(x, peak))
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    print("sfx", name, round(len(x) / SR, 2), "s")


# --- UI clicks (soft, two materials) -------------------------------------------
def click(freq, dur=0.07, noise=0.3):
    n = int(SR * dur)
    tt = t(dur)
    body = np.sin(2 * np.pi * freq * tt) * env(n, 0.0008, 1, 9)
    tick = bandpass(rng.standard_normal(n), 2500, 9000) * env(n, 0.0003, 1, 40)
    return body + noise * tick


save("click_soft", click(1300), 0.45)
save("click_glass", click(2400, 0.09, 0.15) + 0.4 * click(3600, 0.09, 0), 0.4)
save("click_low", click(520, 0.11, 0.2), 0.5)

# --- typing burst (short, irregular keys) ----------------------------------------
def typing(count, span):
    n = int(SR * span)
    x = np.zeros(n)
    pos = np.sort(rng.uniform(0, span - 0.05, count))
    for p in pos:
        k = click(rng.uniform(900, 1700), 0.035, rng.uniform(0.6, 1.2)) * rng.uniform(0.5, 1)
        s = int(p * SR)
        x[s:s + len(k)] += k[: n - s]
    return x


save("type_short", typing(7, 0.6), 0.4)
save("type_long", typing(16, 1.4), 0.4)

# --- panel moves: filtered-noise air with different weights ----------------------
def air(dur, f0, f1, q=0.4, a=0.3, curve=3.0):
    n = int(SR * dur)
    x = sweep_filter(rng.standard_normal(n), f0, f1, q)
    e = env(n, a * dur, 1, curve)
    return x * e


save("panel_slide", air(0.9, 300, 1400, 0.5, 0.45), 0.35)
save("panel_lift", air(1.2, 200, 900, 0.6, 0.6, 2.5), 0.32)
save("panel_pass", air(0.7, 2200, 500, 0.45, 0.35), 0.3)
save("swell_deep", air(1.8, 90, 500, 0.7, 0.75, 2.0) + 0.3 * np.sin(2 * np.pi * 55 * t(1.8)) * env(int(SR * 1.8), 1.3, 1, 5), 0.42)
save("swell_bright", air(1.4, 600, 4200, 0.35, 0.8, 2.0), 0.28)

# --- soft settle / thud (object lands) -------------------------------------------
def thud(f=70, dur=0.35):
    n = int(SR * dur)
    tt = t(dur)
    pitch = f * (1 + 0.8 * np.exp(-tt * 30))
    ph = 2 * np.pi * np.cumsum(pitch) / SR
    return np.sin(ph) * env(n, 0.002, 1, 7) + 0.15 * bandpass(rng.standard_normal(n), 200, 1200) * env(n, 0.001, 1, 25)


save("settle", thud(), 0.55)
save("settle_light", thud(140, 0.22), 0.45)

# --- message bubble pop (rounded) -------------------------------------------------
def pop(f0, f1, dur=0.12):
    n = int(SR * dur)
    tt = t(dur)
    fr = f0 + (f1 - f0) * (1 - np.exp(-tt * 40))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.sin(ph) * env(n, 0.002, 1, 10)


save("msg_out", pop(500, 900), 0.4)
save("msg_in", pop(900, 620) + 0.3 * pop(1350, 1240), 0.38)

# --- data flow: granular ticks rising in density ---------------------------------
def flow(dur, count, f=3200):
    n = int(SR * dur)
    x = np.zeros(n)
    for i in range(count):
        p = (i / count) ** 0.8 * (dur - 0.03)
        g = np.sin(2 * np.pi * (f + rng.uniform(-400, 400)) * t(0.02)) * env(int(SR * 0.02), 0.001, 1, 12)
        s = int(p * SR)
        x[s:s + len(g)] += g * rng.uniform(0.3, 1.0)
    return x + 0.25 * air(dur, 1500, 5000, 0.3, 0.5)


save("data_flow", flow(1.1, 22), 0.3)
save("data_tick", flow(0.4, 6, 4200), 0.3)

# --- connection / status tones (subtle, not notification-like) -------------------
def tone(freqs, dur, a=0.01, curve=5.0):
    n = int(SR * dur)
    x = sum(np.sin(2 * np.pi * f * t(dur)) * (0.6 ** i) for i, f in enumerate(freqs))
    return x * env(n, a, 1, curve)


save("status_on", tone([660, 990], 0.45) + 0.6 * np.concatenate([np.zeros(int(SR * 0.08)), tone([880, 1320], 0.37)]), 0.3)
save("status_warn", tone([330, 349], 0.5, 0.005, 6), 0.32)
save("error_blip", tone([220, 233], 0.28, 0.002, 6) + 0.5 * np.concatenate([np.zeros(int(SR * 0.12)), tone([196], 0.16, 0.002, 6)]), 0.38)

# --- line draw (rising filtered hiss) & text reveal shimmer ----------------------
save("line_draw", air(0.8, 800, 3000, 0.25, 0.2, 1.5), 0.22)
save("text_in", air(0.35, 3000, 7000, 0.3, 0.25, 3) + 0.2 * tone([2600], 0.35, 0.03, 8), 0.2)

# --- container lock / mechanical latch ------------------------------------------
latch = np.concatenate([click(800, 0.05, 0.8), np.zeros(int(SR * 0.04)), click(1100, 0.08, 0.5)])
save("latch", latch, 0.45)

# --- curved warp transition (pitch-bent swell, used sparingly) -------------------
def warp(dur=1.3):
    n = int(SR * dur)
    tt = t(dur)
    fr = 120 * (1 + 3 * (tt / dur) ** 2)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    e = np.sin(np.pi * tt / dur) ** 2
    return 0.4 * np.sin(ph) * e + air(dur, 250, 2500, 0.5, 0.5, 1.5)


save("warp", warp(), 0.36)

# --- closing resolve (long, soft) ------------------------------------------------
save("resolve", tone([392, 587.3, 784], 3.6, 0.4, 3.0) + 0.3 * air(3.6, 200, 800, 0.6, 0.5, 3), 0.3)
