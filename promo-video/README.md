# FELIXIORITY — Video Promosi (Remotion)

Video promosi layanan hosting panel Pterodactyl FELIXIORITY.
**30 detik · 60 FPS · 1080 × 1920 (vertikal)** untuk TikTok, Reels, dan WhatsApp Story.

## Instalasi & render

```bash
cd promo-video
npm install
npm run render        # hasil: out/felixiority-promo.mp4
```

Opsional:

```bash
npm run studio        # pratinjau & edit di browser
npm run audio         # buat ulang musik + SFX (public/audio/*.wav)
npm run stills        # render beberapa frame PNG ke out/stills untuk dicek
```

> Saat pertama kali render, Remotion mengunduh Chrome Headless Shell. Jika jaringan memblokir unduhan itu,
> arahkan ke Chromium lokal: `npm run render -- --browser-executable=/path/ke/chrome-headless-shell`.

## Mengganti teks, harga, logo, dan kontak

Semua isi ada di **`src/config.ts`**:

| Bagian | Kunci |
| --- | --- |
| Nama brand, tagline, logo | `brand` (`logoSrc`: taruh file di `public/`, mis. `'logo.png'`) |
| Teks tiap adegan | `copy` (judul ditulis per baris agar tidak terpotong) |
| Kartu paket & harga | `packageCards` (`price`, `note`) |
| Simulasi order | `orderDemo` |
| Data contoh dashboard | `dashboardDemo` |
| Kontak | `contact.telegram`, `contact.whatsapp` |
| Warna | `colors` |
| Area aman & jadwal adegan | `safeArea`, `scenes` |

Teks dalam `[KURUNG SIKU]` adalah **placeholder** yang harus diganti sebelum publikasi:
`[HARGA PER PAKET]`, `[HARGA UNLIMITED]`, `[HARGA]`, `[DETAIL KETENTUAN PAKET UNLIMITED]`,
`[USERNAME TELEGRAM]`, `[NOMOR WHATSAPP]`. Video tidak memuat harga, testimoni, jumlah pelanggan,
janji aktivasi instan, uptime, atau performa — tambahkan hanya bila datanya sudah pasti.
"Unlimited" diperlakukan sebagai nama paket; batas penggunaannya diisi lewat `note`.

## Alur & transisi

| Detik | Adegan | Penghubung |
| --- | --- | --- |
| 0–4 | Terminal mengetik `npm start`, nama FELIXIORITY muncul di ±0,2 dtk, pertanyaan besar | **3D #1:** rak server muncul, kamera dolly masuk ke layarnya |
| 4–10 | "Kenalan dengan FELIXIORITY." + dashboard (server, CPU, RAM, konsol) | Dashboard muncul dari layar server; **3D #2:** blade server melintas dekat kamera |
| 10–17 | Kartu paket carousel 3D: RAM 1–10 GB, Unlimited, Node.js & Python | Kartu terakhir berubah menjadi jendela order |
| 17–24 | Pilih paket → Konfirmasi pesanan → Terima akses panel, kursor klik & buka konsol | Jendela berputar menjauh seperti pintu |
| 24–30 | **3D #3:** kubus logo, FELIXIORITY, ajakan, kontak (tampil ±24,8–30 dtk) | — |

Konten penting berada di dalam area aman x 130–950, y 210–1500.

## Audio

Musik elektronik instrumental 120 BPM dan SFX (klik, ketikan, whoosh) **disintesis sendiri** oleh
`scripts/generate-audio.mjs`, jadi tidak ada sampel pihak ketiga dan tidak memerlukan lisensi tambahan.
Pergantian adegan (4, 10, 17, 24 dtk) jatuh tepat di ketukan; drop musik di detik 24.
Puncak hasil akhir ±−5 dBFS (tidak clipping). Untuk memakai musik berlisensi sendiri, ganti
`public/audio/music.wav` atau ubah `audio.music` di config.

## Aset

- Font: Plus Jakarta Sans & JetBrains Mono (SIL OFL, salinan lisensi di `public/fonts/`), dimuat lokal.
- Ikon: lucide-react (ISC), satu gaya garis yang konsisten.
