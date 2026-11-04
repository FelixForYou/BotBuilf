# Wings of the Wild

Game 3D open world berbasis web tentang hidup sebagai burung. Kamu bisa terbang bebas, mencari makan, membangun sarang, bertemu kawanan, menolong anak burung yang tersesat, menyelesaikan tantangan udara, dan mengembangkan skill. Game ini berjalan di browser HP maupun PC.

**Stack:** Three.js + TypeScript + Vite. Tidak ada aset eksternal: semua model, tekstur, dan suara dibuat secara prosedural.

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:5173 (akses dari HP di jaringan yang sama via --host)
npm run build        # dist/ → hosting statis (GitHub Pages, Netlify, dll.)
npm run build:single # dist-single/index.html → satu file, bisa dibuka/dibagikan langsung
npm run preview      # menyajikan dist/
npm test             # unit test (dunia prosedural, model terbang, progres, simpan)
npm run e2e          # uji alur lengkap di Chromium headless (jalankan `npm run build` dulu)
```

## Isi game

| Bagian | Detail |
|---|---|
| Dunia | 4 × 4 km, deterministik (seed tetap). Isinya pegunungan dan puncak bersalju, tebing, hutan tua, padang rumput, kebun bunga, sungai dengan air terjun, danau, desa (±49 rumah, ladang, kincir angin), pantai, 4 pulau kecil, laut, gua kristal, dan reruntuhan. |
| Landmark | Pohon Raksasa, Mercusuar (dengan sorot lampu di malam hari), Kincir Angin, Reruntuhan Kuno, Air Terjun, Gerbang Karang, Puncak Elang. Semuanya selalu dimuat sehingga terlihat dari jauh. |
| Terbang | Mengepak, meluncur hemat stamina, menukik (energi kecepatan bisa diubah menjadi ketinggian), mengerem, dan mendarat. Ada arus udara naik di lereng atau tebing yang menghadap angin, kolom termal di siang hari, dan angin yang mendorong burung. Bantuan mendarat (tombol E) membuat burung bertengger otomatis di pohon, batu, atap, atau tebing. Bayangan bulat di bawah burung membantu memperkirakan jarak ke tanah. Kamera tidak menembus tanah atau objek. |
| Skill aktif | Wind Dash, Sky Vision, Updraft, Flock Call, Evasive Roll. Masing-masing punya 3 level, cooldown, dan indikator di skill bar. |
| Skill pasif | Stamina, efisiensi meluncur, kelincahan, jarak pandang, kapasitas ranting. Masing-masing punya 3 level. |
| Dunia hidup | Kawanan burung (terbang, makan di tanah, bertengger, kabur dari ancaman, ikut pemain). Warga desa (berjalan, berkebun, duduk, menaburkan remah roti). Kelinci, rusa, kucing, ikan (bisa ditangkap dengan menukik ke air), kupu-kupu (berubah menjadi kunang-kunang di malam hari), dan elang predator yang menjaga 3 wilayah. |
| Aktivitas | Makan biji, beri, buah, serangga (ditangkap di udara), ikan, dan remah roti. Minum di tepi air atau sambil terbang rendah di atas air. Sarang 5 level dari ranting, bisa dipakai untuk tidur hingga pagi dan sebagai titik kembali. 3 balapan, 2 tantangan menyelam, 2 tantangan celah dengan medali. 5 anak burung tersesat. 6 lokasi rahasia. XP dari eksplorasi. |
| Jenis burung | Pipit, Layang-layang, Camar, Raja Udang, Elang, Burung Hantu. Statistik dan kemampuan khususnya berbeda, dan dibuka lewat level, rahasia, atau jumlah ikan yang ditangkap. Warna bulu bisa dipilih dari preset atau diatur bebas. |
| Mode | **Santai**: lapar dan haus tidak menghukum, predator tidak menyerang. **Petualangan**: ada stamina, lapar, haus, kesehatan, dan predator. |
| Lainnya | Siklus pagi, siang, senja, dan malam. Cuaca cerah, berkabut, dan hujan ringan. Mode foto (orbit, zoom, jam, unduh PNG). Peta dengan area belum terjelajah yang tertutup. Kompas dengan penanda. Tutorial 7 langkah. Autosave lokal. Audio sintesis (angin, kepakan, air, hujan, kicau, jangkrik, efek) dengan pengaturan volume. |

## Kontrol

**PC:** W/S kepak maju/mengerem · A/D atau mouse untuk belok (klik layar untuk mengunci mouse) · Space naik · Ctrl/C menukik · Q meluncur · E interaksi · Shift dash · 2 vision · 3 updraft · 4 call · 5/F roll · M peta · K skill · P foto · H sembunyikan UI · Esc jeda.

**HP:** joystick kiri (belok, maju, mengerem) · ▲/▼ naik/menukik · Luncur (toggle) · E interaksi (menyala bila ada yang bisa dilakukan) · skill bar · geser layar kanan untuk kamera.

## Arsitektur

```
src/
  core/      noise & RNG deterministik, input (keyboard/mouse/sentuh)
  world/     terrain.ts (tinggi/bioma/sungai), chunkGen + chunkWorker (Web Worker),
             chunks.ts (streaming + LOD + instancing), landmarks, water, sky (siklus hari & cuaca), world.ts (tabrakan/kueri)
  player/    player.ts (model terbang), birdModel.ts (animasi prosedural), camera.ts
  ai/        npcs.ts (kawanan, manusia, hewan, ikan, predator), models.ts
  gameplay/  skills, progress, species, pickups, challenges, rescue, nest
  ui/        ui.ts (HUD, menu, peta, foto), style.css
  audio/     audio.ts (WebAudio sintesis)
  save/      save.ts (localStorage)
  game.ts    orkestrasi & loop
```

### Teknik performa
- **Chunk streaming:** 16×16 chunk (256 m) dengan 4 level LOD dan "skirt" penutup celah. Mesh dibangun di Web Worker (maksimal 2 permintaan sekaligus, chunk terdekat diprioritaskan).
- **Instancing:** satu `InstancedMesh` per jenis properti, hanya diisi dari chunk dalam radius properti. NPC burung juga di-instancing (badan + sayap).
- **Batas NPC & radius aktif:** AI hanya disimulasikan di sekitar pemain, dengan jumlah maksimum per preset. Objek yang jauh dilepas.
- **Preset Rendah/Sedang/Tinggi:** pixel ratio maksimal 1/1,5/2, jarak pandang 650/950/1400 m, kepadatan properti, dan LOD. Bayangan dinamis hanya di preset Tinggi; preset lain memakai bayangan bulat.
- **Jarak pandang adaptif:** bila FPS < 27, resolusi dan jarak pandang diturunkan bertahap, lalu dinaikkan lagi bila FPS > 52.
- Pengaturan → "Tampilkan FPS" menampilkan FPS, waktu logika per frame, jumlah draw call, segitiga, pixel ratio, dan jarak pandang, untuk mengukur langsung di perangkat.

## Hasil pengujian

- `npm test`: 14 unit test lolos. Yang diuji: determinisme dunia, keberadaan semua bioma, sungai selalu mengalir ke hilir, model terbang (meluncur, mengepak, menukik, lalu naik lagi dengan momentum, mengerem dan mendarat, kehabisan stamina, dash), XP/level, cooldown skill, dan serialisasi save.
- `npm run e2e`: 24/24 pemeriksaan lolos pada build `dist/` dan `dist-single/`. Yang diuji: layar judul → game baru → naik → belok kanan → menukik → Wind Dash, Sky Vision, Updraft → bertengger dengan E → mendarat di tanah → makan → ambil ranting → bangun sarang → selesaikan Balap Lembah → temukan landmark → peta → mode foto → simpan → reload → Lanjutkan, lalu memastikan posisi, XP, level, sarang, rekor, penemuan, dan mode kembali seperti semula → kontrol sentuh di viewport HP → tanpa error JS. Catatan: dalam uji tantangan, burung dipindahkan langsung ke tiap cincin, jadi uji ini memeriksa logika tantangan, bukan kemampuan menerbangkan rutenya.
- **Performa, apa adanya:** uji otomatis berjalan di Chromium headless dengan **SwiftShader (render di CPU, tanpa GPU)**. Di sana preset Rendah pada viewport Pixel 5 mencapai sekitar 13 FPS, dengan logika game sekitar 1–1,5 ms/frame, sekitar 47 draw call, dan sekitar 93 ribu segitiga. Angka FPS ini **tidak mewakili HP sungguhan**. Game **belum diuji di Vivo Y17s atau HP Android fisik lain**, jadi target 30 FPS di preset Rendah belum terbukti. Untuk mengukurnya, aktifkan "Tampilkan FPS" di perangkat.

## Batasan yang diketahui
- Gua dan reruntuhan berupa struktur sederhana (kubah berongga dan tiang), bukan jaringan gua yang dalam.
- Tabrakan pohon disederhanakan: burung bisa menembus daun, tetapi tidak bisa menembus batu, rumah, atau landmark.
- Progres hanya tersimpan di browser perangkat itu (localStorage). Mode privat atau penghapusan data situs akan menghapusnya.
