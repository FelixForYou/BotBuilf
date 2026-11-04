"""Generate narration per segment with edge-tts (voice id-ID-ArdiNeural).
Usage: python3 scripts/gen_tts.py [segment_id ...]
Writes public/audio/vo/<id>.mp3 and <id>.words.json (word boundaries in seconds)."""
import asyncio, json, os, ssl, sys, re
import edge_tts, edge_tts.communicate as c
CA = os.environ.get("TTS_CA_BUNDLE", "/root/.ccr/ca-bundle.crt")
if os.path.exists(CA):
    c._SSL_CTX = ssl.create_default_context(cafile=CA)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio", "vo")
# spoken spellings (display text stays unchanged in subtitles)
SPOKEN = [(r"\bNode\.js\b", "Node J S"), (r"\bVPS\b", "V P S"), (r"\b2015\b", "dua ribu lima belas"),
          (r"\bRAM\b", "ram"), (r"\bCPU\b", "C P U")]
def spoken(t):
    for a, b in SPOKEN: t = re.sub(a, b, t)
    return t
async def gen(seg):
    comm = edge_tts.Communicate(spoken(seg["text"]), "id-ID-ArdiNeural", rate=seg.get("rate", "+0%"),
                                pitch=seg.get("pitch", "+0Hz"), boundary="WordBoundary")
    words = []
    with open(os.path.join(OUT, seg["id"] + ".mp3"), "wb") as f:
        async for ch in comm.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append({"t": round(ch["offset"] / 1e7, 3), "d": round(ch["duration"] / 1e7, 3), "w": ch["text"]})
    json.dump(words, open(os.path.join(OUT, seg["id"] + ".words.json"), "w"), ensure_ascii=False)
async def main():
    segs = json.load(open(os.path.join(ROOT, "scripts", "narration.json")))
    ids = sys.argv[1:]
    for s in segs:
        if not ids or s["id"] in ids:
            await gen(s); print("ok", s["id"])
asyncio.run(main())
