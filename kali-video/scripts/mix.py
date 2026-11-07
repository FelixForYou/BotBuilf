"""Synthesize SFX procedurally and mix them with the narration into one WAV.

Reads src/timeline.json (scene/narration timing) and src/cues.json (visual beats
with an attached SFX), so audio and animation share the same source of truth.
"""
import json
import os
import wave

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.005, r=None, curve=4.0):
    x = np.linspace(0, 1, n)
    e = np.minimum(1, x * (n / SR) / max(a, 1e-4))
    if r is None:
        e *= (1 - x) ** curve
    return e


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def sweep_noise(d, f0, f1, q=0.6):
    """Noise passed through a moving band-pass (block-wise)."""
    n = int(d * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    blk = 512
    for i in range(0, n, blk):
        p = i / n
        f = f0 * (f1 / f0) ** p
        lo, hi = max(40, f * (1 - q)), min(SR / 2 - 100, f * (1 + q))
        seg = noise[max(0, i - 2048): i + blk]
        y = bp(seg, lo, hi)
        out[i: i + blk] = y[-len(noise[i: i + blk]):]
    return out


def norm(x, peak):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def whoosh(d=0.7, peak=0.35):
    n = int(d * SR)
    x = sweep_noise(d, 300, 4500)
    x *= np.sin(np.linspace(0, np.pi, n)) ** 2
    return norm(x, peak)


def whoosh_s():
    return whoosh(0.45, 0.22)


def impact(peak=0.6):
    d = 1.4
    tt = t(d)
    f = 38 + 90 * np.exp(-tt * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.2)
    crack = lp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 28)
    tail = bp(rng.standard_normal(len(tt)), 200, 1200) * np.exp(-tt * 4) * 0.15
    return norm(body + 0.5 * crack + tail, peak)


def impact_s():
    return impact(0.38)


def blip(f=1760, d=0.09, peak=0.18):
    tt = t(d)
    x = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2 * tt)
    return norm(x * env(len(tt), 0.002, curve=3), peak)


def pop():
    d = 0.14
    tt = t(d)
    f = 500 + 900 * np.exp(-tt * 40)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.001, curve=5)
    return norm(x, 0.25)


def click():
    d = 0.06
    tt = t(d)
    x = hp(rng.standard_normal(len(tt)), 1500) * np.exp(-tt * 160)
    x2 = np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 120) * 0.5
    y = np.concatenate([x + x2, np.zeros(int(0.045 * SR))])
    tt2 = t(0.05)
    y2 = hp(rng.standard_normal(len(tt2)), 2000) * np.exp(-tt2 * 200) * 0.6
    return norm(np.concatenate([y, y2]), 0.4)


def ding(peak=0.22):
    d = 1.2
    tt = t(d)
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * k)
            for f, a, k in [(1318, 1, 3.5), (2637, 0.4, 5), (3951, 0.2, 7)])
    return norm(x * env(len(tt), 0.002, r=1), peak)


def success():
    a = ding(0.2)
    b = ding(0.2)
    tt = t(1.2)
    b = sum(a_ * np.sin(2 * np.pi * f * tt) * np.exp(-tt * k)
            for f, a_, k in [(1975, 1, 3.5), (3951, 0.35, 5)])
    b = norm(b, 0.2)
    out = np.zeros(int(1.4 * SR))
    out[: len(a)] += a
    off = int(0.11 * SR)
    out[off: off + len(b)] += b[: len(out) - off]
    return out


def star():
    out = np.zeros(int(1.3 * SR))
    for i, f in enumerate([1568, 2093, 2637, 3136, 4186]):
        tt = t(0.6)
        x = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9)
        o = int(i * 0.055 * SR)
        out[o: o + len(x)] += x * (0.9 - i * 0.1)
    shimmer = hp(rng.standard_normal(len(out)), 6000) * np.exp(-np.arange(len(out)) / SR * 5) * 0.08
    return norm(out + shimmer, 0.24)


def scan():
    d = 0.6
    tt = t(d)
    f = 400 + 2600 * (tt / d) ** 1.5
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2
    x = x * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 30 * tt)))
    return norm(lp(x, 5000), 0.11)


def glitch():
    d = 0.35
    n = int(d * SR)
    x = rng.standard_normal(n)
    x = np.repeat(x[::24], 24)[:n]  # sample-and-hold "bitcrush"
    gate = (np.sin(2 * np.pi * 23 * t(d)) > -0.2).astype(float)
    x = bp(x * gate, 300, 6000) * env(n, 0.002, curve=1.5)
    return norm(x, 0.2)


def decode(d=0.9):
    out = np.zeros(int((d + 0.1) * SR))
    k = 0
    while k * 0.045 < d:
        b = blip(f=1200 + rng.integers(0, 1400), d=0.03, peak=0.07)
        o = int(k * 0.045 * SR)
        out[o: o + len(b)] += b
        k += 1
    return out


def key():
    d = 0.05
    tt = t(d)
    x = bp(rng.standard_normal(len(tt)), 1200, 7000) * np.exp(-tt * 140)
    x += np.sin(2 * np.pi * (180 + rng.integers(0, 60)) * tt) * np.exp(-tt * 90) * 0.6
    return norm(x, 0.12 + rng.random() * 0.06)


def type_(d=1.0):
    out = np.zeros(int((d + 0.2) * SR))
    c = 0.0
    while c < d:
        k = key()
        o = int(c * SR)
        out[o: o + len(k)] += k
        c += 0.045 + rng.random() * 0.04
    return out


def ticks(d=0.6):
    out = np.zeros(int((d + 0.1) * SR))
    for i in range(int(d / 0.12)):
        b = blip(f=2400, d=0.025, peak=0.06)
        o = int(i * 0.12 * SR)
        out[o: o + len(b)] += b
    return out


def riser(d=1.7):
    tt = t(d)
    f = 60 + 240 * (tt / d) ** 2
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + sweep_noise(d, 200, 3000) * 0.4
    x *= (tt / d) ** 1.6
    return norm(x, 0.18)


def riser_down(d=1.2):
    tt = t(d)
    f = 400 * np.exp(-tt * 2) + 50
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - tt / d) ** 2
    return norm(x + sweep_noise(d, 3000, 200) * (1 - tt / d) * 0.3, 0.14)


def transition():
    a = whoosh(0.6, 0.28)
    g = glitch() * 0.7
    out = np.zeros(max(len(a), len(g)))
    out[: len(a)] += a
    o = int(0.22 * SR)
    out[o: o + len(g)] += g[: len(out) - o]
    return out


SFX = {
    "whoosh": whoosh, "whoosh_s": whoosh_s, "impact": impact, "impact_s": impact_s,
    "blip": blip, "pop": pop, "click": click, "ding": ding, "success": success,
    "star": star, "scan": scan, "glitch": glitch, "decode": decode, "type": type_,
    "ticks": ticks, "riser": riser, "riser_down": riser_down, "transition": transition,
}
TAKES_DUR = {"decode", "type", "ticks", "riser", "riser_down"}


def read_wav(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16) / 32768.0


def main():
    tl = json.load(open(f"{ROOT}/src/timeline.json"))
    cues = json.load(open(f"{ROOT}/src/cues.json"))
    fps = tl["fps"]
    total = tl["total"] / fps + 0.5
    voice = np.zeros(int(total * SR))
    fx = np.zeros(int(total * SR))

    def add(buf, x, sec):
        o = int(sec * SR)
        if o < 0:
            x, o = x[-o:], 0
        n = min(len(x), len(buf) - o)
        buf[o: o + n] += x[:n]

    for sc in tl["scenes"]:
        s0 = sc["from"] / fps
        for p in sc["parts"]:
            add(voice, read_wav(f"{ROOT}/scripts/.tts/{p['file']}"), s0 + p["start"] / fps)
        for name, c in cues.get(sc["id"], {}).items():
            ref = c["ref"]
            if ref == "start":
                base = 0
            elif ref == "end":
                base = sc["dur"]
            else:
                base = sc["parts"][int(ref[1:])]["start"]
            sec = s0 + base / fps + c["off"]
            fn = SFX[c["sfx"]]
            add(fx, fn(c["dur"]) if c["sfx"] in TAKES_DUR and "dur" in c else fn(), sec)
        if sc["from"] > 0:  # scene-boundary transition
            add(fx, transition(), s0 - 0.3)

    # duck SFX slightly while the narrator speaks
    venv = np.convolve(np.abs(voice), np.ones(4800) / 4800, mode="same")
    duck = 1 - 0.35 * np.clip(venv * 12, 0, 1)
    mix = voice * 0.95 + fx * duck
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)  # soft limiter
    stereo = np.stack([mix, mix], axis=1)
    out = f"{ROOT}/public/audio/mix.wav"
    with wave.open(out, "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(stereo, -1, 1) * 32767).astype(np.int16).tobytes())
    print("wrote", out, round(len(mix) / SR, 2), "s")


if __name__ == "__main__":
    main()
