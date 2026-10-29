"""Build printable A4 routine sheets from routines/<lang>/<name>.json into output/<lang>-<name>.html,
and web/data.js for the sheet maker in web/ (sheet CSS, skies, image keywords and edge colors).

    python3 tools/build.py

Each frame's background is the color of its image edge next to the frame, so rebuild after
replacing an image. Labels get the darkest shade of the step color needed for 4.5 : 1 contrast.
The sheet markup in sheet_html() is mirrored in web/app.js (sheetHtml); change both together.
"""
import colorsys
import json
import random
import statistics
from html import escape
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = {m["id"]: m for m in (json.loads(p.read_text(encoding="utf-8")) for p in sorted((ROOT / "images").glob("*.json")))}

# picture themes a parent picks for a whole sheet, the default first: the teddy bear does the steps, or no
# character (the child's hands, the room); images/<id>.json "theme", a variant names its image in "variant_of"
THEMES = ("bear", "plain")


def themed(image, theme):
    """The picture of a step in the sheet's theme: the image's variant in that theme, else the image itself."""
    if not image or IMAGES[image].get("theme") == theme:
        return image
    return next((v for v, m in IMAGES.items() if m.get("variant_of") == image and m.get("theme") == theme), image)

SKIES = {
    "dawn": "#FFB45E 0%, #FFCF9A 12%, #FFE9A8 25%, #FFF1C1 38%, #FFEAC9 58%, #FFF4D6 78%, #DDF3E4 100%",
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
# a line in the footer only on a sheet that has such a step (by its picture), in step order
STEP_NOTES = {
    "care": {"sl": "Zdravila daje in hrani odrasel.", "en": "An adult gives and keeps medicine."},
    "bath": {"sl": "Otroka nikoli ne pusti samega v kadi.", "en": "Never leave a child alone in the bath."},
}
# no line for paper itself: a sheet is no small part (16 CFR 1501.3(b) exempts articles made of paper), and the
# 0–3 sign already keeps away the toddlers who tear and mouth paper; another line would dilute the magnet warning
SAFETY = {"sl": "Opozorilo: otrok ne sme pogoltniti magnetka ali drugih majhnih delov. Pisala naj bodo otroška in kemično varna.", "en": "Warning: a child must not swallow a magnet or other small parts. Use children's chemically safe pens."}
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

# Sheet geometry in mm (A4). The first picture sits at the top margin (the title is beside it, to its right) and the
# last `edge` above the footer; the step centres are evenly spaced in between. "img" is the largest picture, "gap" the
# clearance between objects, "title_h" the height the title pill is built for (21 pt, one line).
GEOMETRY = {"page_h": 297, "page_w": 210, "margin": 5, "margin_bottom": 14, "title_h": 11, "footer": 14, "img": 58,
            "gap": 3, "edge": 1.5, "frame_h": 18, "circle": 35, "footer_gap": 1, "wide_max": 98.5}


def floor_half(x):
    return int(x * 2) / 2


def layout(n):
    """Picture size, whether the frames are wide, and the step spacing for n steps (n >= 1).
    Narrow frames (width - 2 pictures, 84 mm at 58 mm): pictures on the same side keep `gap` (2p >= img + gap).
    Wide frames (from the own picture to the far edge): the frame of a step passes the opposite column, so the next
    picture must clear it (p >= img/2 + frame_h/2 + gap); a picture wider than half the free width minus the circle
    also has to clear the neighbour's circle (p >= img/2 + circle/2 + gap). The larger picture wins; at most two columns apart.
    The steps area reaches from the top margin to the footer: picture 1 starts at the top margin and the title sits to its right."""
    g = GEOMETRY
    w = g["page_w"] - 2 * g["margin"]
    # steps area: from the top margin to the footer; the footer's own gap above it counts as space for the last picture
    span = g["page_h"] - g["margin"] - g["margin_bottom"] - g["footer"] + g["footer_gap"] - g["edge"]
    top = floor_half((w - g["gap"]) / 2)   # pictures in the two columns keep `gap` between them
    if n == 1:
        narrow, wide = g["img"], top
    else:
        k = n - 1
        narrow = min(g["img"], floor_half((2 * span - g["gap"] * k) / (n + 1)))
        a = 2 * (span - (g["frame_h"] / 2 + g["gap"]) * k) / (n + 1)             # frame clearance
        c = 2 * (span - (g["circle"] / 2 + g["gap"]) * k) / (n + 1)              # circle clearance
        free = (w - g["circle"] - g["gap"]) / 2                                   # no horizontal overlap with the circle
        wide = min(top, floor_half(a if a <= free else max(free, min(a, c))))
    img = max(narrow, wide)
    p = (span - img) / (n - 1) if n > 1 else 0
    return img, wide > narrow, p


def centres(n):
    """Step centres in mm from the top of the steps area (the top margin)."""
    g = GEOMETRY
    img, wide, p = layout(n)
    if n == 1:
        return [(g["page_h"] - g["margin"] - g["margin_bottom"] - g["footer"] + g["footer_gap"]) / 2]
    return [round(img / 2 + k * p, 3) for k in range(n)]


def title_space(n):
    """Left edge and width of the title zone in mm (from the left edge of the steps area), right-aligned at the right
    edge. It starts `gap` right of picture 1. Step 1's magnet circle sits next to picture 1 and reaches up to
    img/2 - circle/2 from the top: if the title pill (title_h) does not fit above it with `gap` to spare, the zone
    starts `gap` right of the circle instead. The frame (top at img/2 - frame_h/2) and picture 2 are lower still."""
    g = GEOMETRY
    img = layout(n)[0]
    x = img + g["gap"]
    if img / 2 - g["circle"] / 2 - g["gap"] < g["title_h"]:
        x = img - 0.9 + g["circle"] + g["gap"]
    return x, g["page_w"] - 2 * g["margin"] - x


TITLE_EM = 0.7   # widest share of the font size per title character (Baloo 2 ExtraBold capitals, letter-spacing included), measured


def title_size(title, width):
    """Title font size in pt: 21 pt, smaller for a long title so that it fits `width` mm (pill padding 14 mm + border 1.8 mm)."""
    room = (width - 15.8) / 25.4 * 72
    return min(21.0, room / (TITLE_EM * max(len(title), 1)))


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
    # colours stay gender-neutral (AGENTS.md): a purple or pink hue (270°–355°) turns peach (25°)
    h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in c))
    if 270 / 360 <= h < 355 / 360:
        c = [v * 255 for v in colorsys.hls_to_rgb(25 / 360, l, s)]
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
    ys = centres(n)
    rows = []
    for i, step in enumerate(sheet["steps"], 1):
        side = "left" if i % 2 else "right"
        image = themed(step.get("image"), sheet.get("theme", THEMES[0]))
        bg = edge_color(image, side) if image else MISSING_BG
        style = f"--step: {step['color']}; --bg: {bg}; --ink: {label_color(step['color'], bg)};"
        picture = (f'<img src="../images/{escape(image)}.jpg" alt="{escape(step["label"].capitalize())}" />'
                   if image else '<div class="rt-missing">?</div>')
        time = step.get("time")
        clock = ("" if sheet.get("times") is False else  # a sheet without time fields
                 f'<div class="rt-time">{escape(clock_text(time, lang))}</div>' if time else
                 '<div class="rt-time"><span class="blank"></span>:<span class="blank"></span></div>')
        rows.append(f"""
      <div class="rt-pic pic-{side}" style="{style} --y: {ys[i - 1]:g}mm;">
        {picture}
        <div class="rt-num">{i}</div>
      </div>
      <div class="rt-card card-{side}" style="{style} --y: {ys[i - 1]:g}mm;">
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
    img, wide, _ = layout(n)
    tx, tw = title_space(n)
    notes = " ".join(STEP_NOTES[i][lang if lang in STEP_NOTES[i] else "en"] for i in dict.fromkeys(st.get("image") for st in sheet["steps"]) if i in STEP_NOTES)
    notes = f'<span class="rt-notes">{escape(notes)}</span>' if notes else ""
    size = f" --img: {img:g}mm; --title-x: {tx:g}mm; --title-size: {title_size(sheet['title'], tw):.2f}pt;"
    if wide:   # label and time grow with the picture (+30 % at the largest picture), every label still fits (AGENTS.md)
        k = 1 + 0.3 * (img - GEOMETRY["img"]) / (GEOMETRY["wide_max"] - GEOMETRY["img"])
        size += f" --label: {13 * k:.1f}pt; --time: {15 * k:.1f}pt;"
    return f"""
  <div class="page-a4 rt-page{' rt-wide' if wide else ''}" style="background: {background};{size}">{starry}
    <div class="rt-grid">
      <div class="rt-header"><div class="rt-title">{escape(sheet['title'])}</div></div>{''.join(rows)}
    </div>
    <div class="rt-footer{' on-dark' if sheet['sky'] == 'night' else ''}"><span class="rt-license"><img class="rt-under3" src="../web/under3.jpg" alt="{escape(UNDER3.get(lang, UNDER3["en"]))}"><span class="rt-legal"><span class="rt-safety">{escape(SAFETY.get(lang, SAFETY["en"]))}</span>{notes}</span></span><span class="rt-source"><span class="rt-site">{SITE}</span><span class="rt-lic">{escape(LICENSE.get(lang, LICENSE["en"]))}</span></span>{QR}</div>
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
    /* few steps: the frame reaches from its picture to the far edge, over the opposite column */
    .rt-wide { --frame-w: calc(var(--page-w) - 2 * var(--margin) - var(--img) + 0.9mm); }

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

    /* Images alternate left and right at evenly spaced centres (--y), with the label frame beside it.
       Narrow frames: image + frame + image = sheet width without margins (200 mm on A4), because a frame
       reaches into the height of the opposite image. Wide frames (.rt-wide): image + frame = 200 mm. */
    .rt-grid { position: relative; flex-grow: 1; min-height: 0; }

    /* the title sits beside picture 1, right-aligned; --title-x (generator) keeps it clear of picture 1 and the magnet circle */
    .rt-header { position: absolute; top: 0; left: var(--title-x, 0); right: 0; height: __TITLE__mm; display: flex; align-items: flex-start; justify-content: flex-end; }

    /* Footer: the warnings left, set tight and centred on the 0–3 sign they belong to; the address with the
       licence under it and the QR right. Only the QR has a white ground (it needs it to scan); the text turns
       light on the night sky */
    .rt-footer {
      position: relative; flex: none; height: __FOOTER__mm; margin-top: 1mm;
      display: flex; align-items: flex-end; gap: 2mm; padding: 0 1mm 0.5mm;   /* texts sit on the bottom line of the QR code */
      font-size: 9.5pt; font-weight: 600; color: #475569;   /* the largest size at which three warning lines stay within the QR's 13 mm */
    }
    .rt-license { margin-right: auto; display: flex; align-items: center; gap: 2mm; align-self: flex-end; }
    .rt-legal { display: flex; flex-direction: column; gap: 0; line-height: 1.15; }
    .rt-legal > span { text-wrap: balance; }   /* a wrapped warning breaks into even lines, no lone last word */
    .rt-source { display: flex; flex-direction: column; align-items: flex-end; text-align: right; line-height: 1.15; flex: none; }
    .rt-lic { font-size: 8.5pt; white-space: nowrap; }
    .rt-safety, .rt-notes { font-weight: 800; }
    .rt-notes { display: block; }
    .rt-under3 { width: 10mm; height: 10mm; flex: none; background: #ffffff; border-radius: 1mm; padding: 0.5mm; }
    .rt-site { font-weight: 800; color: #115E59; }
    .rt-footer.on-dark, .rt-footer.on-dark .rt-site { color: #EEF4FF; }
    /* 13 mm with 1.3 mm white around (with the code's own 1-module border, about the 4-module quiet zone) */
    .rt-footer svg { width: 13mm; height: 13mm; flex: none; background: #ffffff; border-radius: 1mm; padding: 1.3mm; }
    .rt-title {
      display: inline-block;
      font-size: var(--title-size, 21pt);
      font-weight: 800;
      line-height: 1.1;
      max-width: 100%;
      overflow-wrap: anywhere;
      text-align: center;
      letter-spacing: 1px;
      color: #115E59;
      background: rgba(255, 255, 255, 0.85);
      border: 2.5px solid #115E59;
      border-radius: 30px;
      padding: 1mm 7mm 0.2mm;
    }

    .rt-pic {
      position: absolute;
      top: calc(var(--y) - var(--img) / 2);
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
    .pic-left { left: 0; }
    .pic-right { right: 0; }

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
      position: absolute;
      top: calc(var(--y) - 9mm);
      z-index: 2;
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
    .card-left { left: calc(var(--img) - 0.9mm); border-radius: 0 6mm 6mm 0; flex-direction: row-reverse; padding: 0 2.4mm 0 0; }
    .card-left::after { left: -0.3mm; border-radius: 0 5.1mm 5.1mm 0; }
    .card-right { right: calc(var(--img) - 0.9mm); border-radius: 6mm 0 0 6mm; padding: 0 0 0 2.4mm; }
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

    .rt-time { display: flex; align-items: flex-end; gap: 1.2mm; font-size: var(--time, 15pt); font-weight: 800; line-height: 1; color: var(--ink); }
    .rt-time .blank { display: inline-block; width: 12mm; height: 6.5mm; border-bottom: 0.6mm solid var(--ink); }

    /* Magnet spot: a circle larger than the frame (like the image), merged with it */
    .rt-check { position: relative; width: 35mm; height: 35mm; min-width: 35mm; }
    .rt-check::before, .rt-check::after { content: ""; position: absolute; border-radius: 50%; }
    .rt-check::before { inset: 0; z-index: 0; background: var(--step); }
    /* a thin dashed ring inside, in a lighter mix of the step colour: an invitation to place the magnet */
    .rt-check::after { inset: 0.9mm; z-index: 1; background: var(--bg); outline: 0.4mm dashed color-mix(in srgb, var(--step) 60%, var(--bg)); outline-offset: -3.2mm; }

    @media print {
      body { background: transparent; padding: 0; gap: 0; }
      .no-print-toolbar { display: none !important; }
      .page-a4 { box-shadow: none; margin: 0; }
      @page { size: A4 portrait; margin: 0; }
    }
"""


CSS = CSS.replace("__IMG__", str(GEOMETRY["img"])).replace("__TITLE__", str(GEOMETRY["title_h"])).replace("__FOOTER__", str(GEOMETRY["footer"] - 1))


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
    for id_, meta in IMAGES.items():
        images[id_] = {"title": meta["title"], "label": meta.get("label", {}), "keywords": meta.get("keywords", {}),
                       **{k: meta[k] for k in ("theme", "variant_of") if k in meta}}
        edges.append(f'  "{id_}": ["{edge_color(id_, "left")}", "{edge_color(id_, "right")}"],')
    data = {"css": CSS, "skies": SKIES, "plain": PLAIN, "missingBg": MISSING_BG, "geometry": GEOMETRY, "site": SITE, "license": LICENSE, "safety": SAFETY, "stepNotes": STEP_NOTES, "under3": UNDER3, "qr": QR,
            "themes": THEMES, "images": images, "examples": routines}
    return ("// Generated by tools/build.py; do not edit by hand.\n"
            f"window.SHEET_DATA = {json.dumps(data, ensure_ascii=False, indent=1)};\n"
            "window.SHEET_EDGES = {\n" + "\n".join(edges) + "\n};\n")


def gallery(routines):
    """images/README.md: every image with its picture in each theme, title, keywords and the routine steps that
    use it. "—" marks a theme with no picture yet (the sheet then shows the other one); a picture without a theme
    shows in both. GitHub shows it under the file list of images/; VS Code in the Markdown preview."""
    used = {}
    for name, routine in routines.items():
        for sheet in routine["sheets"]:
            for i, step in enumerate(sheet["steps"], 1):
                if step.get("image"):
                    used.setdefault(step["image"], []).append(f"{name}: {sheet['title']} {i}")

    def cell(id_, theme):
        pic = themed(id_, theme)
        if IMAGES[pic].get("theme") not in (theme, None):
            return "—"
        return f'<img src="{pic}.jpg" width="120" alt="{escape(IMAGES[pic]["title"])}">'

    rows = []
    for id_, meta in IMAGES.items():
        if "variant_of" in meta:
            continue
        ids = "<br>".join(f"`{i}`" for i in dict.fromkeys(themed(id_, th) for th in THEMES))
        words = "<br>".join(f"{lang}: {', '.join(ws)}" for lang, ws in meta.get("keywords", {}).items())
        rows.append(f'| {" | ".join(cell(id_, th) for th in THEMES)} | {ids} | {meta["title"]} | {words} | '
                    f'{"<br>".join(used.get(id_, [])) or "—"} |')
    return ("# Images\n\n"
            "Generated by `tools/build.py` from `images/<id>.json`; do not edit by hand. "
            "To add an image, see [CONTRIBUTING.md](../CONTRIBUTING.md#add-an-image).\n\n"
            "| Teddy bear | No character | Id | Title | Keywords | Used in |\n| --- | --- | --- | --- | --- | --- |\n" + "\n".join(rows) + "\n")


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
