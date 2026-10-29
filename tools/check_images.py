"""Validate images and routines. Exits 1 on any problem.

    python3 tools/check_images.py

- every images/<id>.jpg has images/<id>.json with the required fields, and vice versa
- images are square 1024 x 1024 JPEG, at most 1.5 MB, license CC0-1.0; keywords per language are lists
- "theme" is a picture theme (THEMES in tools/build.py); a variant ("variant_of") points to an image that is
  no variant, has another theme, no keywords or label (they stay with the image), one variant per theme
- every routine step points to an existing image that is no variant, or to null (empty placeholder)
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REQUIRED = {"id", "title", "model", "prompt", "edits", "contributor", "license", "copyright_check"}
MAX_BYTES = 1_500_000
THEMES = ("bear", "plain")   # as in tools/build.py


def main():
    errors = []
    images = ROOT / "images"
    jpgs = {p.stem for p in images.glob("*.jpg")}
    metas = {p.stem for p in images.glob("*.json")}
    for id_ in sorted(jpgs - metas):
        errors.append(f"images/{id_}.jpg has no images/{id_}.json")
    for id_ in sorted(metas - jpgs):
        errors.append(f"images/{id_}.json has no images/{id_}.jpg")
    for other in sorted(p.name for p in images.iterdir() if p.suffix not in {".jpg", ".json", ".md"}):
        errors.append(f"images/{other}: only .jpg images with a .json file are allowed")

    all_meta = {}
    for id_ in sorted(jpgs & metas):
        jpg, meta_path = images / f"{id_}.jpg", images / f"{id_}.json"
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errors.append(f"{meta_path.name}: invalid JSON ({e})")
            continue
        all_meta[id_] = meta
        missing = REQUIRED - meta.keys()
        if missing:
            errors.append(f"{meta_path.name}: missing fields {sorted(missing)}")
        if meta.get("id") != id_:
            errors.append(f"{meta_path.name}: field id must be {id_!r}")
        if meta.get("license") != "CC0-1.0":
            errors.append(f"{meta_path.name}: license must be CC0-1.0")
        label = meta.get("label", {})
        if not (isinstance(label, dict) and all(isinstance(v, str) and 0 < len(v) <= 17 for v in label.values())):
            errors.append(f'{meta_path.name}: label must be {{"<language>": "SHORT LABEL"}}, at most 17 characters')
        kw = meta.get("keywords", {})
        if not (isinstance(kw, dict) and all(isinstance(v, list) and all(isinstance(w, str) and w.strip() for w in v) for v in kw.values())):
            errors.append(f'{meta_path.name}: keywords must be {{"<language>": ["word", "start*"]}}')
        if not str(meta.get("prompt", "")).strip():
            errors.append(f"{meta_path.name}: prompt must not be empty")
        if jpg.stat().st_size > MAX_BYTES:
            errors.append(f"{jpg.name}: {jpg.stat().st_size} bytes, at most {MAX_BYTES}")
        with Image.open(jpg) as im:
            if im.format != "JPEG" or im.size != (1024, 1024):
                errors.append(f"{jpg.name}: must be a 1024 x 1024 JPEG, is {im.format} {im.size}")
        if "theme" in meta and meta["theme"] not in THEMES:
            errors.append(f"{meta_path.name}: theme must be one of {list(THEMES)}")

    variants = {}
    for id_, meta in all_meta.items():
        base = meta.get("variant_of")
        if base is None:
            continue
        if base not in all_meta or "variant_of" in all_meta[base]:
            errors.append(f"images/{id_}.json: variant_of must name an image that is no variant")
        elif not meta.get("theme") or meta.get("theme") == all_meta[base].get("theme"):
            errors.append(f"images/{id_}.json: a variant needs a theme other than its image's")
        elif (base, meta["theme"]) in variants:
            errors.append(f"images/{id_}.json: {base} already has a {meta['theme']} variant ({variants[base, meta['theme']]})")
        else:
            variants[base, meta["theme"]] = id_
        if meta.get("keywords") or meta.get("label"):
            errors.append(f"images/{id_}.json: a variant has no keywords or label; they stay in images/{base}.json")

    for path in sorted((ROOT / "routines").glob("*/*.json")):
        rel = path.relative_to(ROOT)
        try:
            routine = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errors.append(f"{rel}: invalid JSON ({e})")
            continue
        if routine.get("language") != path.parent.name:
            errors.append(f"{rel}: language must be {path.parent.name!r} (the folder name)")
        for s, sheet in enumerate(routine.get("sheets", []), 1):
            steps = sheet.get("steps", [])
            if not 1 <= len(steps) <= 8:
                errors.append(f"{rel}: sheet {s} has {len(steps)} steps, allowed 1 to 8")
            for i, step in enumerate(steps, 1):
                image = step.get("image")
                if image is not None and image not in jpgs:
                    errors.append(f"{rel}: sheet {s} step {i} uses missing image {image!r}")
                elif image is not None and "variant_of" in all_meta.get(image, {}):
                    errors.append(f"{rel}: sheet {s} step {i} uses a variant; name its image {all_meta[image]['variant_of']!r}")
                if not str(step.get("label", "")).strip():
                    errors.append(f"{rel}: sheet {s} step {i} has no label")

    for e in errors:
        print("ERROR:", e)
    print(f"{len(jpgs)} images, {len(list((ROOT / 'routines').glob('*/*.json')))} routines, {len(errors)} errors")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
