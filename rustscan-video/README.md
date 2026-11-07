# RustScan: video motion dokumenter (Kali Linux)

Video motion berbahasa Indonesia, 1920×1080, 60 fps, ±89 detik, H.264/AAC. Isinya pengenalan [RustScan](https://github.com/bee-san/RustScan), repository GitHub beserta animasi ⭐ Star, cara kerja, instalasi di Kali, demo di lab lokal, fitur dan keterbatasan, lalu outro.

Hasil render: [`RustScan_KaliLinux_1080p60.mp4`](RustScan_KaliLinux_1080p60.mp4). Sumber setiap fakta ada di [RESEARCH.md](RESEARCH.md).

## Struktur

| Path | Isi |
|---|---|
| `scripts/narration.json` | Naskah narasi untuk TTS (ejaan fonetis) |
| `scripts/captions.json` | Teks subtitle (ejaan asli) |
| `scripts/tts.py` | Membuat narasi (gTTS, bahasa Indonesia), lalu trim dan tempo 1,28× |
| `scripts/timeline.py` | Menghitung durasi scene dari panjang narasi, hasilnya `src/timeline.json` |
| `src/cues.json` | Beat visual bernama + SFX. Dibaca oleh animasi dan mixer, jadi audio selalu sinkron |
| `scripts/mix.py` | Sintesis SFX prosedural (whoosh, glitch, ketikan, klik, dll.) dan mixing dengan narasi, hasilnya `public/audio/mix.wav` |
| `src/scenes/S1…S8` | 8 scene |
| `src/components/` | HUD, background partikel/grid, tipografi kinetik, terminal ala Kali, ikon SVG |

## Membangun ulang

```bash
npm i
pip install gTTS numpy scipy
python3 scripts/tts.py && python3 scripts/timeline.py && python3 scripts/mix.py
npx remotion studio            # pratinjau
npx remotion render RustScanVideo out/RustScan_KaliLinux_1080p60.mp4 --codec=h264 --crf=18 --audio-codec=aac
```

Font (Space Grotesk, JetBrains Mono, keduanya lisensi OFL) disertakan secara lokal di `public/fonts`, jadi render tidak butuh jaringan.

> Konten ini hanya untuk edukasi. Lakukan pemindaian hanya pada sistem milik sendiri atau yang sudah memberi izin.
