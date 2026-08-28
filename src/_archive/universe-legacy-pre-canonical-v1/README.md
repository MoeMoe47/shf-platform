# Legacy Universe (pre-canonical-V1) — archived, non-canonical

This implementation is historical and non-canonical.

It was retired when the approved cinematic Silicon Heartland Universe V1
became the sole canonical Universe experience.

Do not route production/application traffic to this implementation.

## What this was

Prior to the canonical migration, this repository's root entry
(`index.html` / `src/entries/index.main.jsx`) unconditionally mounted
`SiliconHeartlandUniversePage.jsx` as SHRV1's homepage — a self-contained,
custom-routed (`window.history.pushState`-based) 3D-styled Universe scene
with its own destination catalog (`universeWorldCatalog.js`), CSS
(`universe.css`), and canvas layer (`UniverseCanvas.jsx`).

It was never registered under a dedicated `/universe` route — it *was*
the site root — and it had no relationship to the approved cinematic
Universe V1 (`SHU_UNIVERSE_V1_BLACK_IVORY_MASTER_V2.png` and the
`shu-cinematic-browser-preview-v1` reference implementation), which was
developed independently and later designated the sole canonical Universe
landing experience for the Silicon Heartland ecosystem.

## What's here

| Archived path | Original location |
|---|---|
| `pages/universe/SiliconHeartlandUniversePage.jsx` | `src/pages/universe/SiliconHeartlandUniversePage.jsx` |
| `pages/universe/universe.css` | `src/pages/universe/universe.css` |
| `pages/universe/scenes/UniverseCanvas.jsx` | `src/pages/universe/scenes/UniverseCanvas.jsx` |
| `components/universe/UniverseLayer.jsx` | `src/components/universe/UniverseLayer.jsx` |
| `data/universe/universeWorldCatalog.js` | `src/data/universe/universeWorldCatalog.js` |
| `styles/universe.css` | `src/styles/universe.css` (an unused placeholder stub — never held real rules) |
| `entries/bootApp.jsx` | `src/entries/bootApp.jsx` (dead entry point — imported the legacy CSS/layer above but was never referenced by any `.html` entry or router) |
| `tests/universe.spec.mjs` | `tests/ui/universe.spec.mjs` (asserted the legacy scene's own behavior — historical evidence only, not run against the canonical Universe) |
| `scripts/check_universe_world_catalog.mjs` | `scripts/check_universe_world_catalog.mjs` (a standalone Node CLI validator for the legacy catalog, predating this migration and not referenced by any `package.json` script — found during the canonical migration's stale-reference sweep. Its relative import (`../src/data/universe/universeWorldCatalog.js`) is left unfixed, same as the other files here: it is retired tooling for retired data, not meant to run.) |

`src/pages/universe/components/` existed as an empty directory with no
files and was removed along with the rest of the empty parent
directories once these files moved.

## Why it was retired, not deleted

Per the canonical migration decision (see
`docs/architecture/universe/SILICON_HEARTLAND_UNIVERSE_CANONICAL_LANDING_V1.md`),
having two independently-maintained Universe implementations was causing
architectural and operational confusion. Deleting this code would destroy
a real, functioning implementation and its history for no operational
benefit — archiving preserves it for forensic/reference purposes while
guaranteeing it can no longer be reached through live application
routing (confirmed: nothing outside this archive folder imports from it).

## Canonical replacement

`src/pages/universe-v1/` — mounted from both `index.html` (site root) and
the new `universe.html` entry, reachable at `/` and `/universe`.
