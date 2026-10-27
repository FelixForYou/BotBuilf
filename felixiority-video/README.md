# FELIXIORITY — Brand Showreel (Remotion)

Video motion graphics 60 detik untuk memperkenalkan brand **FELIXIORITY**, dibangun penuh dengan
Remotion + React + TypeScript (CSS 3D, SVG). Semua animasi berbasis frame dan deterministik —
tanpa layanan/API eksternal saat preview maupun render.

| Spesifikasi | Nilai |
| --- | --- |
| Durasi | 60 detik (3600 frame) |
| Resolusi | 1920 × 1080 (16:9) |
| Frame rate | 60 FPS |
| Output | MP4 H.264, CRF 16, yuv420p, audio AAC |
| Audio | Sound effects saja (tanpa musik), disintesis prosedural |

## Struktur proyek

```
felixiority-video/
├─ public/
│  ├─ brand/        logo asli + hasil cutout transparan (karakter, wordmark), grain
│  ├─ fonts/        Geist, Geist Mono, Instrument Serif (lokal, .woff2)
│  └─ sfx/          16 sound effect .wav (hasil scripts/generate-sfx.mjs)
├─ scripts/
│  ├─ cutout-logo.py    memisahkan logo dari latar ungu → PNG transparan + layer
│  ├─ generate-sfx.mjs  sintesis SFX deterministik (whoosh, click, pop, impact, …)
│  └─ stills.mjs        render frame tertentu ke PNG untuk QA
├─ src/
│  ├─ Root.tsx / index.ts       registrasi komposisi "FelixiorityShowreel"
│  ├─ Showreel.tsx              susunan 8 scene (overlap transisi) + HUD + SFX
│  ├─ Sound.tsx                 daftar cue SFX tersinkron frame
│  ├─ lib/                      theme (warna/font), anim (easing/spring), timeline, layout match-cut
│  ├─ components/               LogoRig, RevealText (kinetic type), MotionBlur, Cursor, Sparkle, Icons, HUD
│  └─ scenes/                   S01…S08, satu file per scene
└─ out/felixiority-showreel.mp4 hasil render final
```

## Storyboard & transisi

| # | Waktu | Scene | Transisi masuk |
| --- | --- | --- | --- |
| 01 | 00:00–00:07 | Brand Awakening — titik → kurva → karakter (layer separation, squash & stretch) → kinetic "FELIXIORITY" | — |
| 02 | 00:07–00:15 | Felixiority Tools — dashboard 3D melayang, orbit kamera, counter, 4 fitur | Kamera menembus titik terracotta; lingkaran mengecil menjadi titik "LIVE" |
| 03 | 00:15–00:23 | Felix Panel — Produk → Checkout → Pembayaran → Deployment, server 3D | Tombol "Order Panel Baru" ber-morph menjadi kontainer panel (match cut) |
| 04 | 00:23–00:31 | 3D User Warehouse — rak isometrik, objek pengguna mendarat otomatis, dolly | Kamera masuk lewat jendela preview di kartu deployment |
| 05 | 00:31–00:39 | Telegram Automation — chat bot, tombol inline, arus data, notifikasi | Pesawat kertas melintas dekat kamera (directional wipe) |
| 06 | 00:39–00:47 | Remotion Studio — kanvas, timeline scrubbing, kurva gerak, panel render | Notifikasi membesar memenuhi layar → menjadi kanvas, kamera tarik mundur |
| 07 | 00:47–00:54 | Semile AI · Mile Oneace 1.0 — liquid glass, streaming teks, konstelasi | Lempeng kaca cair menyapu frame |
| 08 | 00:54–01:00 | Final Reveal — komposisi heksagonal, fly-through, logo overshoot, "Create Beyond Limits." | Jendela chat menyusut menjadi salah satu tile |

Video ditutup dengan logo yang menyusut kembali menjadi titik terracotta di atas putih bersih —
bookend dari titik pembuka.

> Catatan: UI dashboard, panel, bot Telegram, studio, dan Semile AI adalah **visualisasi konsep**
> (ditandai "KONSEP UI"), bukan rekaman aplikasi.

## Instalasi

Butuh Node.js 18+ (diuji pada Node 22).

```bash
cd felixiority-video
npm install
```

(Opsional) bangun ulang aset turunan:

```bash
npm run sfx                          # sintesis ulang public/sfx/*.wav
python3 scripts/cutout-logo.py       # butuh Pillow + numpy; potong ulang logo
```

## Preview di Remotion Studio

```bash
npm run studio
```

Buka URL yang ditampilkan (default http://localhost:3000) lalu pilih komposisi
**FelixiorityShowreel**. Setiap scene tampil sebagai Sequence bernama di timeline.

## Render

```bash
npm run render
# → out/felixiority-showreel.mp4 (1920×1080, 60 FPS, H.264)
```

Pengaturan codec ada di `remotion.config.ts` (H.264, CRF 16, JPEG 95, concurrency 4).
Render satu frame untuk cek cepat:

```bash
npx remotion still FelixiorityShowreel out/still.png --frame=1500
```
