# Naskah Voice Over: OWASP Juice Shop (gaya santai ala TikTok)

Gaya diambil dari audio referensi `tiktok.mp3` (117 detik, ditranskripsi otomatis):

- **Tempo:** sekitar 2,5 kata per detik saat bicara. Tidak terburu-buru.
- **Jeda:** setengah sampai satu detik di setiap titik. Jedanya justru yang bikin enak didengar.
- **Kalimat pendek.** Setiap kalimat diucapkan sebagai satu "pukulan".
- **Bahasa ngobrol:** "gak", "udah", "bikin", "buat", seperti cerita ke teman.
- **Pertanyaan retoris** ("Isinya apa?", "Pemula?") dibaca dengan nada naik dan rasa penasaran, lalu jeda singkat sebelum jawabannya.
- **Kata penghubung** ("Tapi", "Jadi", "Makanya") diberi tekanan dan jeda sesudahnya.
- **Penutup** berupa ajakan komentar, dibaca lebih ringan dan senyum.

Catatan: nada di atas disimpulkan dari transkrip dan pola jeda audio referensi, bukan dari mendengarkan langsung.
Tetap jadikan audionya patokan utama.

Tanda baca: `/` = jeda pendek · `//` = jeda panjang · **tebal** = diberi tekanan

---

## Scene 1 · Opening (target ±7 detik)

> Mau belajar hacking, / takut kena masalah? //
> Wajar. //
> **Tapi**, / ada tempat latihan yang **aman**. / Dan **legal**.

## Scene 2 · Perkenalan (target ±12 detik)

> Namanya, / **OWASP Juice Shop**. //
> Proyek open source, / statusnya **Flagship**, /
> dipimpin Björn Kimminich / dan Jannik Hollenbach. //
> Sebuah toko jus online. / Yang **sengaja** dibikin / penuh celah keamanan.

*Lafal: OWASP = "o-wasp" · Björn Kimminich = "byorn ki-mi-nikh"*

## Scene 3 · GitHub (target ±13 detik)

> Kodenya terbuka di GitHub. //
> Alamatnya / juice-shop, / garis miring, / juice-shop. //
> Bintangnya udah lebih dari **empat belas ribu**. //
> Gratis, / berlisensi MIT. //
> Kalau bermanfaat, / tekan tombol **Star**, / untuk mendukung developernya.

## Scene 4 · Penjelasan (target ±15 detik)

> Isinya apa? //
> Kerentanan dari seluruh daftar **OWASP Top Ten**, /
> plus celah yang sering ketemu di aplikasi nyata. //
> Jalankan di laptopmu **sendiri**, / terus temukan celahnya / satu per satu. //
> Cocok buat pelajar, / developer, / pentester, / sampai trainer CTF.

## Scene 5 · Demo & Fitur (target ±21 detik)

> Cukup **satu** perintah Docker, / lalu buka localhost, / port tiga ribu. //
> Ada **seratus enam belas** tantangan, / level satu sampai enam, /
> semuanya terpantau di Score Board. //
> Pemula? / Ada Hacking Instructor yang nuntun. //
> Lewat Coding Challenge, / kamu belajar **benerin** kode yang rentan, /
> misalnya query SQL dari rangkaian teks, / diganti parameter binding.

## Scene 6 · Kesimpulan (target ±12 detik)

> Jadi, / Juice Shop ngajarin cara mikir penyerang, / biar aplikasimu makin aman. //
> Gunakan **hanya** di lingkungan sendiri, / atau yang berizin. //
> Kunjungi repositorinya. //
> Tantangan mana yang mau kamu coba duluan? / Tulis di komentar.

---

## Durasi

Total 181 kata. Dengan tempo seperti audio referensi, narasi sekitar 80–86 detik dan video sekitar 90–95 detik.
Supaya tetap di bawah 90 detik, bicara sedikit lebih rapat atau buang bagian opsional berikut:

- Scene 1: "Wajar."
- Scene 3: "Gratis,"
- Scene 6: "Kunjungi repositorinya." Link repo tetap tampil di layar. **Jangan buang** kata "Kunjungi" kalau `script-casual.json` tidak ikut diedit, karena kata itu menjadi pemicu animasi kartu penutup.

## Cara rekam dan pasang ke video

1. Rekam **satu file per scene** dan beri nama `s1` sampai `s6` (format bebas: m4a, mp3, wav).
   Ruangan sunyi, mic sekitar sejengkal dari mulut.
2. Taruh semua file di satu folder, misalnya `narration/my-vo/`.
3. Jalankan:
   ```bash
   python3 narration/import_vo.py narration/my-vo
   npx remotion render JuiceShop out/owasp-juice-shop.mp4
   ```
   Panjang tiap scene dan waktu animasi akan menyesuaikan rekaman Anda secara otomatis.
   Kalau kalimat diubah, ubah juga `narration/script-casual.json`. Kata kunci pemicu animasi
   (misalnya "Tapi", "tekan tombol", "Kunjungi") harus tetap ada dan urutannya sama.
