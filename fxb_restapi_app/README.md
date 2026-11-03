# FxB RestApi — aplikasi Android (Flutter)

Aplikasi Flutter **native** untuk layanan **FxB RestApi by FELIXIORITY**. Ini bukan WebView: semua layar
dibangun ulang dengan widget Flutter dan memakai backend website yang sudah ada
(`https://api.felixiority.xyz`, server Pterodactyl). Akun, API key, riwayat, order, dan pengaturan tetap
tersimpan di database backend tersebut. Tidak ada database cloud tambahan.

## Fitur

| Area | Isi | Endpoint backend |
| --- | --- | --- |
| Beranda | Statistik 24 jam, kategori, contoh request, paket, bantuan | `/api/stats`, `/api/catalog`, `/api/plans` |
| Akun | Daftar, masuk, keluar, sesi tetap tersimpan setelah aplikasi ditutup | `/api/auth/register|login|logout|me` |
| Dashboard | Kuota hari ini, statistik 7 hari, key, request terbaru | `/api/keys`, `/api/usage` |
| Dokumentasi | Pencarian, kategori, filter tier/online, detail parameter, contoh kode cURL/JS/Python/PHP, contoh respons | `/api/catalog` |
| API Explorer / Try API | GET, POST JSON, multipart upload; JSON rapi + salin; pratinjau gambar/SVG; tautan hasil | `/api/v1/{kategori}/{endpoint}` |
| Qwerty | `sessionId` otomatis disimpan → percakapan lanjut; tombol "Sesi baru" | `/api/v1/ai/qwerty` |
| Video | Kartu task: cek status (jeda 5 detik sesuai kontrak), cek otomatis, buka/salin URL video | `/api/v1/video/generate`, `/api/v1/video/status` |
| API key | Buat (Create · Step 1 of 2), ganti nama, buat ulang, cabut, upgrade | `/api/keys`, `/api/keys/{id}` |
| Statistik | 7/30/90 hari, grafik, endpoint teratas, request terbaru | `/api/usage?days=` |
| Paket & order | Pilih paket → key → metode bayar → halaman pembayaran; invoice, instruksi manual, batalkan | `/api/plans`, `/api/orders`, `/api/orders/{id}` |
| Pengaturan | Nama, ganti password, tema gelap/terang, efek kaca, hapus akun | `/api/account`, `/api/account/password` |
| Admin (khusus role admin) | Ringkasan, pengguna, API key, endpoint, paket, pembayaran, pengaturan & status provider | `/api/admin/*` |

## Mengubah domain backend sebelum build

Domain diatur developer, bukan pengguna. Pilih salah satu cara:

1. Edit nilai default di `lib/config/app_config.dart`:
   ```dart
   static const String baseUrl = String.fromEnvironment('FXB_BASE_URL', defaultValue: 'https://api.felixiority.xyz');
   ```
2. Atau tanpa mengedit file, saat build:
   ```bash
   flutter build apk --release --dart-define=FXB_BASE_URL=https://domain-baru.xyz
   ```
3. Di GitHub Actions: isi variabel repository `FXB_BASE_URL` (Settings → Secrets and variables → Actions → Variables).

Gunakan HTTPS. Aplikasi menolak HTTP biasa (`usesCleartextTraffic=false`).

## Build lokal

Kebutuhan: Flutter 3.47.x (Dart 3.13), Android SDK (platform 36), JDK 17.

```bash
cd fxb_restapi_app
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter build apk --release
```

Hasil: `build/app/outputs/flutter-apk/app-release.apk`. Untuk APK lebih kecil per arsitektur:
`flutter build apk --release --split-per-abi` (Vivo Y17s memakai `arm64-v8a`).

Build lewat GitHub: workflow `.github/workflows/fxb-android.yml` berjalan otomatis saat folder ini berubah.
Hasilnya muncul sebagai artifact dan GitHub Release (prerelease).

## Penandatanganan APK

Tanpa keystore produksi, APK release **ditandatangani dengan debug key**. APK tetap bisa dipasang,
tapi jangan dipakai untuk distribusi publik/Play Store. Jika kunci berbeda di build berikutnya,
uninstall versi lama dulu sebelum memasang versi baru.

Untuk kunci produksi:

```bash
keytool -genkey -v -keystore fxb-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias fxb
```

Lalu buat `android/key.properties` (jangan di-commit):

```
storeFile=/path/lengkap/fxb-release.jks
storePassword=...
keyAlias=fxb
keyPassword=...
```

Di GitHub Actions, isi secrets `FXB_KEYSTORE_BASE64` (`base64 -w0 fxb-release.jks`), `FXB_KEYSTORE_PASSWORD`,
`FXB_KEY_ALIAS`, `FXB_KEY_PASSWORD`.

## Keamanan & integrasi backend

- **Sesi**: backend memakai cookie httpOnly `fxb_session`. Aplikasi mengambil nilainya dari `Set-Cookie`,
  menyimpannya di Android Keystore (`flutter_secure_storage`), lalu mengirimnya lagi sebagai header `Cookie`.
  Ganti password otomatis memperbarui token. Respons 401 menghapus sesi dan meminta login ulang.
- **CSRF/Origin**: `assertSameOrigin` di backend tetap aktif. Request yang mengubah data mengirim
  `Origin: <domain backend>`, sama dengan origin website. Request tanpa Origin tetap ditolak (sudah diuji).
- **Explorer tanpa API key**: sama dengan API Explorer website, yaitu cookie sesi + `Sec-Fetch-Site: same-origin`.
  Kuota dihitung pada key terbaik akun, atau kuota uji coba per IP jika belum login. Tier, limit,
  dan validasi parameter tetap diperiksa server. Pengguna juga bisa memilih mode API key (`X-API-Key`).
- **API key**: server hanya menyimpan hash. Key yang dibuat atau dibuat ulang di aplikasi disimpan
  terenkripsi di perangkat untuk Explorer. Salinan ini dihapus saat logout atau saat key dicabut.
- APK **tidak** berisi `SESSION_SECRET`, password admin, atau kredensial provider.
- Request POST/PATCH/DELETE **tidak pernah** diulang otomatis (tidak ada akun, order, upload, atau task video ganda).
  Hanya GET yang diulang satu kali saat koneksi putus.
- Respons 502/503/504 non-JSON (dari proxy atau panel) ditampilkan sebagai
  "Backend belum dapat diakses (HTTP 502)". Tidak ada respons palsu.

## Performa (target Vivo Y17s, 60 Hz)

- Blur hanya di top bar, navigation bar, dan tombol bantuan (sigma 12–18). Pengaturan › "Efek kaca" untuk mematikannya.
- Tab memakai `TickerMode`, jadi animasi tab tersembunyi berhenti. Daftar endpoint memakai `SliverList.builder`.
- State global memakai `ValueNotifier` terpisah, sehingga tema/user tidak me-rebuild seluruh aplikasi.
- Respons JSON besar dipotong saat dirender (versi lengkap tetap bisa disalin). Gambar jaringan memakai `cacheHeight`.
- Pengaturan sistem "Hapus animasi" (reduce motion) dihormati oleh semua animasi.

## Pengujian

```bash
flutter test                                     # unit test (API client, format, snippet)
# Uji integrasi NYATA ke backend (buat data uji! gunakan backend lokal/staging):
flutter test test/backend_contract_test.dart --dart-define=FXB_LIVE=true --dart-define=FXB_BASE_URL=http://localhost:3000
# Tangkapan layar dengan data nyata:
flutter test test/screenshots --update-goldens --dart-define=FXB_SHOTS=true --dart-define=FXB_BASE_URL=http://localhost:3000
```

## Struktur

```
lib/
├─ config/app_config.dart     ← domain backend (satu tempat)
├─ core/                      ← ApiClient (cookie, Origin, error), SessionStore, format, snippet
├─ models/                    ← model sesuai JSON backend
├─ state/app_state.dart       ← sesi, tema, katalog (ValueNotifier)
├─ theme/                     ← token warna website (hitam + mint), kurva pegas, reduce motion
├─ widgets/                   ← kartu, tombol, sheet, glass bar, skeleton, kode/JSON, grafik
└─ screens/                   ← beranda, docs, explorer, akun/dashboard, admin, menu, panduan, legal
```
