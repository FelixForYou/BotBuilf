# FELIXIORITY · Portfolio

Website portfolio Felixiority: halaman publik dengan motion graphics (GSAP + ScrollTrigger), login admin, dan dashboard untuk mengelola project. Satu aplikasi Next.js, database SQLite bawaan Node, tanpa layanan eksternal.

## Kebutuhan

- Node.js **22.13 atau lebih baru** (modul `node:sqlite` dipakai langsung, jadi tidak ada dependency native yang perlu dikompilasi)
- Penyimpanan yang tidak terhapus saat restart, untuk folder `data/`

## Instalasi

```bash
npm install
```

```bash
npm run setup
```

`setup` membuat database, mengisi 8 project awal, lalu meminta username dan password admin. Password tidak tampil saat diketik dan disimpan sebagai hash scrypt.

```bash
npm run build
```

```bash
npm start
```

Port dibaca dari `PORT`, lalu `SERVER_PORT` (variabel bawaan Pterodactyl), dan jatuh ke `3000` kalau keduanya kosong. Login admin ada di `/admin/login`, atau lewat tautan kecil "Login Admin" di footer.

## Reset password admin

```bash
npm run reset-password
```

Perintah ini juga mengeluarkan semua sesi akun tersebut dan membuka kunci login yang sempat terkena batas percobaan.

## Deploy di Pterodactyl / VPS

1. Pakai egg Node.js dengan versi 22.13 ke atas, lalu unggah folder ini (tanpa `node_modules`, `.next`, dan `data`).
2. Lewat console, jalankan `npm install`, `npm run setup`, dan `npm run build` satu kali. Input password di prompt tidak ditampilkan oleh aplikasi; kalau panel kamu menampilkan ulang perintah yang diketik, ganti password setelahnya dari terminal SSH dengan `npm run reset-password`.
3. Atur startup command menjadi `npm start`. Port mengikuti alokasi server secara otomatis.

Semua data permanen ada di satu folder: `data/felixiority.db` dan `data/uploads/`. Backup cukup dengan menyalin folder itu. Kalau ingin menaruhnya di lokasi lain, isi variabel `DATA_DIR`.

Tidak perlu Redis, Firebase, layanan auth eksternal, `NEXTAUTH_SECRET`, atau secret yang dibuat manual. Token sesi dibuat acak di server, disimpan sebagai hash di database.

## Yang bisa dikelola dari dashboard

- Project: tambah, edit, hapus (dengan konfirmasi), arsipkan, pulihkan dari arsip, simpan sebagai draft, publikasikan, preview sebelum terbit.
- Judul, slug, deskripsi singkat dan lengkap, kategori (Website, AI, API, Hosting, Bot, Eksperimen), teknologi, status (Aktif, Pengembangan, Maintenance, Arsip).
- Tautan website, demo, GitHub, dokumentasi. Tautan kosong tidak disimpan, jadi tombol kunjungan hanya muncul kalau URL-nya ada.
- Cover dan screenshot (PNG/JPG/WebP, maks. 6 MB) dengan teks alternatif wajib. Jenis file dicek dari isi file, bukan dari namanya.
- Project unggulan dan urutan tampil.
- Teks hero, profil brand, layanan, kontak, sosial media, metadata SEO.
- Intensitas animasi: penuh, ringan, atau minimal.
- Ekspor dan impor project dalam JSON (gabungkan atau ganti semua).

## Catatan data awal

Kedelapan project awal tidak punya URL karena belum ada alamat yang dikonfirmasi, jadi tombol kunjungannya tersembunyi sampai admin mengisi tautan. Status, kategori, dan daftar teknologi awal hanya titik mulai; sesuaikan dengan kondisi sebenarnya. Selama belum ada cover asli, setiap project memakai ilustrasi antarmuka berbasis HTML/CSS yang diberi label "Ilustrasi project".

## Motion dan aksesibilitas

- Desktop (mode penuh): hero dipin, jendela "website" di diagram membesar menjadi panggung project, lalu showcase berjalan dengan kamera 2.5D dan snap per project.
- Mode ringan dan perangkat sentuh: tanpa 3D. Showcase memakai rail horizontal (desktop) atau carousel scroll-snap native (mobile) supaya scroll vertikal tidak dibajak.
- Pengunjung dengan setelan `prefers-reduced-motion` selalu mendapat mode minimal.
- Semua teks dan tautan tetap elemen HTML asli: bisa dipilih, diklik, dan dibaca pembaca layar.

## Keamanan singkat

Cookie sesi `HttpOnly` + `SameSite=Strict` (ditambah `Secure` saat diakses lewat HTTPS), token CSRF per sesi untuk setiap request admin, pengecekan `Origin`, batas 5 percobaan login per 15 menit (per IP dan per username, tersimpan di database), validasi input dengan zod, dan file upload diberi nama acak di luar folder publik.

## Struktur

```
app/(site)        halaman publik (beranda, detail project, preview admin)
app/admin         login dan dashboard
app/api           endpoint auth dan admin
components/site   hero, showcase, grid, section, transisi halaman
components/art    ilustrasi project
db/               skema, data awal, hash password (dipakai app dan skrip)
lib/              akses data, auth, upload, validasi
scripts/          setup, reset-password, start
```
