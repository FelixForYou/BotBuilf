"""Pisahkan stiker Felixiority dari latar ungu polos menjadi PNG transparan.

Hanya membuang piksel ungu latar yang tersambung ke tepi gambar, sehingga ungu
di dalam stiker (wordmark, outline) tetap utuh. Juga mengekspor dua layer
(karakter & wordmark) untuk animasi layer-separation.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.int16)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
# Latar & halo: biru tinggi, hijau rendah, merah sedang.
bg_like = (b > 190) & (g < 120) & (r < 175) & (r > 60)
h, w = bg_like.shape
mask = np.zeros_like(bg_like)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if bg_like[y, x] and not mask[y, x]:
            mask[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if bg_like[y, x] and not mask[y, x]:
            mask[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and bg_like[ny, nx] and not mask[ny, nx]:
            mask[ny, nx] = True; q.append((ny, nx))

alpha = Image.fromarray(np.where(mask, 0, 255).astype(np.uint8))
alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
rgba = im.copy(); rgba.putalpha(alpha)
bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
full = rgba.crop(bbox)
full.save(f"{outdir}/felixiority-sticker.png", optimize=True)
print("bbox", bbox, full.size)

# ------------------------------------------------------------ layer separation
# Wordmark = plat tulisan (ungu, putih, kuning) yang tersambung dari bawah,
# dibatasi batas atas per-kolom agar tidak merambat ke border stiker di sekitar
# tangan dan segitiga aksen.
rgb = np.asarray(full.convert("RGB")).astype(np.int16)
al = np.asarray(full.getchannel("A"))
R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
purple = (B > R + 15) & (B > G + 25)
whiteish = (R > 205) & (G > 205) & (B > 205)
yellow = (R > 200) & (G > 140) & (B < 110)
H, W = al.shape
yy = np.arange(H)[:, None].repeat(W, 1)
xx = np.arange(W)[None, :].repeat(H, 0)
top = np.where(xx < 420, 968, np.where(xx < 1100, 975, 1005))
cand = (purple | whiteish | yellow) & (al > 20) & (yy >= top)
wm = np.zeros_like(cand)
q = deque()
for x in range(W):
    for y in range(1150, H):
        if cand[y, x]:
            wm[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and cand[ny, nx] and not wm[ny, nx]:
            wm[ny, nx] = True; q.append((ny, nx))
wm[yy >= 1150] |= al[yy >= 1150] > 0
wm_img = Image.fromarray((wm * 255).astype(np.uint8))
# tutup lubang kecil (outline gelap antar huruf) lalu haluskan tepi
wm_img = wm_img.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
wm_alpha = (np.asarray(wm_img).astype(np.float32) / 255) * (al.astype(np.float32) / 255)
word = full.copy(); word.putalpha(Image.fromarray((wm_alpha * 255).astype(np.uint8)))
word.save(f"{outdir}/felixiority-wordmark.png", optimize=True)

# Di area bawah, gigit karakter sedikit lebih lebar agar sisa sparkle/outline
# tulisan tidak tertinggal saat layer dipisah.
wm_wide = np.asarray(wm_img.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
wm_soft = np.asarray(wm_img).astype(np.float32) / 255
cut = np.where(yy > 1000, np.maximum(wm_soft, wm_wide), wm_soft)
char_alpha = (al.astype(np.float32) / 255) * (1 - cut)
char_alpha[yy > 1120] = 0
char = full.copy(); char.putalpha(Image.fromarray((np.clip(char_alpha, 0, 1) * 255).astype(np.uint8)))
char.save(f"{outdir}/felixiority-character.png", optimize=True)
print("layers ok", full.size)
