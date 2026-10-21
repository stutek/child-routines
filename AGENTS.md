# Agent guide

**English** · [Slovenščina](AGENTS.sl.md)

Printable A4 routine sheets for young children (morning, dinner, bedtime). They hang on a fridge; the child follows the pictures and puts a magnet on each finished step's circle, adults read the order and the planned time. Public repository: no names or photos of real people.

## Files

| Path                              | Content                                                                  |
| --------------------------------- | ------------------------------------------------------------------------ |
| `routines/<lang>/<name>.json`     | A routine: sheets, each with title, sky, steps (label, image id, color). |
| `images/<id>.jpg` + `.json`       | 1024 × 1024 image and its metadata (model, prompt, edits, check).        |
| `output/<lang>-<name>.html`       | Generated sheets for printing. Never edit by hand.                       |
| `tools/build.py`                  | Generator: routines → output.                                            |
| `tools/check_images.py`           | Validation run in CI.                                                    |
| `tools/copyright_check.py`        | Copyright gate (Vision Web Detection).                                   |
| `tools/lens_check.py`             | Manual Google Lens check through a debugging Chrome.                     |
| `docs/PROMPTS.md`                 | Image style text, prompts and lessons.                                   |
| `.agents/skills/copyright-check/` | How to check images before adding or merging them.                       |
| `docs/copyright-investigations/`  | One write-up per image match that needed a closer look.                  |

## Commands

```bash
pip install -r requirements.txt
python3 tools/check_images.py   # must print 0 errors
python3 tools/build.py          # rebuild output/ after any change to routines or images
```

Check a change visually: print the output file to PDF with headless Chrome and look at it (`google-chrome --headless=new --print-to-pdf=out.pdf file://$PWD/output/<file>.html`).

## Layout and its limits

- A step is one object: square image (54 mm) and a frame (92 × 18 mm) with the label and a time field (`__ : __`), plus a 35 mm circle for the magnet. Image, frame and circle share one outline and background; the frame background is the edge color of the image (lighter half of the edge strip, lifted to a pastel if dark), measured by the generator.
- Images alternate left and right. Width is the binding limit: image + frame + image = 200 mm (A4 minus 5 mm side margins), because a frame reaches into the height of the opposite image.
- Margins 5 mm top and sides, 14 mm bottom: home printers do not print the bottom 13 to 14 mm (Epson specification: 3 mm top and sides, 14 mm bottom).
- Labels do not wrap. 14 pt bold uppercase fits about 17 characters (`POSPRAVI POSTELJO`). After changing labels, measure in headless Chrome that each label's `scrollWidth` is smaller than its parent's width.
- Label color is darkened automatically to at least 4.5 : 1 contrast against the frame (WCAG 2.2, 1.4.3).
- 6 to 7 steps per sheet (at most 8). Split long routines into more sheets rather than shrinking images.

## Images

- Follow `docs/PROMPTS.md`: one watercolor style, real rooms, no clouds (except night), no text, brands, flags or known characters. Generate; never compose an image from pasted parts with code.
- Image models tend to produce pale images. Raise contrast once with Pillow: `ImageOps.autocontrast(cutoff=(0.5, 0.3))`, `ImageEnhance.Contrast(1.1)`, `ImageEnhance.Color(1.12)`, `UnsharpMask(radius=2, percent=50, threshold=3)`. Crop in the file, not with CSS, so the edge color is measured on the visible edge.
- Copy the prompt and the reference images into the image's `.json` exactly as passed to the model (from the tool call), never rewritten from `docs/PROMPTS.md`. What is not known stays `unknown`.
- Before adding any image, follow the skill `.agents/skills/copyright-check/` on the raw and on the final file, and record the result in its `.json`.

## Rules

- This repository is self-contained: everything an agent needs (rules, skills, tools) is in it, and nothing refers to files outside it. `CLAUDE.md` and `GEMINI.md` only import this file.
- Never weaken the copyright gate (`.github/workflows/copyright-gate.yml`): it must stay on `pull_request_target`, must not check out or run pull request code, and must fail closed.
- When a parent makes a routine for their own child, keep the child's name and other personal details out of commits and pull requests.
- Keep `README`, `CONTRIBUTING` and `AGENTS` in English and Slovenian in sync (`*.sl.md`).
- Magnets: recommend 35 mm or more, set in plastic; the US small-parts cylinder is 31.7 mm wide (CPSC 16 CFR 1501). Several swallowed magnets attract each other through the intestines.
