# FxBgraM v9 — Glass & Motion (source)

Basis: Telegram Android 13.1.1 commit 3de37c8cfb039452be7398909461da6288babf15.
Paket tetap id.fxbgram.messenger.next.web; versi 13.1.1-FxGlass9; versionCode 7245 (×10 + ABI 9 = 72459), sehingga dapat
memperbarui v8 (72449) bila ditandatangani dengan keystore pemilik yang sama.

## Baru di v9

Kualitas efek dan animasi (`org.telegram.ui.fxios.FxMotion`)
- Level Liquid Glass: Otomatis / Liquid Glass penuh (blur + refraksi) / Kaca buram (blur tanpa refraksi) /
  Kaca sederhana (tembus pandang + kilau statis, tanpa blur real-time) / Bilah solid.
- Otomatis: API < 31 atau kelas performa rendah → kaca sederhana; kelas menengah di Android 12 → kaca buram;
  selain itu → penuh. Vivo Y17s (V2310, Android 13) → penuh, sama seperti keputusan v8; bisa diturunkan manual. Hemat daya baterai Telegram tetap menang.
- Level diterapkan lewat `LiteMode.isEnabled` (hanya menurunkan flag CHAT_BLUR/LIQUID_GLASS, tidak menaikkan),
  sehingga semua layar yang memakai renderer blur asli ikut tanpa blur bertumpuk.
- Kualitas animasi: Otomatis / Penuh / Hemat / Minimal. Minimal otomatis bila animasi Android dimatikan.

Transisi
- Buka/tutup halaman: pegas kritis gaya iOS (330/300 ms penuh, 190 ms hemat), halaman di bawah bergeser 30%
  (paralaks) dan meredup halus; gestur kembali memakai paralaks yang sama; pelepasan gestur memakai ease-out.
  Paralaks hanya lewat translasi kanvas saat menggambar sehingga tidak meninggalkan state view.
- Perpindahan tab: durasi pager mengikuti mode (300/180/0 ms) agar selaras dengan pegas lensa.

Indikator tab kaca
- Parameter pegas dari FxMotion; deformasi lentur berbasis kecepatan (tepi depan memanjang, tepi belakang
  tertinggal, sedikit pipih saat bergerak), lensa "terangkat" saat ditahan/diseret.
- Shader sorotan/rim di-cache di ruang unit + local matrix (tidak lagi membuat LinearGradient tiap frame).

Modul
- Layar Unduhan (Pengaturan → Kaca & Gerak → Unduhan, atau menu ⋯ daftar chat): memakai mesin unduhan asli
  (progres, jeda/lanjut per berkas dengan ketuk, pratinjau media/dokumen asli), plus pencarian, Jeda semua,
  Lanjutkan semua, Hapus riwayat, dan pintasan Penggunaan Penyimpanan (CacheControlActivity asli, per chat).
- Filter chat cepat (menu ⋯ daftar chat): Semua / Belum dibaca / Pribadi / Grup / Kanal / Bot. Lokal, tidak
  mengubah folder server. Ikon menu berubah menjadi ikon filter selama filter aktif.
- Layar Kaca & Gerak: pratinjau langsung (ketuk untuk menguji lensa), pilihan level kaca dan animasi, haptik,
  animasi tekan, tautan ke Hemat Daya.
- Ikon baru berupa vector drawable (fx_*.xml); tidak ada emoji sebagai ikon.

Fitur bawaan yang sengaja tidak diduplikasi: penggunaan penyimpanan per chat (sudah ada di Data & Penyimpanan),
folder chat (sudah ada), pratinjau foto/video/dokumen (PhotoViewer asli dipakai oleh layar Unduhan).

## Validasi v9
- Semua berkas Java yang diubah/ditambah dicek tipe dengan javac terhadap android.jar API 36 + stub R/BuildConfig;
  tidak ada error yang berasal dari perubahan v9 (error tersisa berasal dari dependensi AndroidX yang tidak
  tersedia di lingkungan pemeriksaan).
- Kurva pegas diverifikasi numerik (kritis: tanpa overshoot; lunak: overshoot maks 2%).
- XML string en/id valid.
- BELUM: build Gradle penuh, APK, uji perangkat fisik, uji alur login. Lingkungan pengerjaan tidak dapat
  mengakses dl.google.com / maven.google.com (Android SDK & Google Maven).

## Build
Clone revision basis, apply FxBgraM.patch, inisialisasi submodule (lihat .gitmodules; untuk native dari source
perlu semua submodule). Isi fxbgram.local.properties (api_id, api_hash) dan fxbgram-signing/release.keystore
(alias fxbgram). Build: `./gradlew :TMessagesProj_AppStandalone:assembleAfatStandalone`
(tambahkan `-PfxbgramPrebuiltNative=true` bila libtmessages.49.so tersedia di fxbgram-native/arm64-v8a).
