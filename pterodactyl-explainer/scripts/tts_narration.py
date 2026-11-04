#!/usr/bin/env python3
"""
Membuat rekaman narasi per baris: narration/lines/<section>_<idx>.wav

Mesin: Piper (ONNX) suara bahasa Indonesia `id_ID-news_tts-medium`
(https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models → vits-piper-id_ID-news_tts-medium),
lalu dikonversi ke register suara laki-laki muda dengan vocoder WORLD (pyworld):
F0 diturunkan dan envelope spektral (formant) digeser.

Pemakaian:
  python3 scripts/tts_narration.py --model <dir model piper> [--length 1.0]

Untuk mengganti dengan rekaman suara manusia: taruh file WAV dengan nama yang sama
di narration/lines/ lalu jalankan scripts/build_timeline.py — seluruh cue animasi,
subtitle, dan mix narasi akan menyesuaikan otomatis.
"""
import argparse, json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Ejaan fonetis untuk istilah asing agar dibaca natural oleh model berbahasa Indonesia.
RESPELL = [
    (r'\bPterodactyl\b', 'Terodaktil'),
    (r'\bopen source\b', 'oupen sors'),
    (r'\bNode\.js\b', 'Noud jei es'),
    (r'\bPython\b', 'Paiton'),
    (r'\bruntime\b', 'rantaim'),
    (r'\bimage container\b', 'imej kontainer'),
    (r'\bcontainer\b', 'kontainer'),
    (r'\bContainer\b', 'Kontainer'),
    (r'\begg\b', 'eg'),
    (r'\bEgg\b', 'Eg'),
    (r'\bWings\b', 'Wings'),
    (r'\bVPS\b', 'vi pi es'),
    (r'\bCPU\b', 'si pi yu'),
    (r'\bRAM\b', 'ram'),
    (r'\bbrowser\b', 'brauser'),
    (r'\bConsole\b', 'Konsol'),
    (r'\bconsole\b', 'konsol'),
    (r'\bFile manager\b', 'Fail menejer'),
    (r'\brestart\b', 'ristart'),
    (r'\bRunning\b', 'raning'),
    (r'\bSoftware\b', 'Softwer'),
    (r'\bWhatsApp\b', 'Wotsap'),
    (r'\bdashboard\b', 'desbor'),
    (r'\berror\b', 'eror'),
    (r'\boutput\b', 'autput'),
    (r'\bnode\b', 'noud'),
    (r'\bgame\b', 'gem'),
    (r'\bstart\b', 'start'),
    (r'\bhosting\b', 'hosting'),
    (r'\bAsisten Bot\b', 'Asisten Bot'),
]


def respell(t: str) -> str:
    for a, b in RESPELL:
        t = re.sub(a, b, t)
    return t


def to_male(y, sr, f0_ratio=0.56, formant=0.86, flatten=0.88):
    import pyworld as pw
    import librosa
    y = y.astype(np.float64)
    if sr != 44100:
        y = librosa.resample(y, orig_sr=sr, target_sr=44100)
        sr = 44100
    f0, t = pw.harvest(y, sr, f0_floor=70, f0_ceil=500, frame_period=5)
    sp = pw.cheaptrick(y, f0, t, sr)
    ap = pw.d4c(y, f0, t, sr)
    n = sp.shape[1]
    freqs = np.arange(n)
    src = np.clip(freqs / formant, 0, n - 1)
    sp2 = np.array([np.interp(src, freqs, row) for row in sp])
    ap2 = np.array([np.interp(src, freqs, row) for row in ap])
    f02 = f0 * f0_ratio
    v = f02 > 0
    if v.any():
        m = np.exp(np.mean(np.log(f02[v])))
        f02[v] = m * (f02[v] / m) ** flatten
    out = pw.synthesize(f02, sp2, ap2, sr, frame_period=5)
    # sedikit kehangatan: low-shelf ringan + de-ess ringan
    from scipy.signal import butter, sosfilt
    low = sosfilt(butter(2, 220, 'low', fs=sr, output='sos'), out)
    hi = sosfilt(butter(2, 7000, 'high', fs=sr, output='sos'), out)
    out = out + 0.18 * low - 0.25 * hi
    return out / (np.max(np.abs(out)) + 1e-9) * 0.9, sr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--length', type=float, default=1.0)
    ap.add_argument('--only', default=None, help='mis. s3_2')
    a = ap.parse_args()
    onnx = [f for f in os.listdir(a.model) if f.endswith('.onnx')][0]
    script = json.load(open(os.path.join(ROOT, 'narration/script.json')))
    os.makedirs(os.path.join(ROOT, 'narration/lines'), exist_ok=True)
    for s in script['sections']:
        ls = s.get('length', a.length)
        for i, text in enumerate(s['lines']):
            key = f"{s['id']}_{i}"
            if a.only and key != a.only:
                continue
            with tempfile.TemporaryDirectory() as td:
                raw = os.path.join(td, 'raw.wav')
                subprocess.run([sys.executable, '-m', 'piper', '-m', os.path.join(a.model, onnx), '-c', os.path.join(a.model, onnx + '.json'),
                                '-f', raw, '--length-scale', str(ls), '--noise-scale', '0.6', '--noise-w-scale', '0.7',
                                '--sentence-silence', '0.2'], input=respell(text).encode(), check=True,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                y, sr = sf.read(raw)
            out, sr2 = to_male(y, sr)
            sf.write(os.path.join(ROOT, f'narration/lines/{key}.wav'), out.astype(np.float32), sr2, subtype='PCM_16')
            print(key, f'{len(out)/sr2:.2f}s', respell(text)[:70])


if __name__ == '__main__':
    main()
