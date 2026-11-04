# Pterodactyl Panel — Visual Explainer (5 menit)

Video motion graphics edukatif berbahasa Indonesia tentang Pterodactyl Panel: dari asal-usulnya
sebagai panel pengelolaan server game hingga penggunaannya untuk mengelola aplikasi bot Telegram
dan WhatsApp. Dibangun dengan **Remotion + React + TypeScript**.

- Resolusi 1920 × 1080, 60 FPS, 18.000 frame (tepat 300 detik)
- Narasi bahasa Indonesia + SFX, tanpa musik
- Hasil render: `out/pterodactyl-explainer.mp4` (H.264, AAC)

## Isi folder

| Path | Isi |
|---|---|
| `src/scenes/S1.tsx … S10.tsx` | 10 bagian cerita (± 45 shot), mengikuti storyboard 00:00–05:00 |
| `src/components/` | primitif visual: kamera/dunia 3D, panel melayang, teks kinetik, distorsi lengkung, ilustrasi SVG, UI bergaya Pterodactyl, jendela chat, SFX |
| `src/lib/timeline.ts`, `src/data/timeline.json` | cue animasi yang diturunkan dari durasi rekaman narasi sebenarnya |
| `narration/script.json` | naskah sumber (per section & per baris) |
| `narration/lines/*.wav` | rekaman narasi per baris |
| `public/audio/narration.wav` | narasi lengkap 300 detik yang sudah ditempatkan |
| `public/audio/sfx/*.wav` | SFX prosedural |
| `deliverables/naskah-narasi.md` | naskah final dengan stempel waktu |
| `deliverables/subtitles.srt` | subtitle lengkap |
| `deliverables/sumber-dan-lisensi.md` | sumber fakta resmi + lisensi seluruh aset |
| `scripts/` | pembuat narasi, timeline/subtitle, SFX, dan lembar kontak still |

## Render ulang

```bash
npm install
```

```bash
npx remotion render Explainer out/pterodactyl-explainer.mp4
```

Pratinjau interaktif: `npx remotion studio`.
`remotion.config.ts` memakai chrome-headless-shell lokal bila ada; atur `REMOTION_BROWSER`
untuk menunjuk browser lain, atau hapus baris itu agar Remotion mengunduh browsernya sendiri.

## Mengganti narasi (mis. dengan rekaman suara manusia)

1. Rekam tiap baris di `narration/script.json` dan simpan sebagai `narration/lines/<section>_<idx>.wav`
   (mis. `s3_2.wav`). Atau buat ulang dengan TTS:
   `python3 scripts/tts_narration.py --model <folder model piper> --length 0.87`
2. Jalankan `python3 scripts/build_timeline.py` — batas section, cue animasi, `narration.wav`,
   subtitle SRT, dan naskah bertanda waktu dibuat ulang otomatis dengan total tetap 300 detik.
3. Render ulang.

Animasi membaca cue per kata (`L(i, 'kata')`) dari timeline, sehingga penekanan visual dan SFX
tetap mengikuti rekaman baru.

## SFX

`python3 scripts/make_sfx.py` membuat ulang semua SFX (klik, ketikan, gerak panel per material,
aliran data, dentum lapisan, pop gelembung, dsb.) dengan beberapa varian per jenis.
