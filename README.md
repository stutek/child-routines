# Child routines

**English** · [Slovenščina](README.sl.md)

Printable A4 sheets with a young child's daily routine: morning, dinner and bedtime. Hang them on the fridge or another metal board. The child follows the pictures and puts a magnet on the circle of each finished step (or ticks it with a pen when you print a fresh sheet each time). Adults read the order and write the planned time next to each step, which helps grandparents or a babysitter when the child sleeps over.

## Print

1. Open a file from [`output/`](output/) in Chrome, for example `output/sl-vsakdan.html`.
2. Print: paper A4, margins *None*, scale 100 %. The sky background prints on its own.

The sheets keep a 14 mm bottom margin because most home printers cannot print the bottom edge.

## Make your own

Routines are data files in [`routines/<language>/`](routines/). Copy one, change the labels, images and colors, then rebuild:

```bash
pip install -r requirements.txt
python3 tools/check_images.py   # validates images and routines
python3 tools/build.py          # writes output/<language>-<name>.html
```

Images live in [`images/`](images/) with one metadata file each. How to make new ones: [docs/PROMPTS.md](docs/PROMPTS.md).

## Contribute

Parents are welcome to add routines, translations and images: see [CONTRIBUTING.md](CONTRIBUTING.md). Every new image passes an automatic copyright gate before it can be merged.

## Magnets and safety

Small magnets are dangerous if a child swallows several. Use magnets larger than 32 mm in every direction (the circles are 35 mm), set in plastic, not small neodymium magnets, and supervise young children.

## License

Everything in this repository (code, images, routine texts, documentation) is dedicated to the public domain under [CC0 1.0](LICENSE). You may copy, change and use it for any purpose, without asking and without attribution. The images were made with an image model; such images are most likely not protected by copyright, and CC0 states that plainly instead of claiming rights that may not exist.

For AI agents: [AGENTS.md](AGENTS.md).
