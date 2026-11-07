# Mengenal Kali Linux: video motion edukasi (revisi 2, gaya minimal)

Video motion vertikal berbahasa Indonesia untuk pemula. Spesifikasi: 1080×1920, 60 fps, H.264/AAC, ±118 detik, dengan narasi santai, subtitle, dan SFX tanpa musik.

Hasil render: [`Mengenal_Kali_Linux_Vertikal_1080x1920.mp4`](Mengenal_Kali_Linux_Vertikal_1080x1920.mp4). Sumber setiap fakta ada di [RESEARCH.md](RESEARCH.md).

## Revisi 2 (mengikuti video & audio referensi)

- **Desain**: latar putih dengan gradasi pastel lembut. Headline hitam tebal dengan satu kata aksen biru, kartu putih bershadow, kotak seleksi bergaya tool desain, dan kursor yang mengklik. Bar "Tanya soal Kali Linux..." tetap di bawah, header/footer kecil, dan outro berupa end card navy.
- **Pembukaan**: dibuka dengan gelembung komentar penonton ("Bang, Kali Linux itu sebenernya buat apa sih?"), lalu hook "Katanya buat ~~hacker?~~ → keamanan."
- **Narasi**: gaya bicara santai seperti audio referensi ("aku", "nah", "ya", kalimat pendek). Suara gTTS diolah dengan vocoder WORLD (`scripts/voice.py`) menjadi suara pria (±115 Hz) dengan kontur intonasi diperkuat 2,2×.
- **SFX**: lebih lembut (pop, tick, klik, ketikan, chime), tanpa glitch.

Versi 1 (landscape 1920×1080, gaya gelap) masih ada di riwayat git.

## Pipeline

- `scripts/narration.json` + `scripts/captions.json`: naskah TTS (ejaan fonetis) dan teks subtitle
- `scripts/tts.py`: gTTS → trim → `voice.py` (WORLD) → tempo 1,28×
- `scripts/timeline.py`: menghitung durasi scene, hasilnya `src/timeline.json`
- `src/cues.json`: beat animasi + SFX
- `scripts/mix.py`: sintesis SFX dan mixing, hasilnya `public/audio/mix.wav`
- `src/components/Ui.tsx`: sistem desain (Backdrop, Chrome, Headline, Card, Select, Cursor, Pill, CommandBar, Captions)
- `src/scenes/S1…S8`: 8 scene

```bash
npm ci
pip install gTTS numpy scipy pyworld librosa soundfile
python3 scripts/tts.py && python3 scripts/timeline.py && python3 scripts/mix.py
npx remotion render KaliLinuxVideo out/Mengenal_Kali_Linux_Vertikal_1080x1920.mp4 --codec=h264 --crf=18 --audio-codec=aac
```

Narasi juga bisa diganti dengan rekaman suara sendiri, seperti cara di video referensi. Potong rekaman per kalimat sesuai `narration.json`, lalu timeline dan audio tinggal dihitung ulang.

Logo dan screenshot berasal dari kali.org dan dipakai untuk keperluan edukasi.
