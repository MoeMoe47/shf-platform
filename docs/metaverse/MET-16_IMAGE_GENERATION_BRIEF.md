# MET-16 — Image Generation Brief

Planning only. **No image is generated in this phase.** This document is the
literal brief to hand to the next asset-generation phase (MET-17), built from
`MET-16_CLEAN_MASTER_PLATE_SPEC.md`. Do not begin MET-17 automatically.

## Brief Text

> Generate a single, opaque, static master aerial/establishing-shot city plate
> for "Silicon Heartland," a premium institutional-futuristic civic technology
> city. Cinematic, realistic architectural rendering style — clean modern
> glass, stone, metal, solar, and transit infrastructure, landscaped civic
> plazas, dusk/sunset-capable lighting language (dark navy base, electric-blue
> identity lighting, warm amber/orange public-realm lighting). No fantasy
> skyline, no cyberpunk decay, no cartoon aesthetic.
>
> The composition must clearly show, at correctly separated and legible
> positions:
> - A central skyline cluster with distinguishable tall landmark towers.
> - A civic center: a domed capitol/city-hall building fronted by a fountain
>   plaza.
> - A data-center campus (large low-rise industrial/data-hall buildings).
> - A university/career-center campus.
> - A circular/portal-shaped "learning arcade" building.
> - A technology/innovation building cluster.
> - A community/public-realm building beside a landscaped waterfront park
>   with a small decorative pond.
> - A residential/student-life building cluster.
> - A commerce/treasury tower cluster.
> - A river system running through the city with: a narrow headwaters
>   stretch near the civic center, a wider central basin, a crossing point
>   near a single wind turbine, and a wider channel continuing to a
>   causeway crossing at the frame edge; plus a secondary, unconnected
>   channel exiting another frame edge.
> - At least: one cable-stayed suspension bridge, one diagonal cable bridge
>   near the turbine, one wide causeway/freeway river crossing, and one
>   small arch bridge — each on clearly legible, continuous road surfaces.
> - Solar panel arrays and exactly one wind turbine, rendered as a single
>   isolated landmark (not a wind farm).
> - Clearly visible, continuous road geometry connecting the districts —
>   freeways, major arterials, and district connector roads — with clean,
>   unobstructed pavement suitable for a separately-authored transparent
>   traffic overlay to be placed on top later.
>
> Camera and composition should match the current accepted Silicon Heartland
> city direction (same aerial angle, same overall framing and district
> layout) so existing navigation and overlay work is not invalidated.

## Explicit Prohibitions

The brief must explicitly and unambiguously prohibit:

- Sidebar or any other persistent UI chrome
- Widgets, panels, HUD elements of any kind
- District/facility text labels or any other baked-in text
- Floating markers or pins
- Traffic (moving or posed-as-moving vehicles) baked into the still image
- Buses
- Motion blur
- Light trails / long-exposure streaks
- Animated-looking or painted-on rapids/whitewater
- Any UI of any kind
- Prominent people in the foreground
- Transparency (the base plate must render fully opaque)
- Fantasy or cyberpunk-decay stylistic drift from the locked institutional-
  futuristic tone

## Format Requirements

- Deliver as a single opaque master composition (see
  `MET-16_CLEAN_MASTER_PLATE_SPEC.md` §6, Geometry Lock Enforcement) —
  DAY/DUSK/NIGHT are produced as grading passes over this one composition,
  not as three separate generations.
- Minimum resolution 1672×941 (current production dimension); higher is
  acceptable if the composition and aspect ratio are unchanged.
- PNG, no alpha channel.

## What Happens After Generation (Not Part of This Brief)

1. Run the `MET-16_CLEAN_MASTER_PLATE_SPEC.md` §7 acceptance checklist against
   the generated plate.
2. Re-verify (or re-trace) road/water geometry against the new plate before
   reusing any `MET-16_MOTION_ZONE_MAP.md` coordinates.
3. Author the transparent motion overlays described in
   `MET-16_CINEMATIC_MOTION_LAYER_BLUEPRINT.md` against the accepted plate.

None of this occurs during MET-16.
