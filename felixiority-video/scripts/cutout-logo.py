"""Pisahkan logo Felixiority dari latar ungu menjadi PNG transparan + layer terpisah.

Latar ungu dideteksi via flood-fill dari tepi (warna dekat #8737FA), lalu
tepiannya dihaluskan. Hasil:
  public/brand/felixiority-cutout.png   (seluruh stiker, transparan)
  public/brand/felixiority-character.png (bagian karakter, atas)
  public/brand/felixiority-wordmark.png  (tulisan "Felixiority", bawah)
"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

src = sys.argv[1] if len(sys.argv) > 1 else "public/brand/felixiority-original.jpg"
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.int32)
h, w, _ = a.shape
bg = np.array([135, 54, 250])
dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
cand = dist < 70

mask = np.zeros((h, w), bool)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if cand[y, x] and not mask[y, x]:
            mask[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if cand[y, x] and not mask[y, x]:
            mask[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not mask[ny, nx]:
            mask[ny, nx] = True; q.append((ny, nx))

alpha = Image.fromarray(((~mask) * 255).astype(np.uint8))
alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
rgba = im.copy(); rgba.putalpha(alpha)
bbox = alpha.getbbox()
rgba = rgba.crop(bbox)
rgba.save("public/brand/felixiority-cutout.png")
print("cutout", rgba.size, "bbox", bbox)

# Split: wordmark starts around y≈1020 in original coords
split = 1035 - bbox[1]
W, H = rgba.size
char = rgba.crop((0, 0, W, split)); char.save("public/brand/felixiority-character.png")
word = rgba.crop((0, split, W, H)); word.save("public/brand/felixiority-wordmark.png")
print("char", char.size, "word", word.size, "split", split)
