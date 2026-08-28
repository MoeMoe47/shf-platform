# Classical Arcade Room — Artwork Sourcing Record

This records exactly where every game/cabinet/topic visual on the
Classical Arcade Room page (`src/pages/arcade/ClassicalArcadeRoom.jsx`)
came from, for the visual-fidelity closure pass that replaced the
original custom-SVG fallbacks with real approved artwork.

## Source

Two full-resolution (1536×1024) approved mock screenshots, found during
a forensic repository search (the original search for these mocks came
up empty; they were sitting one directory above the project root, not
inside it):

- `/Users/mikeslate/Projects/Dark_classic_aracde.png` (dark mode — the
  file used for every extraction below)
- `/Users/mikeslate/Projects/light_ classic_ arcade.png` (light mode —
  visually cross-checked; identical artwork, only the card chrome
  differs between the two mocks)

## Extracted assets

All coordinates are pixel boxes `(left, top, right, bottom)` in the
1536×1024 dark-mode source PNG. Each crop is the artwork region only —
no card border, title text, tag chips, or button chrome included.

| Output file | Source box | Size |
|---|---|---|
| `public/assets/arcade/classical/orbit-defender.jpg` | (237, 567, 447, 654) | 210×87 |
| `public/assets/arcade/classical/pixel-foundry.jpg` | (467, 567, 677, 654) | 210×87 |
| `public/assets/arcade/classical/circuit-runner.jpg` | (697, 567, 907, 654) | 210×87 |
| `public/assets/arcade/classical/eco-stack.jpg` | (927, 567, 1137, 654) | 210×87 |
| `public/assets/arcade/classical/featured-cabinet-orbit-defender.jpg` | (1200, 197, 1478, 273) | 278×76 |
| `public/assets/arcade/classical/art-assets-ship.jpg` | (565, 795, 668, 868) | 103×73 |
| `public/assets/arcade/classical/ai-agent-systems.jpg` | (838, 793, 953, 866) | 115×73 |

Saved as JPEG, quality 92, optimized. No upscaling — every asset is used
at or below its native resolution in the live page (game cards render
the art at `max-height:58px`, well under the 87px source height).

## Not extracted: "Game Logic" topic visual

The mock's own "Game Logic" icon (in the "3. How Was This Built?" row)
occupies roughly a 60×40px region with no isolatable margin on any
edge — the surrounding label text ("Game Logic", "Movement, collisions,
spawning, scoring") sits close enough that every crop attempt either
included text fragments or clipped part of the illustration itself.
Multiple boundary refinements were tried (see git history of this pass
for the iteration); none produced a clean result at usable quality.

`public/assets/arcade/classical/game-logic-orbital.svg` (a custom,
upgraded SVG — see below) is used instead, matching the mock's own
concept (a sun with orbital rings) and referencing the section's actual
copy ("Movement, Collisions, Spawning, Scoring") in its composition:
motion-path ellipses, a moving body, a collision-impact burst, a spawn
marker, and scoring HUD ticks.

## Custom SVG fallback retained

`public/assets/arcade/classical/game-logic-orbital.svg` is the only
custom fallback still in active use (referenced by
`ClassicalArcadeRoom.jsx`'s `HowBuiltSection`), for the reason above.

The four superseded game-card SVGs (`orbit-defender.svg`,
`pixel-foundry.svg`, `circuit-runner.svg`, `eco-stack.svg`) and the two
superseded How-Was-This-Built SVGs (`art-assets-ship.svg`,
`ai-agent-systems.svg`) are no longer present in
`public/assets/arcade/classical/` — once nothing in the live component
referenced them, they were removed rather than left as unreferenced
clutter alongside the real photos now doing their job.
