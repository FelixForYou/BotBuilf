"""Placeholder narration for the short (vertical) cut: same voice/settings as gen_tts.py.
Usage: python3 scripts/gen_tts_short.py   -> public/audio/vo_short/pX.mp3 + pX.words.json
(Replace with the recorded narration later: copy the WAVs, run align_words.py --short.)"""
import asyncio, json, os, re, ssl, sys
import edge_tts, edge_tts.communicate as c
CA = os.environ.get("TTS_CA_BUNDLE", "/root/.ccr/ca-bundle.crt")
if os.path.exists(CA):
    c._SSL_CTX = ssl.create_default_context(cafile=CA)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "scripts", "gen_tts.py")).read()
SPOKEN = eval(re.search(r"SPOKEN = (\[.*?\])\n", src, re.S).group(1))
def spoken(t):
    for a, b in SPOKEN: t = re.sub(a, b, t)
    return t
OUT = os.path.join(ROOT, "public", "audio", "vo_short")
async def main():
    os.makedirs(OUT, exist_ok=True)
    for s in json.load(open(os.path.join(ROOT, "short", "narration_short.json"))):
        comm = edge_tts.Communicate(spoken(s["text"]), "id-ID-ArdiNeural", rate="+8%", boundary="WordBoundary")
        words = []
        with open(os.path.join(OUT, s["id"] + ".mp3"), "wb") as f:
            async for ch in comm.stream():
                if ch["type"] == "audio": f.write(ch["data"])
                elif ch["type"] == "WordBoundary":
                    words.append({"t": round(ch["offset"] / 1e7, 3), "d": round(ch["duration"] / 1e7, 3), "w": ch["text"]})
        json.dump(words, open(os.path.join(OUT, s["id"] + ".words.json"), "w"), ensure_ascii=False)
        print("ok", s["id"])
asyncio.run(main())
