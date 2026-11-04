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

# ===================== revision: motion-matched SFX ==============================
def whip(dur, f0, f1, q=0.35, peak_at=0.55, curve=2.0):
    """Doppler-like pass: band sweeps f0->f1, loudness peaks at `peak_at`."""
    n = int(SR * dur)
    x = sweep_filter(rng.standard_normal(n), f0, f1, q)
    tt = np.arange(n) / n
    e = np.where(tt < peak_at, (tt / peak_at) ** curve, ((1 - tt) / (1 - peak_at)) ** 1.4)
    return x * e


save("whip_fast", whip(0.32, 900, 4200, 0.4, 0.6), 0.32)
save("whip_low", whip(0.5, 260, 1400, 0.5, 0.55), 0.36)
save("whip_air", whip(0.42, 2500, 700, 0.35, 0.45), 0.28)
save("lens_pass", whip(0.7, 120, 900, 0.6, 0.62, 2.6) + 0.5 * np.sin(2 * np.pi * np.cumsum(60 + 140 * np.linspace(0, 1, int(SR * 0.7))) / SR) * np.sin(np.pi * np.linspace(0, 1, int(SR * 0.7))) ** 3, 0.42)

def impact(f=95, dur=0.26, bright=0.35):
    n = int(SR * dur)
    tt = t(dur)
    pitch = f * (1 + 0.6 * np.exp(-tt * 45))
    body = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * env(n, 0.001, 1, 9)
    tick = bandpass(rng.standard_normal(n), 1800, 7000) * env(n, 0.0005, 1, 60)
    return body + bright * tick


save("impact_soft", impact(), 0.5)
save("impact_card", impact(160, 0.2, 0.6), 0.45)
save("impact_glass", impact(320, 0.18, 0.2) + 0.3 * tone([1900, 2850], 0.18, 0.002, 9), 0.4)

def flip(dur=0.34):
    n = int(SR * dur)
    x = np.zeros(n)
    for i in range(7):
        p0 = int((i / 7) ** 1.3 * (dur - 0.04) * SR)
        g = bandpass(rng.standard_normal(int(SR * 0.03)), 900 + i * 250, 4000 + i * 300) * env(int(SR * 0.03), 0.001, 1, 14)
        x[p0:p0 + len(g)] += g * (1 - i / 9)
    return x + 0.3 * whip(dur, 500, 2400, 0.4, 0.4)


save("flip", flip(), 0.38)

def morph(dur=0.6, f0=300, f1=900):
    n = int(SR * dur)
    fr = np.linspace(f0, f1, n) * (1 + 0.04 * np.sin(np.linspace(0, 30, n)))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s1 = np.sin(ph) + 0.4 * np.sin(2 * ph + 0.5)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return s1 * e * 0.5 + 0.3 * whip(dur, f0 * 2, f1 * 3, 0.3, 0.5)


save("morph_up", morph(), 0.3)
save("morph_down", morph(0.5, 900, 260), 0.3)

def ticks(count, span, f=2600, spread=600):
    n = int(SR * span)
    x = np.zeros(n)
    for i in range(count):
        p0 = int((i / count) * (span - 0.03) * SR)
        g = np.sin(2 * np.pi * (f + i * spread / count) * t(0.018)) * env(int(SR * 0.018), 0.0008, 1, 14)
        x[p0:p0 + len(g)] += g * (0.6 + 0.4 * rng.random())
    return x


save("stack_ticks", ticks(5, 0.32), 0.3)
save("scramble", ticks(14, 0.28, 3600, 1800) * 0.7 + 0.2 * bandpass(rng.standard_normal(int(SR * 0.28)), 3000, 9000) * env(int(SR * 0.28), 0.01, 1, 4), 0.22)
save("rise_short", whip(0.45, 300, 3000, 0.3, 0.92, 3.0), 0.3)
