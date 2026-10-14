# FELIXIORITY

Visualisasi seluruh **user** dan **server** panel Pterodactyl dalam ruangan pixel interaktif.
Satu karakter = satu user panel. Data diambil langsung dari **Application API** panel Anda (bukan data demo).

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- PixiJS 8 untuk ruangan & sprite pixel, React untuk antarmuka
- Tanpa database, Redis, Firebase, atau Turso — sesi disimpan di cookie terenkripsi

---

## Fitur

| Halaman | Isi |
| --- | --- |
| `/` Koneksi panel | Domain panel + Application API key (`ptla_…`) → **Hubungkan Panel** |
| `/workspace` | Ruangan pixel, kartu Total User/Server/Admin, pencarian, filter, zoom, geser, pindah ruangan, detail user |
| `/users` | Tabel user dengan pencarian, filter, urutan, dan pagination |
| `/servers` | Tabel server dengan pencarian, filter pemilik, dan batas alokasi RAM/Disk/CPU |
| `/settings` | Info koneksi, **Putuskan Koneksi**, pengaturan animasi, label, dan interval sinkronisasi |

**Data yang ditampilkan**

- Total seluruh user (termasuk admin), total seluruh server, total admin (`root_admin`).
- Jumlah server per user dihitung dari atribut `user` (ID pemilik) pada setiap server — **bukan** dari username.
- User tanpa server tetap muncul (filter "Tanpa server").
- Detail user: karakter, username, ID, role, tanggal bergabung, total server, daftar server (nama, ID, identifier, batas RAM/Disk/CPU).
- Status daya, pemakaian CPU/RAM langsung, dan status online **tidak** tersedia melalui PTLA, sehingga tidak ditampilkan (aplikasi menulis "Tidak tersedia melalui PTLA"). Gerakan karakter hanyalah animasi visual.

**Ruangan**

- Kapasitas 24 kursi per ruangan. Panel dengan 1.050 user → 44 ruangan.
- Posisi karakter lengket selama halaman terbuka: polling tidak mengacak posisi. User baru mengisi kursi kosong; user yang dihapus menghilang setelah sinkronisasi berhasil.
- Penampilan karakter (kulit, rambut, baju, aksesori) deterministik dari ID user.
- Pencarian mencari di **semua** ruangan; memilih hasil membuka ruangannya, memilih karakter, dan memusatkan kamera.
- Hanya karakter di ruangan aktif yang dirender. Label username adalah elemen HTML yang tajam; posisinya diperbarui langsung per frame tanpa render ulang React.

**Sinkronisasi**

- Polling setiap 10/12/15 detik (default 12) selama tab aktif; berhenti saat tab disembunyikan.
- Tidak pernah bertumpuk (satu permintaan aktif). Backoff eksponensial saat gagal, menghormati `Retry-After` saat terkena rate limit.
- Seluruh halaman `/api/application/users` dan `/api/application/servers` dibaca (100 per halaman) sebelum snapshot diganti. Jika satu halaman gagal, snapshot lama dipertahankan.
- Panel besar otomatis memakai jeda lebih panjang (target ≤ 60 permintaan/menit ke panel).
- Status: **Memperbarui**, **Terbaru**, atau **Gagal memperbarui**, plus waktu sinkronisasi terakhir dan tombol **Perbarui**.
- Perubahan di panel terlihat pada sinkronisasi berikutnya. User dan server dibaca berurutan, sehingga tidak ada jaminan konsistensi transaksional antara keduanya.

---

## Menjalankan lokal

Prasyarat: Node.js 20.9+.

```bash
cd FELIXIORITY
npm install
cp .env.example .env.local
# isi SESSION_SECRET dengan hasil:
openssl rand -hex 32
npm run dev
```

Buka http://localhost:3000, isi domain panel dan Application API key.

### Membuat Application API key

Di panel Pterodactyl: **Admin → Application API → Create New**. Beri izin **Read** untuk **Users** dan **Servers**
(izin lain boleh "None"). Salin key berawalan `ptla_`.

### Mencoba tanpa panel asli (panel tiruan)

Repositori menyertakan panel tiruan untuk pengujian (pagination, 401/403/429/500, tambah/hapus/ubah user):

```bash
# terminal 1
MOCK_USERS=237 MOCK_SERVERS=512 npm run mock-panel
# terminal 2 — izinkan alamat lokal HANYA di mode pengembangan
FELIX_DEV_ALLOW_PRIVATE=1 npm run dev
```

Hubungkan ke `http://127.0.0.1:4010` dengan key yang dicetak di terminal 1.
`FELIX_DEV_ALLOW_PRIVATE` bersifat opsional dan **diabaikan sepenuhnya pada build produksi**.

Endpoint kontrol panel tiruan (GET): `/_mock/add-user?name=…`, `/_mock/delete-user?id=…`,
`/_mock/rename?id=…&name=…`, `/_mock/add-server?id=<owner>`, `/_mock/fail?n=…`, `/_mock/ratelimit?n=…`,
`/_mock/reset?users=…&servers=…`.

### Pemeriksaan

```bash
npm test          # unit test: validasi domain/SSRF, pagination, kepemilikan, sesi, slot ruangan, transport HTTP
npm run typecheck
npm run build
```

### Aset pixel

Semua aset di `public/assets/` (karakter, furnitur, lantai/dinding) dibuat oleh `scripts/generate-assets.mjs`
— karya asli proyek ini, tanpa aset pihak ketiga. Untuk membuat ulang: `npm run assets`.
Lisensi aset: CC0 (lihat `public/assets/LICENSE.md`).

---

## Deploy ke Vercel

1. Push repositori ke GitHub.
2. Di Vercel: **Add New → Project**, pilih repositori.
3. **Root Directory**: `FELIXIORITY` (wajib karena aplikasi berada di subfolder).
4. Framework terdeteksi otomatis (Next.js). Build command & output default.
5. **Environment Variables**: tambahkan `SESSION_SECRET` = hasil `openssl rand -hex 32`. Tidak ada variabel lain.
6. Deploy. Buka domain Vercel (HTTPS), hubungkan panel.

Catatan Vercel:

- `/api/sync` memakai `maxDuration = 60` detik untuk panel besar (paket Hobby mendukung hingga 60 detik).
- Rate limit dan penggabungan permintaan disimpan di memori per instance fungsi. Pada serverless, batas ini
  bersifat per instance (bukan global). Ini cukup untuk mencegah polling bertumpuk dari satu sesi, tetapi bukan
  pengganti WAF/rate limit platform.
- Mengganti `SESSION_SECRET` membuat semua sesi lama tidak valid (pengguna perlu menghubungkan ulang).

---

## Keamanan

- **API key hanya di server.** PTLA disimpan di cookie `HttpOnly`, `SameSite=Lax`, `Secure` (produksi, dengan
  prefiks `__Host-`), dienkripsi & diautentikasi dengan AES-256-GCM (kunci diturunkan dari `SESSION_SECRET`
  via HKDF). Masa berlaku 12 jam. PTLA tidak pernah dikirim balik ke browser, tidak disimpan di
  localStorage/sessionStorage/URL, dan tidak dicatat di log. Pesan error disaring dari pola `ptl?_…`.
- **Frontend hanya memanggil backend aplikasi** (`/api/connect`, `/api/sync`, `/api/disconnect`); backend yang menghubungi panel.
- **SSRF**: domain divalidasi; `localhost`, `.local`, `.internal`, IP privat/loopback/link-local/CGNAT/multicast,
  `169.254.169.254` dan endpoint metadata, IPv6 ULA/link-local, serta IPv4 tersemat di IPv6 (`::ffff:`, NAT64, 6to4)
  ditolak. **Semua** hasil DNS diperiksa, lalu koneksi dipaku ke IP yang sudah divalidasi (mencegah DNS rebinding).
  Redirect tidak diikuti. HTTPS wajib di produksi.
- Timeout 12 detik per permintaan, batas respons 8 MB per halaman, batas 1.000 halaman per endpoint
  (melebihi → error eksplisit, tidak dipotong diam-diam).
- **CSRF**: `/api/connect` dan `/api/disconnect` memeriksa header `Origin` dan `Sec-Fetch-Site`, serta hanya menerima JSON.
- Rate limit: koneksi 8/menit per IP, sinkronisasi ±1 per 4 detik per sesi.
- Data tidak tercampur antarsesi: setiap koneksi punya ID sesi acak; tidak ada cache data panel bersama.
- Aplikasi hanya membaca. Tidak ada hapus/suspend/ubah data panel, dan tidak mengakses database panel.

## Aksesibilitas & performa

- Teks UI tajam (HTML), ikon SVG tanpa emoji, seluruh teks berbahasa Indonesia.
- Ruangan dapat dikendalikan keyboard (panah = geser, `+`/`-` = zoom, `0` = reset, `Esc` = batal pilih).
- Mendukung `prefers-reduced-motion` dan pilihan "Kurangi animasi" (karakter tetap duduk, FPS dibatasi).
- Animasi berhenti saat tab tidak aktif. Sprite atlas (3 PNG kecil) dan render hanya ruangan aktif.
- HP: kartu statistik ringkas, ruangan mendukung geser & cubit-zoom, detail sebagai bottom sheet, navigasi bawah
  dengan target sentuh besar, label dibatasi lebarnya, dan **daftar user** sebagai alternatif tanpa memilih karakter.

---

## Struktur

```
FELIXIORITY/
├── app/
│   ├── page.tsx                 Koneksi panel
│   ├── workspace/page.tsx       Workspace pixel
│   ├── users/page.tsx           Pengguna
│   ├── servers/page.tsx         Server
│   ├── settings/page.tsx        Pengaturan
│   └── api/{connect,sync,disconnect}/route.ts
├── components/
│   ├── workspace/
│   │   ├── Office.tsx           Komponen React ruangan (memuat engine secara dinamis)
│   │   ├── OfficeEngine.ts      Engine PixiJS: dunia, input, kamera, perilaku jalan, label
│   │   ├── Character.tsx        Sprite karakter berlapis (tint per user)
│   │   ├── CharacterPreview.tsx Pratinjau karakter (kanvas 2D) untuk detail/daftar
│   │   ├── UserLabel.tsx        Label username + jumlah server
│   │   └── Camera.tsx           Logika kamera + tombol zoom/reset
│   ├── UserDetail.tsx, Stats.tsx, Search.tsx, AppShell.tsx, SyncStatus.tsx, …
│   └── views/                   Isi tiap halaman
├── lib/
│   ├── pterodactyl.ts           Klien Application API (pagination penuh, pemetaan error)
│   ├── http.ts                  Transport HTTP aman (DNS pinning, timeout, batas ukuran, tanpa redirect)
│   ├── sync.ts                  Snapshot server-side (kepemilikan via ID)
│   ├── client-store.ts          Polling sisi klien, backoff, diff perubahan, slot ruangan
│   ├── session.ts               Cookie sesi terenkripsi (AES-256-GCM)
│   ├── validation.ts            Validasi domain/API key + pemblokiran alamat (SSRF)
│   ├── security.ts              Origin/CSRF, rate limit
│   └── workspace/               Denah ruangan & pathfinding
├── public/assets/{characters,furniture,tiles}/   Sprite atlas PNG + JSON
├── scripts/generate-assets.mjs  Generator aset pixel
├── scripts/mock-panel.mjs       Panel tiruan untuk pengujian
├── tests/                       Unit test (Vitest)
├── types/panel.ts
└── .env.example                 Hanya SESSION_SECRET
```

---

## Perbedaan dengan foto referensi

Foto desain referensi **tidak ikut terlampir** dalam sesi saat aplikasi ini dibuat, sehingga tampilan disusun dari
deskripsi tertulis (tema navy dengan aksen biru-ungu, lantai kayu hangat, meja/monitor/kursi/tanaman/dispenser/rak
server, sudut atas dengan sedikit perspektif, header + navigasi, tiga kartu statistik, panel detail di kanan, kontrol
pencarian/filter/zoom/ruangan). Hal yang kemungkinan berbeda dari foto:

- Detail bentuk karakter, palet persis, dan susunan furnitur adalah interpretasi sendiri (aset dibuat dari nol).
- Perspektif berupa top-down 3/4 (permukaan meja dan sisi depan terlihat), bukan isometrik penuh.
- Bagian CPU/RAM pada desain ditampilkan sebagai **batas alokasi**, bukan pemakaian, karena PTLA tidak menyediakan pemakaian langsung.
- Tidak ada indikator online/aktivitas user karena data tersebut tidak tersedia dari Application API.
- Angka di kartu statistik selalu dari panel yang terhubung (bukan 128/246/3 seperti pada mockup).

Silakan lampirkan fotonya bila ingin penyesuaian visual lebih dekat.
