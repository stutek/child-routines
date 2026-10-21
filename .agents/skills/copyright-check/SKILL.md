---
name: copyright-check
description: Check that a routine image is not a copy of an existing work before it is added or merged. Use for every new or changed image in images/, for reviewing a pull request with images, and before publishing.
---

# Copyright check for images

**English** · [Slovenščina](SKILL.sl.md)

An image may enter `images/` only if no copy of it, or of a part of it, exists on the web. Image models sometimes reproduce existing stock clipart almost exactly: here a tooth character holding a brush above its head turned out to be nearly identical to clipart published on Pngtree (2020) and Pikbest (2019), only recolored.

## When

- Right after generating an image, on the **raw** model output.
- Again on the **final** file after any edit (contrast, crop, retouch). Edits can weaken detection, so both versions must pass.
- On every pull request: the `copyright-gate` workflow checks the final files automatically.

## How

1. **Automatic (gate and local):** `VISION_API_KEY=... python3 tools/copyright_check.py <images...>`. Google Cloud Vision Web Detection; the image fails on any `fullMatchingImages`, `partialMatchingImages` or `pagesWithMatchingImages` outside this repository. A missing key or an API error also fails.
2. **Manual second check (local, optional):** `python3 tools/lens_check.py <absolute path>` with a debugging Chrome (see the script header). Read the *Exact matches* tab. Lens matched the recolored tooth, so it tolerates color changes.

## Decide

- Any exact or partial match, or a page showing the image: **reject**. Generate a new image with a different composition; do not edit the old one until it passes.
- Only *visually similar* results (same subject, different picture): accept.
- A matched site shows a bot check or login wall: do not bypass it; treat the match as real.
- No manual exceptions to the gate.

## Record

Write the result into the image's `.json`:

```json
"copyright_check": {"date": "YYYY-MM-DD", "method": "Vision Web Detection (raw and final); Google Lens Exact matches", "result": "no exact matches"}
```

A match that needed a closer look (similar layout, a near copy, a license question) gets its own write-up in `docs/copyright-investigations/<date>-<image>-<source>.md`: the image by commit, blob and SHA-256, the match with its URL and license, a comparison, the decision and its sources.
