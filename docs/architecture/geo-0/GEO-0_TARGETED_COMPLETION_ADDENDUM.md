# GEO-0 Targeted Completion Addendum

Created: 2026-09-27
Status: COMPLETE WITH CONDITIONS
Repository HEAD: `2651e17 feat(fabric): harden run execution safety`

This addendum completes the missing GEO-0 reconciliation deliverables without creating a competing documentation tree. It preserves `docs/architecture/geo-0/` as the canonical GEO-0 packet and revalidates the interrupted forensic findings against current repository evidence.

Governing rule: separate authorities, shared spatial coordination. Spatial may coordinate projection, selection, highlighting, viewport, layers, route/path presentation, and interaction. Spatial must not become source authority for SHF, SHS, Exchange/Capital, CivicSure, Career, Curriculum, Workforce, Projects, Opportunities, Agent Fabric, Truth Spine, Watchtower, Events, Metaverse engines, Traffic, Water, Transit, Emergency, Missions, or Identity.

## 1. Expanded Map Registry

| Map | Current route or mount | Data/source | Status | Evidence | Confidence |
|---|---|---|---|---|---|
| Exchange / Capital Unified Truth Map | `capital.html#/exchange/unified-truth`, also `#/exchange/truth` | Mapbox runtime, remote county GeoJSON, hardcoded operational points | Mounted, token-dependent | `src/routes/exchangeRoutes.jsx`, `src/router/CapitalRoutes.jsx`, `src/pages/exchange/unified-truth/UnifiedTruthMapRoute.jsx`, `src/pages/exchange/unified-truth/components/SHSOperationalMapboxMap.jsx` | HIGH |
| Exchange command map/globe checkpoints | checkpoint copies only for several globe imports | Historical local implementations | Preservation candidate, not current authority | `src/pages/exchange/CommandCenter.STABLE_*`, `src/pages/exchange/GlobeScene.jsx` | MEDIUM |
| SHF Public Impact Ohio Map | intended `foundation.html#/impact`; actual Foundation entry renders homepage for unknown hash | SHF impact data filtered by public approval | Stale route; public data intentionally suppressed | `src/router/FoundationRoutes.jsx`, `src/entries/foundation.main.jsx`, `src/foundation/App.jsx`, `src/pages/shf-command/components/SHFImpactOhioMap.jsx` | HIGH |
| SHF Command Impact Map | root/admin command routes | `src/data/shfImpactData.js`, entity county resolver | Mounted in command contexts; not public evidence authority | `src/App.jsx`, `src/router/AdminRoutes.jsx`, `src/pages/shf-command/SHFImpactCommandCenter.jsx` | HIGH |
| SHFOhioMapEngine | unrouted test page only | page-local/static values | Preserve for analysis, not live route | `src/pages/shf-command/SHFOhioMapEngine.jsx`, `src/pages/shf-command/SHFOhioMapEngineTest.jsx` | HIGH |
| IEP Ohio county map | IEP command page | static GeoJSON and county profiles | Active demo/command surface | `src/pages/iep-command-v2/OhioCountyNeutralBase.jsx`, `src/pages/iep-command-v2/countyProfiles.js` | HIGH |
| Metaverse Quick Map | city page mini map | `silicon-heartland-metaverse-top-map.png`, normalized quick-map coordinates | Active client map; separate coordinate space | `src/system/metaverse/metaverseMiniMapRegistry.js`, `src/components/metaverse/MetaverseMiniMap.jsx` | HIGH |
| Metaverse master city plate | city scene and traces | `silicon-heartland-city-master-overview.png`, normalized master-city coordinates | Active/reference city coordinate space | `src/system/metaverse/metaverseRoadTraceRegistry.js`, `src/system/metaverse/metaverseRiverFlowRegistry.js`, `src/system/metaverse/metaverseDestinationRelationshipRegistry.js` | HIGH |
| Metaverse regional scenes | `/metaverse/:slug` regional sequence | regional assets, scene metadata, capability metadata | Active visual/spatial scenes; destination links mostly pending | `src/system/metaverse/regionalSceneRegistry.js`, `src/pages/metaverse/MetaverseCityPage.jsx` | HIGH |
| OperationalGlobe | no confirmed importer | public GeoJSON and hardcoded points/arcs | Unmounted preservation candidate | `src/components/globe/OperationalGlobe.jsx` | HIGH |
| RealGlobe | no confirmed importer | globe implementation | Unmounted preservation candidate | `src/components/globe/RealGlobe.jsx` | HIGH |
| OutcomeGlobe | no confirmed importer | Exchange outcome visualization | Unmounted preservation candidate | `src/components/exchange/OutcomeGlobe.jsx` | HIGH |

## 2. Layer Registry

| Layer family | Members | Authority boundary | Evidence | Status |
|---|---|---|---|---|
| REAL_WORLD administrative geography | states, counties, jurisdictions, geography levels | Domain systems remain authority; Spatial presents geometry/scope only | `public/geo/*.geojson`, `public/assets/maps/*.geojson`, `apps/shs-api/migrations/025_report_publications.sql`, `apps/shs-api/migrations/099_government_program_assurance_source_scope.sql` | Incomplete authority metadata |
| Exchange operational layers | state, region, county, community, location steps; operational points; unified truth overlays | Exchange/Capital owns operational state; Spatial owns projection/layers | `SHSOperationalMapboxMap.jsx` | Mounted but token and remote-source dependent |
| SHF impact layers | public-approved counties, program lanes, metrics, suppressed/public states | SHF and Truth/reporting systems own metrics and publication eligibility | `src/data/shfImpactData.js`, `SHFImpactOhioMap.jsx` | Public data suppressed |
| Metaverse destination layers | districts, facilities, activities, career/civic destinations | Metaverse registry owns virtual destination identity; Spatial projects and selects | `metaverseNavigationModel.js`, `city-registry.ts`, `metaverseDestinationRelationshipRegistry.js` | Active, with some registry-only entries |
| Metaverse mobility layers | road traces, traffic authoring/live preview, water mobility, river flow, ocean/regional water routes | Mobility engines own behavior if present; Spatial presents route/path coordinates | `metaverseRoadTraceRegistry.js`, `metaverseRiverFlowRegistry.js`, `regionalSceneRegistry.js` | Road/water geometry confirmed; transit incomplete |
| Metaverse environment layers | DAY/DUSK/NIGHT, weather, accessibility, camera scene state | Environment runtime owns behavior; Spatial presents visual state | `MetaverseCityPage.jsx`, `regionalSceneRegistry.js` | Active visual/runtime layers |
| Emergency/incident capability layers | emergency capability metadata, incident/dispatch labels | No confirmed dispatch engine; do not treat metadata as authority | `regionalSceneRegistry.js`, `metaverseDevCapabilities.js` | Metadata only |

## 3. Engine Registry

| Engine or system | Classification | Current evidence | GEO-0 decision |
|---|---|---|---|
| `SHSOperationalMapboxMap` | Mapbox projection and interaction surface | imports `mapbox-gl`, uses `VITE_MAPBOX_TOKEN`, publishes UI context | Preserve; require GEO-4 token/source/fallback policy |
| `SHFImpactOhioMap` | Public impact SVG/geography presentation | consumes public-approved SHF records; suppresses unapproved values | Preserve; fix route/data only after authority decision |
| `SHFOhioMapEngine` | Unrouted/static map engine candidate | referenced by test page only | Preserve as restoration candidate |
| `OhioCountyNeutralBase` | D3/SVG county renderer | uses static county geometry | Preserve with provenance constraints |
| `MetaverseMiniMap` | Quick Map client | quick-map coordinate registry and validation mode | Preserve; future Spatial Engine client |
| Metaverse road trace registry | Route/path geometry registry | master-city normalized traces, bus/corridor metadata | Geometry registry, not full traffic authority |
| Metaverse river flow registry | Water path geometry registry | master-city normalized water traces | Geometry registry, not full water authority |
| Ocean/regional scenes | Regional visual/spatial scene runtime | scene registry, water routes, media assets, capability metadata | Preserve as metaverse scene system |
| Sky Bridge / Transit | Incomplete/pending | transit hub is registry-only; no Sky Bridge registry available | Do not classify as engine yet |
| Emergency / Dispatch | Metadata/capability only | emergency capability arrays and dev capability labels | Do not classify as engine yet |
| OperationalGlobe, RealGlobe, OutcomeGlobe | Disconnected globe candidates | definitions found; no confirmed live importer | Preserve for GEO-8 restoration/disposition |

## 4. Route Matrix

| Route | Expected component | Actual status | Notes |
|---|---|---|---|
| `capital.html#/exchange` | Exchange command center | Mounted through Capital routes | Current command surface, not Mapbox by default |
| `capital.html#/exchange/unified-truth` | Unified Truth Mapbox route | Mounted | Requires `VITE_MAPBOX_TOKEN` for map rendering |
| `capital.html#/exchange/truth` | Unified Truth Mapbox route | Mounted alias | Same dependency profile |
| `foundation.html#/impact` | SHF impact public route | Not mounted by current Foundation entry | `FoundationRoutes.jsx` has route, but `foundation.main.jsx` renders `FoundationApp` manual router |
| root `/shf-command` | SHF Impact Command Center | Mounted | Command/admin context, not public Foundation route |
| admin `/command`, `/command-center` | SHF Impact Command Center | Mounted | Permission-gated admin routes |
| `/metaverse`, `/metaverse/city`, `/metaverse/dev/ocean`, `/metaverse/:slug` | Metaverse city/regional/ocean scenes | Mounted in metaverse page routing | Substantial active spatial system |
| SHFOhioMapEngine test page | engine test | No confirmed live app route | Restoration candidate only |

## 5. Asset Registry

| Asset group | Examples | Source/provenance status | GEO-0 decision |
|---|---|---|---|
| Real-world GeoJSON | `public/geo/ohio-counties.geojson`, `public/geo/us-states.geojson`, `public/geo/us-counties.geojson`, `public/assets/maps/ohio-counties.geojson` | Source/license/freshness not fully registered | GEO-2 must add provenance and authority metadata |
| Cluster maps | `public/assets/maps/clusters/*.geojson` | Static local assets | Preserve; register before authoritative use |
| SVG base maps | `public/assets/maps/usa-base.svg`, `usa-state-lines.svg` | Static local assets | Preserve; register |
| Metaverse city assets | `public/assets/metaverse/city/*day*`, `*dusk*`, `*night*`, `*master-overview*` | Virtual scene assets | Register as METAVERSE assets, not real geography |
| Metaverse Quick Map | `public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png` | Quick-map coordinate source image | Register separately from master-city plate |
| Metaverse regional assets | oil-rig/open-sea day/dusk/night/quick maps and media | Virtual regional scene assets | Register as METAVERSE scene assets |
| Mapbox remote county GeoJSON | Plotly GitHub counties URL in Mapbox component | Remote runtime dependency | GEO-4 must decide local vendoring/fallback policy |

## 6. Authority Matrix

| Domain | Source authority remains | Spatial may coordinate | Spatial must not own |
|---|---|---|---|
| SHF impact | SHF, Truth, Metric Registry, reporting publication gates | map presentation, county highlighting, viewport, layer toggles | metric values, public approval, county truth |
| SHS operations | SHS operational systems | operational projection, route/path display, selection/highlight | operational decisions or record truth |
| Exchange / Capital | Exchange/Capital, Truth Spine, Agent Fabric where applicable | unified truth map presentation and selection | capital truth, transaction state, drafts, approvals |
| CivicSure/GPA | CivicSure/GPA jurisdiction and assurance services | geography presentation and jurisdiction selection | assurance claims, jurisdiction source authority |
| Metaverse | Metaverse registries/engines | scene projection, camera/viewport, normalized coordinates, destination selection | mission state, event state, traffic/water/emergency authority |
| Identity/auth | Identity and route guards | none beyond display context | authorization grants |

## 7. Restoration Matrix

| Candidate | Restore? | Reason | Condition |
|---|---|---|---|
| Exchange / Capital Mapbox map | Preserve in place | Currently mounted and operationally valuable | Add token/source/fallback policy before hardening |
| Exchange disconnected globes | Do not restore in GEO-0 | No confirmed live importer | GEO-8 disposition after comparing checkpoint value |
| SHF Public Impact route | Candidate fix after GEO-1 | Route mismatch blocks intended public map | Requires public authority and approved data decision |
| SHFOhioMapEngine | Preserve as candidate | Unrouted, may contain useful map behavior | Must not become authority without source data |
| Metaverse Quick Map | Preserve and elevate as Spatial Engine client candidate | Active, validated separate coordinate model | Must not merge with master-city coordinates without mapping |
| OperationalGlobe/RealGlobe/OutcomeGlobe | Preserve for audit | Unmounted implementations may document intent | GEO-8 non-destructive disposition |

## 8. Map Opportunity Matrix

| Opportunity | Value | Dependency |
|---|---|---|
| Canonical Spatial Engine projection adapter | Reuse selection, viewport, layers, coordinate metadata across maps | GEO-1 authority charter and GEO-4 engine boundary |
| Verified public SHF impact map | Restores intended public route without fabricated data | Public-approved records and route decision |
| Exchange operational map hardening | Stabilizes Mapbox/token/remote GeoJSON behavior | GEO-4 token and remote-source policy |
| Metaverse Quick Map integration | Lets Quick Map become a client of shared selection/projection | Coordinate registry and no false transforms |
| Spatial Evidence overlays | Visual verification layer for claims and metrics | Truth/evidence contracts from GEO-5 |
| Geographic Command Center | Cross-domain command visualization | Authority boundaries and projection-only rule |

## 9. Coordinate Space Registry

| Family | Coordinate space | Units | Evidence | Rule |
|---|---|---|---|---|
| REAL_WORLD | latitude/longitude | degrees | Mapbox operational points in `SHSOperationalMapboxMap.jsx` | Use only when source has real geographic meaning |
| REAL_WORLD | county/state geometry | GeoJSON geometry | `public/geo/*`, `public/assets/maps/*.geojson`, remote counties GeoJSON | Requires provenance before authoritative use |
| REAL_WORLD | jurisdiction/geography scope | text/enums/ids | API migrations with `geography_level`, `geographic_reference`, `geography` | Not geometry; do not treat as lat/lng |
| METAVERSE | master-city | normalized percent x/y over approximately 1672 x 941 source plate | `metaverseRoadTraceRegistry.js`, `metaverseRiverFlowRegistry.js`, `metaverseDestinationRelationshipRegistry.js` | Separate from Quick Map unless explicit mapping exists |
| METAVERSE | quick-map | normalized percent x/y over 1448 x 1086 image | `metaverseMiniMapRegistry.js` | Separate from master-city |
| METAVERSE | regional scene/image | scene-specific image and viewport coordinates | `regionalSceneRegistry.js` | Scene-local unless mapped |
| METAVERSE | camera/world | runtime camera and 3D/scene state | Metaverse city/runtime components | Behavior/camera only, not real geography |

No confirmed transform currently maps quick-map coordinates to master-city coordinates. They must remain separate until a verified calibration exists.

## 10. Spatial Data Flow

1. Domain systems produce domain records, metrics, missions, events, destinations, or operational state.
2. Domain registries expose identifiers, authority metadata, and eligible projection fields.
3. Spatial adapters convert eligible fields into projection records with coordinate family, coordinate space, provenance, layer, and interaction metadata.
4. Map clients render projection records and publish selection/highlight/viewport events.
5. Domain systems decide whether a selection changes domain state. Spatial surfaces do not grant authority or mutate canonical domain truth.

## 11. Gaps and Unknowns Log

| Gap | Impact | Required follow-up |
|---|---|---|
| No `VITE_MAPBOX_TOKEN` declaration found in checked example env files | New setups can fail Mapbox map rendering | GEO-4 config contract |
| Runtime remote county GeoJSON dependency | Availability/license/privacy uncertainty | GEO-2/GEO-4 source registration |
| Foundation public impact route not mounted | Intended public map URL is stale | GEO-1/GEO-5 route and publication decision |
| SHF unknown entity fallback maps to Franklin County | Fabricated/default geography risk | Replace with null/unknown after authority decision |
| No confirmed persisted lat/lng or geometry in inspected migrations | Backend geography appears mostly textual | GEO-3 schema decision |
| Quick Map and master-city coordinate spaces not mapped | Coordinate ambiguity | Calibration registry if needed |
| Transit/Sky Bridge incomplete | Risk of overstating engine maturity | Do not claim engine until registry/runtime exists |
| Emergency/dispatch appears metadata-only | Risk of overstating capability | Require engine evidence before roadmap claims |
| Disconnected globe implementations | Preservation and bundle confusion | GEO-8 disposition matrix |

## 12. Spatial Library Audit

Current spatial/runtime libraries include `d3-geo`, `topojson-client`, `mapbox-gl`, `maplibre-gl`, `globe.gl`, `react-globe.gl`, `three`, `three-globe`, `@react-three/fiber`, and `@react-three/drei` in `package.json`. `vite.config.js` already treats Mapbox, MapLibre, geo support, d3/chart families, and Three-related code as chunk boundaries. GEO-4 must preserve or explicitly replace those performance boundaries.

## 13. Metaverse Spatial Engine Inventory

| Area | Confirmed | Classification |
|---|---|---|
| Quick Map | asset dimensions, quick-map coordinate registry, validation/calibration behavior | Active map client |
| Mini Map | Quick Map UI/client component | Active map client |
| Destination Registry | districts/facilities/activity placeholders and backend city registry | Authority registry for virtual places |
| Road Traffic | road traces and authoring/live preview references | Partial geometry/authoring system; not full authority |
| Water Mobility | river flow and regional water routes | Partial geometry/visual system |
| River Flow | master-city water path registry | Geometry registry |
| Ocean | regional scenes and ocean dev page | Active visual/spatial scene system |
| Sky Bridge / Transit | registry-only hub, road corridor metadata, explicit absence from Mini Map until real city-state data | Pending/incomplete |
| Emergency / Dispatch | capability metadata only | Not a confirmed engine |
| Incidents | not independently confirmed as authoritative engine | Unknown/pending |
| Missions | backend mission resolver and UI mission systems | Domain authority remains missions |
| Events | metaverse/event modules exist but not audited as spatial authority | Domain authority remains events |
| Career/civic destinations | destination projection via metaverse/discovery adapters | Virtual destination projections |
| Learning Arcade | metaverse activity/destination relationship via registry | Virtual destination/activity layer |
| DAY/DUSK/NIGHT | scene assets and environment state | Visual environment layer |
| Accessibility | metaverse accessibility/dev affordances present | Requires GEO-7 acceptance tests |
| Scene/normalized/camera coordinates | multiple coordinate families confirmed | Must remain explicitly typed |

## 14. REAL_WORLD vs METAVERSE Separation Rules

REAL_WORLD coordinates are latitude/longitude, real geographic boundaries, county/city/region/service geography, and jurisdiction identifiers. METAVERSE coordinates are scene coordinates, normalized image coordinates, SVG/canvas coordinates, route/path coordinates, and camera/world coordinates.

Rules:

1. Do not convert METAVERSE coordinates to REAL_WORLD coordinates without an explicit, reviewed transform.
2. Do not use REAL_WORLD county or jurisdiction names to imply verified location unless the domain authority supplies them.
3. Do not merge quick-map and master-city coordinates without a calibration registry.
4. Map clients may display both families, but projection records must declare family and coordinate space.
5. Unknown, unapproved, or demo geography must render as unknown/suppressed/demo, not as a real county fallback.

## 15. Existing-Map Restoration Analysis

Exchange / Capital should keep the mounted Mapbox route and preserve disconnected globes for GEO-8 analysis. SHS operations should preserve operational-map behavior while moving token, remote source, fallback, and provenance decisions into GEO-4. SHF Public Impact should not be restored by simply mounting the route because current public-approved data is empty and unknown entity geography can default to Franklin County. Metaverse Quick Map should be restored forward as a future Spatial Engine client, with explicit coordinate-family separation and no invented transform to master-city.

## 16. Authority / Projection Boundary Matrix

| Boundary | Projection allowed | Authority prohibited |
|---|---|---|
| Domain record -> map point | render eligible coordinate and metadata | create or infer domain record |
| County metric -> choropleth/layer | color/label verified public metric | calculate or approve metric |
| Mission/event -> metaverse marker | present registry-linked destination | change mission/event state |
| Route/path -> map line | display path and progress | decide route authority unless engine owns it |
| Selection -> domain panel | emit selected id/family/space | grant permissions or mutate source |

## 17. Roadmap Concept Additions

Explore / Analyze / Act: Spatial surfaces should support discovery, comparison/verification, and domain action handoff as separate modes.

Destination Intelligence: Destination records should connect places, routes, opportunities, missions, and evidence without transferring domain authority.

Temporal Spatial Intelligence: Maps should support time slices, event windows, and historical/forecast overlays only when source data supplies temporal provenance.

Shared Spatial Selection: A selected spatial object should carry id, authority, coordinate family, coordinate space, provenance, and eligible actions.

Verification-Native Visualization: Spatial claims should expose evidence and confidence inline instead of hiding verification outside the map.

Spatial Evidence: Every authoritative spatial claim needs producer, source, timestamp/freshness, eligibility, and publication state.

Geographic Command Center: A command center may coordinate many domains visually, but action authority remains with each owning domain.

GEO-10 parity/migration gate: GEO-10 must certify that the new Spatial Intelligence architecture preserves or intentionally retires current maps, disconnected candidates, route behavior, accessibility, evidence boundaries, and public/private projection boundaries.

## 18. GEO-1 Through GEO-10 Revalidation

| Phase | Revalidated readiness | Conditions |
|---|---|---|
| GEO-1 Authority Charter | READY WITH CONDITIONS | Must adopt separate authorities/shared coordination and preservation-before-replacement |
| GEO-2 Asset Registry | READY WITH CONDITIONS | Must register local and remote geometry/media provenance |
| GEO-3 Spatial Data Contracts | NOT READY | Needs coordinate family, feature id, geometry, jurisdiction, and transform rules |
| GEO-4 Runtime Engine Boundary | NOT READY | Needs Mapbox token/source/fallback, bundle, and engine/client policy |
| GEO-5 Evidence and Publication | NOT READY | Needs public approval, metric, evidence, and reporting gates |
| GEO-6 Domain Integration | NOT READY | Needs domain-owned adapters and no authority transfer |
| GEO-7 Accessibility | NOT READY | Needs keyboard, reduced-motion, text equivalent, and nonvisual test evidence |
| GEO-8 Preservation/Restoration | NOT READY | Needs disposition for checkpoint/globe/test-page candidates |
| GEO-9 Implementation Plan | NOT READY | Depends on GEO-1 through GEO-8 decisions |
| GEO-10 Certification | NOT READY | Must include parity/migration gate and acceptance evidence |

## 19. Revalidated GEO-0 Completion Decision

GEO-0 is COMPLETE WITH CONDITIONS. The packet now contains the required registries, matrices, coordinate-family rules, route/restoration findings, metaverse inventory, risk register additions, and roadmap concept additions. Conditions remain for later phases because several maps are token-dependent, stale-routed, unapproved, disconnected, or coordinate-ambiguous. GEO-1 is READY WITH CONDITIONS and must begin with authority and preservation decisions, not implementation.
