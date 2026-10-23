# Child routines

**English** · [Slovenščina](README.sl.md)

**[Make your sheet →](https://stutek.github.io/child-routines/)**

A4 sheets with a daily routine for children aged 3 and up: morning, dinner and evening. Your child follows the pictures. They mark each finished step with a magnet on its circle or a tick. Adults read the order and the time.

![Three example sheets: morning, dinner and evening](docs/preview.jpg)

Free, no sign-up and no ads. What you type stays in your browser.

## How to make your sheet

1. Open the [sheet maker](https://stutek.github.io/child-routines/). It is easiest on a computer. It opens with an example evening routine.
2. Pick the routine type and type 3–4 steps (up to 8). Click a picture to change it. Drag a row by its dots to move it. Type a time, or turn off *Time on the sheet*.
3. Click **Print**: A4, margins *None*, scale 100%. For a grandparent or a print shop, choose *Save as PDF*. You can put the sheet on the fridge or a board.

## How to use it

- **Make the sheet together with your child.** You type the steps, your child picks the pictures.
- **Do the steps together for the first few days.**
- **Start with 3–4 steps.** When your child knows the routine, add more.
- **A magnet means “done”.** Don't promise gifts for magnets: a reward can take away the joy of the task.
- **The times on the sheet are for adults,** not for hurrying. If a step is skipped or the order gets mixed up, stay calm and try again next time.
- **When your child sleeps over at grandparents', an aunt's or an uncle's,** send the sheet along. A familiar order can give a child a sense of security.

Example sheets, ready to print, are [here](https://stutek.github.io/child-routines/output/en-example.html).

## Safety

- **Age:** the sheet is for children aged 3 and up.
- **Magnets:** choose large ones in plastic and keep them out of reach of younger children. If a child swallows a magnet, see a doctor at once.
- **Pens:** for ticks, use children's chemically safe pens.
- **Medicine:** an adult gives and keeps it. It is not a sweet.
- **Bath:** never leave a child alone in the bath.

## Did it help?

Send the link to other parents. If you have a GitHub account, also click **⭐ Star** on the [project page](https://github.com/stutek/child-routines).

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
