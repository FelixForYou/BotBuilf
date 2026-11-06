"""Import your own voice-over recordings into the video.

Usage:
  python3 narration/import_vo.py <folder>

<folder> must contain s1..s6 in any audio format (s1.m4a, s2.mp3, s3.wav, ...),
recorded from narration/NASKAH-VO.md. Each file is trimmed of leading/trailing
silence, loudness-normalised, and written to public/vo/sN.wav. Afterwards
src/vo-durations.json and src/script.json are updated, so scene lengths and
animation cues follow your recording. Then render again.
"""
import glob, json, os, shutil, subprocess, sys

src = sys.argv[1] if len(sys.argv) > 1 else "narration/my-vo"
durs = {}
for i in range(1, 7):
    sid = f"s{i}"
    found = [p for p in glob.glob(os.path.join(src, sid + ".*"))]
    if not found:
        sys.exit(f"Tidak ditemukan file {sid}.* di {src}")
    out = f"public/vo/{sid}.wav"
    trim = "silenceremove=start_periods=1:start_threshold=-45dB"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", found[0],
                    "-af", f"{trim},areverse,{trim},areverse,loudnorm=I=-16:TP=-1.5",
                    "-ar", "48000", "-ac", "1", out], check=True)
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", out], capture_output=True, text=True).stdout.strip()
    durs[sid] = float(d)
    print(f"{sid}: {float(d):.2f} s  <- {found[0]}")

json.dump(durs, open("src/vo-durations.json", "w"))
shutil.copy("narration/script-casual.json", "src/script.json")
total = sum(durs.values()) + 9.6  # + scene padding
print(f"Narasi {sum(durs.values()):.1f} s, perkiraan video ±{total:.1f} s")
if total > 90:
    print("Catatan: lebih dari 90 detik. Bicara sedikit lebih cepat atau pakai versi pendek di NASKAH-VO.md.")
