# Video Motion: OWASP Juice Shop

Video motion edukatif (bahasa Indonesia) yang memperkenalkan **OWASP Juice Shop**,
aplikasi web yang sengaja dibuat rentan untuk latihan ethical hacking secara legal.

- **Hasil:** `out/owasp-juice-shop.mp4`, MP4 H.264 + AAC, 1920×1080, 60 FPS, ±90 detik
- **Repository yang dibahas:** https://github.com/juice-shop/juice-shop

## Riset: kenapa Juice Shop

| Kriteria | Temuan |
|---|---|
| Kategori | Latihan ethical hacking / keamanan aplikasi web |
| Status | OWASP Flagship Project, masih aktif (commit terakhir 2026-10-23, `master` @ `717f5ef`) |
| Rilis | v20.3.0 (`package.json`) |
| Lisensi | MIT |
| Popularitas | ★ 14k, 21k fork (shields.io, diambil 2026-11-06) |
| Project leader | Björn Kimminich (`bkimminich`), Jannik Hollenbach (`J12934`) |
| Dokumentasi | README lengkap (instalasi via source, paket, Docker, Vagrant) dan buku panduan gratis *Pwning OWASP Juice Shop* |
| Aman untuk didemokan | Ya. Target dijalankan di komputer sendiri (`127.0.0.1:3000`), tanpa menyerang sistem pihak lain |

Fakta yang tampil di video dan sumbernya di repository:

- 116 tantangan, tingkat kesulitan 1–6 bintang (13/19/27/26/19/12), 16 kategori → `data/static/challenges.yml`
- Nama dan kategori tantangan (Score Board, DOM XSS, Login Admin, …) → `data/static/challenges.yml`
- Hacking Instructor (tutorial interaktif) → `frontend/src/hacking-instructor/`, teks UI di `frontend/src/assets/i18n/en.json`
- Coding Challenge (Find It / Fix It) → `data/static/codefixes/loginAdminChallenge_*`, `routes/login.ts`
- Notifikasi "You successfully solved a challenge" → `en.json` (`CHALLENGE_SOLVED`)
- Log "Server listening on port 3000" → `server.ts`
- Perintah Docker → bagian *Docker Container* di README

## Struktur

```
narration/script.json   naskah narasi per scene
narration/gen.py        TTS (gTTS, id) → public/vo/*.wav
scripts/sfx.py          SFX hasil sintesis numpy (bebas royalti) → public/sfx/*.wav
src/timeline.ts         durasi scene dari panjang narasi; cue() menyinkronkan visual dengan kata yang diucapkan
src/scenes/S1…S6        enam scene
```

## Render ulang

```bash
npm install
python3 narration/gen.py     # opsional, untuk membuat ulang narasi (perlu pip install gTTS)
python3 scripts/sfx.py       # opsional, untuk membuat ulang SFX
REMOTION_CHROME=/path/to/chrome-headless-shell npx remotion render JuiceShop out/owasp-juice-shop.mp4
```

Setelah naskah diubah, jalankan `narration/gen.py` lalu perbarui `src/vo-durations.json`
dan `src/script.json`. Timeline akan menyesuaikan sendiri.

## Catatan etika

Halaman GitHub, terminal, dan dashboard di video adalah **simulasi UI** yang dibuat ulang
dari data asli. Demo hanya memperlihatkan instalasi lokal, Score Board, dan *perbaikan* kode
(query SQL dengan parameter binding). Video tidak menampilkan payload serangan.
Logo Juice Shop diambil dari repository (MIT).
