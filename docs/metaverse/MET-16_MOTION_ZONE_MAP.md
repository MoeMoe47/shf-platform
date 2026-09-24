# MET-16 — Motion Zone Map

Planning / reference only. No animation, overlay, or image asset is implemented here.

## Status

Architecture lock for the future Cinematic Living City Layer. Every zone below is
anchored to geometry already traced and visually verified against the current
production master plate (`metaverseRoadTraceRegistry.js`, `metaverseRiverFlowRegistry.js`,
`livingCityRegistry.js`). Per MET-16 Section 2 (Master Geometry Rule), the future
clean master plate must preserve this same composition, so this geometry is the
working reference for pre-alignment — it will need a final re-verification pass
once the actual clean plate exists (see `MET-16_CLEAN_MASTER_PLATE_SPEC.md`), but
is not expected to shift meaningfully.

Depth bands (shared with `metaverseRoadTraceRegistry.js`):
- `DEPTH_FAR` — y 0–42
- `DEPTH_MID` — y 42–72
- `DEPTH_NEAR` — y 72–100

Schema: `ZONE ID | TYPE | LOCATION | DEPTH | DAY | DUSK | NIGHT | OVERLAY FORMAT | PRIORITY | NOTES`

## A. Traffic Zones

| Zone ID | Type | Location | Depth | Day | Dusk | Night | Overlay Format | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| T1 | TRAFFIC (freeway+bridge) | Southwest cable-stayed bridge crossing (Data Center District landing → merges into T5). Geometry ref: `FREEWAY_02` + `BRIDGE_02`. | NEAR→MID | Light sedan flow, restrained, tiny scale. | Sedans + forming headlights; bridge cable lighting begins to read. | Headlight/taillight pairs do the visual work; cable-stay architectural lighting emphasized; no streak trails. | Alpha WebM | P0 | Strongest foreground bridge read per MET-15H audit. Cars only — `FREEWAY_02` is not bus-eligible; `BRIDGE_02`'s bus eligibility is reserved for T6/`BUS_ROUTE_03`, not this loop. |
| T2 | TRAFFIC (freeway+bridge) | Southeast river-crossing causeway. Geometry ref: `FREEWAY_03` + `BRIDGE_03` (provisional). | NEAR | Sparse light sedans. | Subtle headlights. | Taillights, subdued, lower intensity than T1. | Alpha WebM | P0 | `BRIDGE_03` is an interpretive/provisional extension of the same causeway, not an independent crossing — animate as one continuous corridor with `FREEWAY_03`, not two. |
| T3 | TRAFFIC (major road, bus-capable) | Central Civic Boulevard, directly south of Civic Plaza / City Hall. Geometry ref: `MAJOR_ROAD_04`. | MID | Light car flow + rare Civic Circulator bus. | Same, headlights forming. | Taillights + rare bus. | Transparent PNG sprite sequence | P0 | Designated bus corridor 1 of 2 — carries `BUS_ROUTE_01` (Civic Circulator, out-and-back, `RARE`/`SLOW`). |
| T4 | TRAFFIC (interchange, bus-capable) | Data Center access interchange loop. Geometry ref: `MAJOR_ROAD_02` + `MAJOR_ROAD_03`. | MID | Slow local car flow. | Headlights, low density. | Taillights, low density. | Transparent PNG sprite sequence | P1 | Designated bus corridor 2 of 2 — carries `BUS_ROUTE_02` (Data Center ↔ Civic connector). |
| T5 | TRAFFIC (freeway, foreground) | Civic approach / foreground south belt, bottom edge of frame. Geometry ref: `FREEWAY_01`. | NEAR | Most visually prominent corridor; small, restrained cars — no oversized foreground vehicles. | Headlights, mild wet-look pavement reflection. | Headlights/taillights are the primary visual signal; subtle road reflection. | Alpha WebM (highest resolution — closest to camera) | P0 | Closest-to-camera road; largest permitted vehicle scale (1.5–1.9x per `MET_ROAD_TRACE_SPEC_V1`) but still restrained. Freeway-streak-eligible in the old system — streaks are **not** reintroduced; pre-aligned vehicle loops replace that effect entirely. |
| T6 | TRAFFIC (secondary) | Left Data Center Crescent. Geometry ref: `MAJOR_ROAD_01`. | MID–NEAR | Sparse local traffic. | Sparse headlights. | Sparse taillights. | Transparent PNG sprite sequence | P1 | Secondary corridor; also carries the local leg of `BUS_ROUTE_02`. |
| T7 | TRAFFIC (secondary, bridge) | Central small arch bridge, Civic ↔ Treasury & Commerce. Geometry ref: `BRIDGE_01`. | MID | Rare single-vehicle crossing. | Same, rare. | Same, rare. | Transparent PNG sprite (very low density) | P2 | Optional. Not bus-eligible — cars only, at most one vehicle per loop. |
| T8 | TRAFFIC (deferred) | Residential / Student Life & Community District local streets. | FAR | — | — | — | TBD | P3 | No corridor defined. MET-15B explicitly excluded this area as "tiny far-background street, too small/ambiguous to trace confidently." Do not fabricate a corridor here — revisit only once the new clean master plate renders this area with resolvable geometry. |

## B. Water Zones

| Zone ID | Type | Location | Depth | Day | Dusk | Night | Overlay Format | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| W1 | WATER (main flow) | Central channel: `NORTH_CONFLUENCE` → `CENTRAL_BASIN` → `TURBINE_CROSSING` → `EAST_CAUSEWAY_CHANNEL`. Geometry ref: `MAIN_FLOW_01` / `FLOWING_WATER_MAIN`. | FAR→NEAR | Bright directional shimmer, sun-glint. | Warm/orange reflection streaks. | Cool blue-white reflection streaks; skyline and bridge-light reflections. | Masked animated noise/displacement inside a static mask | P0 | Anchor water feature; largest continuous body. |
| W2 | WATER (foreground reach) | `EAST_CAUSEWAY_CHANNEL` near-camera stretch, under/around `FREEWAY_03`/`BRIDGE_03`. | NEAR | Crisper foreground shimmer than the upstream reach. | Strongest warm reflection (largest sun-facing surface on the DUSK plate). | Bridge-light and skyline reflections read most clearly here. | Masked animated noise/displacement — higher-resolution mask tile than W1/W3 | P1 | Same hydrological body as W1; split out only because the near-camera depth band needs a higher-detail texture tile. |
| W3 | WATER (background) | `NORTH_CONFLUENCE` narrow headwaters below Civic Plaza, plus the distant background lake visible near the skyline horizon. | FAR | Minimal shimmer, mostly static with a slow subtle glint. | Reflection only, negligible motion. | Reflection only, negligible motion. | Transparent sprite loop at very low frame rate, or a static per-time-of-day reflection texture | P2 | Should read as calm/still — must not compete with W1/W2 for attention. |
| W4 | WATER (confluence/turbulence) | `TURBINE_CROSSING`, around the `BRIDGE_02` pier bases. Geometry ref: `TURBULENCE_ZONE_01` / `TURBULENCE_FLOW_01`. | MID | Light pier-wake ripple. | Same, warm-tinted. | Subtle, cool-tinted, restrained. | Masked animated noise/displacement, small tile | P1 | Support detail only; must stay visually subordinate to W5. |
| W5 | WATER (conditional whitewater) | `RAPIDS_ZONE_01`, `CENTRAL_BASIN` immediately downstream of `BRIDGE_01` — civic, Grand-Rapids-style broad/shallow feature. | MID | Visible whitewater texture, if the new plate supports it. | Warm-tinted foam highlights. | Restrained, cool-lit foam — avoid overbright white patches. | Masked transparent whitewater loop, precisely aligned to the narrowing/drop feature | P2, CONDITIONAL | See `MET-16_CINEMATIC_MOTION_LAYER_BLUEPRINT.md` §Rapids Decision. Only implement if the new clean master plate visually shows a narrowing/drop/weir here; otherwise fold into W1/W4 directional-flow-and-shimmer treatment. Do not force rapids onto geometry that doesn't support them. |
| W-sw | WATER (secondary, optional) | `SOUTHWEST_CHANNEL`, left frame edge, crossed by `FREEWAY_02`. Geometry ref: `SECONDARY_FLOW_01`. | NEAR | Optional subtle shimmer. | Optional subtle shimmer. | Optional subtle shimmer. | Transparent sprite loop | P3 | Small, edge-of-frame, hydrologically unconnected to the main channel. Low visual priority. |
| W-pond | WATER (isolated, optional) | `CALM_WATER_COMMUNITY_POND`, Community District. | MID | None / static. | Very subtle reflection only. | Very subtle reflection only. | Static reflection texture | P3 | Decorative isolated pond — no current, no rapids/streak eligibility (matches existing registry flags). |

## C. Building / City Life Zones (Decorative)

Distinct from the existing source-backed `HYBRID`/`SOURCE_BACKED` facility-activity
markers (`METAVERSE_BUILDING_EFFECTS` in `livingCityRegistry.js`, rendered by
`MetaverseBuildingActivityLayer`), which stay in the Interactive Software Layer
and are out of scope here. These are purely decorative ambient life.

| Zone ID | Type | Location | Depth | Day | Dusk | Night | Overlay Format | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| BL1 | BUILDING LIGHT | City Hall dome / Civic core (~x32,y44) | MID | Static. | Restrained architectural accent lighting begins. | Same, steady. | Transparent sprite / CSS opacity keyframe on a pre-baked light-mask cutout | P1 | Landmark accent only — not a pulsing effect. |
| BL2 | BUILDING LIGHT | Data Center towers (~x44,y45) | MID | Static. | Occasional window light variation begins. | Occasional window light variation, slightly more active than dusk. | Same as BL1 | P2 | Sparse, slow — a handful of windows, not a grid flicker. |
| BL3 | BUILDING LIGHT | Downtown skyline cluster (tallest towers, scene-center) | FAR | Static. | Modest window activity. | Modest window activity, slightly higher than dusk. | Same as BL1 | P1 | Highest-visibility landmark cluster; keep restrained per Section 11 (no whole-skyline glow animation). |
| BL4 | BUILDING LIGHT | Treasury & Commerce towers (~x47,y62) | MID | Static. | Signage glow begins. | Signage glow, steady. | Same as BL1 | P2 | Signage only, not full-facade lighting. |
| BL5 | BUILDING LIGHT | Learning Arcade portal building | MID | Static. | Static. | Small rooftop beacon blink. | Same as BL1 | P3 | Night-only, single beacon, slow blink — not a marquee. |
| BR1 | BRIDGE LIGHT | Main cable-stayed bridge (T1 geometry) | NEAR–MID | Static. | Restrained architectural cable lighting begins. | Cable lighting steady, primary night landmark accent. | Same as BL1 | P1 | Shares geometry with T1; keep independent of the vehicle overlay so it can render even if T1 is disabled under reduced motion. |

## D. Turbine Zone

| Zone ID | Type | Location | Depth | Day | Dusk | Night | Overlay Format | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| TUR1 | TURBINE | Infrastructure Zone wind turbine, within `TURBINE_CROSSING` next to `BRIDGE_02` | MID | Slow rotation if separable. | Slow rotation if separable. | Slow rotation if separable. | Transparent sprite/rotation overlay anchored to a static hub | P2, CONDITIONAL | See blueprint §Wind Turbine Decision. Falls back to fully STATIC if blade geometry cannot be cleanly separated from the master plate at generation time. |

## E. Atmosphere Zones

| Zone ID | Type | Location | Depth | Day | Dusk | Night | Overlay Format | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ATM1 | SKY/CLOUD | City-wide (`*`), upper sky | FAR | Slow cloud drift, 1–2 layers, far slower than near. | Slow drift, slight glow-color variation. | Slow drift, very restrained. | Transparent PNG/sprite layer per `MET_LIVING_CITY_VISUAL_RULES_V1.md` | P2 | Reuses existing cloud rules — no new design needed. |
| ATM2 | DISTANT AIRCRAFT | City-wide (`*`), far background sky | FAR | Not used. | Occasional, very sparse. | Occasional, very sparse distant light. | Transparent sprite, single-instance | P3 | Long gaps between appearances; never more than one at a time. |

## Summary Counts

- Traffic: 5 P0/committed corridors (T1, T2, T3, T5 essential; T4 high-value), 2 secondary (T6 P1, T7 P2), 1 deferred (T8 P3).
- Water: 1 P0 anchor (W1), 3 P1/P2 supporting zones (W2, W4, W5-conditional), 1 P2 background (W3), 2 P3 optional (W-sw, W-pond).
- Building/bridge light: 6 candidate zones, 2 P1, 3 P2, 1 P3.
- Turbine: 1 zone, conditional P2.
- Atmosphere: 2 zones, P2/P3, reusing existing cloud/bird rules.

No zone above is implemented by this document. See
`MET-16_CINEMATIC_MOTION_LAYER_BLUEPRINT.md` for the layer architecture that
will consume these zones, and `MET-16_CLEAN_MASTER_PLATE_SPEC.md` /
`MET-16_IMAGE_GENERATION_BRIEF.md` for the master-plate requirements this
geometry assumes.
