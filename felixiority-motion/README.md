# FELIXIORITY — Brand Motion Showreel (Remotion)

Video motion graphics 60 detik yang memperkenalkan brand **FELIXIORITY**, dibangun
sepenuhnya dengan **Remotion + React + TypeScript + CSS/SVG** (3D memakai CSS
`preserve-3d`, deterministik, tanpa WebGL). Semua font, logo, dan sound effect
dibundel lokal — tidak ada API/layanan eksternal saat preview maupun render.

| Spesifikasi | Nilai |
| --- | --- |
| Durasi | 60 detik (3600 frame) |
| Resolusi | 1920 × 1080 (16:9) |
| Frame rate | 60 fps |
| Output | MP4 H.264 (CRF 16, yuv420p) + audio AAC |
| Audio | Sound effects saja (disintesis prosedural, tanpa musik) |

## Storyboard

| # | Waktu | Scene | Transisi keluar |
| --- | --- | --- | --- |
| 01 | 00:00–00:07 | **Brand Awakening** — titik terracotta → kurva → ring → karakter muncul (squash & stretch, motion blur) → kinetic type `FELIXIORITY` + tagline | Camera push-in ke logo, *circle reveal* |
| 02 | 00:07–00:15 | **Felixiority Tools** — dashboard 3D merakit diri, kamera orbit, counter, highlight fitur tersinkron | Kamera meluruskan & zoom ke kartu "Server" |
| 03 | 00:15–00:23 | **Felix Panel** — kartu Server *morph* menjadi panel pemesanan: Product Selection → Checkout → Payment → Deployment, kursor menekan tombol, server 3D muncul | Kamera masuk lewat jendela deployment |
| 04 | 00:23–00:31 | **3D User Warehouse** — gudang isometrik, rak tumbuh, user (kubus 3D) jatuh ke slot, dolly kamera | *Slab wipe* — objek melintas sangat dekat kamera |
| 05 | 00:31–00:39 | **Telegram Automation** — bubble chat, tombol inline, pemesanan otomatis, monitoring, notifikasi, aliran data ke node | Bubble melesat ke kamera menutup frame (*match cut*) |
| 06 | 00:39–00:47 | **Remotion Studio** — dari kanvas putih kamera mundur: timeline, keyframe, motion curve, scrubbing, render progress | *Circle reveal* dari tombol "Selesai" |
| 07 | 00:47–00:54 | **Semile AI** — liquid glass, chat dengan streaming teks, model *Mile Oneace 1.0*, jaringan kecerdasan minimalis | Seluruh frame mengecil menjadi tile |
| 08 | 00:54–01:00 | **Final Brand Reveal** — semua scene menjadi komposisi geometris, kamera mundur lalu melesat menembusnya, logo masuk dengan overshoot, "Different Ideas. One Vision." → `FELIXIORITY` → "Create Beyond Limits." → outro putih bersih | — |

> UI pada scene 02–07 adalah **visualisasi konseptual** fitur, bukan rekaman aplikasi.

## Struktur proyek

```
felixiority-motion/
├─ public/
│  ├─ logo/        # logo asli + hasil cutout transparan & layer (karakter / wordmark)
│  ├─ sfx/         # 13 sound effect WAV hasil sintesis
│  └─ fonts/       # Geist, Geist Mono, Inter, Instrument Serif (OFL) + lisensi
├─ scripts/
│  ├─ cutout_logo.py    # memisahkan stiker dari latar ungu + layer separation
│  ├─ generate_sfx.py   # sintesis sound effect (numpy, seed tetap)
│  ├─ stills.mjs        # render banyak frame sekaligus untuk QA
│  └─ sheet.py          # contact sheet QA
├─ src/
│  ├─ index.ts / Root.tsx    # registrasi komposisi
│  ├─ Showreel.tsx           # susunan scene, transisi, audio
│  ├─ timeline.ts            # timing semua scene (frame @60fps)
│  ├─ theme.ts / fonts.ts    # warna, tipografi, bayangan, pemuatan font lokal
│  ├─ sfx.tsx                # cue sound effect per frame
│  ├─ lib/anim.ts            # easing, keyframe, spring, PRNG deterministik
│  ├─ components/            # Camera, Logo, Type (kinetic), Transitions, Box3D, Primitives
│  └─ scenes/                # S01 … S08
├─ remotion.config.ts
└─ out/felixiority-showreel.mp4
```

## Instalasi

Butuh **Node.js 18+** (diuji dengan Node 22).

```bash
cd felixiority-motion
npm install
```

## Preview di Remotion Studio

```bash
npm run dev
```

Buka URL yang ditampilkan (biasanya http://localhost:3000) dan pilih komposisi
**FelixiorityShowreel**. Komposisi `LogoLayers` menampilkan hasil pemisahan layer logo.

## Render MP4

```bash
npm run render
```

Hasil: `out/felixiority-showreel.mp4` (1920×1080, 60 fps, H.264).

Opsi berguna:

```bash
REMOTION_CONCURRENCY=8 npm run render
```

```bash
REMOTION_BROWSER_EXECUTABLE=/path/ke/chrome-headless-shell npm run render
```

Render satu frame untuk pengecekan:

```bash
npx remotion still FelixiorityShowreel out/frame.png --frame=1800
```

## Membuat ulang aset (opsional)

Aset sudah tersedia di `public/`. Untuk membuat ulang (butuh Python 3 + numpy + Pillow):

```bash
npm run assets
```

## Catatan teknis

- Semua animasi berbasis frame (`useCurrentFrame`, `interpolate`, `spring`), tidak ada
  `Math.random()` / waktu sistem — hasil render selalu identik dengan preview Studio.
- 3D (dashboard orbit, server rack, gudang isometrik, kubus) memakai CSS 3D transforms,
  sehingga deterministik dan tidak memerlukan WebGL di mesin render.
- Motion blur sinematik memakai `@remotion/motion-blur` (`CameraMotionBlur`) pada
  momen cepat logo; transisi cepat lain memakai blur berbasis kecepatan.
- Scene 08 memakai `<Freeze>` untuk menampilkan snapshot asli setiap scene di dalam tile.
- Font berlisensi SIL Open Font License (lihat `public/fonts/LICENSE-*`).
