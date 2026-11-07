"""Narration: gTTS (Indonesian) -> trim -> WORLD voice styling (male, expressive) -> tempo."""
import json, subprocess, os, sys
from gtts import gTTS
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice import convert

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
segs = json.load(open(f"{root}/scripts/narration.json"))
tmp = f"{root}/scripts/.tts"; os.makedirs(tmp, exist_ok=True)
TEMPO = 1.28
out = {}
for s in segs:
    parts = []
    for i, p in enumerate(s["parts"]):
        base = f"{tmp}/{s['id']}_{i}"
        if not os.path.exists(base + ".mp3"):
            gTTS(p, lang="id").save(base + ".mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", base + ".mp3", "-af",
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
                        "-ar", "24000", "-ac", "1", base + "_raw.wav"], check=True)
        # questions get a stronger rising arc; statements a gentle declination
        tilt = -1.0 if p.strip().endswith("?") else 1.6
        convert(base + "_raw.wav", base + "_v.wav", 116.0, 2.2, 0.85, tilt)
        wav = base + ".wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", base + "_v.wav", "-af",
                        f"atempo={TEMPO},highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3500:t=q:w=1.5:g=3,acompressor=threshold=-20dB:ratio=3:attack=5:release=80",
                        "-ar", "48000", "-ac", "1", wav], check=True)
        d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]))
        parts.append({"file": wav, "dur": round(d, 3)})
    out[s["id"]] = parts
json.dump(out, open(f"{tmp}/durations.json", "w"), indent=1)
tot = 0
for k, v in out.items():
    tot += sum(p["dur"] for p in v)
    print(k, [p["dur"] for p in v], round(sum(p["dur"] for p in v), 2))
print("total", round(tot, 1))
