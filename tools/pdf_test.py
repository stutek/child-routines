"""Pictures stay sharp in print: each sheet in output/ is printed to PDF with headless Chrome, and every image
in the PDF must be a JPEG at the pixel size of one of the files the sheet embeds (1024 px pictures, the 0–3 sign).

    python3 tools/pdf_test.py [sheet.html ...]   # default: output/*.html

A CSS filter (e.g. drop-shadow) or a 3D transform makes Chrome rasterise a picture: it then lands in the PDF
as a new image at another size, scaled down and grainy, and this test fails. Needs google-chrome, pdfimages
(poppler-utils) and Pillow. Exit code 0 when every sheet passes, 1 otherwise.
"""
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TMP = ROOT / ".private" / "tmp" / f"pdf_test-{os.getpid()}"   # own folder per run, ignored by git; removed at the end


def embedded_sizes(html_file):
    """Pixel sizes of the raster images the sheet embeds, and how many such <img> it has (the SVG icon of the
    toolbar is not printed and not a raster)."""
    srcs = [s for s in re.findall(r'<img[^>]*\ssrc="([^"]+)"', html_file.read_text(encoding="utf-8"))
            if s.lower().endswith((".jpg", ".jpeg", ".png"))]
    sizes = set()
    for src in set(srcs):
        with Image.open((html_file.parent / src).resolve()) as im:
            sizes.add(im.size)
    return sizes, len(srcs)


def pdf_images(pdf):
    """(type, width, height, encoding) of every image pdfimages lists."""
    out = subprocess.run(["pdfimages", "-list", str(pdf)], capture_output=True, text=True, check=True).stdout
    return [(c[2], int(c[3]), int(c[4]), c[8]) for c in (line.split() for line in out.splitlines()[2:]) if len(c) > 8]


def check(html_file, pdf):
    subprocess.run(["google-chrome", "--headless=new", "--disable-gpu", "--no-sandbox", f"--user-data-dir={TMP / 'profile'}",
                    "--no-pdf-header-footer", f"--print-to-pdf={pdf}", html_file.resolve().as_uri()],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60, check=True)
    sizes, count = embedded_sizes(html_file)
    images = pdf_images(pdf)
    bad = sorted({f"{t} {w}x{h} {enc}" for t, w, h, enc in images if t != "image" or enc != "jpeg" or (w, h) not in sizes})
    errors = [f"rasterised or re-encoded image in the PDF: {b}" for b in bad]
    if len(images) < count:
        errors.append(f"{len(images)} images in the PDF for {count} <img> in the sheet")
    print(f"{html_file.name}: {count} <img>, {len(images)} images in the PDF, sizes {sorted(sizes)}, {len(errors)} errors")
    return errors


def main():
    files = [Path(a) for a in sys.argv[1:]] or sorted((ROOT / "output").glob("*.html"))
    TMP.mkdir(parents=True, exist_ok=True)
    errors = []
    try:
        for i, f in enumerate(files):
            errors += [f"{f.name}: {e}" for e in check(f, TMP / f"{i}.pdf")]
    finally:
        shutil.rmtree(TMP, ignore_errors=True)
    for e in errors:
        print("ERROR", e)
    print(f"{len(errors)} errors")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
