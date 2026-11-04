"""Align the narration script to a NEW recording using word timestamps from a transcriber.

Input : scripts/narration.json (script text), a JSON of transcribed words per segment
        {"s01": [{"w": "...", "t": start, "e": end}, ...], ...}
Output: public/audio/vo/<id>.words.json in the same format the TTS step produced
        ([{"t", "d", "w"}] using the *spoken* tokens of the script), so
        build_timeline.py and every scene cue() keep working unchanged.

Usage: python3 scripts/align_words.py transcribed_words.json
Tokens the transcriber misheard are matched fuzzily; tokens it skipped
(e.g. spelled-out acronyms) get times interpolated between matched neighbours.
"""
import difflib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "scripts", "gen_tts.py")).read()
SPOKEN = eval(re.search(r"SPOKEN = (\[.*?\])\n", src, re.S).group(1))


def spoken(t):
    for a, b in SPOKEN:
        t = re.sub(a, b, t)
    return t


norm = lambda s: re.sub(r"[^0-9a-z]", "", s.lower())


def align(expected, heard):
    """Needleman-Wunsch over tokens with fuzzy similarity; returns index of heard word per expected token (or None)."""
    n, m = len(expected), len(heard)
    E = [norm(x) for x in expected]
    H = [norm(x["w"]) for x in heard]
    sim = lambda a, b: difflib.SequenceMatcher(None, a, b).ratio() if a and b else 0.0
    GAP = -0.4
    score = [[0.0] * (m + 1) for _ in range(n + 1)]
    back = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        score[i][0], back[i][0] = score[i - 1][0] + GAP, 1
    for j in range(1, m + 1):
        score[0][j], back[0][j] = score[0][j - 1] + GAP, 2
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = sim(E[i - 1], H[j - 1])
            opts = [(score[i - 1][j - 1] + (s * 2 - 0.8), 0), (score[i - 1][j] + GAP, 1), (score[i][j - 1] + GAP, 2)]
            score[i][j], back[i][j] = max(opts)
    res, i, j = [None] * n, n, m
    while i > 0 or j > 0:
        b = back[i][j] if i > 0 and j > 0 else (1 if i > 0 else 2)
        if b == 0:
            if sim(E[i - 1], H[j - 1]) >= 0.5:
                res[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif b == 1:
            i -= 1
        else:
            j -= 1
    return res


def main(path):
    heard_all = json.load(open(path))
    segs = json.load(open(os.path.join(ROOT, "scripts", "narration.json")))
    for s in segs:
        heard = heard_all[s["id"]]
        expected = re.findall(r"[\w\-]+", spoken(s["text"]))
        idx = align(expected, heard)
        times = [(heard[k]["t"], heard[k]["e"]) if k is not None else None for k in idx]
        # interpolate gaps between matched anchors
        n = len(times)
        i = 0
        while i < n:
            if times[i] is None:
                j = i
                while j < n and times[j] is None:
                    j += 1
                a = times[i - 1][1] if i > 0 else (heard[0]["t"] if heard else 0.0)
                b = times[j][0] if j < n else (heard[-1]["e"] if heard else a + 0.3 * (j - i))
                step = max(0.05, (b - a) / (j - i))
                for k in range(i, j):
                    times[k] = (a + step * (k - i), a + step * (k - i + 1))
                i = j
            else:
                i += 1
        matched = sum(1 for k in idx if k is not None)
        words = [{"t": round(t0, 3), "d": round(max(0.02, t1 - t0), 3), "w": w} for w, (t0, t1) in zip(expected, times)]
        json.dump(words, open(os.path.join(ROOT, "public", "audio", "vo", s["id"] + ".words.json"), "w"), ensure_ascii=False)
        print(f"{s['id']}: {matched}/{len(expected)} kata cocok ({100 * matched / len(expected):.0f}%)")


if __name__ == "__main__":
    main(sys.argv[1])
