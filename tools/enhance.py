"""Raise the contrast of a generated image once (image models tend to produce pale images).

    python3 tools/enhance.py <input.jpg> <output.jpg>

Writes a 1024 x 1024 JPEG. Run it once per image: applying it twice overdoes the colors.
Check the copyright of the raw and of the enhanced image (.agents/skills/copyright-check/).
"""
import sys

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def enhance(src, dst):
    im = Image.open(src).convert("RGB")
    if im.size != (1024, 1024):
        side = min(im.size)
        left, top = (im.width - side) // 2, (im.height - side) // 2
        im = im.crop((left, top, left + side, top + side)).resize((1024, 1024), Image.LANCZOS)
    im = ImageOps.autocontrast(im, cutoff=(0.5, 0.3))
    im = ImageEnhance.Contrast(im).enhance(1.1)
    im = ImageEnhance.Color(im).enhance(1.12)
    im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=50, threshold=3))
    im.save(dst, "JPEG", quality=92)


if __name__ == "__main__":
    enhance(sys.argv[1], sys.argv[2])
