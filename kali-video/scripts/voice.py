"""Turn a gTTS clip into a lower, more expressive 'male conversational' voice using WORLD."""
import sys, numpy as np, soundfile as sf, pyworld as pw, librosa

def convert(inp, out, target_f0=118.0, expr=1.9, formant=0.86, tilt=0.0):
    x, sr = librosa.load(inp, sr=24000)
    x = x.astype(np.float64)
    f0, t = pw.harvest(x, sr, f0_floor=70, f0_ceil=500, frame_period=5.0)
    sp = pw.cheaptrick(x, f0, t, sr)
    ap = pw.d4c(x, f0, t, sr)
    v = f0 > 0
    med = np.median(f0[v])
    st = 12 * np.log2(np.where(v, f0, med) / med)
    # smooth contour slightly, exaggerate excursions (more lively intonation)
    k = np.ones(9) / 9
    st_s = np.convolve(st, k, mode="same")
    st_new = st_s * expr + (st - st_s)
    # gentle phrase-level arc: start a bit higher, settle at the end (conversational declination)
    n = len(st_new)
    st_new += tilt * np.linspace(1.0, -1.0, n)
    f0n = np.where(v, target_f0 * 2 ** (st_new / 12), 0.0)
    # formant warp: compress spectral envelope frequency axis (lower = bigger vocal tract)
    nb = sp.shape[1]
    src = np.clip(np.arange(nb) / formant, 0, nb - 1)
    i0 = np.floor(src).astype(int); i1 = np.minimum(i0 + 1, nb - 1); fr = src - i0
    spn = sp[:, i0] * (1 - fr) + sp[:, i1] * fr
    apn = ap[:, i0] * (1 - fr) + ap[:, i1] * fr
    y = pw.synthesize(np.ascontiguousarray(f0n), np.ascontiguousarray(spn), np.ascontiguousarray(apn), sr, 5.0)
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.9
    sf.write(out, y.astype(np.float32), sr)

if __name__ == "__main__":
    convert(sys.argv[1], sys.argv[2], *[float(a) for a in sys.argv[3:]])
