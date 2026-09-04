# turns logos/*.{png,jpg} into a single monochrome silhouette per logo and writes
# them to scripts/logos.json, base64 encoded, for the carousel in build-plates.mjs.
# run by hand whenever a logo is added or replaced:
#   python scripts/prep-logos.py
#
# the silhouettes are black on transparent. that drops the white boxes the source
# files ship with, and lets one file serve both themes: the carousel shows them as
# is on a light readme and inverts them to white on a dark one.

import base64, io, json, os, glob
from PIL import Image, ImageChops

BOX_W, BOX_H = 138, 44   # largest a mark is allowed to draw at

# display order, left to right. keys are filename stems.
ORDER = [
    "royal_aviation_museum",
    "chi",
    "uofm",
    "canu",
    "Manitoba_Teachers_Society_logo",
    "CMCCF-SVlogo-circle_colour",
    "poolpros",
]
NAMES = {
    "royal_aviation_museum": "Royal Aviation Museum of Western Canada",
    "chi": "George and Fay Yee Centre for Healthcare Innovation",
    "uofm": "University of Manitoba",
    "canu": "CanU",
    "Manitoba_Teachers_Society_logo": "The Manitoba Teachers' Society",
    "CMCCF-SVlogo-circle_colour": "Coalition of Manitoba Cultural Communities for Families",
    "poolpros": "Pool Pros",
}


def trim(im):
    """drop the flat border most of these ship with, transparent or white."""
    im = im.convert("RGBA")
    alpha = im.getchannel("A")
    if alpha.getextrema()[0] < 250:
        box = alpha.getbbox()
    else:
        rgb = im.convert("RGB")
        bg = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
        box = ImageChops.difference(rgb, bg).convert("L").point(lambda p: 255 if p > 12 else 0).getbbox()
    return im.crop(box) if box else im


def silhouette(im):
    """ink coverage becomes alpha: the darker and more opaque a pixel was, the
    more of it survives. a mid grey logo and a black one end up the same weight."""
    im = im.convert("RGBA")
    lum = im.convert("L")
    src_alpha = im.getchannel("A")
    # invert luminance so white paper reads as empty and dark ink as solid,
    # then knock out anything the original had already made transparent
    ink = ImageChops.invert(lum)
    ink = ImageChops.multiply(ink, src_alpha)
    # most of these are line art on white, so lift the midtones or thin strokes
    # disappear once the mark is scaled down
    ink = ink.point(lambda p: min(255, int(p * 1.45)))
    out = Image.new("RGBA", im.size, (0, 0, 0, 255))
    out.putalpha(ink)
    return out


out = []
for stem in ORDER:
    hits = [h for h in glob.glob(f"logos/{stem}.*") if os.path.isfile(h)]
    if not hits:
        raise SystemExit(f"missing logo for {stem}")
    im = trim(Image.open(hits[0]))
    scale = min(BOX_W / im.width, BOX_H / im.height)
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    im = silhouette(im).resize((w * 2, h * 2), Image.LANCZOS)  # 2x for retina
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    out.append({
        "name": NAMES[stem],
        "w": w,
        "h": h,
        "data": "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode(),
    })
    print(f"{stem:34} {w}x{h}  {len(buf.getvalue())//1024}kb")

with open("scripts/logos.json", "w", encoding="utf-8") as f:
    json.dump(out, f)
print(f"\nwrote scripts/logos.json  ({os.path.getsize('scripts/logos.json')//1024}kb)")
