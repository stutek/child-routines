# Child routines

**English** · [Slovenščina](README.sl.md)

**[Open the sheet maker →](https://stutek.github.io/child-routines/)**

Printable A4 sheets with a daily routine for children, recommended from age 3: morning, dinner and evening. Put the printed sheet on the fridge. Your child follows the pictures and marks each finished step by putting a magnet on its circle or drawing a tick (for ticks, print a fresh sheet each time). Adults read the order and the time on the sheet.

![Three example sheets: morning, dinner and evening](docs/preview.jpg)

Free, no sign-up and no ads. What you type stays in your browser.

## How to make your sheet

1. Open the [sheet maker](https://stutek.github.io/child-routines/), easiest on a computer, where the preview is next to the form. It starts with an example evening routine.
2. Pick the routine type (morning, day, evening) and type up to 8 steps. You can change the sheet title and every label as you like. The page picks a picture for each step; click it to change it. To change the order, drag a row by the dots on its left. The time is optional: leave it empty and write it in by hand later, or hide the time fields with the *Time on the sheet* switch.
3. Click **Print**. In the print window choose A4 paper, margins *None* and scale 100%. To send the sheet to a grandparent or a print shop, choose *Save as PDF* instead of a printer.

## How to use it

- **Make the sheet together with your child** and go through it together for the first few days. Let your child pick the pictures; you set the order.
- **A magnet on the circle means "done".** It is not a reward: do not take it away as a punishment and do not tie sweets or cartoons to it.
- **Start with one routine**, for a three-year-old with 3–4 steps, and add to it bit by bit. If your child skips a step, no drama: the sheet shows the order, it is not a test.
- **The time is for adults.** A young child follows the order of the pictures, not the clock.
- **When your child sleeps over at grandparents' or relatives',** send the sheet along: they see what comes next and when, too.

Example sheets, ready to print, are [here](https://stutek.github.io/child-routines/output/en-example.html).

## Safety

- **Magnets:** use magnets set in plastic, with no small parts that could come off. Throw away a cracked one. Keep the magnets out of reach when the sheet is not in use. If a child swallows one magnet or more, see a doctor at once: several magnets can attract each other inside the gut.
- **Medicine and care:** an adult gives medicine and keeps it out of the child's reach. The step on the sheet only reminds the child that it is time for it.
- **Bath:** never leave a child alone in the bath.

## Did it help?

Click **⭐ Star** at the top of the [project page on GitHub](https://github.com/stutek/child-routines) (needs a free GitHub account) or share the link with other parents. That tells us the project is worth more work.

## For advanced users

### Print without a connection

1. On the [project page](https://github.com/stutek/child-routines) click **Code**, then **Download ZIP**, and unpack it. The sheets need the `images/` folder next to `output/`, so opening a single file on GitHub does not work.
2. In Chrome, open `web/index.html` for your own sheet or `output/en-example.html` for the example.
3. Print as above.

### Your own routine from files

Routines are data files in [`routines/<lang>/`](routines/). Copy one, change the labels, pictures and colors, then rebuild:

```bash
pip install -r requirements.txt
python3 tools/check_images.py   # checks images and routines
python3 tools/build.py          # writes output/<lang>-<name>.html
```

Images are in [`images/`](images/), each with its own metadata file. How to make new ones: [docs/PROMPTS.md](docs/PROMPTS.md).

### Your own routine with an agent

An AI coding agent (Claude Code, Codex, Gemini CLI or Antigravity) can build the routine for you. It loads the repository's instructions in [AGENTS.md](AGENTS.md) by itself.

1. Get the repository onto your computer (`git clone https://github.com/stutek/child-routines.git` or the ZIP above) and start the agent in its folder.
2. Describe the routine in your own words, for example:

   ```text
   In routines/en/ours.json, make a routine for my four-year-old: morning (wake up, toilet, wash hands, teeth, get dressed, preschool) and evening (bath, pajamas, teeth, story, sleep). Use the existing pictures where they fit, rebuild, and print it to PDF for me to check.
   ```

3. Check the result yourself in Chrome's print preview: every label is whole, the order is right, every picture matches its step.

Tips:

- **Personal details stay at home.** Your child's name on your own sheet is fine on your computer; do not commit it to a public fork or a pull request.
- **Use the existing pictures first.** Many coding agents cannot make images; new ones need an image model (the ones here were made with Google Gemini through Antigravity), following [docs/PROMPTS.md](docs/PROMPTS.md) and the [copyright check](.agents/skills/copyright-check/SKILL.md). Look at every new picture yourself before you print or share it.
- **Do not let the agent publish.** Review the changes before you push or open a pull request.

### Contributing

Parents can add routines, translations and pictures: see [CONTRIBUTING.md](CONTRIBUTING.md). Every new picture must pass the automatic copyright gate before it is merged.

## License

All content (code, pictures, routine texts, documentation) is dedicated to the public domain under [CC0 1.0](LICENSE): you may copy, change and use it for any purpose, without asking and without credit. The pictures were made with an image model; such pictures are most likely not protected by copyright, and CC0 says so plainly. CC0 does not cover any rights third parties may have.

For agents: [AGENTS.md](AGENTS.md).
