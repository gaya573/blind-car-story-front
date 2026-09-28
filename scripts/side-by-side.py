"""tmp/compare/<name>-publishing.png 과 -app.png 을 나란히 붙여 구간별 이미지로 자른다.
사용: python scripts/side-by-side.py <name> [slice_height=1400] [scale=0.5]
"""
import sys
from PIL import Image, ImageDraw

name = sys.argv[1]
slice_h = int(sys.argv[2]) if len(sys.argv) > 2 else 1400
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
a = Image.open(f"tmp/compare/{name}-publishing.png").convert("RGB")
b = Image.open(f"tmp/compare/{name}-app.png").convert("RGB")
h = max(a.height, b.height)
gap = 16
outs = []
for i, top in enumerate(range(0, h, slice_h)):
    canvas = Image.new("RGB", (a.width + b.width + gap, slice_h), (255, 0, 255))
    canvas.paste(a.crop((0, top, a.width, min(top + slice_h, a.height))) if top < a.height else Image.new("RGB", (a.width, 1), "white"), (0, 0))
    canvas.paste(b.crop((0, top, b.width, min(top + slice_h, b.height))) if top < b.height else Image.new("RGB", (b.width, 1), "white"), (a.width + gap, 0))
    d = ImageDraw.Draw(canvas)
    d.text((8, 4), f"PUBLISHING y={top}", fill=(255, 0, 0))
    d.text((a.width + gap + 8, 4), f"APP y={top}", fill=(255, 0, 0))
    canvas = canvas.resize((int(canvas.width * scale), int(canvas.height * scale)))
    path = f"tmp/compare/{name}-sbs-{i}.png"
    canvas.save(path)
    outs.append(path)
print("\n".join(outs))
