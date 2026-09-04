# squares the project marks off into small tiles under assets/projects/ so the
# highlight cards in the readme can point at them directly.
#   python scripts/prep-project-logos.py
import os
from PIL import Image, ImageChops

SIZE = 96
SRC = {
    "cleanit": "logos/projects/cleanit.png",
    "frugal": "logos/projects/frugal.png",
    "noteify": "logos/projects/noteify.png",
    "sapbert": "logos/projects/sapbert.jpg",
}

def trim(im):
    im = im.convert("RGBA")
    a = im.getchannel("A")
    if a.getextrema()[0] < 250:
        box = a.getbbox()
    else:
        rgb = im.convert("RGB")
        bg = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
        box = ImageChops.difference(rgb, bg).convert("L").point(lambda p: 255 if p > 12 else 0).getbbox()
    return im.crop(box) if box else im

os.makedirs("assets/projects", exist_ok=True)
for name, path in SRC.items():
    im = trim(Image.open(path))
    scale = min(SIZE / im.width, SIZE / im.height)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    # centre it on a transparent square so every card lines up
    tile = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    tile.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2), im)
    out = f"assets/projects/{name}.png"
    tile.save(out, "PNG", optimize=True)
    print(f"{out}  {os.path.getsize(out)//1024}kb")
