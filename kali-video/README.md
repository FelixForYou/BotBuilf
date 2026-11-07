# Mengenal Kali Linux: video motion edukasi

Video motion berbahasa Indonesia untuk pemula. Spesifikasi: 1920×1080, 60 fps, H.264/AAC, ±119 detik, dengan narasi, subtitle, dan SFX tanpa musik.

Isinya dibagi ke 8 scene: Opening, Apa itu Kali Linux, Sejarah, Fungsi, Tools populer, Cara penggunaan, Siapa penggunanya, dan Penutup ("Understand Security. Build Better Protection.").

- Hasil render: [`Mengenal_Kali_Linux_1080p60.mp4`](Mengenal_Kali_Linux_1080p60.mp4)
- Sumber setiap fakta: [RESEARCH.md](RESEARCH.md)

Pipeline-nya sama dengan `../rustscan-video`:

- `scripts/narration.json` + `scripts/captions.json`: naskah TTS (fonetis) dan teks subtitle (ejaan asli)
- `scripts/tts.py`: membuat narasi gTTS bahasa Indonesia
- `scripts/timeline.py`: menghitung durasi scene, hasilnya `src/timeline.json`
- `src/cues.json`: beat animasi + SFX
- `scripts/mix.py`: sintesis SFX dan mixing, hasilnya `public/audio/mix.wav`
- `src/scenes/S1…S8`: 8 scene

```bash
npm ci
pip install gTTS numpy scipy
python3 scripts/tts.py && python3 scripts/timeline.py && python3 scripts/mix.py
npx remotion render KaliLinuxVideo out/Mengenal_Kali_Linux_1080p60.mp4 --codec=h264 --crf=18 --audio-codec=aac
```

Logo dan screenshot berasal dari kali.org dan dipakai untuk keperluan edukasi.
