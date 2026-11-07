"""Use the voice recordings (one file per scene) instead of TTS.

Each scene recording is cut into the narration parts at the silence between
words (word timestamps from Whisper, scripts/rec/words.json). Cuts sit in the
middle of the pause, so the recorded rhythm is kept exactly; the timeline then
plays the parts back-to-back (GAP = 0).
"""
import json, os, subprocess

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rec = f"{root}/scripts/rec"
tmp = f"{root}/scripts/.tts"
os.makedirs(tmp, exist_ok=True)
words = json.load(open(f"{rec}/words.json"))

# First word of every narration part (as transcribed), per scene recording.
ANCHORS = {
    "s1": ["Kali", "Kamannya", "Oke"],
    "s2": ["Kali", "Tepatnya", "Yang", "Dan"],
    "s3": ["Asal", "Dulu", "Terus,", "Sejak"],
    "s4": ["Nah,", "Pentes,", "Ngaudit", "nyari", "Forensik", "nemuin", "sampai"],
    "s5": ["Isinya", "and", "Wireshark", "Metasploit", "Burp", "sama"],
    "s6": ["Tampilannya", "kebanyakan", "Di", "Tujuannya"],
    "s7": ["Yang", "Tapi"],
    "s8": ["Jadi,", "Pakenya", "Understand"],
}


def dur(path):
    import soundfile as sf
    i = sf.info(path)
    return i.frames / i.samplerate


out = {}
for sid, anchors in ANCHORS.items():
    w = words[sid]
    # normalise the whole scene recording once, so every part has the same loudness
    src = f"{tmp}/{sid}_norm.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{rec}/{sid}.wav", "-af",
                    "highpass=f=60,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", src], check=True)
    total = dur(src)
    idx, k = [], 0
    for a in anchors:
        while w[k][0] != a:
            k += 1
        idx.append(k)
        k += 1
    cuts = [0.0]
    for i in idx[1:]:
        prev_end, start = w[i - 1][2], w[i][1]
        cuts.append(max(prev_end, (prev_end + start) / 2) if start - prev_end > 0.06 else start - 0.03)
    cuts.append(total)
    parts = []
    for j in range(len(anchors)):
        a, b = cuts[j], cuts[j + 1]
        wav = f"{tmp}/{sid}_{j}.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
                        "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav], check=True)
        parts.append({"file": wav, "dur": round(dur(wav), 3)})
    out[sid] = parts
    print(sid, [p["dur"] for p in parts], round(sum(p["dur"] for p in parts), 2))
json.dump(out, open(f"{tmp}/durations.json", "w"), indent=1)
print("total", round(sum(p["dur"] for v in out.values() for p in v), 1))
