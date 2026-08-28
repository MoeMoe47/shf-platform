# SILICON HEARTLAND UNIVERSE
# BATCH 01 - ROOT VERTICAL-SLICE FOUNDATION

> **Superseded.** This document records the development history of the
> `SiliconHeartlandUniversePage` implementation described below, which
> was retired during the canonical Universe migration and archived at
> `src/_archive/universe-legacy-pre-canonical-v1/`. It is kept as a
> historical record, not as current architecture. For the canonical
> implementation, see
> `docs/architecture/universe/SILICON_HEARTLAND_UNIVERSE_CANONICAL_LANDING_V1.md`.

## Purpose

Batch 01 establishes the Silicon Heartland Universe as the public root presentation and navigation layer. It replaces the temporary root launcher without creating a new application, authority layer, registry, backend service, or deployment.

## Confirmed Root Placement

- HTML entry: `index.html`
- React entry: `src/entries/index.main.jsx`
- Universe page: `src/pages/universe/SiliconHeartlandUniversePage.jsx`
- `/studio/templates` remains routed to `src/pages/public/WebMakerPage.jsx`.

## Architecture Boundary

The Universe is a presentation consumer. It does not own institutional truth, trust, certification, governance, public approval, evidence, access control, command-center behavior, Package H behavior, Truth Spine behavior, or Oracle behavior.

## Component And Runtime Flow

`index.html` loads `src/entries/index.main.jsx`. The root entry applies existing global styles, keeps `RootProviders`, preserves `/studio/templates`, and lazy-loads `SiliconHeartlandUniversePage`.

`SiliconHeartlandUniversePage` owns experience phase state, reduced-motion detection, WebGL fallback selection, navigation timing, and accessible DOM destination navigation.

`UniverseCanvas` owns Three.js rendering, camera motion, generated star field, Earth horizon mesh, coordination beacon, reusable world rendering, and the shooting-star timer.

## World Presentation Contract

World presentation lives in `src/data/universe/universeWorldCatalog.js`.

The catalog stores Batch 01 presentation metadata only:

- stable world ID
- display and short names
- accessible description
- position and scale
- reveal timing
- visual palette
- destination reference
- availability

It is not a canonical institutional registry.

## Destination Resolution Strategy

Destination resolution is centralized in `resolveUniverseDestination`. Batch 01 enables only confirmed existing public entries:

- `foundation.html#/`
- `solutions.html#/`

The SHS BOS world is rendered as destination pending because no specific public BOS entry was introduced in this batch.

## Accessibility Strategy

Canvas content is supportive and marked from the root page as non-essential to screen readers. The destination list is semantic DOM navigation with visible focus states, screen-reader labels, disabled semantics for unavailable destinations, and a skip path.

Reduced-motion users bypass the long cinematic transition and keep the same destination information.

WebGL failure falls back to a static institutional navigation section.

## Asset Provenance Status

Inspected assets:

- `public/assets/earth-horizon.png`: 2048 x 1365 PNG, 5,278,945 bytes, used provisionally as a background layer.
- `public/assets/cosmic/stars.png`: 1536 x 1024 PNG, 2,406,687 bytes, used provisionally as a background layer.
- `public/assets/earth/earth_day.jpg`: 14-byte text placeholder, not used.
- `public/assets/earth/earth_night.jpg`: 14-byte text placeholder, not used.
- `public/assets/earth/earth_bump.png`: 14-byte text placeholder, not used.
- `public/space/starfield.jpg`: 14-byte text placeholder, not used.

No licensing or provenance record was found for the reused visual assets during Batch 01. They remain provisional and require art-direction/provenance review before final production approval.

## Performance Strategy

- Universe page is lazy-loaded from the root entry.
- The heavy canvas scene is separately lazy-loaded from the page.
- Stars are shader-driven points, not React elements.
- Frame animation mutates Three.js objects and shader uniforms, not React state.
- Device pixel ratio is clamped in the Canvas.
- Shooting star uses delayed timers and is disabled for reduced motion.
- DOM shell and fallback remain meaningful without WebGL.

## Files Changed

- `index.html`
- `src/entries/index.main.jsx`
- `src/data/universe/universeWorldCatalog.js`
- `src/pages/universe/SiliconHeartlandUniversePage.jsx`
- `src/pages/universe/scenes/UniverseCanvas.jsx`
- `src/pages/universe/universe.css`
- `scripts/check_universe_world_catalog.mjs`
- `tests/ui/universe.spec.mjs`
- `docs/architecture/SILICON_HEARTLAND_UNIVERSE_BATCH_01_ROOT_VERTICAL_SLICE_FOUNDATION.md`

## Validation Commands

- `node scripts/check_universe_world_catalog.mjs` - PASS, `UNIVERSE_WORLD_CATALOG_VALID worlds=3`.
- `npm run manifests:validate` - PASS, `Manifest validation OK (17 manifests)`.
- `npx playwright test tests/ui/universe.spec.mjs` - PASS, 6 passed in 28.2s when Chromium was allowed to launch outside the sandbox. The first sandboxed attempt failed before page load because Chromium could not register its macOS Mach port.
- `npm run build` - PASS, built in 46.56s. Existing Vite warnings remained for circular manual chunks and chunks larger than 700 kB.

## Known Limitations

- Asset provenance is unknown for the provisional Earth horizon and star PNG.
- The generated Three.js Earth is intentionally restrained and not final commissioned art.
- BOS is represented as a visible but non-navigable Batch 01 world until a public destination is approved.
- Exact FPS, LCP, and bundle-size budgets were not measured by a dedicated performance harness in this batch.

## Deferred Work

- Commission or approve production Universe assets.
- Integrate a public-safe destination contract if one becomes available outside the Universe-local adapter.
- Add future worlds only after ownership and public destination contracts are confirmed.
- Add deeper visual regression and performance budget automation.

## Batch 02 Entry Criteria

- Approved visual asset provenance or replacement assets.
- Confirmed public destination contract for any additional worlds.
- Decision on BOS public entry route.
- Performance measurement workflow for FPS and initial transfer budgets.

## Batch 01R Visual Reconstruction

Batch 01R is a controlled visual reconstruction of the existing Batch 01 Universe implementation. It does not add worlds, activate the SHS BOS destination, introduce a new registry, replace the root integration, or redesign destination applications.

### Why Reconstruction Was Required

Rendered desktop and mobile evidence from `/private/tmp/silicon-heartland-universe-verification/` showed that the first Batch 01 visual pass read as a prototype rather than a premium institutional universe. The rejected output included an oversized flat-blue Earth, blurry bubble-like stars, equal colored sphere worlds, colliding labels, mobile crowding, and ordinary destination-card presentation.

### Preserved Architecture

- Root integration remains `index.html` and `src/entries/index.main.jsx`.
- `/studio/templates` still routes to `src/pages/public/WebMakerPage.jsx`.
- Phase state remains owned by `SiliconHeartlandUniversePage` through the existing reducer.
- Destination resolution remains centralized in `resolveUniverseDestination`.
- The three-world Batch 01 catalog remains the presentation source.
- SHF and SHS remain enabled through existing public entries; SHS BOS remains disabled.
- Accessible DOM navigation, skip behavior, reduced-motion behavior, and WebGL fallback remain part of the root page.

### Asset Sources And Licensing

Batch 01R does not introduce third-party downloaded textures. Production-rights review was therefore not required for new binary assets. The previous repo assets remain as follows:

- `public/assets/earth-horizon.png`: 2048 x 1365 PNG, 5,278,945 bytes, provenance unknown, used only as a subdued non-WebGL/fallback background reference.
- `public/assets/cosmic/stars.png`: 1536 x 1024 PNG, 2,406,687 bytes, provenance unknown, no longer used as the primary star treatment.
- `public/assets/earth/earth_day.jpg`: 14-byte text placeholder, not production-appropriate.
- `public/assets/earth/earth_night.jpg`: 14-byte text placeholder, not production-appropriate.
- `public/assets/earth/earth_bump.png`: 14-byte text placeholder, not production-appropriate.
- `public/space/starfield.jpg`: 14-byte text placeholder, not production-appropriate.

The reconstructed WebGL Earth and worlds use generated `CanvasTexture` materials in `src/pages/universe/scenes/UniverseCanvas.jsx`. These are procedural placeholders with no third-party license dependency, but they should not be treated as final commissioned production planet assets.

### Texture Resolution Strategy

Procedural Earth textures are generated at 2048 pixels wide on desktop and 1024 pixels wide on tablet/mobile. Procedural world textures are generated at 1024 pixels wide on desktop and 512 pixels wide on tablet/mobile. The textures are cached in module scope for reuse and avoid adding large source binaries or forcing 8K transfers to mobile devices.

### Earth Reconstruction

The arrival Earth was rebuilt as a real Three.js sphere with generated surface detail, cloud bands, a subdued atmosphere shell, directional lighting, and a shadowed night side. Its camera framing anchors the lower frame while preserving negative space for the headline and action. During reveal, Earth recedes into the deep background instead of remaining a dominant fourth body.

### Starfield Reconstruction

The starfield was rebuilt as deterministic buffer geometry with seeded positions, color-temperature variation, bounded point sizes, sparse brighter anchors, depth distribution, and independent low-amplitude twinkle phases. Star counts adapt by viewport tier: 1420 desktop, 980 tablet, and 620 mobile. The CSS background no longer depends on the previous blurry star PNG as the primary visual.

### Shooting-Star Implementation

The shooting star remains automated in full-motion Universe phases, is disabled for reduced motion and mobile, schedules at a randomized production interval between 45 and 75 seconds, avoids simultaneous instances, pauses triggering when the document is hidden, and cleans up timers. A narrow visual-test hook, `?universeVisualTest=1`, shortens the delay only for deterministic rendered evidence capture.

### World Materials

The existing catalog now centralizes world-specific procedural material fields: seed, surface palette, roughness, metalness, rotation speed, ring speed, label offset, and ring definitions. SHF receives warmer civic/regenerative material cues; SHS receives infrastructure-blue material with restrained orange network accents; SHS BOS receives a deeper gold/blue systemic material while remaining disabled.

### Coordination Beacon

The Universe Core was rebuilt as a compact luminous octahedral coordination beacon with thin orbital rings and restrained gold/ivory light. It is presentation-only and intentionally distinct from the three worlds.

### Camera Timeline

The camera keeps the existing phase architecture while changing the motion shape: quiet arrival, smooth Earth departure, progressive world reveal, stable spatial hierarchy, and destination approach after selection. Reduced-motion users bypass the long flight and receive the stable navigation state quickly.

### Label And Navigation Strategy

Desktop projected labels now use short labels with leader-line treatment and active focus feedback. Tablet and mobile hide projected labels to prevent collision and use the DOM destination rail as the stable accessible selector. Destination controls were restyled from large equal cards into a compact contextual rail with one focus panel and destination index controls.

### Mobile Art Direction

Mobile uses separate camera/framing decisions, reduced star count, hidden projected labels, horizontally scrollable destination controls, and a tighter Earth composition. It does not simply shrink the desktop grid.

### Accessibility Preservation

Batch 01R preserves the semantic heading, keyboard-accessible `Enter the Universe`, skip link, keyboard-accessible destination controls, visible focus states, disabled BOS semantics, reduced-motion path, WebGL fallback, and DOM navigation independent of WebGL.

### Performance Measurements

Measured facts from `npm run build` after Batch 01R:

- `dist/index.html`: 2.10 kB, gzip 0.60 kB.
- Root entry chunk `dist/assets/index-f7IPj194.js`: 2.16 kB, gzip 1.02 kB.
- Main shared `pages` chunk containing the Universe module after build: `dist/assets/pages-DKc80ktu.js`, 421.03 kB, gzip 95.24 kB.
- Existing Vite warnings remain for circular manual chunks and chunks larger than 700 kB. These warnings predate the visual reconstruction scope and were not changed by Batch 01R.
- Final evidence artifact sizes include desktop video 4.8 MB and mobile video 1.3 MB under `/private/tmp/silicon-heartland-universe-batch01r/`.

Unmeasured: FPS, LCP, GPU frame time, and full network transfer waterfall were not measured with a dedicated performance harness.

### Visual Evidence

Final visual evidence was captured under `/private/tmp/silicon-heartland-universe-batch01r/`:

- Desktop recording: `desktop-1440x900-batch01r-verification.webm`.
- Mobile recording: `mobile-390x844-batch01r-verification.webm`.
- Desktop screenshots: arrival, shooting star, mid-transition, stable Universe, coordination beacon, each world focused, keyboard focus, destination transition, reduced motion, and WebGL fallback.
- Tablet screenshot: `tablet-768x1024-stable-universe.png`.
- Mobile screenshots: arrival, mid-transition, stable Universe, and focused destination.

### Known Limitations

- Procedural generated materials are legally safe placeholders but are not a substitute for final approved production planet texture assets.
- Existing fallback background asset provenance remains unknown.
- The build still emits existing manual chunk/circular chunk warnings.
- Dedicated FPS, LCP, and GPU measurements remain future work.

### User-Review Status

Batch 01R internal implementation and rendered verification are complete for user visual review. This document does not claim user approval.

## First-Design Controlled Visual Restoration

The Batch 01R visual direction was rejected by the user on 2026-07-31. The first rendered Universe implementation, captured before Batch 01R under `/private/tmp/silicon-heartland-universe-verification/`, became the binding restoration target.

### Exact Restoration Source

The restoration source was the pre-Batch-01R inspected source state for:

- `src/pages/universe/scenes/UniverseCanvas.jsx`
- `src/pages/universe/universe.css`
- visual sections of `src/pages/universe/SiliconHeartlandUniversePage.jsx`
- visual presentation fields in `src/data/universe/universeWorldCatalog.js`
- corresponding `tests/ui/universe.spec.mjs` control-label expectations

The proof target was the original visual evidence in `/private/tmp/silicon-heartland-universe-verification/`, especially `desktop-01-arrival.png`, `desktop-03-stable-universe.png`, and `mobile-03-stable-universe.png`.

### Files And Hunks Restored

- `src/pages/universe/scenes/UniverseCanvas.jsx`: restored the first large flat-blue Earth sphere, additive blurred star shader, simple colored world materials, original labels, original coordination beacon, original shooting-star behavior, original camera positions, and original renderer settings.
- `src/pages/universe/universe.css`: restored the first background treatment, typography scale, large arrival composition, relative destination-card section, mobile stacked cards, and original responsive breakpoints.
- `src/pages/universe/SiliconHeartlandUniversePage.jsx`: restored `Show destinations`, `Opening spatial navigation`, `Choose a destination`, and the original three-card destination navigation markup.
- `src/data/universe/universeWorldCatalog.js`: removed Batch 01R-only procedural material fields and restored the first simple visual palette contract.
- `tests/ui/universe.spec.mjs`: restored test expectations for the first-design `Show destinations` control while preserving functional and responsive coverage.

### Technical Improvements Retained

The broader Batch 01 root architecture remains retained: public-root integration, provider chain, reducer phases, central destination resolver, code splitting, WebGL fallback, reduced-motion path, skip path, accessible DOM navigation, SHF/SHS routing, disabled SHS BOS semantics, and `/studio/templates` preservation.

### Batch 01R Visual Elements Removed

Removed the rejected procedural Earth/world texture system, seeded sharp starfield, 01R compact spatial rail, 01R focus panel, 01R mobile horizontal selector, 01R hidden tablet/mobile projected labels, 01R tone-mapping changes, 01R camera profiles, 01R production visual-test query hook, and 01R `Destinations` button label.

### Assets Restored Or Retained

No assets were downloaded, deleted, or replaced. The first-design use of existing `public/assets/cosmic/stars.png` and `public/assets/earth-horizon.png` as background layers was restored. Existing placeholder Earth/space files remain unused.

### Validation Results

- `node scripts/check_universe_world_catalog.mjs`: PASS, `UNIVERSE_WORLD_CATALOG_VALID worlds=3`.
- `npm run manifests:validate`: PASS, `Manifest validation OK (17 manifests)`.
- `npm run ui:validate`: PASS, `UI contracts validated (1)`.
- `npx playwright test tests/ui/universe.spec.mjs`: PASS, 10 passed in 27.9s.
- `npm run build`: PASS, built in 38.23s. Existing circular manual chunk warnings and chunk-size warnings remain.

### Restoration Evidence

Final restoration evidence was captured under `/private/tmp/silicon-heartland-universe-restored-first-design/`:

- `desktop-1440x900-restored-first-design.webm`
- `mobile-390x844-restored-first-design.webm`
- `desktop-01-arrival.png`
- `desktop-02-mid-transition.png`
- `desktop-03-stable-universe.png`
- `desktop-04-coordination-center.png`
- `desktop-05-focus-shf.png`
- `desktop-05-focus-shs.png`
- `desktop-06-keyboard-focus.png`
- `desktop-07-destination-transition.png`
- `desktop-08-reduced-motion.png`
- `desktop-09-webgl-fallback.png`
- `mobile-01-arrival.png`
- `mobile-02-mid-transition.png`
- `mobile-03-stable-universe.png`
- `mobile-04-focused-destination.png`

### Visual Comparison Summary

| Area | Original preferred version | Restored version | Match status | Remaining difference |
| --- | --- | --- | --- | --- |
| Arrival composition | Large left headline, oversized foreground Earth, blurred star field | Same composition restored | Match | Star positions vary because the first implementation uses random generation |
| Earth | Large flat-blue sphere with atmosphere overlay | Same first-design sphere restored | Match | Frame-to-frame rotation/star context may differ |
| Stars | Blurry additive/bubble star treatment | Same shader and background treatment restored | Match | Random seed is not fixed |
| Worlds | Simple colored spheres with rings | Same simple materials and placements restored | Match | Random star background differs |
| Coordination center | Small gold core with rings | Same beacon restored | Match | None material |
| Typography | Original large headline and phase-resized heading | Same CSS restored | Match | None material |
| Navigation | `Show destinations`, `Universe Core`, three destination cards | Same controls and cards restored | Match | None material |
| Desktop framing | Large canvas plus lower destination section | Same framing restored | Match | Random star distribution |
| Mobile framing | Crowded first-design canvas and stacked cards | Same mobile layout restored | Match | Random star distribution |

### User-Approval Status

The first visual design has been restored and verified internally against available evidence. This record does not claim final user approval.

`FIRST_DESIGN_RESTORED_READY_FOR_USER_REVIEW`
