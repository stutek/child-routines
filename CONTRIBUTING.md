# Contributing

**English** · [Slovenščina](CONTRIBUTING.sl.md)

Thank you for sharing your child's routine. You can add a **routine** (a new one or a translation), **images**, or both. Changes come as a pull request.

## Ground rules

- **No real people.** No photos of children or adults, no names, no faces of real people.
- **No text in images**, no brands, logos, flags or known characters (cartoon, film, toy brands).
- **Only images you may give away.** Images you generated yourself with an image model, or drew yourself. Never images found on the web, stock images or edited copies of them.
- Everything you add is dedicated to the public domain under [CC0 1.0](LICENSE).

## Add a routine

1. Copy a file from `routines/<language>/` to `routines/<your language>/<name>.json` (language code like `en`, `de`, `sl`; name in lowercase with hyphens).
2. Edit it:

   ```json
   {
     "title": "Daily routine",
     "language": "en",
     "sheets": [
       {
         "title": "☀️ MORNING",
         "sky": "dawn",
         "stars": false,
         "steps": [
           {"label": "GOOD MORNING", "image": "good-morning-sun", "color": "#8B5CF6"},
           {"label": "BRUSH TEETH", "image": null, "color": "#F97316"}
         ]
       }
     ]
   }
   ```

   - `sky`: `dawn`, `afternoon`, `night`, or your own CSS gradient stops.
   - `stars`: `true` adds small stars (for night sheets).
   - Up to 8 steps per sheet; 6 to 7 look best. Split long routines into more sheets.
   - `label`: short, uppercase, one word where possible. The build fails visually if a label is too long: keep it under about 17 characters.
   - `image`: an image id from `images/`, or `null` for an empty placeholder.
   - `color`: the step color; labels are darkened automatically for readable contrast.
3. Run `python3 tools/check_images.py` and `python3 tools/build.py`, open the new file in `output/` and check it in Chrome's print preview.
4. Commit the routine and the rebuilt `output/` file.

## Add an image

1. Generate a square image following [docs/PROMPTS.md](docs/PROMPTS.md) (same watercolor style, real rooms, no clouds except at night, no text). Save it as `images/<id>.jpg`, 1024 × 1024 pixels, JPEG, at most 1.5 MB. The id is lowercase English with hyphens, e.g. `brush-teeth`.
2. Add `images/<id>.json`:

   ```json
   {
     "id": "brush-teeth",
     "title": "Tooth brushing at the bathroom sink",
     "model": "name of the image model you used",
     "prompt": "the full prompt you used",
     "edits": ["what you changed after generating, or nothing"],
     "contributor": "your GitHub username",
     "license": "CC0-1.0",
     "copyright_check": {"date": "YYYY-MM-DD", "method": "how you checked", "result": "no exact matches"}
   }
   ```

3. Check it yourself first with an image search (for example Google Lens, tab *Exact matches*), both the raw image from the model and the final file after any edit. If the same or almost the same picture already exists on the web, do not submit it: generate a new one with a different composition. Details: [copyright check](.agents/skills/copyright-check/SKILL.md).

## The copyright gate

Every pull request runs two automatic checks, and both must pass before merging:

- **validate**: image files and metadata, routine files, rebuilt output.
- **copyright-gate**: each new or changed image is searched on the web (Google Cloud Vision, Web Detection). If the web already has the same picture, part of it, or a page showing it, the check fails and the pull request cannot be merged. There are no manual exceptions: regenerate the image with a different composition and push again. Visually similar pictures do not count, only copies.

## Pull request

Fill in the checklist in the pull request template. Keep one routine or a few related images per pull request.

## Maintainers

- Repository secret `VISION_API_KEY`: an API key of a Google Cloud project with the Cloud Vision API enabled (first 1,000 checks per month are free). Set it with `gh secret set VISION_API_KEY`.
- Make `validate / check` and `copyright-gate / web-match` required status checks for `main` (repository settings, rules or branch protection).
- The gate runs on `pull_request_target`, from the base branch. Never change it to check out or run code from the pull request.
