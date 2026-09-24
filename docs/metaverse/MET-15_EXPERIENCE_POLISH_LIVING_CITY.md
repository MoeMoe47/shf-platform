# MET-15 Experience Polish + Living City

## Current-State Audit

- MET-2A visual assets are centralized in `src/system/metaverse/metaverseVisualAssets.js`; production backgrounds live under `public/assets/metaverse`.
- `MetaverseCityPage.jsx` owns the city shell, protected entry, polling, presence, chat, missions, opportunities, market, enterprise, passport, civic, orchestration, fast travel, mini-map, and building preview.
- `MetaverseCamera.jsx` provides pan, zoom, wheel zoom, pointer drag, keyboard camera changes via page-level handlers, and normalized marker coordinates.
- Hotspots, district markers, facility markers, activity markers, mission/opportunity/market badges, and accessible labels already use normalized scene coordinates.
- MET-11 Daily City Briefing, Guided Next Action, District Pulse, City Events, Fast Travel, Mini Map, and Building Preview already consume the orchestration projection.
- MET-6 presence and chat are server-backed; the city overview uses aggregate presence counts only.
- Existing CSS has reduced-motion handling, mobile bottom-sheet panels, and responsive HUD behavior.
- No canvas overlay system exists; CSS transform overlays are the repo-native fit.

## Visual Direction

MET-15 preserves the locked Silicon Heartland direction: futuristic Midwest city, premium institutional tone, deep navy/electric blue, warm gold/orange civic light, clean transit, green infrastructure, and cinematic depth. It avoids a generic dashboard or arcade-driving aesthetic.

## Architecture

The Living City system is centralized in `src/system/metaverse/livingCityRegistry.js` and rendered through `src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx`.

Layers:
- Time-of-day layer: decorative presentation tint.
- Ambient layer: clouds, shimmer, vapor, and energy/data flow.
- Traffic/transit layer: declarative moving vehicle paths.
- Weather layer: optional decorative visual weather architecture.
- Building activity layer: source-backed or hybrid building glow.
- Event overlay layer: source-backed city event markers.
- Presence overlay layer: bounded aggregate presence dots.

All overlay coordinates are scene-normalized percentages and are mounted inside the same camera-transformed marker plane as hotspots, so overlays remain aligned during pan, zoom, resize, and drill-down.

## Time Of Day

`src/system/metaverse/metaverseTimeOfDay.js` implements `AUTO`, `DAY`, `DUSK`, and `NIGHT`.

Default windows:
- `DAY`: 07:00-17:00
- `DUSK`: 17:00-20:00
- `NIGHT`: 20:00-07:00

Time-of-day is presentation-only, uses local browser time for display, and cannot affect access, eligibility, assignments, civic authority, market access, evidence, grades, or credentials. The preview control in the city HUD is non-persistent QA/admin presentation state.

## Asset Fallbacks

The asset resolver supports `dayAsset`, `duskAsset`, `nightAsset`, and `baseAsset`. Missing variants safely fall back to the current base/dusk plate. Current production files do not include final day/night variants, so this is P1 asset work.

## Clean Plate Strategy

Current production plates remain fallbacks. Final clean plates should remove prominent frozen moving traffic and crowds while preserving architecture, roads, lighting, and district identity. The complete per-scene plan is in `docs/metaverse/MET-15_CLEAN_PLATE_ASSET_PLAN.md`.

## Data-Driven Vs Decorative State

Every registry overlay is classified:
- `DECORATIVE`: traffic, transit, cloud drift, energy flow, visual time/weather.
- `SOURCE_BACKED`: opportunity glow, civic event markers, event overlays, aggregate presence.
- `HYBRID`: low-key facility ambient effects that intensify only when real source-backed activity exists.

Decorative state never implies real system state and never enters authority flows.

## Activity And Events

District pulse, opportunity/mission badges, city events, building previews, market activity, enterprise activity, and civic activity reuse existing runtime projections only. No fake counts or demo activity are introduced.

## Experience Polish

- Daily City Briefing now uses a more in-world "Silicon Heartland Today" presentation while retaining source-backed sections.
- Guided Next Action now presents destination context when supplied and uses a fast-travel CTA without coercing optional exploration.
- Fast Travel is labeled and marks protected-entry destinations; navigation still calls the canonical protected fast-travel endpoint.
- Mini Map adds visual nodes while retaining the required text equivalent.
- Building Preview groups source-backed facility activity and keeps identity/private details out.

## Accessibility

MET-15 respects `prefers-reduced-motion`; reduced motion removes traffic paths and disables Living City animations. Dynamic markers have text equivalents or `aria-label`s. Mini-map navigation remains available as text/list content. No essential information is conveyed by animation alone, no color-only state is required, and vehicle lights use slow opacity changes rather than flashing.

## Privacy

Presence remains aggregate and bounded. The Living City layer does not expose student names, emails, exact private locations, private projects, private market orders, protected educational records, bids, reliability, or civic participation.

## Security And Authority

Presentation state cannot grant access. The Living City layer has no entry, mission, fast-travel, unlock, evidence, Truth, Treasury, or civic authority calls. Fast travel, building entry, activity entry, missions, and deep links still flow through existing protected entry logic.

## Performance

The layer uses CSS transforms/opacity and registry data, with no per-frame React state. Low mode reduces traffic density. Reduced motion hides traffic and disables ambient animation. Mobile uses low mode and existing responsive HUD/panel behavior.

## Persistence

No migration and no backend persistence are introduced. Time preview and decorative vehicle state are not persisted.

## Browser Acceptance

Target acceptance:
- City overview: traffic/transit overlays move on curated paths, vehicle lights are subtle, pan/zoom stays aligned.
- Time preview: `AUTO`, `DAY`, `DUSK`, `NIGHT` resolve and missing variants fall back safely.
- District/facility: source-backed building, event, opportunity, mission, district pulse, and presence markers remain bounded.
- Accessibility: reduced motion disables/reduces animation, keyboard camera controls remain, mini-map text equivalent remains.
- Mobile: HUD and overlays do not create page overflow; motion density is reduced.

## P0/P1 Gaps

P0: none known in repository-local implementation after focused tests and builds pass.

P1:
- Produce final clean plates for every scene.
- Produce full `DAY` and `NIGHT` image variants.
- Add richer weather packs, audio/soundscapes, more vehicle art, richer seasonal packs, advanced avatar markers, browser performance fixtures, and true 3D only if later phases authorize them.
