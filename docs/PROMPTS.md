# Image prompts and style guide

**English** · [Slovenščina](PROMPTS.sl.md)

Every routine image is a square 1:1 illustration generated with an image model. Use the **style text** in every prompt, then add the **scene prompt** of the image.

## Style text (add to every prompt)

> Soft watercolor and gouache children's picture-book illustration, delicate colored-pencil outlines, warm cream paper texture, gentle pastel palette. The scene is set in a real, cozy room of a family home with a floor, walls and a few homely details (plants, a small shelf), like a warm picture-book interior. Clear contrast and rich, saturated colors with defined darker outlines and shadows, not pale or washed out. No clouds, nothing floating. Cute and friendly, for a 4-year-old. Gender-neutral. Everything painted in one consistent watercolor style, no flat vector shapes, no text, no letters, no logos, no brands, no flags, no recognizable existing characters; every character is original. Square 1:1 composition, main subject large and centered, readable at 4 cm size.

**Style references** (pass to the model if it accepts input images): `images/toilet.jpg`, `images/wash-hands.jpg`. They show the target: a real room, clear contrast, objects with friendly faces.

**Only exception to "no clouds":** the sleep image stays on a dreamy night sky.

## Rules learned the hard way

- **Generate, never compose.** If the image model fails (quota, error), stop. Do not fake an image with Python/PIL by pasting flat shapes onto other images; those results looked broken and were all rejected.
- **No reference to a near-copy.** An earlier tooth image (tooth holding a brush above its head, foam on top) was almost identical to existing stock clipart (Pngtree 2020, Pikbest 2019) and was removed. Never ask for that pose.
- **Show the action, not the result.** "Set the table" is hands placing cutlery next to an empty plate, not a plate with food (that reads as "dinner").
- **Keep steps distinct.** "Clear the table" must not show a sink with a tap, because "wash hands" already does.
- **Same world.** Bath and teeth happen in the same bathroom as the toilet image; the same teddy bear appears in waking up, making the bed and sleeping.
- **No false promises.** Do not show food the child will not get (pancakes for breakfast at home when breakfast is at kindergarten).
- **Check before use:** contrast (see AGENTS.md), and the copyright check on the raw and the final file (`.agents/skills/copyright-check/`).

## Scene prompts

| Target id    | Step                | Reference image         |
| ------------ | ------------------- | ----------------------- |
| set-table    | set the table       | style references        |
| cartoon      | cartoon             | style references        |
| tidy-toys    | tidy up toys        | style references        |
| brush-teeth  | teeth               | `toilet.jpg` (bathroom) |
| sleep        | sleep               | `sleep.jpg` (bear)      |
| story        | bedtime story       | style references        |
| clear-table  | clear the table     | style references        |
| bath         | bath                | `toilet.jpg` (bathroom) |
| good-morning | good morning        | `sleep.jpg` (bear)      |
| kindergarten | off to kindergarten | style references        |
| make-bed     | make the bed        | `sleep.jpg` (bear, bed) |
| pajamas      | pajamas             | style references        |

**Set the table** — Top-down view through a child's eyes: two small child hands placing a child-size fork and spoon with wooden handles next to an EMPTY white plate on a colorful fabric placemat on a light wooden table. An empty cup and a folded napkin next to the plate. No food anywhere.

**Cartoon** — A cozy rounded retro TV on a small wooden cabinet, its screen glowing softly and showing a friendly smiling cartoon bunny waving (an original character, not any known brand). A soft cushion and a small blanket on the rug in front of the TV, warm evening lamp light.

**Tidy up toys** — A low, open wooden toy chest, low enough for a small child, with a few toys already inside. Two small child hands putting a colorful ball into the chest. A teddy bear sits on the rug next to the chest waiting to be tidied, with a few colorful wooden blocks beside it. The action of tidying up must be obvious at a glance.

**Teeth** — An ORIGINAL cute tooth character (new design, not the common clipart pose of a tooth holding a toothbrush above its head with foam on top): the tooth stands on the edge of the bathroom sink, brushing its front with a small toothbrush held in front of it, a few bubbles around, a cup with toothbrushes next to it, in the same cozy bathroom as the reference with mint tiles, so the white tooth stands out clearly against the colored background. No dental floss.

**Sleep** — The same teddy bear with a striped nightcap, LYING DOWN flat on its side in a small wooden bed, head resting on a soft white pillow, body fully under a cozy patchwork quilt, eyes closed, fast asleep. It must clearly be lying, not sitting or leaning up. Keep the same dreamy night setting as the reference: deep blue starry night sky, a crescent moon and soft clouds around the bed, but NO moonbeam, no sunbeam, no light rays or glow streaks. (This one image may have clouds.)

**Bedtime story** — A large open picture storybook lying on a cozy bed with a patchwork quilt and a soft pillow. A small magical fairy-tale castle with pastel towers and little flags rises out of the open pages like a pop-up, with tiny golden sparkles around it. A warm glowing bedside lamp and a window with a crescent moon. No characters in the bed, no clouds. Calm bedtime mood.

**Clear the table** — Through a child's eyes: two small child hands carrying a used plate with a fork and spoon on it (a few crumbs and a little leftover sauce) away from a light wooden table with a colorful fabric placemat, toward a kitchen counter. The action of clearing the table must be obvious. No sink, no running water, no tap.

**Bath** — The same cozy bathroom as in the reference (mint tiles, wooden shelf, plants, patterned floor): a happy small toddler sitting in a white clawfoot bathtub full of foamy bubbles, playing with a yellow rubber duck. The bathtub stands firmly on the bathroom floor. A fluffy towel hangs nearby. Gender-neutral child.

**Good morning** — The same teddy bear, just woken up, SITTING UP in its small wooden bed under the patchwork quilt and stretching happily with both arms raised above its head, a big sleepy smile. A cozy child's bedroom in the morning: bright warm sunshine streaming through a window, a small rug.

**Off to kindergarten** — A cheerful yellow child's backpack seen from a three-quarter back view so that both padded SHOULDER STRAPS are clearly visible, standing on the floor of a cozy home entrance hall next to a pair of small sneakers, near the front door with coat hooks. Ready to go to kindergarten.

**Make the bed** — Through a child's eyes: two small child hands smoothing and pulling up the patchwork quilt over the pillow of the same small wooden bed, making the bed neatly. The same teddy bear sits tidily on top of the made bed. A cozy child's bedroom in the morning, sunshine through a window.

**Pajamas** — Through a child's eyes: two small child hands pulling on a soft pastel pajama top with little moons and stars, the matching pajama pants laid on the bed nearby. A cozy child's bedroom in the evening, warm lamp light. Gender-neutral.
