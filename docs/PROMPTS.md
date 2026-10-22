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
- **Rich but readable.** A real room with a few homely details, never bare; at 4 cm the main subject fills most of the picture and the background stays calm (at most 3 to 4 details). No letters or numbers anywhere, also not on toys or clocks.
- **Keep steps distinct.** "Clear the table" must not show a sink with a tap, because "wash hands" already does. Only the sleep image has closed eyes; waking up has eyes wide open.
- **No disembodied hands.** Hands appear only in a child's-eye view, entering from the bottom edge (set the table, clear the table, pajamas). Otherwise the teddy bear does the action (make the bed, tidy up toys).
- **Cloth obeys gravity.** Clothes, quilts and towels hang, drape and fold; they never stand stiff like a board. Do not show the child already wearing what it is putting on.
- **Same world.** Bath and teeth happen in the same bathroom as the toilet image; the same teddy bear appears in waking up, making the bed, tidying up and sleeping. It wears its striped nightcap only around sleep (good morning, make the bed, sleep); in other scenes it has no cap.
- **No false promises.** Do not show food the child will not get (pancakes for breakfast at home when breakfast is at kindergarten).
- **Check before use:** contrast (see AGENTS.md), and the copyright check on the raw and the final file (`.agents/skills/copyright-check/`).

## Scene prompts

| Target id    | Step                | Reference image         |
| ------------ | ------------------- | ----------------------- |
| set-table    | set the table       | style references        |
| cartoon      | cartoon             | see the prompt          |
| tidy-toys    | tidy up toys        | none (see the prompt)   |
| brush-teeth  | teeth               | `toilet.jpg` (bathroom) |
| sleep        | sleep               | none (see the prompt)   |
| story        | bedtime story       | style references        |
| clear-table  | clear the table     | style references        |
| bath         | bath                | `toilet.jpg` (bathroom) |
| good-morning | good morning        | `sleep.jpg` (bear)      |
| kindergarten | off to kindergarten | style references        |
| make-bed     | make the bed        | none (see the prompt)   |
| pajamas      | pajamas             | style references        |

**Set the table** — Top-down view through a child's eyes: two small child hands placing a child-size fork and spoon with wooden handles next to an EMPTY white plate on a colorful fabric placemat on a light wooden table. An empty cup and a folded napkin next to the plate. No food anywhere.

**Cartoon** — (references: `cartoon.jpg` of commit 65555ab for the calm composition, the night-run cartoon of 2026-10-22 for the drawing only) A calm, cozy family living room in the evening, seen so that a rounded wooden TV on a low cabinet is LARGE in the picture. On the TV screen, large and clear, an original friendly cartoon bunny waves (not any known character). In front of the TV, an empty big soft floor cushion and a folded blanket invite you to sit and watch. No characters in the room. Only a few homely details: a glowing floor lamp, a potted plant, a patterned rug on wooden floorboards, one framed picture on the wall. No letters or numbers anywhere (no clock, no alphabet blocks), no toys on the floor.

**Tidy up toys** — (no reference image) The same cute brown teddy bear, WITHOUT a nightcap, STANDS on the rug beside a low, open wooden toy chest and, with both paws, puts the last colorful ball into it. The chest is full of toys (wooden blocks, a toy car, a picture book). The floor around it is tidy: NO toys left on the floor. No human hands, no people. A cozy child's room with many homely details: a shelf with colorful books, a plant, framed children's drawings, a window with curtains, a patterned rug on wooden floorboards. The action of tidying up must be obvious at a glance.

**Teeth** — An ORIGINAL cute tooth character (new design, not the common clipart pose of a tooth holding a toothbrush above its head with foam on top): the tooth stands on the edge of the bathroom sink, brushing its front with a small toothbrush held in front of it, a few bubbles around, a cup with toothbrushes next to it, in the same cozy bathroom as the reference with mint tiles, so the white tooth stands out clearly against the colored background. No dental floss.

**Sleep** — (full prompt, no reference image: a reference made the model copy the old sitting pose) Soft watercolor and gouache children's picture-book illustration, delicate colored-pencil outlines, warm cream paper texture, clear contrast and rich colors with defined darker outlines, not pale. A cute brown teddy bear wearing a blue-and-white striped nightcap is LYING DOWN fully horizontal and asleep in a small wooden bed with a heart on the footboard, seen from the side: its head rests on a white pillow at the LEFT end of the bed, its body is stretched out under a patchwork quilt toward the RIGHT end, only the head and one paw above the quilt, eyes closed, peaceful. The bear is NOT sitting, NOT leaning, NOT propped up. Dreamy night setting: deep blue starry night sky with a crescent moon and a few soft clouds around the bed. NO moonbeam, no sunbeam, no light rays or glow streaks. No text, no letters, no logos. Square 1:1 composition, bed large and centered, readable at 4 cm size.

**Bedtime story** — A large open picture storybook lying on a cozy bed with a patchwork quilt and a soft pillow. A small magical fairy-tale castle with pastel towers and little flags rises out of the open pages like a pop-up, with tiny golden sparkles around it. A warm glowing bedside lamp and a window with a crescent moon. No characters in the bed, no clouds. Calm bedtime mood.

**Clear the table** — Through a child's eyes: two small child hands carrying a used plate with a fork and spoon on it (a few crumbs and a little leftover sauce) away from a light wooden table with a colorful fabric placemat, toward a kitchen counter. The action of clearing the table must be obvious. No sink, no running water, no tap.

**Bath** — The same cozy bathroom as in the reference (mint tiles, wooden shelf, plants, patterned floor): a happy small toddler sitting in a white clawfoot bathtub full of foamy bubbles, playing with a yellow rubber duck. The bathtub stands firmly on the bathroom floor. A fluffy towel hangs nearby. Gender-neutral child.

**Good morning** — The same teddy bear, just woken up, SITTING UP in its small wooden bed under the patchwork quilt and stretching happily with both arms raised above its head, a big smile, its eyes WIDE OPEN, round and bright (NOT closed, NOT squinting; take only the bear's look from the reference, not its closed eyes). A cozy child's bedroom in the morning: bright warm sunshine streaming through a window, a small rug.

**Off to kindergarten** — A cheerful yellow child's backpack seen from a three-quarter back view so that both padded SHOULDER STRAPS are clearly visible, standing on the floor of a cozy home entrance hall next to a pair of small sneakers, near the front door with coat hooks. Ready to go to kindergarten.

**Make the bed** — (no reference image) A cute brown teddy bear wearing a blue-and-white striped nightcap is wide AWAKE with its eyes OPEN and smiling, STANDING on the floor BESIDE its small wooden bed (heart cut-out on the footboard), making the bed: with both paws it holds a patchwork quilt RAISED high in the air, shaking it out to spread it neatly over the bed; the soft quilt billows and drapes with natural folds. The bear is not in the bed. A white pillow at the head of the bed. A cozy child's bedroom in the morning: warm sunshine through a window, a small rug, a plant. No clouds, nothing floating, no light rays.

**Pajamas** — Through a child's eyes (first-person view): two small child hands with BARE forearms enter from the bottom edge and lift a soft pastel cotton pajama top with little moons and stars by its shoulders, about to pull it over the head. The soft fabric hangs down limply under its own weight, with natural folds and drooping sleeves; it is NOT stiff and does NOT stand up like a board. The child is not yet wearing any pajamas. The matching pajama pants lie loosely on the bed. A cozy child's bedroom in the evening, warm lamp light, many homely details: a shelf with books and toys, a plant, a window with curtains, a patterned rug. Gender-neutral.
