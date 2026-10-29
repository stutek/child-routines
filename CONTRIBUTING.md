# Contributing

**English** · [Slovenščina](CONTRIBUTING.sl.md)

How to build sheets from the data files on your computer, with or without an AI agent, and how to contribute. Thank you for sharing your child's routine: you can add a **routine** (a new one or a translation), **images**, or both. Changes come as a pull request.

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

   - `sky`: `dawn`, `afternoon`, `night`, your own CSS gradient stops, or `white` or `none` (transparent).
   - `stars`: `true` adds small stars (for night sheets).
   - `times`: `false` leaves out the time fields on this sheet.
   - Up to 8 steps per sheet; 6 to 7 look best. Split long routines into more sheets.
   - `label`: short, uppercase, one word where possible. The build fails visually if a label is too long: keep it under about 17 characters.
   - `image`: an image id from `images/`, or `null` for an empty placeholder.
   - `time`: optional, e.g. `"07:30"`; printed instead of the empty time field.
   - `color`: the step color; labels are darkened automatically for readable contrast.
3. Rebuild and check it in Chrome's print preview:

   ```bash
   pip install -r requirements.txt
   python3 tools/check_images.py   # checks images and routines; must print 0 errors
   python3 tools/build.py          # writes output/<lang>-<name>.html
   ```

4. Commit the routine and the rebuilt `output/` file.

## Add an image

1. Generate a square image following [docs/PROMPTS.md](docs/PROMPTS.md) (same watercolor style, real rooms, no clouds except at night, no text). Save it as `images/<id>.jpg`, 1024 × 1024 pixels, JPEG, at most 1.5 MB. The id is lowercase English with hyphens, e.g. `brush-teeth`.
2. Add `images/<id>.json`:

   ```json
   {
     "id": "brush-teeth",
     "title": "Tooth brushing at the bathroom sink",
     "label": {"en": "BRUSH TEETH", "sl": "ZOBKI"},
     "keywords": {"en": ["teeth", "tooth*", "brush teeth"], "sl": ["zob*"]},
     "theme": "plain",
     "model": "name of the image model you used",
     "prompt": "the full prompt you used, copied exactly",
     "reference_images": ["images you passed to the model, or nothing"],
     "edits": ["what you changed after generating, or nothing"],
     "contributor": "your GitHub username",
     "license": "CC0-1.0",
     "copyright_check": {"date": "YYYY-MM-DD", "method": "how you checked", "result": "no exact matches"}
   }
   ```

   `label` is the default step label per language (at most 17 characters); the sheet maker writes it when a parent picks this picture on an empty row. `keywords` are the words a parent would type for this step, per language; `word*` matches the start of a word. The sheet maker in `web/` uses them to pick the picture. `theme` is `bear` (the teddy bear does the step) or `plain` (no character: the child's hands or the room); a parent picks one theme for the whole sheet. The same step in the other theme is a variant: `images/<id>-<theme>.json` with `"variant_of": "<id>"` and its `theme`, without `label` and `keywords` (they stay with the first picture).

3. Check it yourself first with an image search (for example Google Lens, tab *Exact matches*), both the raw image from the model and the final file after any edit. If the same or almost the same picture already exists on the web, do not submit it: generate a new one with a different composition. Details: [copyright check](.agents/skills/copyright-check/SKILL.md).

## The copyright gate

Every pull request runs two automatic checks, and both must pass before merging:

- **validate**: image files and metadata, routine files, rebuilt output.
- **copyright-gate**: each new or changed image is searched on the web (Google Cloud Vision, Web Detection). If the web already has the same picture, part of it, or a page showing it, the check fails and the pull request cannot be merged. There are no manual exceptions: regenerate the image with a different composition and push again. Visually similar pictures do not count, only copies.

## With an AI agent

An AI coding agent (Claude Code, Codex, Gemini CLI or Antigravity) can do the steps above for you. It loads the repository's instructions in [AGENTS.md](AGENTS.md) by itself.

1. Get the repository onto your computer (`git clone https://github.com/stutek/child-routines.git` or **Code** → **Download ZIP**) and start the agent in its folder.
2. Describe the routine in your own words, for example:

   ```text
   In routines/en/ours.json, make a routine for my four-year-old: morning (wake up, toilet, wash hands, teeth, get dressed, preschool) and evening (bath, pajamas, teeth, story, sleep). Use the existing pictures where they fit, rebuild, and print it to PDF for me to check.
   ```

3. Check the result yourself in Chrome's print preview: every label is whole, the order is right, every picture matches its step.

Tips:

- **Personal details stay at home.** Your child's name on your own sheet is fine on your computer; do not commit it to a public fork or a pull request.
- **Use the existing pictures first.** Many coding agents cannot make images; new ones need an image model (the ones here were made with Google Gemini through Antigravity), following [docs/PROMPTS.md](docs/PROMPTS.md) and the [copyright check](.agents/skills/copyright-check/SKILL.md). Look at every new picture yourself before you print or share it.
- **Do not let the agent publish.** Review the changes before you push or open a pull request.

If you contribute the result, it stays yours: before you open the pull request, look at every image and check every item of the checklist yourself. The agent follows the same rules ([AGENTS.md](AGENTS.md)), and the copyright gate checks its work like anyone else's.

## Pull request

Fill in the checklist in the pull request template. Keep one routine or a few related images per pull request.

## Maintainers

- Repository secret `VISION_API_KEY`: an API key of a Google Cloud project with the Cloud Vision API enabled (first 1,000 checks per month are free). Set it with `gh secret set VISION_API_KEY`.
- Make `validate / check`, `copyright-gate / web-match` and `web-test / web` required status checks for `main` (repository settings, rules or branch protection).
- The gate runs on `pull_request_target`, from the base branch. Never change it to check out or run code from the pull request.
