# squares the project marks off into small tiles under assets/projects/ so the
# highlight cards in the readme can point at them directly.
#   python scripts/prep-project-logos.py
import os
from PIL import Image, ImageChops, ImageDraw

SIZE = 96
INSET = 14   # padding between a mark and the edge of its tile
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

def rounded(im, r):
    """round the corners of an opaque tile so it matches the drawn marks."""
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=r, fill=255)
    im.putalpha(mask)
    return im


os.makedirs("assets/projects", exist_ok=True)
for name, path in SRC.items():
    im = trim(Image.open(path))
    box = SIZE - INSET * 2
    scale = min(box / im.width, box / im.height)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    # a mark that came on white needs to keep its white, or it disappears into a
    # dark readme. one that came with its own transparency is left alone.
    opaque = im.getchannel("A").getextrema()[0] > 250
    tile = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 255) if opaque else (0, 0, 0, 0))
    if opaque:
        tile = rounded(tile, 18)
    tile.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2), im)
    out = f"assets/projects/{name}.png"
    tile.save(out, "PNG", optimize=True)
    print(f"{out}  {os.path.getsize(out)//1024}kb")
