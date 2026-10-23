"""Build printable A4 routine sheets from routines/<lang>/<name>.json into output/<lang>-<name>.html,
and web/data.js for the sheet maker in web/ (sheet CSS, skies, image keywords and edge colors).

    python3 tools/build.py

Each frame's background is the color of its image edge next to the frame, so rebuild after
replacing an image. Labels get the darkest shade of the step color needed for 4.5 : 1 contrast.
The sheet markup in sheet_html() is mirrored in web/app.js (sheetHtml); change both together.
"""
import json
import random
import statistics
from html import escape
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

SKIES = {
    "dawn": "#D6ECFF 0%, #FFF1C1 30%, #FFDDB0 55%, #FFF4D6 78%, #DDF3E4 100%",
    "afternoon": "#FFF6CC 0%, #FFE7B3 30%, #DDF3E4 65%, #CDEBFA 100%",
    # night: light blue behind the pictures (less ink, the last picture stands out), dark only under
    # the last picture, so the light footer text keeps its contrast
    "night": "#CFE3F7 0%, #A8C4EE 30%, #86A6E0 70%, #6F8FD3 86%, #22336B 93%, #1B2A5C 100%",
}

# The footer of every sheet: licence, address and a QR code (web/qr.svg, from tools/qr.py), so a
# sheet on a fridge leads to the sheet maker. It sits above the 14 mm home printers cannot print.
SITE = "stutek.github.io/child-routines"
LICENSE = {"sl": "CC0 · prosto za uporabo, spreminjanje in deljenje", "en": "CC0 · free to use, change and share"}
# the sheet travels without the maker (to grandparents), so the essential warning goes on the sheet itself
SAFETY = {"sl": "Pozor: otrok ne sme pogoltniti magnetka. Pisala naj bodo otroška in kemično varna.", "en": "Warning: a child must not swallow a magnet. Use children's chemically safe pens."}
# the EU pictogram for "not suitable for children under 36 months" (web/under3.json: source and licence), with the hazard above
UNDER3 = {"sl": "Ni primerno za otroke, mlajše od 3 let", "en": "Not suitable for children under 3 years"}
QR = (ROOT / "web" / "qr.svg").read_text(encoding="utf-8").strip()

# "sky" may also name a plain background: white, or none (transparent, prints no background)
PLAIN = {"white": "#FFFFFF", "none": "none"}

TOOLBAR = {
    "sl": ("Natisni", "Za tisk: A4, robovi »Brez«, merilo 100 %."),
    "en": ("Print", "To print: A4, margins “None”, scale 100%."),
}

MISSING_BG = "#FFFFFF"

# Sheet geometry in mm (A4). Rows under the title are all equal, so image centres are evenly spaced;
# a sheet with many steps gets smaller images to keep GAP between images on the same side.
GEOMETRY = {"page_h": 297, "margin": 5, "margin_bottom": 14, "title": 14, "footer": 14, "img": 58, "gap": 3}


def image_size(n):
    g = GEOMETRY
    row = (g["page_h"] - g["margin"] - g["margin_bottom"] - g["title"] - g["footer"]) / (2 * n + 2)
    return min(g["img"], int((4 * row - g["gap"]) * 2) / 2)
MIN_FRAME_LUMINANCE = 0.6  # WCAG relative luminance; keeps frames pastel


def edge_color(image_id, side):
    """Median of the image strip that fades into the frame (the inner 12 %, at the frame's height, as the CSS mask; image
    on the left -> right edge), without its darkest quarter (outlines, furniture, floor). The
    lighter half alone picked near-white paper specks and lost the background's hue."""
    im = Image.open(ROOT / "images" / f"{image_id}.jpg").convert("RGB")
    w, h = im.size
    x0, x1 = (int(w * 0.88), w) if side == "left" else (0, int(w * 0.12))
    px = sorted(im.crop((x0, int(h * 0.35), x1, int(h * 0.65))).get_flattened_data(),
                key=lambda p: 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2])
    light = px[len(px) // 4:]
    c = [statistics.median(p[k] for p in light) for k in range(3)]
    # an edge that is dark all over (furniture, floor) is mixed with white until it is pastel
    for share in [i / 20 for i in range(21)]:
        mixed = [round(v + (255 - v) * share) for v in c]
        if _luminance(mixed) >= MIN_FRAME_LUMINANCE:
            break
    return "#%02X%02X%02X" % tuple(mixed)


def _luminance(c):
    def k(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = map(k, c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _rgb(x):
    return [int(x[i:i + 2], 16) for i in (1, 3, 5)]


def label_color(step, background, minimum=4.5):
    """Dark shade of the step color with at least 4.5 : 1 contrast (WCAG 2.2, 1.4.3)."""
    dark, bg = _rgb("#1E1B4B"), _rgb(background)
    for share in (0.55, 0.45, 0.35, 0.25, 0.15, 0.0):
        c = [round(share * s + (1 - share) * d) for s, d in zip(_rgb(step), dark)]
        a, b = sorted([_luminance(c), _luminance(bg)], reverse=True)
        if (a + 0.05) / (b + 0.05) >= minimum:
            return "#%02X%02X%02X" % tuple(c)
    return "#1E1B4B"


FOOTER_BAND = (264, 286)   # mm from the top: no stars behind the footer text


def stars():
    rnd = random.Random(7)
    out = []
    while len(out) < 46:
        x, y = rnd.uniform(3, 207), rnd.uniform(110, 295)
        r, o = rnd.choice([0.35, 0.5, 0.7, 0.9]), rnd.uniform(0.45, 0.95)
        if not FOOTER_BAND[0] < y < FOOTER_BAND[1]:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" opacity="{o:.2f}"/>')
    return "".join(out)


def clock_text(time, lang):
    """As the browser's Intl formats it for the language: 24-hour without a leading zero (sl: 7:05,
    19:30), 12-hour with AM/PM for English (US). The sheet maker uses the reader's own locale."""
    h, m = map(int, time.split(":"))
    if lang != "en":
        return f"{h}:{m:02d}"
    return f"{(h % 12) or 12}:{m:02d} {'AM' if h < 12 else 'PM'}"


def sheet_html(sheet, lang="sl"):
    n = len(sheet["steps"])
    rows = []
    for i, step in enumerate(sheet["steps"], 1):
        side = "left" if i % 2 else "right"
        image = step.get("image")
        bg = edge_color(image, side) if image else MISSING_BG
        style = f"--step: {step['color']}; --bg: {bg}; --ink: {label_color(step['color'], bg)};"
        picture = (f'<img src="../images/{escape(image)}.jpg" alt="{escape(step["label"].capitalize())}" />'
                   if image else '<div class="rt-missing">?</div>')
        time = step.get("time")
        clock = ("" if sheet.get("times") is False else  # a sheet without time fields
                 f'<div class="rt-time">{escape(clock_text(time, lang))}</div>' if time else
                 '<div class="rt-time"><span class="blank"></span>:<span class="blank"></span></div>')
        rows.append(f"""
      <div class="rt-pic pic-{side}" style="{style} grid-row: {2 * i} / span 4;">
        {picture}
        <div class="rt-num">{i}</div>
      </div>
      <div class="rt-card card-{side}" style="{style} grid-row: {2 * i + 1} / span 2;">
        <div class="rt-text">
          <div class="rt-label">{escape(step['label'])}</div>
          {clock}
        </div>
        <div class="rt-check"></div>
      </div>""")
    plain = PLAIN.get(sheet["sky"])
    background = plain or f'linear-gradient(180deg, {SKIES.get(sheet["sky"], sheet["sky"])})'
    starry = (f'\n    <svg class="rt-sky" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">'
              f'<g fill="#FFF8DC">{stars()}</g></svg>') if sheet.get("stars") and not plain else ""
    # half-rows: title, then 2n + 2 equal ones; image i spans 4 (from 2i), its frame the middle 2
    grid_rows = f"{GEOMETRY['title']}mm repeat({2 * n + 2}, minmax(0, 1fr))"
    img = image_size(n)
    size = f" --img: {img:g}mm;" if img < GEOMETRY["img"] else ""
    return f"""
  <div class="page-a4 rt-page" style="background: {background};{size}">{starry}
    <div class="rt-grid" style="grid-template-rows: {grid_rows};">
      <div class="rt-header"><div class="rt-title">{escape(sheet['title'])}</div></div>{''.join(rows)}
    </div>
    <div class="rt-footer{' on-dark' if sheet['sky'] == 'night' else ''}"><span class="rt-license"><img class="rt-under3" src="../web/under3.jpg" alt="{escape(UNDER3.get(lang, UNDER3["en"]))}"><span class="rt-legal"><span class="rt-safety">{escape(SAFETY.get(lang, SAFETY["en"]))}</span>{escape(LICENSE.get(lang, LICENSE["en"]))}</span></span><span class="rt-site">{SITE}</span>{QR}</div>
  </div>
"""


CSS = """
    /* Baloo 2 (SIL OFL, web/fonts/OFL-Baloo2.txt) from this site, not Google: no visitor data leaves the page and it works offline */
    @font-face { font-family: 'Baloo 2'; font-style: normal; font-weight: 400 800; font-display: swap; src: url('../web/fonts/baloo2-latin-ext.woff2') format('woff2'); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF; }
    @font-face { font-family: 'Baloo 2'; font-style: normal; font-weight: 400 800; font-display: swap; src: url('../web/fonts/baloo2-latin.woff2') format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* Sheet geometry, all from the paper size (A4). US Letter later: change --page-w and --page-h
       (and @page size). The frame takes the width the two images leave. */
    :root {
      --page-w: 210mm; --page-h: 297mm; --margin: 5mm; --margin-bottom: 14mm;
      --img: __IMG__mm; --label: 13pt;
      --frame-w: calc(var(--page-w) - 2 * var(--margin) - 2 * var(--img));
    }

    body {
      /* plain warm paper, like the paper of the pictures; colour stays on the sheets (screen only; print has no body background) */
      background: #F6F1E7;
      font-family: 'Baloo 2', -apple-system, 'Segoe UI', Roboto, Ubuntu, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      gap: 32px;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }

    .no-print-toolbar {
      background: white;
      padding: 16px 24px;
      border-radius: 16px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 20px;
      max-width: 840px;
      width: 100%;
      justify-content: space-between;
    }
    .no-print-toolbar h2 { font-size: 18px; margin-bottom: 3px; }
    .toolbar-info { font-size: 14px; color: #475569; line-height: 1.4; }
    .btn-print {
      background: #0F766E;   /* the colour of web/icon.svg, like the sheet maker */
      color: white;
      border: none;
      padding: 12px 24px;
      font: inherit;
      font-size: 16px;
      font-weight: 700;
      border-radius: 12px;
      cursor: pointer;
    }
    .btn-print:hover { background: #115E59; }

    /* A4 sheet; the sky background prints because of print-color-adjust: exact. Margins stay inside
       the area home printers can print (Epson: 3 mm top and sides, 14 mm bottom). */
    .page-a4 {
      position: relative;
      width: var(--page-w);
      height: var(--page-h);
      padding: var(--margin) var(--margin) var(--margin-bottom);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      break-after: page;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .rt-sky { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

    /* Images alternate left and right, each spanning four half-rows, with the label frame beside it.
       Image + frame + image = sheet width without margins (200 mm on A4), because a frame reaches into
       the height of the opposite image. */
    .rt-grid {
      position: relative;
      flex-grow: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: var(--img) 1fr var(--img);
    }

    .rt-header { grid-column: 1 / -1; grid-row: 1; align-self: center; text-align: center; }

    /* Footer: licence left, address and QR right; only the QR has a white ground (it needs it to scan),
       the text turns light on the night sky */
    .rt-footer {
      position: relative; flex: none; height: __FOOTER__mm; margin-top: 1mm;
      display: flex; align-items: flex-end; gap: 2mm; padding: 0 1mm 0.5mm;   /* texts sit on the bottom line of the QR code */
      font-size: 8.5pt; font-weight: 600; color: #475569;
    }
    .rt-license { margin-right: auto; display: flex; align-items: flex-end; gap: 2mm; }
    .rt-legal { display: flex; flex-direction: column; gap: 0.6mm; }
    .rt-safety { font-weight: 800; }
    .rt-under3 { width: 10mm; height: 10mm; flex: none; background: #ffffff; border-radius: 1mm; padding: 0.5mm; }
    .rt-site { font-weight: 800; color: #115E59; }
    .rt-footer.on-dark, .rt-footer.on-dark .rt-site { color: #EEF4FF; }
    /* 13 mm with 1.3 mm white around (with the code's own 1-module border, about the 4-module quiet zone) */
    .rt-footer svg { width: 13mm; height: 13mm; flex: none; background: #ffffff; border-radius: 1mm; padding: 1.3mm; }
    .rt-title {
      display: inline-block;
      font-size: 21pt;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: 1px;
      color: #115E59;
      background: rgba(255, 255, 255, 0.85);
      border: 2.5px solid #115E59;
      border-radius: 30px;
      padding: 1mm 7mm 0.2mm;
    }

    .rt-pic {
      position: relative;
      align-self: center;
      justify-self: center;
      width: var(--img);
      height: var(--img);
      border-radius: 7mm;   /* badge radius 5 + gap 1 + border 0.9: concentric with the badge */
      border: 0.9mm solid var(--step);
      background: var(--bg);
      box-shadow: 0 1mm 0 rgba(42, 46, 110, 0.22);
      overflow: hidden;
    }
    .rt-pic img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .rt-missing {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40pt;
      font-weight: 800;
      color: color-mix(in srgb, var(--step) 35%, #ffffff);
      border: 1mm dashed color-mix(in srgb, var(--step) 35%, #ffffff);
      border-radius: 6mm;
    }
    .pic-left { grid-column: 1; }
    .pic-right { grid-column: 3; }

    /* The inner image edge fades into the frame background (--bg), only where the frame (18 mm) joins
       it; the corners above and below stay sharp. The second layer keeps the image whole outside that
       band (mask layers add up). The fade ends at 97 %, not 100 %: at 100 % the last pixels keep a
       trace of the dark image grain next to the flat frame (a thin line). */
    .pic-left img, .pic-right img {
      --band: linear-gradient(to bottom, #000 calc(50% - 13mm), transparent calc(50% - 7mm),
                              transparent calc(50% + 7mm), #000 calc(50% + 13mm));
    }
    .pic-left img {
      -webkit-mask-image: linear-gradient(to right, #000 88%, transparent 97%), var(--band);
      mask-image: linear-gradient(to right, #000 88%, transparent 97%), var(--band);
    }
    .pic-right img {
      -webkit-mask-image: linear-gradient(to left, #000 88%, transparent 97%), var(--band);
      mask-image: linear-gradient(to left, #000 88%, transparent 97%), var(--band);
    }

    .rt-card {
      position: relative;
      z-index: 2;
      grid-column: 2;
      align-self: center;
      width: var(--frame-w);
      height: 18mm;
      display: flex;
      align-items: center;
      gap: 1.5mm;
      filter: drop-shadow(0 1mm 0 rgba(42, 46, 110, 0.22));
    }

    /* Frame, circle and image share one outline: both outlines in the step color at the bottom (0),
       both fills in the background color on top, inset by the border width (1), text on top (2).
       The border stays even where circle and frame meet. The frame covers the image border at
       the seam, so it has no border on that side; its fill reaches 0.3 mm past the seam, or the
       anti-aliased edge lets the outline below show as a thin grey line. */
    .rt-card::before, .rt-card::after { content: ""; position: absolute; border-radius: inherit; }
    .rt-card::before { inset: 0; z-index: 0; background: var(--step); }
    .rt-card::after { inset: 0.9mm; z-index: 1; background: var(--bg); border-radius: 0; }
    .card-left { justify-self: start; margin-left: -0.9mm; border-radius: 0 6mm 6mm 0; flex-direction: row-reverse; padding: 0 2.4mm 0 0; }
    .card-left::after { left: -0.3mm; border-radius: 0 5.1mm 5.1mm 0; }
    .card-right { justify-self: end; margin-right: -0.9mm; border-radius: 6mm 0 0 6mm; padding: 0 0 0 2.4mm; }
    .card-right::after { right: -0.3mm; border-radius: 5.1mm 0 0 5.1mm; }

    .rt-text { position: relative; z-index: 2; flex-grow: 1; display: flex; flex-direction: column; align-items: center; gap: 0.8mm; }

    /* Step number as a sticker in the outer top corner of the image */
    .rt-num {
      position: absolute;
      top: 1.1mm;
      width: 10mm;
      height: 10mm;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--step) 65%, #ffffff), var(--step) 70%);
      border: 0.6mm solid #ffffff;
      box-shadow: 0 0.8mm 0 rgba(42, 46, 110, 0.28);
      color: #ffffff;
      font-size: 15pt;
      font-weight: 800;
      line-height: 1;
      text-shadow: 0 0.3mm 0 rgba(0, 0, 0, 0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 0.6mm;
    }
    /* Concentric with the image corner (nested-radius rule): badge centre = corner centre, 7 mm from
       the outer edges; 1.1 mm from the padding box = 7 - 5 (badge radius) - 0.9 (border). */
    .pic-left .rt-num { left: 1.1mm; }
    .pic-right .rt-num { right: 1.1mm; }

    .rt-label {
      white-space: nowrap;
      font-size: var(--label);
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0.3px;
      color: var(--ink);
      padding-top: 0.8mm;
    }

    .rt-time { display: flex; align-items: flex-end; gap: 1.2mm; font-size: 15pt; font-weight: 800; line-height: 1; color: var(--ink); }
    .rt-time .blank { display: inline-block; width: 12mm; height: 6.5mm; border-bottom: 0.6mm solid var(--ink); }

    /* Magnet spot: a circle larger than the frame (like the image), merged with it */
    .rt-check { position: relative; width: 35mm; height: 35mm; min-width: 35mm; }
    .rt-check::before, .rt-check::after { content: ""; position: absolute; border-radius: 50%; }
    .rt-check::before { inset: 0; z-index: 0; background: var(--step); }
    .rt-check::after { inset: 0.9mm; z-index: 1; background: var(--bg); }

    @media print {
      body { background: transparent; padding: 0; gap: 0; }
      .no-print-toolbar { display: none !important; }
      .page-a4 { box-shadow: none; margin: 0; }
      @page { size: A4 portrait; margin: 0; }
    }
"""


CSS = CSS.replace("__IMG__", str(GEOMETRY["img"])).replace("__FOOTER__", str(GEOMETRY["footer"] - 1))


def page_html(routine):
    lang = routine["language"]
    button, hint = TOOLBAR.get(lang, TOOLBAR["en"])
    return f"""<!DOCTYPE html>
<html lang="{escape(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{escape(routine['title'])}</title>
  <link rel="icon" href="../web/icon.svg" type="image/svg+xml">
  <!-- Generated by tools/build.py from routines/; do not edit by hand -->
  <style>{CSS}  </style>
</head>
<body>

  <div class="no-print-toolbar">
    <div>
      <h2><img src="../web/icon.svg" alt="" style="width: 1.2em; height: 1.2em; vertical-align: -0.25em; margin-right: 6px">{escape(routine['title'])}</h2>
      <p class="toolbar-info">{escape(hint)}</p>
    </div>
    <button class="btn-print" onclick="window.print()">{button}</button>
  </div>
{''.join(sheet_html(s, lang) for s in routine['sheets'])}
</body>
</html>
"""


def web_data(routines):
    """web/data.js: everything the browser sheet maker needs, from the same sources as the sheets.
    Edge colors sit one image per line, so CI can ignore them like the style lines in output/."""
    images, edges = {}, []
    for path in sorted((ROOT / "images").glob("*.json")):
        meta = json.loads(path.read_text(encoding="utf-8"))
        images[meta["id"]] = {"title": meta["title"], "label": meta.get("label", {}), "keywords": meta.get("keywords", {})}
        edges.append(f'  "{meta["id"]}": ["{edge_color(meta["id"], "left")}", "{edge_color(meta["id"], "right")}"],')
    data = {"css": CSS, "skies": SKIES, "plain": PLAIN, "missingBg": MISSING_BG, "geometry": GEOMETRY, "site": SITE, "license": LICENSE, "safety": SAFETY, "under3": UNDER3, "qr": QR,
            "images": images, "examples": routines}
    return ("// Generated by tools/build.py; do not edit by hand.\n"
            f"window.SHEET_DATA = {json.dumps(data, ensure_ascii=False, indent=1)};\n"
            "window.SHEET_EDGES = {\n" + "\n".join(edges) + "\n};\n")


def gallery(routines):
    """images/README.md: every image with its title, keywords and the routine steps that use it.
    GitHub shows it under the file list of images/; VS Code in the Markdown preview."""
    used = {}
    for name, routine in routines.items():
        for sheet in routine["sheets"]:
            for i, step in enumerate(sheet["steps"], 1):
                if step.get("image"):
                    used.setdefault(step["image"], []).append(f"{name}: {sheet['title']} {i}")
    rows = []
    for path in sorted((ROOT / "images").glob("*.json")):
        meta = json.loads(path.read_text(encoding="utf-8"))
        id_ = meta["id"]
        words = "<br>".join(f"{lang}: {', '.join(ws)}" for lang, ws in meta.get("keywords", {}).items())
        rows.append(f'| <img src="{id_}.jpg" width="120" alt="{escape(meta["title"])}"> | `{id_}` | {meta["title"]} | {words} | '
                    f'{"<br>".join(used.get(id_, [])) or "—"} |')
    return ("# Images\n\n"
            "Generated by `tools/build.py` from `images/<id>.json`; do not edit by hand. "
            "To add an image, see [CONTRIBUTING.md](../CONTRIBUTING.md#add-an-image).\n\n"
            "| Picture | Id | Title | Keywords | Used in |\n| --- | --- | --- | --- | --- |\n" + "\n".join(rows) + "\n")


def main():
    built, routines = [], {}
    for path in sorted((ROOT / "routines").glob("*/*.json")):
        routine = json.loads(path.read_text(encoding="utf-8"))
        routines[f"{path.parent.name}-{path.stem}"] = routine
        out = ROOT / "output" / f"{path.parent.name}-{path.stem}.html"
        out.write_text(page_html(routine), encoding="utf-8")
        built.append(out.relative_to(ROOT))
    out = ROOT / "web" / "data.js"
    out.parent.mkdir(exist_ok=True)
    out.write_text(web_data(routines), encoding="utf-8")
    built.append(out.relative_to(ROOT))
    out = ROOT / "images" / "README.md"
    out.write_text(gallery(routines), encoding="utf-8")
    built.append(out.relative_to(ROOT))
    print("Built:", ", ".join(map(str, built)))


if __name__ == "__main__":
    main()
