# Child routines

**English** · [Slovenščina](README.sl.md)

Printable A4 sheets with a young child's daily routine: morning, dinner and bedtime. Hang them on the fridge or another metal board. The child follows the pictures and puts a magnet on the circle of each finished step (or ticks it with a pen when you print a fresh sheet each time). Adults read the order and write the planned time next to each step, which helps grandparents or a babysitter when the child sleeps over.

## Print

1. Download the files: on the [repository page](https://github.com/stutek/child-routines), click **Code**, then **Download ZIP**, and unzip it. The sheets need the `images/` folder next to `output/`, so opening a single file on GitHub does not work.
2. Open a file from `output/` in Chrome, for example `output/sl-vsakdan.html`.
3. Print: paper A4, margins *None*, scale 100 %. The sky background prints on its own.

The sheets keep a 14 mm bottom margin because most home printers cannot print the bottom edge.

## Make your own in the browser

Open `web/index.html` from the downloaded folder in Chrome, type the steps and times, and print. The page picks a picture for each step by keyword and warns when it has none, when a label is too long for its frame or when a sheet has more than 8 steps. Nothing leaves your browser.

## Make your own from files

Routines are data files in [`routines/<language>/`](routines/). Copy one, change the labels, images and colors, then rebuild:

```bash
pip install -r requirements.txt
python3 tools/check_images.py   # validates images and routines
python3 tools/build.py          # writes output/<language>-<name>.html
```

Images live in [`images/`](images/) with one metadata file each. How to make new ones: [docs/PROMPTS.md](docs/PROMPTS.md).

## Make your own with an AI agent

An AI coding agent (Claude Code, Codex, Gemini CLI or Antigravity) can make the routine for you. It loads the repository's instructions in [AGENTS.md](AGENTS.md) on its own.

1. Get the repository onto your computer (`git clone https://github.com/stutek/child-routines.git`, or the ZIP above) and start the agent in its folder.
2. Describe the routine in your own words, for example:

   ```text
   Make an English routine for my 4-year-old in routines/en/daily.json: morning (wake up, toilet, wash hands, teeth, get dressed, kindergarten) and bedtime (bath, pajamas, teeth, story, sleep). Use the existing images where they fit, rebuild, and print it to PDF so I can check it.
   ```

3. Check the result yourself in Chrome's print preview: every label is whole, the order is right, each picture matches its step.

Recommendations:

- **Keep personal details at home.** Your child's name on your own sheet is fine on your computer; do not commit it to a public fork or a pull request.
- **Reuse images first.** Many coding agents cannot make images; new ones need an image model (the images here were made with Google Gemini through Antigravity), following [docs/PROMPTS.md](docs/PROMPTS.md) and the [copyright check](.agents/skills/copyright-check/SKILL.md). Look at every new image yourself before you print or share it: models make mistakes, such as hands without a body.
- **Do not let the agent publish.** Review the changes before you push or open a pull request.

## Contribute

Parents are welcome to add routines, translations and images: see [CONTRIBUTING.md](CONTRIBUTING.md). Every new image passes an automatic copyright gate before it can be merged.

## Magnets and safety

Small magnets are dangerous if a child swallows several. Use magnets larger than 32 mm in every direction (the circles are 35 mm), set in plastic, not small neodymium magnets, and supervise young children.

## License

Everything in this repository (code, images, routine texts, documentation) is dedicated to the public domain under [CC0 1.0](LICENSE). You may copy, change and use it for any purpose, without asking and without attribution. The images were made with an image model; such images are most likely not protected by copyright, and CC0 states that plainly instead of claiming rights that may not exist.

For AI agents: [AGENTS.md](AGENTS.md).
