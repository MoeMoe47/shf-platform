# MERP-0 Visual Baseline + Asset Inventory

MERP-0 is an audit-only baseline. No production visual implementation, authority architecture, or backend business logic was changed.

## Repository Baseline

| Item | Value |
| --- | --- |
| Branch | `studio-v1-plus-development` |
| HEAD | `a9f74fbc73489454ad5c5e64f3c6aecc607b93b6` |
| Dirty baseline before MERP docs/screenshots | 12 files: 7 modified, 5 untracked |
| Modified owner files present | `src/components/metaverse/MetaverseBuildingPreview.jsx`, `src/components/metaverse/MetaverseCamera.jsx`, `src/components/metaverse/MetaverseDailyBriefing.jsx`, `src/components/metaverse/MetaverseFastTravel.jsx`, `src/components/metaverse/MetaverseMiniMap.jsx`, `src/components/metaverse/MetaverseNextAction.jsx`, `src/pages/metaverse/MetaverseCityPage.jsx`, `src/pages/metaverse/metaverse-city.css` |
| Untracked owner files present | `docs/metaverse/MET-15_CLEAN_PLATE_ASSET_PLAN.md`, `docs/metaverse/MET-15_EXPERIENCE_POLISH_LIVING_CITY.md`, `src/components/metaverse/living-city/`, `src/system/metaverse/livingCityRegistry.js`, `src/system/metaverse/metaverseTimeOfDay.js`, `tests/metaverseLivingCity.test.mjs` |
| Existing metaverse routes | `/metaverse`, `/metaverse/*` protected-link fallback, `/metaverse/growth-observatory`, `/metaverse/bfe-test` |
| Primary page | `src/pages/metaverse/MetaverseCityPage.jsx` |
| Primary shell CSS | `src/pages/metaverse/metaverse-city.css` |
| Primary registries | `src/system/metaverse/metaverseNavigationModel.js`, `src/system/metaverse/metaverseVisualAssets.js`, `src/system/metaverse/livingCityRegistry.js`, `src/system/metaverse/metaverseTimeOfDay.js` |
| Current metaverse docs | `docs/metaverse/MET-0...` through `MET-15...`, including visual mapping in `MET-2A` and living-city/clean-plate drafts in untracked `MET-15` docs |
| Current relevant tests | `tests/metaverseCityShell.test.mjs`, `tests/metaverseVisualAssetMapping.test.mjs`, `tests/metaverseLivingCity.test.mjs`, `tests/metaverseCityOrchestration.test.mjs`, `tests/metaverseMissionIntegration.test.mjs`, `tests/metaversePresenceCommunicationRuntime.test.mjs`, `tests/metaverseRuntimeAdapter.test.mjs`, plus MET-8 through MET-14 feature tests |

## Production Asset Inventory

Dimensions were inspected with `sips`. Production metaverse images are 1672 x 941 PNG files unless noted.

| Asset path | Filename | Scene type | Scene/district name | Current usage location | Dimensions | Format | Actively referenced | Duplicate/legacy/reference-only | Apparent time of day | Clean-plate suitability |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `public/assets/metaverse/city/silicon-heartland-city-master-overview.png` | `silicon-heartland-city-master-overview.png` | CITY | Silicon Heartland city overview | `METAVERSE_PRODUCTION_BACKGROUND_SET`; selected by `findProductionEnvironmentAsset({ cameraLevel: "CITY_OVERVIEW" })`; rendered in `MetaverseCamera` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset | Needs cleanup or replacement; heavy baked labels/light trails/traffic |
| `public/assets/metaverse/districts/civic-district-city-hall-plaza.png` | `civic-district-city-hall-plaza.png` | DISTRICT | Civic | District background for `civic-district` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset | Moderate cleanup; roads/plaza visible |
| `public/assets/metaverse/districts/career-education-district-university-overview.png` | `career-education-district-university-overview.png` | DISTRICT | Career & Education | District background for `career-education-district` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset | Moderate cleanup; road network visible but dense |
| `public/assets/metaverse/districts/data-center-district-overview.png` | `data-center-district-overview.png` | DISTRICT | Data Center | District background for `data-center-district` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset | Moderate cleanup; good facility roads |
| `public/assets/metaverse/districts/learning-arcade-district-portal-plaza.png` | `learning-arcade-district-portal-plaza.png` | DISTRICT | Learning Arcade | District background for `learning-arcade-district` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset | Limited; plaza dominates, roads are secondary |
| `public/assets/metaverse/districts/treasury-commerce-district-overview.png` | `treasury-commerce-district-overview.png` | DISTRICT | Treasury & Commerce | District background for `treasury-commerce-district` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset/night-leaning | Needs cleanup; dense light trails and labels |
| `public/assets/metaverse/districts/technology-innovation-district-overview.png` | `technology-innovation-district-overview.png` | DISTRICT | Technology & Innovation | District background for `technology-innovation-district` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset | Moderate cleanup; many labels and bright plazas |
| `public/assets/metaverse/districts/community-district-public-realm.png` | `community-district-public-realm.png` | DISTRICT | Community | District background for `community-district` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset | Moderate cleanup; transit/road elements visible |
| `public/assets/metaverse/districts/student-life-district-overview.png` | `student-life-district-overview.png` | DISTRICT | Residential / Student Life | District background for `student-life-district` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset | Moderate cleanup; pedestrian plaza dominates |
| `public/assets/metaverse/districts/public-realm-civic-plaza.png` | `public-realm-civic-plaza.png` | DISTRICT | Public Realm | District background for `public-realm` | 1672 x 941 | PNG | Yes | Active production; byte-identical to `student-social-commons-facility.png` | Dusk/sunset | Limited; plaza paths good, roads limited |
| `public/assets/metaverse/facilities/northstar-data-center-facility.png` | `northstar-data-center-facility.png` | FACILITY | Main Data Center | Facility background for `main-data-center` | 1672 x 941 | PNG | Yes | Active production; byte-identical to `data-center-training-facility.png` | Dusk/sunset | Good static facility plate; road motion optional |
| `public/assets/metaverse/facilities/data-center-training-facility.png` | `data-center-training-facility.png` | FACILITY | Data Center Training Lab | Facility background for `data-center-training-lab` | 1672 x 941 | PNG | Yes | Active production; byte-identical to `northstar-data-center-facility.png` | Dusk/sunset | Good static facility plate; duplicate should be reviewed |
| `public/assets/metaverse/facilities/infrastructure-project-work-zone.png` | `infrastructure-project-work-zone.png` | FACILITY | Infrastructure / Innovation Lab | Facility background for `innovation-lab` | 1672 x 941 | PNG | Yes | Active production | Dusk/sunset | Needs review; includes split/stacked composition and cranes |
| `public/assets/metaverse/facilities/student-social-commons-facility.png` | `student-social-commons-facility.png` | FACILITY | Student Hub | Facility background for `student-hub` | 1672 x 941 | PNG | Yes | Active production; byte-identical to `public-realm-civic-plaza.png` | Dusk/sunset | Static social plate; duplicate should be reviewed |
| `public/assets/arcade/eco-city-hero.jpg` | `eco-city-hero.jpg` | OTHER | Learning Arcade reference | `METAVERSE_REFERENCE_ASSETS` only | 776 x 273 | JPG | Registry reference only | Reference-only | Day/bright | Do not use as production plate without promotion |
| `public/assets/arcade/classical-arcade-cabinets.jpg` | `classical-arcade-cabinets.jpg` | OTHER | Arcade facility reference | `METAVERSE_REFERENCE_ASSETS` only | 270 x 245 | JPG | Registry reference only | Reference-only | Interior | Reference only |
| `public/assets/career/pathways/hero.jpg` | `hero.jpg` | OTHER | Career reference | `METAVERSE_REFERENCE_ASSETS` only | 471 x 230 | JPG | Registry reference only | Reference-only | Day/bright | Reference only |
| `public/assets/career/pathways/family-infrastructure.jpg` | `family-infrastructure.jpg` | OTHER | Infrastructure reference | `METAVERSE_REFERENCE_ASSETS` only | 134 x 102 | JPG | Registry reference only | Reference-only | Day/bright | Reference only |
| `public/assets/solutions/solutions-infrastructure-globe.png` | `solutions-infrastructure-globe.png` | OTHER | Public Realm reference | `METAVERSE_REFERENCE_ASSETS` only | 1254 x 1254 | PNG | Registry reference only | Reference-only | Graphic/render | Reference only |

## Main City Overview Identification

| Item | Finding |
| --- | --- |
| Exact asset | `public/assets/metaverse/city/silicon-heartland-city-master-overview.png` |
| Selecting registry/component | `src/system/metaverse/metaverseVisualAssets.js` registers `met-city-master-overview`; `src/system/metaverse/metaverseNavigationModel.js#findProductionEnvironmentAsset` selects it; `src/pages/metaverse/MetaverseCityPage.jsx` resolves it; `src/components/metaverse/MetaverseCamera.jsx` renders it as `backgroundImage` |
| Fallback behavior | If a facility asset is missing, `findProductionEnvironmentAsset` falls back to that district background. City overview has no alternate fallback beyond returning `null` if registry selection fails. |
| Time-of-day behavior | `resolveMetaverseTimeOfDay` supports AUTO/DAY/DUSK/NIGHT. `resolveMetaverseAssetVariant` checks `dayAsset`, `duskAsset`, `nightAsset`, then `baseAsset`; current production assets do not define true day/night variants, so all modes fall back to the base plate. |
| Baked-in traffic present | Yes, high. The image contains many baked light trails and bright vehicle-like traces on roads/bridges/freeways. |
| Roads visible for tracing | Yes, but cluttered. Major roads, bridges, freeways, and waterfront corridors are distinguishable; local roads are partly obscured by labels, glow, and overlay panels in runtime. |
| Bridges/freeways/main roads distinguishable | Yes. Bridges and expressways are visually prominent enough for MERP-1 tracing, but a clean plate would reduce ambiguity. |

## District Scene Inventory

| District | Exact asset | Current route/state mapping | Time-of-day state | Baked traffic issue | Road quality | Future road traces | Clean plate replacement priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Civic | `public/assets/metaverse/districts/civic-district-city-hall-plaza.png` | Selecting `civic-district` sets `level="DISTRICT_VIEW"` and `districtId="civic-district"` | Base plate fallback for all modes | LOW/MODERATE; plaza and bridge lights more than dense traffic | GOOD for plaza approaches, LIMITED for local streets | GOOD for marker-to-facility paths, LIMITED for vehicle loops | P2 |
| Career & Education | `public/assets/metaverse/districts/career-education-district-university-overview.png` | `career-education-district` district view | Base plate fallback | MODERATE; light trails and dense city background | GOOD; campus roads and bridge corridor visible | GOOD | P2 |
| Data Center | `public/assets/metaverse/districts/data-center-district-overview.png` | `data-center-district` district view | Base plate fallback | MODERATE; elevated corridor and service road lights | GOOD; service roads and campus paths visible | GOOD for service/shuttle paths | P2 |
| Learning Arcade | `public/assets/metaverse/districts/learning-arcade-district-portal-plaza.png` | `learning-arcade-district` district view | Base plate fallback | LOW; plaza glow dominates | LIMITED; portal plaza dominates, roads peripheral | LIMITED for vehicles, GOOD for pedestrian markers | P3 |
| Treasury & Commerce | `public/assets/metaverse/districts/treasury-commerce-district-overview.png` | `treasury-commerce-district` district view | Base plate fallback | HIGH; waterfront/road light trails and labels are strong | GOOD major-road visibility, noisy local roads | GOOD after cleanup | P1/P2 |
| Technology & Innovation | `public/assets/metaverse/districts/technology-innovation-district-overview.png` | `technology-innovation-district` district view | Base plate fallback | MODERATE; many bright UI-like signs and plazas | GOOD for district streets; labels distract | GOOD after label/glow cleanup | P2 |
| Community | `public/assets/metaverse/districts/community-district-public-realm.png` | `community-district` district view | Base plate fallback | MODERATE; transit/light streaks in foreground | GOOD; transit and road lines visible | GOOD for transit/bus paths | P2 |
| Residential / Student Life | `public/assets/metaverse/districts/student-life-district-overview.png` | `student-life-district` district view | Base plate fallback | MODERATE; transit/light trails and plaza glow | LIMITED/GOOD; internal plaza paths visible, roads less dominant | LIMITED for traffic, GOOD for walking/marker paths | P2/P3 |
| Public Realm | `public/assets/metaverse/districts/public-realm-civic-plaza.png` | `public-realm` district view | Base plate fallback | LOW/MODERATE; plaza glow, little true road traffic | LIMITED; civic plaza paths stronger than roads | LIMITED for vehicles, GOOD for pedestrian/context markers | P3 |

## Facility Scene Inventory

| Facility scene | Exact asset | Classification | Rationale |
| --- | --- | --- | --- |
| Main Data Center / Northstar | `public/assets/metaverse/facilities/northstar-data-center-facility.png` | MOTION-WORTHY | Data-center exterior supports subtle operational pulse, cooling vapor, and limited service-road motion. |
| Data Center Training Lab | `public/assets/metaverse/facilities/data-center-training-facility.png` | NEEDS REVIEW | Active facility asset, but byte-identical to Northstar; should decide whether separate training-lab plate is needed. |
| Infrastructure Project Work Zone / Innovation Lab | `public/assets/metaverse/facilities/infrastructure-project-work-zone.png` | MOTION-WORTHY | Cranes/work-zone composition could support subtle site activity, but split composition and labels need review. |
| Student Social Commons / Student Hub | `public/assets/metaverse/facilities/student-social-commons-facility.png` | MOSTLY STATIC | Useful social commons plate, but byte-identical to Public Realm; better as static context unless replaced. |
| Other mapped facilities without facility plates | District fallback assets | REFERENCE ONLY / NEEDS REVIEW | `findProductionEnvironmentAsset` falls back to district plate for facilities not listed in the production set. Do not assume each needs a unique motion layer. |

## Baked-In Traffic Audit

| Scene | Baked-in traffic | Cleanup class |
| --- | --- | --- |
| Silicon Heartland city overview | HIGH | NEEDS_TRAFFIC_CLEANUP |
| Civic | LOW/MODERATE | READY_CLEAN with minor NEEDS_DISTRACTION_CLEANUP |
| Career & Education | MODERATE | NEEDS_TRAFFIC_CLEANUP |
| Data Center | MODERATE | NEEDS_TRAFFIC_CLEANUP |
| Learning Arcade | LOW | READY_CLEAN / NEEDS_DISTRACTION_CLEANUP |
| Treasury & Commerce | HIGH | NEEDS_TRAFFIC_CLEANUP |
| Technology & Innovation | MODERATE | NEEDS_TRAFFIC_CLEANUP / NEEDS_DISTRACTION_CLEANUP |
| Community | MODERATE | NEEDS_TRAFFIC_CLEANUP |
| Student Life | MODERATE | NEEDS_TRAFFIC_CLEANUP / NEEDS_DISTRACTION_CLEANUP |
| Public Realm | LOW/MODERATE | READY_CLEAN / NEEDS_DISTRACTION_CLEANUP |
| Northstar Data Center | LOW/MODERATE | READY_CLEAN / NEEDS_DISTRACTION_CLEANUP |
| Data Center Training Facility | LOW/MODERATE | READY_CLEAN / NEEDS_DISTRACTION_CLEANUP |
| Infrastructure Project Work Zone | MODERATE | NEEDS_DISTRACTION_CLEANUP |
| Student Social Commons | LOW/MODERATE | READY_CLEAN / NEEDS_DISTRACTION_CLEANUP |
| Reference assets | N/A | REFERENCE_ONLY |

No image cleanup occurred in MERP-0.

## Road Trace Suitability Audit

| Scene | Local roads | Major roads | Freeway/expressway | Bridges | Transit corridors | Potential bus paths | Summary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| City overview | GOOD | EXCELLENT | EXCELLENT | EXCELLENT | GOOD | GOOD | Best MERP-1 target because the full city network is visible. |
| Civic | LIMITED | GOOD | GOOD | GOOD | LIMITED | LIMITED | Plaza/facility approach paths are clearer than local vehicle lanes. |
| Career & Education | GOOD | GOOD | GOOD | GOOD | GOOD | GOOD | Campus roads and river corridor can support future traces. |
| Data Center | GOOD | GOOD | GOOD | LIMITED | GOOD | GOOD | Service roads and elevated guideway are usable. |
| Learning Arcade | LIMITED | LIMITED | POOR | POOR | LIMITED | LIMITED | Better for marker/pedestrian pathing than road traffic. |
| Treasury & Commerce | GOOD | GOOD | GOOD | GOOD | LIMITED | GOOD | Strong road network, but baked light trails and labels complicate tracing. |
| Technology & Innovation | GOOD | GOOD | LIMITED | LIMITED | LIMITED | GOOD | Usable internal district streets, but visual signage competes. |
| Community | GOOD | GOOD | LIMITED | LIMITED | GOOD | GOOD | Transit/bus traces are plausible. |
| Student Life | LIMITED | GOOD | LIMITED | LIMITED | GOOD | LIMITED | Plaza and transit edges are better than local roads. |
| Public Realm | LIMITED | LIMITED | POOR | POOR | LIMITED | LIMITED | Better as gathering/pedestrian scene than vehicle scene. |

## Current City Shell Audit

| Surface | Component | Location | Persistent/temporary | Approximate footprint | Eventual MERP destination |
| --- | --- | --- | --- | --- | --- |
| Header/status card | `MetaverseCityPage` header plus `MetaverseBreadcrumbs`, `MetaversePresenceHud`, time buttons | Top-left | Persistent | Large card, roughly 30% width on desktop and most top mobile viewport | COMPACT HUD / LEFT SIDEBAR |
| Required Next Step | `MetaverseNextAction` | Bottom-left orchestration grid | Persistent when orchestration renders | Medium card | COMPACT HUD |
| Daily City Briefing / Silicon Heartland Today | `MetaverseDailyBriefing` | Bottom-left orchestration grid | Persistent | Medium card | LEFT SIDEBAR or RIGHT DRAWER |
| Fast Travel | `MetaverseFastTravel` | Bottom-left grid / bottom nav-like row | Persistent | Multi-button strip | BOTTOM CONTEXT BAR |
| Mini Map | `MetaverseMiniMap` | Bottom-left orchestration grid | Persistent | Medium card | Lower-right MINI MAP/CAMERA CONTROLS |
| District Pulse | `MetaverseDistrictPulse` | Bottom-left orchestration grid | Persistent | Medium card | LEFT SIDEBAR |
| City Events | `MetaverseCityEvents` | Bottom-left orchestration grid | Persistent | Medium card when populated | RIGHT DRAWER or LEFT SIDEBAR |
| City Hall / building preview | `MetaverseBuildingPreview` | Right-bottom | Conditional but fixed when preview exists | Small/medium card | RIGHT DRAWER |
| District/facility/activity markers | `MetaverseHotspot` | Over city | Persistent markers | Large labeled marker cards | CITY MARKER; shrink labels |
| Bottom navigation/camera controls | `MetaverseCameraControls` | Bottom-right desktop, bottom mobile | Persistent | Wide button cluster | BOTTOM CONTEXT BAR + small lower-right controls |
| Presence indicator/status selector | `MetaversePresenceHud` | Inside header | Persistent | Header row | LEFT SIDEBAR or COMPACT HUD |
| Time-of-day controls | Inline buttons in header | Inside header | Persistent | Header row | LEFT SIDEBAR settings or compact control |
| Living City HUD/layers | `MetaverseLivingCityLayer` and child layers | Over city canvas | Persistent presentation layer | Full-canvas overlay | KEEP, but subtle |
| Context drawer | `MetaverseContextPanel` | Right top | Temporary, closable | Medium right card | RIGHT DRAWER |
| Locations panel | `MetaverseLocationNavigator` | Bottom-left hidden panel | Temporary | Large drawer/card | LEFT SIDEBAR |
| Missions panel | `MetaverseMissionList` | Bottom-right hidden panel | Temporary | Large drawer/card | LEFT SIDEBAR or RIGHT DRAWER |
| Opportunity Exchange | `MetaverseOpportunityExchange` | Bottom-left hidden panel | Temporary | Large drawer/card | LEFT SIDEBAR / RIGHT DRAWER |
| Student Market | `MetaverseMarket` | Bottom-left hidden panel | Temporary | Large drawer/card | LEFT SIDEBAR / RIGHT DRAWER |
| Work Passport | `MetaverseWorkPassport` | Bottom-left hidden panel | Temporary | Large drawer/card | LEFT SIDEBAR / RIGHT DRAWER |
| Civic Hall | `MetaverseCivicHall` plus toggle | Bottom/right panel | Temporary, toggle persistent | Large panel when open | RIGHT DRAWER |
| Student Enterprise | `MetaverseEnterpriseHub` plus toggle | Bottom/right panel | Temporary, toggle persistent | Large panel when open | LEFT SIDEBAR / RIGHT DRAWER |
| Participants | `MetaverseParticipantList` | Left-bottom | Conditional persistent in room | Small/medium card | RIGHT DRAWER or compact presence drawer |
| Chat tray | `MetaverseChatTray` | Right-bottom | Temporary tray | Small button, panel when open | RIGHT DRAWER or bottom context |
| Footer authority text | Footer in `MetaverseCityPage` | Bottom-left | Persistent desktop | Thin footer text | REMOVE/REPLACE or accessibility-only |

## Existing Living City Audit

`src/system/metaverse/livingCityRegistry.js` is presentation-only and declares that decorative state does not grant authority. It maps every production background into `METAVERSE_LIVING_CITY_SCENES`.

Current implementation:

- Traffic: `METAVERSE_TRAFFIC_PATHS` and `METAVERSE_TRANSIT_PATHS`; rendered by `MetaverseTrafficLayer`.
- Transit: one city rail/glide path in `METAVERSE_TRANSIT_PATHS`.
- Ambient motion: clouds, water shimmer, data-center cooling vapor, and fiber-road energy flow.
- Building activity: source-backed/hybrid pulse points for data center, career center, city hall, marketplace, and builder studio.
- City events: event zones derived from district markers and rendered by `MetaverseEventOverlayLayer`.
- Presence overlays: aggregate district presence markers via `MetaversePresenceOverlayLayer`.
- Energy/data flow: `fiber-road-pulse` ambient effect.
- Weather/atmosphere: `MetaverseWeatherLayer` supports weather prop, currently called with `"CLEAR"`.
- Time-of-day: `MetaverseTimeOfDayLayer`, `metaverseTimeOfDay.js`, and header controls; current assets fall back to base plate.
- Reduced motion: reduced motion hides traffic by passing `reducedMotion` to `getTrafficPathsForScene`; CSS also disables animations.
- LOW/performance modes: compact viewport and reduced motion use `performanceMode="LOW"`; LOW traffic returns only the first path for a scene.

Preserve later:

- authority boundary metadata
- scene registry mapping
- reduced-motion and performance-mode switches
- source-backed vs decorative classification pattern
- time-of-day resolver and asset-variant fallback mechanism
- aggregate presence/event/building overlay concept

Replace/refine later:

- current traffic geometry, vehicle styling, speed, scale, and brightness
- broad energy-flow line
- large marker cards that obscure the city
- permanent orchestration dashboard surfaces

## Traffic Implementation Audit

| Topic | Current implementation |
| --- | --- |
| Path definition | Arrays of percentage points in `livingCityRegistry.js`; renderer uses only first and last point for CSS animation. |
| Road alignment | Approximate only. Paths are hand-entered normalized percentages and do not trace actual curved roads. |
| Normalization | Points use 0-100 x/y percentage scene coordinates. |
| Vehicle scale | Fixed CSS sizes: sedans 18 x 8 px, bus/transit 34 x 10 px, service/shuttle 24 x 9 px. |
| Speed | Fixed `speedSeconds` per path, e.g. 18, 20, 22, 24, 30 seconds. |
| Y-position scaling | None. Vehicle size does not change with y position. |
| Lights/glow | Yes. Vehicles include bright body gradients, headlight and taillight spans, and box shadows. |
| Density configuration | Registry `density` plus `performanceMode`; STANDARD filters out HIGH density, LOW slices to one path. |
| Buses | Yes. `vehicleType: "bus"` exists on `city-transit-blue`; styling treats bus/transit as elongated vehicles. |
| Freeway streaks | No separate freeway streak system exists. Baked image streaks are present, but overlay streaks are not. |
| Reduced motion | Traffic returns `[]` when reduced motion is true; CSS also disables animation. |

Confirmed implementation reasons for visual issues:

- Misalignment comes from straight first-to-last CSS animation over hand-entered percent points rather than traced road polylines.
- Oversized appearance comes from fixed pixel vehicle sizes that do not perspective-scale.
- Fast motion comes from short fixed animation durations and long straight spans.
- Brightness comes from gradients, headlights/taillights, and glow shadows.

## Atmospheric Motion Audit

| Motion type | Verified current support | Notes |
| --- | --- | --- |
| Clouds | Yes | `cloud-drift` ambient effect and CSS `metCloudDrift`; one broad semi-transparent cloud form. |
| Birds | No | No bird layer or bird registry found. |
| Turbine rotation | No | Wind turbines exist in some baked imagery, but no turbine overlay or rotation code found. |
| Water movement | Yes, limited | `water-shimmer` ambient effect for `public-realm`. |
| Vapor | Yes, limited | `data-center-cooling` vapor effect for Data Center scene. |
| Energy/data flow | Yes | `fiber-road-pulse` ambient effect. |
| Weather | Partial | Weather layer exists; runtime currently passes `weather="CLEAR"`. |
| Time of day | Partial | Overlay tint and mode resolver exist; no separate day/night image variants currently registered. |

## Screenshot Baseline

Saved under `docs/metaverse/merp/baseline/`:

- `MERP-0_city_desktop.png`
- `MERP-0_city_context_open.png`
- `MERP-0_city_mobile.png`

Screenshot capture used the current frontend without visual implementation edits. Browser startup required an escalated Playwright run after sandboxed Chromium failed on macOS Mach port registration.

## Recommended MERP-1 Target

Recommended target: `public/assets/metaverse/city/silicon-heartland-city-master-overview.png`.

Recommended treatment: B. Generate a replacement clean plate based on the same composition.

Reason: The main city overview is the visual entry point, the city-wide road/bridge/freeway network is visible enough to anchor road tracing, and the current plate has high baked-in traffic/light trails plus label/sign clutter. A replacement clean plate preserving the same composition is likely cleaner than trying to surgically remove every baked trail and large label from the current image.

MERP-1 must not begin until the owner completes visual review and accepts this target.

