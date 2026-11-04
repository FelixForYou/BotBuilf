"""Lay narration segments on the 300 s timeline from the REAL recordings and
write src/data/timeline.json (absolute word times) + subtitles/pterodactyl-explainer.srt.
Usage: python3 scripts/build_timeline.py"""
import json, os, re, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "public", "audio", "vo")
FIRST_START = 1.5   # s, narration begins after the opening text has started moving
GAP = 2.1           # s of breathing room between segments (sized for the recorded narration)
TOTAL = 300.0
segs = json.load(open(os.path.join(ROOT, "scripts", "narration.json")))
import importlib.util
spec = importlib.util.spec_from_file_location("g", os.path.join(ROOT, "scripts", "gen_tts.py"))
src = open(os.path.join(ROOT, "scripts", "gen_tts.py")).read()
SPOKEN = eval(re.search(r"SPOKEN = (\[.*?\])\n", src, re.S).group(1))
def spoken(t):
    for a, b in SPOKEN: t = re.sub(a, b, t)
    return t
normal = lambda s: re.sub(r"[^0-9a-z]", "", s.lower())
out, cues, t0 = [], [], FIRST_START
for s in segs:
    words = json.load(open(os.path.join(VO, s["id"] + ".words.json")))
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(VO, s["id"] + ".mp3")]))
    speech_end = words[-1]["t"] + words[-1]["d"]
    aw = [{"w": w["w"], "t": round(t0 + w["t"], 3), "e": round(t0 + w["t"] + w["d"], 3)} for w in words]
    out.append({"id": s["id"], "start": round(t0, 3), "audioDur": round(dur, 3), "speechEnd": round(t0 + speech_end, 3), "words": aw})
    # subtitle chunks: sentences, long ones split at , : ;
    sentences = re.findall(r"[^.?!]+[.?!]", s["text"])
    chunks = []
    for sen in sentences:
        sen = sen.strip()
        if len(sen) <= 84: chunks.append(sen); continue
        parts = re.split(r"(?<=[,:;])\s+", sen); cur = ""
        for p in parts:
            if cur and len(cur) + len(p) > 84: chunks.append(cur); cur = p
            else: cur = (cur + " " + p).strip()
        if cur: chunks.append(cur)
    wi, acc = 0, 0
    flat = [normal(w["w"]) for w in aw]
    for ch in chunks:
        need = len(normal(spoken(ch))); got = 0; first = wi
        while wi < len(aw) and got < need:
            got += len(flat[wi]); wi += 1
        cues.append((aw[first]["t"], aw[wi - 1]["e"], ch))
    assert wi == len(aw), (s["id"], wi, len(aw))
    t0 = t0 + speech_end + GAP
last_end = out[-1]["speechEnd"]
assert last_end < TOTAL - 3, last_end
json.dump({"fps": 60, "total": TOTAL, "segments": out}, open(os.path.join(ROOT, "src", "data", "timeline.json"), "w"), ensure_ascii=False)
def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s_, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s_:02d},{ms:03d}"
def wrap(c):
    if len(c) <= 42: return c
    mid = len(c) // 2; sp = [i for i, ch in enumerate(c) if ch == " "]
    k = min(sp, key=lambda i: abs(i - mid)); return c[:k] + "\n" + c[k + 1:]
os.makedirs(os.path.join(ROOT, "subtitles"), exist_ok=True)
with open(os.path.join(ROOT, "subtitles", "pterodactyl-explainer.srt"), "w") as f:
    for i, (a, b, c) in enumerate(cues, 1):
        nxt = cues[i][0] if i < len(cues) else TOTAL
        b = min(max(b + 0.25, a + 1.2), nxt - 0.05)
        f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{wrap(c)}\n\n")
for o in out: print(o["id"], o["start"], o["speechEnd"])
print("cues", len(cues), "last speech end", last_end)
