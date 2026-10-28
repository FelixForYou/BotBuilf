# Gabungkan PNG QA menjadi satu contact sheet berlabel.
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
files = sorted(glob.glob(os.path.join(d, "f*.png")))
ims = [Image.open(f).convert("RGB") for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w + (cols - 1) * 6, rows * h + (rows - 1) * 6), (255, 0, 80))
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * (w + 6), (i // cols) * (h + 6)
    sheet.paste(im, (x, y))
    ImageDraw.Draw(sheet).text((x + 8, y + 6), os.path.basename(f), fill=(255, 0, 80))
sheet.save(out)
