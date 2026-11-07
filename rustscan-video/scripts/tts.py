import json, subprocess, os
from gtts import gTTS
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
segs=json.load(open(f"{root}/scripts/narration.json"))
tmp=f"{root}/scripts/.tts"; os.makedirs(tmp,exist_ok=True)
out={}
for s in segs:
    parts=[]
    for i,p in enumerate(s["parts"]):
        mp3=f"{tmp}/{s['id']}_{i}.mp3"
        if not os.path.exists(mp3): gTTS(p,lang="id").save(mp3)
        wav=f"{tmp}/{s['id']}_{i}.wav"
        # speed up, trim silence at both ends, mono 48k
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",mp3,"-af",
          "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo=1.28,highpass=f=80,acompressor=threshold=-18dB:ratio=3",
          "-ar","48000","-ac","1",wav],check=True)
        d=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",wav]))
        parts.append({"file":wav,"dur":round(d,3)})
    out[s["id"]]=parts
json.dump(out,open(f"{tmp}/durations.json","w"),indent=1)
for k,v in out.items(): print(k,[p["dur"] for p in v], round(sum(p["dur"] for p in v),2))
