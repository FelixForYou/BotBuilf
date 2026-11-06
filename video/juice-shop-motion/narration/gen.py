# Generate Indonesian narration (gTTS) per scene, speed-up slightly, report durations.
import json, subprocess
from gtts import gTTS
for s in json.load(open("narration/script.json")):
    raw = f"narration/{s['id']}_raw.mp3"
    gTTS(s["text"], lang="id").save(raw)
    out = f"public/vo/{s['id']}.wav"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",raw,
        "-af","atempo=1.3,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5",
        "-ar","48000","-ac","1",out],check=True)
    d = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",out],capture_output=True,text=True).stdout.strip()
    print(s["id"], d)
