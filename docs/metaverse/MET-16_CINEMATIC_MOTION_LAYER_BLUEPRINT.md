# MET-16 — Cinematic Motion Layer Blueprint

Planning / architecture only. No overlay, video, shader, or animation is
implemented by this document. See `MET-16_MOTION_ZONE_MAP.md` for the zone-by-
zone data this architecture consumes, `MET-16_CLEAN_MASTER_PLATE_SPEC.md` for
the master-plate requirements it assumes, and `MET-16_IMAGE_GENERATION_BRIEF.md`
for the next asset-generation brief.

## Why This Replaces MET-15's Runtime Tracing

The previous approach (`MetaverseVehicleLayer.jsx`, `MetaverseTrafficLayer.jsx`,
`MetaverseRiverMotionLayer.jsx`, all retired — see
`docs/metaverse/MET-15K_CLEANUP_NOTES.md`) computed vehicle and water positions
at runtime from traced polylines and rendered them as live CSS/SVG shapes.
That produced motion that didn't read as believable against the production
plate — road tracing didn't line up as convincing traffic, and river tracing
didn't produce convincing water. MET-16 replaces this with **pre-aligned
cinematic overlays**: motion is authored once, against the actual final plate,
as a small number of transparent assets placed at fixed, hand-verified
positions — not derived at runtime from abstract polyline math.

## 1. Canonical Architecture

```
1. BASE CITY PLATE          — opaque, static, one per time-of-day variant
2. WATER MOTION LAYERS       — masked/alpha overlays, bounded to water zones
3. TRAFFIC MOTION LAYERS     — pre-aligned transparent vehicle/bus loops
4. BUILDING / CITY LIFE      — restrained decorative light variation
5. ATMOSPHERIC LAYERS        — clouds, distant aircraft
6. INTERACTIVE WORLD LAYERS  — markers, presence, events, activity (existing, software-driven)
7. UI                        — sidebar, drawer, mini map, HUD (existing)
```

Layers 2–5 are DECORATIVE and carry `data-authority="presentation-only"`
exactly like the current `MetaverseLivingCityLayer` — none of them may gate
entry, unlock, fast travel, or any business-logic decision. Layer 6 is the
existing software stack (`MetaverseBuildingActivityLayer`,
`MetaverseEventOverlayLayer`, `MetaversePresenceOverlayLayer`, district/facility
markers) and is unaffected by this blueprint. Layer 7 is unaffected.

## 2. Base Master Plate Rules

See `MET-16_CLEAN_MASTER_PLATE_SPEC.md` for the full spec. Summary: the plate
is opaque, static, high-resolution, free of baked-in motion (no traffic, no
rapids, no light trails, no motion blur, no UI, no labels), and identical in
geometry across DAY/DUSK/NIGHT — only grading changes between variants.

## 3. Geometry Lock

One master composition. DAY/DUSK/NIGHT are graded variants of the same
underlying geometry, not three independently generated cities. Roads, bridges,
water edges, district building placement, skyline silhouette, and turbine
position must not shift between variants — this is what lets a single set of
motion-overlay coordinates (see the zone map) serve all three time-of-day
variants without re-alignment. This mirrors the rule the current registries
already enforce (`metaverseRoadTraceRegistry.js` / `metaverseRiverFlowRegistry.js`
are traced once, against one plate, and reused for DAY/DUSK/NIGHT via the
shared 0–100 scene-percentage coordinate system that `metaverseCameraProjection.js`
keeps stable across viewport/zoom/pan).

## 4. Motion Zone Classification

- **A. ANIMATE** — traffic corridors T1–T7, water zones W1–W5 (W5 conditional),
  building/bridge light zones BL1–BL5/BR1, turbine TUR1 (conditional),
  atmosphere ATM1–ATM2. All DECORATIVE, presentation-only.
- **B. STATIC** — everything else in the plate: full district architecture,
  parks/landscaping, parked/background vehicles not on an animated corridor,
  T8 (deferred — no verified geometry), background skyline detail not covered
  by BL3, solar arrays, non-turbine infrastructure.
- **C. INTERACTIVE SOFTWARE** — district/facility markers, destination labels,
  hover/selected glow, avatar, mission indicators, location/access state, fast
  travel, Mini Map, right drawer, sidebar, presence, event overlays, source-
  backed building-activity markers (`METAVERSE_BUILDING_EFFECTS`). All already
  implemented as software layers; not touched by this blueprint.

## 5. Traffic Strategy

Full corridor detail in `MET-16_MOTION_ZONE_MAP.md` §A. Summary:

- 4 essential (P0) corridors: T1 (main cable-stayed bridge), T2 (waterfront/
  southeast crossing), T3 (central civic boulevard), T5 (foreground civic
  approach). This matches the "4–6 primary corridors" target at the
  conservative end, favoring visual impact over coverage.
- 1 high-value (P1) corridor: T4 (Data Center interchange loop).
- 1 additional secondary (P1): T6 (Data Center Crescent).
- 1 optional (P2): T7 (small arch bridge, single-vehicle only).
- 1 explicitly deferred (P3): T8 (residential/community local streets — no
  verified geometry exists; do not fabricate one).
- Buses limited to exactly 2 corridors (T3, T4), matching existing
  `BUS_ROUTE_01`/`BUS_ROUTE_02` and the "1–2 bus-capable routes, wide arterials
  only" rule. `BUS_ROUTE_03` (East District Shuttle) remains documented but is
  not promoted to an animated corridor in V1 — it would be a third bus route
  on a corridor (T1/T6) not otherwise bus-primary.
- Do not animate every road: excluded corridors from `metaverseRoadTraceRegistry.js`
  (`METAVERSE_EXCLUDED_ROAD_CORRIDORS`) stay excluded here for the same
  documented reasons (decorative loops, pedestrian promenades, service lanes,
  unresolvable far-background streets).

### Traffic Overlay Type

**Preferred default: pre-aligned transparent alpha-video loops (WebM, VP9 +
alpha) for the two highest-value, most foreground-visible corridors (T1, T2,
T5's foreground band), and transparent PNG sprite-sheet sequences for the
remaining lower-density corridors (T3, T4, T6, T7).**

Rationale:
- Alpha WebM gives the best visual quality (real motion blur, lighting,
  reflection interaction baked in at authoring time) at a fixed, small file
  size, and is broadly supported in evergreen Chromium/Firefox/Safari via
  `<video>` with a VP9+alpha or HEVC+alpha source; a canvas/WebGL fallback can
  composite it as a texture where native alpha-video isn't available.
- Sprite-sheet PNG sequences are cheaper on the CPU/GPU compositing budget
  (no video decoder needed) and are the right choice for the lower-density,
  lower-visual-priority corridors, where a handful of positioned, looping
  sprite frames read convincingly without needing full cinematic fidelity.
- Canvas/WebGL texture sequences are reserved as a future upgrade path if
  per-frame color grading (tying vehicle lighting to the live DAY/DUSK/NIGHT
  toggle rather than baking three separate loops) becomes worth the added
  complexity; not the V1 default.

**Fallback:** if alpha-video isn't supported or fails to decode (older mobile
browsers, data-saver modes), fall back to the sprite-sheet path for every
corridor, including T1/T2/T5 — same positions, same zone data, lower visual
fidelity, not a missing layer. Under `prefers-reduced-motion`, all traffic
layers are removed entirely (matches current `reducedMotionBehavior: "HIDE"`
convention already used by `METAVERSE_TRAFFIC_PATHS`/`METAVERSE_TRANSIT_PATHS`).

### Vehicle Visual Rules

Per corridor, DAY/DUSK/NIGHT vehicle treatment follows the zone map exactly:
DAY favors small, restrained bodies with no light trails; DUSK adds subtle
headlights and mild reflection emphasis; NIGHT drops toward headlight/taillight
silhouettes doing most of the visual work, with no exaggerated long-exposure
streaks and only subtle road reflection. Buses stay on T3/T4 only, never on
T7 (small curved/arch bridge) — large-vehicle assets require exact alignment
to the corridor's real lane width, which only T3/T4's wide arterial geometry
supports.

## 6. Water Strategy

Full zone detail in `MET-16_MOTION_ZONE_MAP.md` §B. No traced river path
drives motion directly — zones are bounded masks, and the existing
`metaverseRiverFlowRegistry.js` geometry (flow paths, water zones, exclusion
zones) is reused only as the *reference outline* for building those masks, not
as a live animation driver.

### Water Overlay Type

Evaluated for each use case:

| Use case | Preferred method | Why |
|---|---|---|
| Main river (W1/W2/W4) | **B. Masked animated noise/displacement inside a static mask** | Gives continuous, direction-controllable flow and reflection response without per-frame video weight; the mask is authored once against the real water outline (reusing `metaverseRiverFlowRegistry.js` geometry) and reused across DAY/DUSK/NIGHT by only changing the color/light-response lookup, not the motion itself. |
| Subtle background reflections (W3, W-pond) | **D. Shader/canvas ripple inside a static mask, or a plain static reflection texture swapped per time-of-day** | These zones are intentionally near-static; a full animated technique is unjustified weight for a background element that should not draw attention (per Section 13's "avoid heavy particles/obvious looping"). |
| Optional whitewater (W5) | **A. Alpha video texture, precisely masked** | Convincing whitewater needs real turbulence detail (foam break-up, spray) that noise/displacement can't fake convincingly at this scale; a short, tightly masked alpha-video loop aligned to the exact rapids geometry is the only method in this list that can deliver that without reading as fake streaks — but only if Section 8's justification test passes. |

Sprite loops (C) are the fallback for W5 and W3 on constrained devices (see
Performance Budget) where alpha video isn't affordable.

## 7. Rapids / Whitewater Decision

`RAPIDS_ZONE_01` already exists as geometrically-verified reference data
(point-in-polygon and line-intersection checked against every road trace,
documented as a civic, Grand-Rapids-style broad/shallow feature immediately
downstream of `BRIDGE_01`) — it is the one location in the current plate that
was deliberately, evidence-based chosen as visually supporting a whitewater
treatment, not an arbitrary "moving water would look nice" pick.

**Decision: CONDITIONAL KEEP (W5, P2).** Whether it ships depends on the new
clean master plate, not on this document:

- If the new plate's redesigned river still shows a narrowing, drop, or
  civic weir/rock feature at this location (i.e., the composition preserves
  what made `RAPIDS_ZONE_01` justified in the first place), W5 proceeds as a
  masked alpha-video whitewater loop, precisely aligned to that feature.
- If the new plate's river through this area reads as plain open water with
  no such feature, W5 is dropped and the area is treated as ordinary W1/W4
  directional flow + shimmer — no fake painted streaks, no whitewater texture
  forced onto geometry that doesn't support it.

This mirrors the same discipline `metaverseRiverFlowRegistry.js` already
applied when it rejected an earlier rapids candidate west of `BRIDGE_01` for
crossing a road.

## 8. Building / City Life Plan

Full zone list in `MET-16_MOTION_ZONE_MAP.md` §C. Effects are restrained by
design: occasional window-light variation, small signage glow, a single
rooftop beacon blink, and (at night only) a modest uptick in window activity —
never a synchronized grid flicker, never a whole-skyline animation, and never
enough that the city reads as an arcade. The majority of buildings, including
every building not listed in a BL/BR zone, remain fully static. These layers
are independent of and additional to the existing source-backed
`METAVERSE_BUILDING_EFFECTS` markers, which stay in the Interactive Software
Layer and are not decorative.

### Night Light Activity

At NIGHT: window activity may increase slightly over DUSK, district facility
lighting stays modest and localized, bridge lighting stays restrained/
architectural (BR1). No large pulsing neon, no random flashing, no whole-city
glow animation — this matches the correction already made in MET-15M (see
`docs/metaverse/` NIGHT fidelity report): NIGHT should look luminous and
crisp via real light detail in the plate and restrained accents, not via a
global brightening or animation trick layered on top.

## 9. Wind Turbine Decision

**Decision: EVALUATE AT GENERATION TIME, DEFAULT TO STATIC FOR V1.**

TUR1 (the Infrastructure Zone turbine within `TURBINE_CROSSING`, adjacent to
`BRIDGE_02`) is a good candidate for a separate slow-rotation blade overlay —
the source composition already isolates it as a single, recognizable
landmark, not a field of many turbines needing synchronized-looking motion.
If the image-generation pass can produce a version of the plate with the hub
static and the blades either isolated on their own layer or trivially
paintable back in after being removed from the base plate, proceed with a
blade overlay: static tower/hub in the master plate, blade overlay anchored to
the exact hub position, slow natural rotation, timed independently of any
other looping asset (avoid synchronized speeds with anything else that
rotates/loops). If clean separation isn't practical from the generated plate,
document turbine motion as **STATIC for V1** and revisit only in a future
phase with a dedicated turbine asset pass. No implementation occurs in either
case during MET-16.

## 10. Atmosphere Plan

Reuses the existing, already-accepted cloud/bird rules in
`docs/metaverse/MET_LIVING_CITY_VISUAL_RULES_V1.md` verbatim — 1–2 soft,
semi-transparent cloud layers with far-slower-than-near drift, no storm look,
static or removed under reduced motion; birds sparse (1–3 visible), slow,
long gaps, removed/reduced under reduced motion. ATM2 (distant aircraft
lights) is new for MET-16: night-only, single-instance, very sparse, never
more than one visible at a time, no blinking pattern loud enough to draw
attention from the skyline. No particles, no fantasy effects, no dust/haze
dominating the city per Section 13.

## 11. Reflection Plan

Reflections are planned independently of the vehicle-body overlays so they
can render even if traffic layers are disabled (reduced motion, low
performance mode):

- **Bridge lighting reflections** (BR1 → water surface below T1/T2) — soft,
  DUSK/NIGHT only.
- **Skyline reflections** (BL3 → W1/W2 surface) — soft, DUSK/NIGHT only.
- **Moving headlight reflections** — only where a traffic overlay (T1, T2,
  T5) directly borders a water zone (W1, W2); implemented as part of the
  water layer's light-response lookup (see §6 table), not as a separate
  per-vehicle asset.
- **Street lamp reflections** — folded into the general water-zone night
  treatment, not itemized per lamp.

All reflections stay soft/diffuse. No vertical neon-streak look unless a
specific bridge or tower is bright enough in the plate itself to physically
justify it — this is a rendering-restraint rule, not a stylistic default.

## 12. Depth / Perspective Model

| Band | Y range | Vehicle scale | Animation speed | Opacity | Atmospheric softness | Layer order |
|---|---|---|---|---|---|---|
| FAR | 0–42 | 1.0x–1.15x | Slowest (longest loop duration) | Full, but smallest/least detailed sprites | Highest (slight haze allowed) | Bottom of the traffic stack (L3) |
| MID | 42–72 | 1.2x–1.5x | Standard | Full | Light | Middle (L4) |
| NEAR | 72–100 | 1.5x–1.9x max | Fastest (shortest loop duration reads as closer/quicker) | Full, highest fidelity (video-tier assets preferred here) | None/minimal | Top of the traffic stack (L5) |

A foreground vehicle (T5, NEAR) must never share the same asset, scale, or
loop speed as a background/skyline-adjacent vehicle (T1's far end, FAR/MID);
this is enforced by keeping FAR/MID/NEAR as separate stack layers (L3/L4/L5)
with independently authored assets, not one scaled sprite reused across
bands.

## 13. DAY / DUSK / NIGHT Behavior

Not every layer needs three separate assets:

| Layer | Geometry reuse | What actually changes per variant |
|---|---|---|
| Water masks (W1–W5) | Identical mask/geometry across all three | Color grading and light-response lookup only |
| Traffic corridor paths (T1–T7) | Identical path/position across all three | Vehicle-body asset (headlights-dominant at night vs. visible body by day), density |
| Headlight/taillight glow | N/A — additive layer | DUSK: subtle; NIGHT: primary visual signal; DAY: absent |
| Window-activity layers (BL1–BL5) | Identical anchor positions | DUSK/NIGHT only; DAY is fully static (no asset needed) |
| Bridge lighting (BR1) | Identical geometry | DUSK/NIGHT only |
| Turbine rotation (TUR1, if implemented) | Identical hub position | Speed/appearance constant across all three — this one doesn't need per-variant tuning |
| Clouds/atmosphere (ATM1) | Identical layer | Color tint shifts with variant; motion unchanged |
| Distant aircraft (ATM2) | N/A | NIGHT only |

## 14. Performance Budget

Target: ordinary student laptops/tablets, not gaming hardware.

- **Simultaneous alpha-video overlays:** 2 maximum at once on desktop (T1 +
  T2, or T1 + T5, depending on which are in view/enabled) — never all three
  P0 video-tier corridors decoding simultaneously as a hard requirement; the
  layer manager should stagger or degrade to sprite fallback if more than 2
  would be required.
- **Total animated decorative layers active at once (desktop, HIGH mode):**
  ≤ 10 (traffic corridors + water zones + building lights + turbine +
  atmosphere combined), matching the zone map's P0/P1 counts.
- **Texture/sprite tile size:** cap individual overlay assets at 512×512 for
  sprite tiles and 720p for alpha-video loops — the overlay only needs to
  cover its own bounded zone, not the full 1672×941 plate.
- **Frame rate:** target 30fps for video-tier overlays (cinematic loops don't
  need 60fps to read as smooth at this scale); software/UI layers keep their
  existing 60fps target, unaffected.
- **Loop length:** 4–12 seconds per traffic/water loop — long enough to avoid
  an obvious repeat, short enough to keep asset size bounded.
- **Memory:** decorative-layer asset budget ≤ 25MB total resident at once
  (sum of currently-mounted overlay assets for the active scene), well below
  the ~150–300MB typical mobile browser tab budget once the base plate and UI
  are accounted for.
- **GPU compositing:** overlays use `transform`/`opacity` only for any
  positioning (matching the existing `.met-camera__world`/`.met-living-*`
  convention) so they composite on their own layer without forcing a repaint
  of the base plate.

Favor subtle motion and a low layer count over broad coverage — this is a
direct carry-over of the MET-15 living-city design law ("city receives 85–90%
of visual attention," "no permanent dashboard clutter") applied to motion
rather than UI chrome.

### Reduced Motion

All decorative motion (traffic, water, building lights, turbine, atmosphere)
is removed or reduced to a single static frame under
`prefers-reduced-motion`/the existing `data-reduced-motion` shell attribute —
same contract `.met-shell[data-reduced-motion="true"]` already enforces for
`.met-living-ambient`/`.met-living-building`/`.met-living-event` today.
Reflections may remain as static (non-animated) tints since they carry no
motion themselves.

## 15. Responsive / Reduced Motion

- **Desktop:** full motion set allowed within the performance budget above.
- **Tablet:** drop to secondary layers only where budget-constrained — keep
  P0 traffic (T1, T2, T3, T5) and W1/W2, drop P1/P2 (T4, T6, T7, W3–W5, BL2/
  BL4/BL5, TUR1, ATM2); this matches the existing `LOW` performance-mode
  precedent already defined in `livingCityRegistry.js`
  (`LIVING_CITY_PERFORMANCE_MODES`).
- **Mobile:** only the highest-value motion — W1 subtle water motion, 1–2
  main traffic corridors (T5 foreground + T3 or T1, whichever reads best at
  small viewport), and ATM1 at reduced density. No building-light layers, no
  turbine, no secondary water zones.
- **Reduced motion (any device):** continuous decorative motion is disabled
  or reduced to an extremely subtle/static state, per §14.

## 16. Implementation Boundaries (What This Phase Did Not Do)

- No image was generated or modified.
- No overlay asset (video, sprite sheet, shader) was created.
- No traffic or water motion was added, re-added, or re-enabled in production.
- No existing background, marker, sidebar, drawer, or canonical-domain logic
  was changed.
- `MetaverseLivingCityLayer.jsx` and its current mounted layers are unchanged;
  the MET-15K retirement of the runtime-traced vehicle/river-motion layers
  remains in effect.

## 17. Recommended Next Phase

**MET-17 — Clean Master City Plate Generation.** Not started; owner review
required before beginning, per the MET-16 stop condition.
