"""Write docs/preview.jpg for the README: the example sheets side by side, as they print on A4.

    python3 tools/preview.py

Run after tools/build.py when images or the layout change. Needs google-chrome (headless) and
pdftoppm (poppler-utils); CI does not run it.
"""
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SHEETS = ROOT / "output" / "sl-primer.html"   # the public example, following good habits
OUT = ROOT / "docs" / "preview.jpg"
GAP = 24


def main():
    with tempfile.TemporaryDirectory() as tmp:
        pdf = Path(tmp) / "sheets.pdf"
        subprocess.run(["google-chrome", "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        f"--print-to-pdf={pdf}", SHEETS.as_uri()], check=True, capture_output=True)
        subprocess.run(["pdftoppm", "-r", "60", "-png", str(pdf), str(Path(tmp) / "page")], check=True)
        pages = [Image.open(p).convert("RGB") for p in sorted(Path(tmp).glob("page-*.png"))]
        out = Image.new("RGB", (sum(p.width for p in pages) + GAP * (len(pages) - 1), max(p.height for p in pages)), "white")
        x = 0
        for p in pages:
            out.paste(p, (x, 0))
            x += p.width + GAP
        out.save(OUT, quality=85, optimize=True)
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(pages)} pages, {out.size[0]} x {out.size[1]}")


if __name__ == "__main__":
    main()
