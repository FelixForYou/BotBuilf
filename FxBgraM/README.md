# FxBgraM (fork Telegram Android) — source

Folder ini menyimpan source FxBgraM sebagai patch terhadap Telegram Android resmi, sehingga repo tetap kecil
(source Telegram lengkap ±560 MB).

| Berkas | Isi |
| --- | --- |
| `BASE_COMMIT` | Commit dasar DrKLO/Telegram (13.1.1) |
| `FxBgraM.patch` | Patch lengkap v8 + v9 terhadap commit dasar (termasuk aset biner) |
| `v9-changes.patch` | Hanya perubahan v9 (untuk review) |
| `STATUS.md` | Daftar perubahan, hasil validasi, dan keterbatasan |
| `ci/fxbgram-apk.yml` | Template GitHub Actions untuk build APK (belum aktif) |
| `LICENSE` | GPL-2.0 (lisensi Telegram Android) |

## Menyusun source

```bash
git clone https://github.com/DrKLO/Telegram.git fxbgram-src
cd fxbgram-src
git checkout "$(cat ../FxBgraM/BASE_COMMIT)"
git apply ../FxBgraM/FxBgraM.patch
git submodule update --init --recursive --depth 1
```

Lalu isi kredensial pemilik (jangan di-commit, sudah di-.gitignore):

- `fxbgram.local.properties` → `api_id=...` dan `api_hash=...` (dari my.telegram.org)
- `fxbgram-signing/release.keystore` (alias `fxbgram`); kata sandi lewat `-PRELEASE_STORE_PASSWORD=... -PRELEASE_KEY_PASSWORD=...`

Build (Android SDK 36, NDK 27.2.12479018, JDK 17/21):

```bash
./gradlew :TMessagesProj_AppStandalone:assembleAfatStandalone
```

APK: `TMessagesProj_AppStandalone/build/outputs/apk/afat/standalone/app.apk`.

## Build otomatis di GitHub Actions (opsional)

1. Pindahkan `FxBgraM/ci/fxbgram-apk.yml` ke `.github/workflows/fxbgram-apk.yml`.
2. Isi Secrets repo: `FXBGRAM_API_ID`, `FXBGRAM_API_HASH`, dan (agar bisa menimpa v8)
   `FXBGRAM_KEYSTORE_BASE64`, `FXBGRAM_STORE_PASSWORD`, `FXBGRAM_KEY_PASSWORD`.
3. Push atau jalankan manual (Actions → FxBgraM APK → Run workflow). APK muncul sebagai artifact.
   Build pertama mengompilasi lib native (lama); berikutnya memakai cache.
