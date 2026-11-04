#!/usr/bin/env python3
"""
Menyusun narasi per baris ke dalam slot waktu tiap section dan menghasilkan:
  - src/data/timeline.json   (cue frame untuk animasi Remotion)
  - public/audio/narration.wav (seluruh narasi, tepat 300 detik)
  - deliverables/subtitles.srt
  - deliverables/naskah-narasi.md

Input: narration/script.json + narration/lines/<section>_<idx>.wav (hasil TTS).
Dengan --estimate, durasi diperkirakan dari jumlah karakter (tanpa audio).
"""
import json, sys, os, re
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 60
TOTAL = 300.0
SR = 44100

def subtitle_text(t: str) -> str:
    return t.replace('dua ribu lima belas', '2015')

def load_wav(path):
    import soundfile as sf
    y, sr = sf.read(path, dtype='float32')
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr != SR:
        import librosa
        y = librosa.resample(y, orig_sr=sr, target_sr=SR)
    return y

def trim(y, thr=0.008):
    idx = np.where(np.abs(y) > thr)[0]
    if len(idx) == 0:
        return y
    a = max(0, idx[0] - int(0.02 * SR))
    b = min(len(y), idx[-1] + int(0.06 * SR))
    return y[a:b]

def main():
    estimate = '--estimate' in sys.argv
    script = json.load(open(os.path.join(ROOT, 'narration/script.json')))
    out_sections = []
    mix = np.zeros(int(TOTAL * SR) + SR, dtype=np.float32)
    srt = []
    md = ['# Naskah Narasi Final — Pterodactyl Panel (Visual Explainer)', '',
          'Durasi total 05:00 (300 detik). Waktu di bawah adalah posisi rekaman sebenarnya di video.', '']
    total_words = 0
    # 1) muat semua klip
    allclips = []
    for s in script['sections']:
        clips = []
        for i, text in enumerate(s['lines']):
            total_words += len(text.split())
            if estimate:
                clips.append((text, None, len(text) * 0.062))
            else:
                y = trim(load_wav(os.path.join(ROOT, f"narration/lines/{s['id']}_{i}.wav")))
                clips.append((text, y, len(y) / SR))
        allclips.append(clips)
    # 2) batas section fleksibel: kebutuhan minimum + sisa waktu dibagi
    #    proporsional terhadap durasi storyboard, total tetap 300 detik.
    GAP_MIN, TAIL_MIN = 0.42, 0.75
    def lead_of(s):
        return 0.9 if s['id'] == 's1' else 0.5
    need = [lead_of(s) + sum(c[2] for c in cl) + GAP_MIN * (len(cl) - 1) + TAIL_MIN
            for s, cl in zip(script['sections'], allclips)]
    nominal = [s['end'] - s['start'] for s in script['sections']]
    slack = TOTAL - sum(need)
    print(f"kebutuhan {sum(need):.2f}s, sisa {slack:.2f}s")
    if slack < 0:
        print('!! narasi melebihi 300 detik', file=sys.stderr)
    # campuran: sebagian mengikuti storyboard, sebagian merata
    target = [n for n in nominal]
    durs = [nd + max(0.0, slack) * (0.5 * tg / TOTAL + 0.5 * max(0, tg - nd) / max(1e-6, sum(max(0, t2 - n2) for t2, n2 in zip(target, need))))
            for nd, tg in zip(need, target)]
    if slack < 0:
        durs = [d * TOTAL / sum(need) for d in need]
    bounds, acc = [], 0.0
    for d in durs:
        bounds.append((acc, acc + d)); acc += d
    # bulatkan ke frame
    bounds = [(round(a * FPS) / FPS, round(b * FPS) / FPS) for a, b in bounds]
    bounds[-1] = (bounds[-1][0], TOTAL)
    for s, clips, (S0, S1) in zip(script['sections'], allclips, bounds):
        n = len(clips)
        speech = sum(c[2] for c in clips)
        lead = lead_of(s)
        tail_min = TAIL_MIN
        avail = (S1 - S0) - lead - tail_min - speech
        if avail < GAP_MIN * (n - 1) - 1e-6:
            print(f"!! {s['id']} terlalu padat: kelebihan {-(avail):.2f}s", file=sys.stderr)
        gap = max(GAP_MIN, min(1.1, avail / max(1, n - 1 + 0.8)))
        t = S0 + lead
        lines = []
        for i, (text, y, d) in enumerate(clips):
            st, en = t, t + d
            lines.append({'text': text, 'subtitle': subtitle_text(text),
                          'start': round(st * FPS), 'end': round(en * FPS),
                          'file': f"{s['id']}_{i}.wav"})
            if y is not None:
                a = int(st * SR)
                mix[a:a + len(y)] += y
            srt.append((st, en, subtitle_text(text)))
            t = en + gap
        tail = S1 - (t - gap)
        print(f"{s['id']}: bicara {speech:5.2f}s  jeda {gap:4.2f}s  sisa akhir {tail:4.2f}s")
        out_sections.append({'id': s['id'], 'title': s['title'], 'start': round(S0 * FPS),
                             'end': round(S1 * FPS), 'lines': lines})
        md.append(f"## {s['title']}  ({int(S0)//60:02d}:{int(S0)%60:02d}–{int(S1)//60:02d}:{int(S1)%60:02d})")
        md.append('')
        for ln in lines:
            ts = ln['start'] / FPS
            md.append(f"- `{int(ts)//60:02d}:{ts%60:05.2f}` {ln['subtitle']}")
        md.append('')
    md.append(f"Jumlah kata narasi: {total_words}")
    tl = {'fps': FPS, 'durationInFrames': int(TOTAL * FPS), 'sections': out_sections}
    json.dump(tl, open(os.path.join(ROOT, 'src/data/timeline.json'), 'w'), ensure_ascii=False, indent=1)
    os.makedirs(os.path.join(ROOT, 'deliverables'), exist_ok=True)

    def ts(x):
        ms = int(round(x * 1000))
        return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"
    with open(os.path.join(ROOT, 'deliverables/subtitles.srt'), 'w') as f:
        for k, (a, b, txt) in enumerate(srt, 1):
            # pecah baris panjang menjadi maks 2 baris ~42 karakter
            words, rows, cur = txt.split(), [], ''
            for w in words:
                if len(cur) + len(w) + 1 > 46 and cur:
                    rows.append(cur); cur = w
                else:
                    cur = (cur + ' ' + w).strip()
            rows.append(cur)
            if len(rows) > 2:
                # bagi menjadi beberapa cue proporsional
                chunks = [' '.join(rows[i:i+2]) for i in range(0, len(rows), 2)]
                tot = sum(len(c) for c in chunks)
                t0 = a
                for c in chunks:
                    t1 = t0 + (b - a) * len(c) / tot
                    srt_rows, cc = [], ''
                    for w in c.split():
                        if len(cc) + len(w) + 1 > 46 and cc:
                            srt_rows.append(cc); cc = w
                        else:
                            cc = (cc + ' ' + w).strip()
                    srt_rows.append(cc)
                    f.write(f"{{n}}\n{ts(t0)} --> {ts(t1)}\n" + '\n'.join(srt_rows) + '\n\n')
                    t0 = t1
            else:
                f.write(f"{{n}}\n{ts(a)} --> {ts(b)}\n" + '\n'.join(rows) + '\n\n')
    # nomori ulang cue
    raw = open(os.path.join(ROOT, 'deliverables/subtitles.srt')).read()
    k = [0]
    def num(_):
        k[0] += 1
        return str(k[0])
    open(os.path.join(ROOT, 'deliverables/subtitles.srt'), 'w').write(re.sub(r'\{n\}', num, raw))
    open(os.path.join(ROOT, 'deliverables/naskah-narasi.md'), 'w').write('\n'.join(md) + '\n')
    if not estimate:
        import soundfile as sf
        mix = mix[:int(TOTAL * SR)]
        peak = np.abs(mix).max()
        if peak > 0:
            mix = mix / peak * 0.89
        os.makedirs(os.path.join(ROOT, 'public/audio'), exist_ok=True)
        sf.write(os.path.join(ROOT, 'public/audio/narration.wav'), mix, SR, subtype='PCM_16')
    print('kata:', total_words)

if __name__ == '__main__':
    main()
