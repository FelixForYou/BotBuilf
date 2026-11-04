# FxB Pay — BY FELIXIORITY

Payment gateway full-stack dengan integrasi **DANA Payment Gateway (SNAP)**, dompet internal per akun berbasis
**ledger double-entry immutable**, dashboard merchant & admin, API merchant, dan **pusat pengujian DANA Sandbox & UAT**.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL · Drizzle ORM (transaksi + row lock) · Vitest.

> **Status jujur.** Seluruh alur (akun, saldo, ledger, refund, penarikan, webhook, API, UAT lokal) berfungsi dan teruji.
> Panggilan nyata ke DANA **membutuhkan kredensial merchant DANA Anda** dan belum pernah dijalankan terhadap akun
> DANA sungguhan dalam pengembangan ini. Lihat [Apa yang membutuhkan DANA](#apa-yang-membutuhkan-kredensial--persetujuan-dana).

## Isi

- [Fitur](#fitur) · [Instalasi lokal](#instalasi-lokal) · [Deployment](#deployment) · [Akun admin awal](#akun-admin-awal)
- [docs/DANA.md](docs/DANA.md) — mendapatkan & memasukkan kredensial, webhook, menjalankan UAT
- [docs/OPERASIONAL.md](docs/OPERASIONAL.md) — worker, backup & pemulihan, keamanan, rekonsiliasi
- [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md) — ledger, status pembayaran, pemetaan status DANA

## Fitur

| Area | Ringkasan |
|---|---|
| Akun | Daftar, masuk/keluar, verifikasi email, lupa password, profil & toko, riwayat login, kelola sesi, 2FA TOTP (wajib untuk admin), role user/admin di server |
| Dompet | Saldo tersedia / tertahan / dicadangkan per akun per env; terpisah dari saldo DANA pribadi |
| Ledger | Double-entry, BIGINT rupiah, immutable (trigger DB), jurnal seimbang (constraint trigger), saldo tidak bisa negatif (CHECK), idempotency key per jurnal, penguncian `FOR UPDATE` berurutan |
| Pembayaran | Link pembayaran, checkout bermerek, countdown, invoice & bukti PDF, filter/pencarian, ekspor CSV, timeline status |
| DANA | Create Order (redirect & QRIS opsional), Query Payment, Cancel Order, Refund Order, Finish Notify — signature SNAP RSA-SHA256 identik dengan SDK resmi `dana-node` |
| Penarikan | Cadangan saat pengajuan, tinjauan admin, pencairan manual dengan bukti, status tidak pasti wajib rekonsiliasi |
| Admin | Ringkasan (dana pengguna vs biaya platform vs settlement), pengguna (bekukan, role, jurnal koreksi), transaksi, ledger & reversal, settlement & rekonsiliasi, penarikan, refund, API & webhook, pengaturan DANA, Sandbox & UAT, biaya & limit, notifikasi, audit log, website |
| API merchant | API key sandbox/production (scope, kedaluwarsa, rotasi, cabut), Idempotency-Key, rate limit, webhook keluar HMAC + retry backoff + kirim ulang, proteksi SSRF, playground sandbox, dokumentasi Node/PHP/cURL di `/docs` |

## Instalasi lokal

Prasyarat: Node.js ≥ 20.9, PostgreSQL ≥ 14.

```bash
cd FxBPay
npm install
cp .env.example .env            # isi DATABASE_URL; APP_URL=http://localhost:3000 untuk lokal
npm run keygen                  # salin APP_ENCRYPTION_KEY & CRON_SECRET ke .env
npm run db:migrate              # membuat tabel + trigger pengaman
npm run setup:admin -- admin@domain.com "Nama Admin"   # password diminta tersembunyi
npm run db:seed                 # OPSIONAL, hanya development: merchant demo@fxbpay.test / demopassword123
npm run dev                     # http://localhost:3000
npm run worker                  # terminal lain: job webhook, query status, rekonsiliasi, email
```

Tanpa `SMTP_URL`, email (verifikasi/reset) ditulis ke log server dan tampil di Admin → Notifikasi → Outbox email.

Pengujian (butuh database kosong terpisah, akan di-reset):

```bash
createdb fxbpay_test
TEST_DATABASE_URL=postgres://.../fxbpay_test npm test
npm run typecheck
```

35 tes mencakup: ledger (seimbang, idempoten, tidak negatif, immutable, pemisahan env), alur pembayaran,
callback duplikat & paralel, nominal tidak cocok, signature salah, callback terlambat & tidak berurutan,
refund, penarikan (cadangan, tolak, cair, paralel, idempotensi, status tidak pasti), koreksi & reversal admin,
isolasi akun (dashboard & API), scope/pencabutan API key, Idempotency-Key, SSRF, serta **kesetaraan signature
dengan SDK resmi `dana-node`**.

## Deployment

FxB Pay adalah aplikasi Node.js biasa + PostgreSQL. Dua komponen harus berjalan: **web** dan **worker**.

**VPS / Docker / Railway / Render / Fly (disarankan):**

```bash
npm ci && npm run build && npm run db:migrate
npm start            # web (port 3000, letakkan di belakang reverse proxy HTTPS)
npm run worker       # proses terpisah, jalankan terus (systemd/pm2/service kedua)
```

**Vercel / serverless:** set env di dashboard, jalankan `npm run db:migrate` dari mesin Anda ke database
production, lalu jadwalkan pemanggilan tiap menit:

```
POST https://pay.domainanda.com/api/cron   Authorization: Bearer <CRON_SECRET>
```

Checklist production: `APP_URL` https, `APP_ENCRYPTION_KEY` baru (bukan default dev), `SMTP_URL`, backup terjadwal
(`npm run backup`), worker/cron hidup, lalu ikuti [docs/DANA.md](docs/DANA.md) sampai checklist di Admin → Sandbox & UAT hijau.

## Akun admin awal

Admin pertama **hanya** dibuat dari terminal server (`npm run setup:admin`) — tidak ada halaman setup publik
yang bisa disalahgunakan. Saat login pertama admin diarahkan mengaktifkan 2FA; panel admin terkunci sampai 2FA aktif.

## Apa yang membutuhkan kredensial / persetujuan DANA

| Bagian | Butuh |
|---|---|
| Transaksi Sandbox nyata ke DANA | Kredensial Sandbox (Partner ID, Merchant ID, private key, MCC) dari Merchant Portal |
| Notifikasi DANA ke FxB Pay | Domain HTTPS publik + Notify URL terdaftar di Merchant Portal |
| UAT resmi | Dijalankan & dinilai di Merchant Portal DANA; FxB Pay hanya mencatat hasilnya secara manual |
| Production | Persetujuan DANA + kredensial Production + public key DANA production |
| QRIS | Akses QRIS aktif di akun merchant |
| Pencairan otomatis | Produk Disbursement DANA terpisah — **belum diintegrasikan**; penarikan diproses manual dengan bukti |
| Settlement | Jadwal & laporan settlement dari DANA; FxB Pay mencatat penerimaan dana secara manual lalu merekonsiliasi |

Tanpa kredensial, Sandbox berjalan dalam **mode DEMO** berlabel jelas (simulator lokal; tidak memengaruhi saldo
Production), dan Production menampilkan "Integrasi belum dikonfigurasi".

## Catatan desain

Gambar referensi desain tidak ikut terlampir pada permintaan pengembangan ini, sehingga UI dibangun dari spesifikasi
tertulis: latar `#101010`, card `#1E1E1E`/`#272727`, aksen mint `#58DCC5`, tombol pill, card radius 28 px, grup baris
pengaturan, bottom sheet "Buat" dengan segmented control, timeline "build steps", card error, onboarding, animasi
200–280 ms, mobile-first (360 px) dengan sidebar di desktop. Token warna & komponen berada di
`app/globals.css`, `components/ui.tsx`, dan `components/client.tsx` agar mudah disesuaikan dengan foto referensi.
