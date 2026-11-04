# Pterodactyl Panel — visual explainer (5 menit)

Video motion graphics edukatif berbahasa Indonesia tentang Pterodactyl Panel: dari asal-usulnya sebagai panel
pengelolaan server game hingga penggunaannya untuk menjalankan bot Telegram dan WhatsApp.

- **Video final:** `out/pterodactyl-explainer.mp4` — 1920×1080, 60 fps, H.264 + AAC, tepat 300 dtk (18.000 frame)
- **Subtitle:** `subtitles/pterodactyl-explainer.srt`
- **Naskah narasi:** `docs/naskah-narasi.md` (607 kata)
- **Sumber fakta:** `docs/sumber-fakta.md`
- **Aset & lisensi:** `docs/aset-dan-lisensi.md`
- **Storyboard / daftar shot:** `docs/storyboard-shot.md`

Dibuat dengan Remotion 4 + React 18 + TypeScript. Tanpa musik; narasi + SFX prosedural.

## Struktur

```
scripts/narration.json     naskah per segmen (sumber kebenaran teks)
scripts/gen_tts.py         narasi -> public/audio/vo/*.mp3 + timing per kata (edge-tts, id-ID-ArdiNeural)
scripts/build_timeline.py  menata segmen di timeline 300 dtk dari rekaman asli -> src/data/timeline.json + SRT
scripts/gen_sfx.py         sintesis 37 SFX -> public/audio/sfx/*.wav
scripts/stills.sh          render still preview
src/lib/time.ts            cue(): frame persis sebuah kata di rekaman, dipakai semua adegan untuk sinkronisasi
src/lib/motion.ts          spring berkarakter (SNAP/POP/PANEL/WHIP/GLIDE), rig kamera, lintasan melengkung, kecepatan
src/components/Motion.tsx  motion blur terarah, SwapText, Sweep (lewat lensa), CircleReveal, Barrel
src/components/            primitif gerak (Stage/kamera 3D, Words, GlowWave, DashedGrid, Flow), ikon, logo, UI, ilustrasi SVG
src/scenes/S01..S10.tsx    10 adegan + daftar SFX masing-masing
```

Semua animasi disinkronkan ke timing kata dari rekaman (`cue("s04", "Wings")`), jadi bila narasi
direkam ulang, cukup jalankan ulang pipeline dan visual/SFX ikut bergeser.

## Render ulang

```bash
npm install
pip install edge-tts numpy          # hanya bila ingin membuat ulang audio
npm run tts                         # opsional: generate ulang narasi
npm run timeline                    # tata ulang timeline + SRT
npm run sfx                         # opsional: generate ulang SFX
npm run typecheck
npm run render                      # -> out/pterodactyl-explainer.mp4
npm run studio                      # pratinjau interaktif
```

Untuk mengganti suara TTS dengan rekaman manusia: simpan `public/audio/vo/sXX.mp3` dan
`sXX.words.json` (`[{"t": detik, "d": durasi, "w": "kata"}]`, mis. dari forced alignment), lalu `npm run timeline`.

## Narasi

Video final memakai narasi hasil **voice replication Gemini 3.8 Flash TTS** (suara dengan izin pemiliknya),
`public/audio/vo/`. Timing kata diukur dari rekaman (faster-whisper) lalu dicocokkan ke naskah:

```bash
python3 scripts/align_words.py transcribed_words.json   # -> public/audio/vo/sXX.words.json
npm run timeline                                         # susun ulang timeline + SRT
npm run render
```
Versi tanpa narasi: `--props='{"narration":false}'`. Narasi TTS awal tersimpan di `public/audio/vo_tts/`.
