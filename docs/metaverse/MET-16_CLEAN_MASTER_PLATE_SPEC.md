# MET-16 — Clean Master Plate Spec

Planning / specification only. No image is generated, edited, or replaced by
this document. This is the canonical spec the next asset-generation phase
(MET-17) must follow; `MET-16_IMAGE_GENERATION_BRIEF.md` turns this into the
literal generation brief text.

## 1. Purpose

Define the exact requirements for a future clean, opaque master city plate
that replaces the current fallback (`silicon-heartland-city-master-overview.png`
and its MET-15G DAY/DUSK/NIGHT variants), so that:

1. The plate itself needs no runtime cleanup (no baked traffic, no baked
   rapids, no motion-blur artifacts implying movement).
2. Pre-aligned cinematic motion overlays (per
   `MET-16_CINEMATIC_MOTION_LAYER_BLUEPRINT.md`) can be authored against it
   with confidence the geometry will not change later.
3. DAY, DUSK, and NIGHT remain the same city, graded three ways, rather than
   three independently generated compositions (a recurring risk flagged
   across MET-15's asset history — see `MET-15_CLEAN_PLATE_ASSET_PLAN.md`).

## 2. Base City Plate Rules

The master plate must be:

- **Opaque.** Not a transparent asset — see §5, Transparency Plan.
- **Clean.** No permanent UI, no district labels, no sidebar, no widgets, no
  fake/frozen traffic, no baked-in motion streaks, no fake rapids, no
  animated-looking whitewater baked into the still image.
- **Static.** A single frozen moment — no implied motion of any kind (see §4).
- **High resolution.** At minimum the current 1672×941 production dimension;
  higher is acceptable if it doesn't change the composition (see §3).
- **Identical geometry across DAY/DUSK/NIGHT.** One master composition, three
  gradings — see §3.
- **Free of large foreground vehicles that imply motion.** Small, clearly
  static/parked vehicles are acceptable as background detail; nothing large
  enough or posed in a way that reads as "caught mid-motion."
- **Motion-overlay-friendly.** Road surfaces, water surfaces, building
  facades, and the turbine must be rendered clean enough that a transparent
  overlay placed on top reads as belonging to the scene, not as a mismatched
  sticker (consistent lighting direction, consistent perspective, no baked
  shadow/light that would conflict with an overlay's own lighting).

## 3. Preserved Content (Composition Lock)

The plate must preserve, at recognizable, correctly-scaled positions:

- Overall skyline silhouette and its tallest landmark towers.
- Civic center (City Hall / Capitol dome, Civic Plaza fountain, Council
  Chamber block).
- Data Center district (Northstar Data Center + training facility massing).
- Career & Education district (university/career-center massing).
- Learning Arcade district (portal/plaza building).
- Technology & Innovation district (Builder/Studio and innovation-lab
  massing).
- Community district (public-realm building + waterfront park/pond).
- Residential / Student Life district massing.
- Treasury & Commerce district towers.
- Major bridges: the southwest cable-stayed bridge, the diagonal cable
  crossing near the turbine, the southeast causeway, and the small central
  arch bridge.
- River/water geometry: the central channel, its confluence near the Civic
  shoreline, the turbine crossing, the east causeway channel, and the
  southwest channel — the same connectivity currently documented in
  `metaverseRiverFlowRegistry.js`'s `METAVERSE_WATER_FOOTPRINT_REGIONS`.
- Visible road geometry consistent with the current traced network
  (`metaverseRoadTraceRegistry.js`) — freeways, major roads, district
  connectors, and bridge decks in their current relative positions.
- The Infrastructure Zone wind turbine (as a single, clearly isolated
  landmark, not a field of turbines).
- Solar infrastructure (the panel arrays near the Infrastructure Zone).
- City parks and landscaped plaza space.
- Any other landmark already load-bearing for a district marker's visual
  anchor point (see `METAVERSE_BUILDING_EFFECTS` anchors in
  `livingCityRegistry.js` for exact reference coordinates: City Hall ~32,44;
  Data Center ~44,45; Career Center ~34,50; Treasury marketplace ~47,62;
  Builder/Studio ~45,62).

## 4. Explicitly Excluded From the Plate

- No permanent UI of any kind (sidebar, HUD, buttons, panels).
- No district or facility text labels baked into the image.
- No floating markers, pins, or badges.
- No people rendered prominently in the foreground (matches the existing
  `peopleFree: true` requirement already enforced for every entry in
  `METAVERSE_PRODUCTION_BACKGROUND_SET`).
- No fake dashboard UI, live counts, names, credentials, or any other
  dynamic-state content baked into the artwork — this is a pre-existing,
  non-negotiable rule (`METAVERSE_IMAGE_ROLE_RULES.PRODUCTION_BACKGROUND.prohibited`
  in `metaverseVisualAssets.js`) and applies unchanged here.
- No large foreground cars/buses posed to imply motion.
- No baked-in motion streaks, motion blur, or light trails of any kind.
- No fake or painted-on rapids/whitewater texture.
- No cartoon aesthetic, generic sci-fi fantasy, or cyberpunk-decay styling —
  matches the existing `METAVERSE_VISUAL_STYLE_LOCK.exclusions`.

## 5. Transparency Plan

**The base background is opaque.** Do not request, generate, or accept a
transparent city background. Transparency is reserved entirely for the
separately-generated overlay assets that sit on top of this plate:

- Traffic overlays (T1–T7)
- Water motion overlays (W1–W5)
- Whitewater, if W5 is justified (see blueprint §Rapids Decision)
- Turbine blade overlay, if separable (see blueprint §Wind Turbine Decision)
- Atmosphere overlays (clouds, distant aircraft), if needed beyond the
  existing CSS-driven cloud treatment
- Localized building-light/signage effects (BL1–BL5, BR1)

Each of these is authored and delivered independently, aligned to this plate
after it exists — none of them are baked into the master plate itself.

## 6. Geometry Lock Enforcement

Once generated, this plate becomes the new tracing source, exactly as
`silicon-heartland-city-master-overview.png` is today for
`metaverseRoadTraceRegistry.js`/`metaverseRiverFlowRegistry.js`. Practically,
that means:

1. Generate ONE master composition first.
2. Derive DAY/DUSK/NIGHT as grading passes over that same composition —
   never as three independent generations (this is what caused the
   MET-15_CLEAN_PLATE_ASSET_PLAN.md table to list every scene as needing
   consistent variant coverage; grading-from-one-master avoids repeating that
   gap).
3. Re-run a geometry diff against the current registries once the new plate
   exists (pixel-position spot-check of the roads/bridges/water edges listed
   in §3) before authoring any new overlay coordinates against it. If the new
   plate's composition matches closely enough, the existing zone-map
   coordinates in `MET-16_MOTION_ZONE_MAP.md` carry over directly; if not,
   re-trace before building overlays, don't force old coordinates onto new
   geometry.

## 7. Acceptance Checklist (for MET-17)

A generated plate is acceptable only if all of the following hold:

- [ ] Opaque, single static image, no transparency channel.
- [ ] No UI, no labels, no floating markers, no baked text of any kind.
- [ ] No people prominent in the foreground.
- [ ] No large foreground vehicles posed as if moving; no motion blur; no
      light trails; no baked rapids/whitewater.
- [ ] All districts/landmarks in §3 present, identifiable, and appropriately
      spaced for marker placement.
- [ ] Road and water surfaces clean enough to place a transparent overlay on
      top convincingly (consistent lighting/perspective).
- [ ] Same composition intended to be reused for DAY/DUSK/NIGHT grading (or,
      if generated per-variant, geometry verified identical across variants
      before acceptance).
- [ ] Institutional-futuristic Silicon Heartland tone preserved
      (`METAVERSE_VISUAL_STYLE_LOCK.mood`/`materialLanguage`), no fantasy or
      cyberpunk-decay drift.
