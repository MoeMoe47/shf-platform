# MET-2A Visual Design Lock & Asset Mapping

## Executive Result

MET-2A locks the production visual direction, camera/navigation hierarchy, overlay layer architecture, image role rules, responsive/accessibility rules, presence/chat placeholders, and canonical asset mapping for the Silicon Heartland Metaverse.

This phase does not implement the metaverse UI, presence/chat, learner unlocks, gameplay, economy transactions, backend authority, migrations, commits, or pushes.

Implementation readiness: **READY FOR IMPLEMENTATION**. MET-2A remediation copied every required approved people-free production background into the canonical repository asset tree.

## Repository Baseline

| Field | Value |
| --- | --- |
| Repository | `/Users/mikeslate/Projects/shrv1` |
| Branch | `studio-v1-plus-development` |
| Phase HEAD | `d44dd81a06ef1bd4f3260416dc9d8b47be58bb5e` |
| MET-0 | `docs/metaverse/MET-0_SYSTEM_WIDE_METAVERSE_CURRENT_STATE_AUDIT.md` |
| MET-1 | `docs/metaverse/MET-1_CANONICAL_METAVERSE_ARCHITECTURE.md` |
| MET-2 | `docs/metaverse/MET-2_CITY_DISTRICT_REGISTRY.md` |
| Canonical city registry | `apps/shs-api/src/domain/metaverse/registry/city-registry.ts` |
| Visual asset manifest | `src/system/metaverse/metaverseVisualAssets.js` |

## Design Lock

| Decision | Locked Value |
| --- | --- |
| World mood | Premium institutional-futuristic Silicon Heartland civic technology environment |
| Lighting | Dusk/sunset; dark navy architectural surfaces, electric blue identity light, warm amber/orange public realm light |
| City material language | Clean modern glass, stone, metal, landscaped plazas, transit, clean energy, data-center infrastructure |
| Signage style | Static place identity only: district/facility names, short civic/institutional mottos, no live-state labels |
| District identity treatment | Each district has a clear architectural anchor and blue/amber wayfinding identity; dynamic status is overlaid by the app |
| Navigation marker style | Electric-blue map pins/rings with icon and text in semantic HTML; never image-only |
| Camera control placement | Desktop top/right or lower/right control cluster; mobile bottom sheet with list/map hybrid |
| Presence overlay style | Small semantic chips/dots/groups above markers and facility panels; no names baked into images |
| Chat treatment | Nearby/group chat tray over the app shell, tied to selected place/facility, with block/mute/report actions |
| Mission/task overlay style | Activity cards and waypoint badges rendered dynamically; no fake tasks/opportunities in backgrounds |
| Mobile behavior | Reduced spatial dependence, bottom-sheet controls, list-first access to city/district/facility hierarchy |
| Accessible alternative mode | Non-spatial tree/list/search navigation with equivalent route/activity entry |

Explicit exclusions:

- no cartoon aesthetic
- no generic sci-fi fantasy
- no cyberpunk decay
- no cluttered dashboard look
- no prominent people in production backgrounds
- no dynamic live state baked into images

## Target Asset Structure

Use the canonical root:

`public/assets/metaverse/`

Required folders:

| Folder | Purpose |
| --- | --- |
| `public/assets/metaverse/city/` | City overview production backgrounds |
| `public/assets/metaverse/districts/` | District-level production backgrounds |
| `public/assets/metaverse/facilities/` | Facility-level production backgrounds |
| `public/assets/metaverse/references/` | Optional copied references that are not live backgrounds |

Do not create a parallel metaverse asset system. Existing non-metaverse assets under `public/assets/arcade/`, `public/assets/career/`, and `public/assets/solutions/` remain reference material unless explicitly promoted into `public/assets/metaverse/`.

## Image Role Rules

| Role | Allowed | Prohibited |
| --- | --- | --- |
| `PRODUCTION_BACKGROUND` | World/environment pixels, static place identity signage, architectural district context | Prominent people, baked dashboard UI, dynamic names, online counts, chat content, task status, live notification state, fake opportunities, fake credentials |
| `REFERENCE_ONLY` | People, mock UI, concept interactions, visual mood references | Live-state authority, credential authority, production dynamic state |
| `OVERLAY_ONLY` | Presence, chat, labels, tasks, opportunities, camera controls, accessibility controls | Baked into production background images |

Production background rule:

Backgrounds represent the world. The application represents the people. Real students, avatars, presence markers, chats, teams, tasks, activity state, notifications, and accessibility controls must be rendered dynamically by the app.

## Overlay Architecture

| Layer | Responsibility | Production Background Boundary |
| --- | --- | --- |
| 1. Environment Layer | Background scene image or future 3D scene | Static world/place imagery only |
| 2. Navigation Layer | District markers, facility markers, waypoints, camera controls, breadcrumbs | Dynamic app UI |
| 3. Presence Layer | Online student indicators, nearby users, teams, instructors, moderators, group markers | Dynamic app UI |
| 4. Activity Layer | Tasks, learning activities, job simulations, civic sessions, arcade challenges, opportunities | Dynamic app UI |
| 5. System Layer | Notifications, accessibility controls, help, safety/reporting controls, connection/session state | Dynamic app UI |

## Camera Model

Canonical hierarchy:

`CITY OVERVIEW -> DISTRICT VIEW -> FACILITY VIEW -> ACTIVITY / SIMULATION VIEW`

Required camera behaviors:

- pan
- zoom
- reset view
- selected-location focus
- district drill-down
- facility drill-down
- breadcrumb navigation
- waypoint selection
- transition back outward
- keyboard-accessible equivalent
- reduced-motion mode
- list-based alternate navigation

Camera movement is an experience layer only. It does not grant access, role, credential, job eligibility, civic authority, economy authority, or verified completion.

## Canonical Asset Registry

| Asset ID | City | District | Facility | Camera Level | Use Case | Source Filename | Target Filename | Target Path | Status | People-Free? | Production Background? | Reference Only? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `met-city-master-overview` | `silicon-heartland-city` | - | - | `CITY_OVERVIEW` | Primary city entry, district selection, map/list hybrid overview | `ChatGPT Image Sep 14, 2026, 10_05_24 PM (1).png` | `silicon-heartland-city-master-overview.png` | `public/assets/metaverse/city/silicon-heartland-city-master-overview.png` | `READY` | Yes | Yes | No | Approved people-free master city overview copied into canonical asset root |
| `met-district-civic` | `silicon-heartland-city` | `civic-district` | - | `DISTRICT_VIEW` | City Hall, council, planning, civic-session waypoints | `ChatGPT Image Sep 14, 2026, 09_39_15 PM (3).png` | `civic-district-city-hall-plaza.png` | `public/assets/metaverse/districts/civic-district-city-hall-plaza.png` | `READY` | Yes | Yes | No | Approved people-free district background copied into canonical asset root |
| `met-district-career-education` | `silicon-heartland-city` | `career-education-district` | - | `DISTRICT_VIEW` | University, pathway, portfolio, learning center waypoints | `ChatGPT Image Sep 14, 2026, 09_39_14 PM (1).png` | `career-education-district-university-overview.png` | `public/assets/metaverse/districts/career-education-district-university-overview.png` | `READY` | Yes | Yes | No | Approved people-free Career & Education/University background copied into canonical asset root |
| `met-district-data-center` | `silicon-heartland-city` | `data-center-district` | - | `DISTRICT_VIEW` | Data Center District and training facility drill-down | `ChatGPT Image Sep 14, 2026, 09_39_15 PM (4).png` | `data-center-district-overview.png` | `public/assets/metaverse/districts/data-center-district-overview.png` | `READY` | Yes | Yes | No | Approved people-free Data Center District background copied into canonical asset root |
| `met-district-learning-arcade` | `silicon-heartland-city` | `learning-arcade-district` | - | `DISTRICT_VIEW` | Challenge hub and simulation entrances | `ChatGPT Image Sep 14, 2026, 09_39_15 PM (2).png` | `learning-arcade-district-portal-plaza.png` | `public/assets/metaverse/districts/learning-arcade-district-portal-plaza.png` | `READY` | Yes | Yes | No | Approved people-free Learning Arcade background copied into canonical asset root |
| `met-district-treasury-commerce` | `silicon-heartland-city` | `treasury-commerce-district` | - | `DISTRICT_VIEW` | Projection-only Treasury/Commerce navigation | `ChatGPT Image Sep 14, 2026, 10_12_27 PM (2).png` | `treasury-commerce-district-overview.png` | `public/assets/metaverse/districts/treasury-commerce-district-overview.png` | `READY` | Yes | Yes | No | Approved people-free Treasury & Commerce district background copied into canonical asset root |
| `met-district-technology-innovation` | `silicon-heartland-city` | `technology-innovation-district` | - | `DISTRICT_VIEW` | OAS, AI/agent, Builder/Studio, Innovation Lab waypoints | `ChatGPT Image Sep 14, 2026, 09_39_16 PM (5).png` | `technology-innovation-district-overview.png` | `public/assets/metaverse/districts/technology-innovation-district-overview.png` | `READY` | Yes | Yes | No | Approved people-free Technology & Innovation background copied into canonical asset root |
| `met-district-community` | `silicon-heartland-city` | `community-district` | - | `DISTRICT_VIEW` | Community programs, learning commons, public programs | `ChatGPT Image Sep 14, 2026, 09_39_16 PM (6).png` | `community-district-public-realm.png` | `public/assets/metaverse/districts/community-district-public-realm.png` | `READY` | Yes | Yes | No | Approved people-free Community District background copied into canonical asset root |
| `met-district-student-life` | `silicon-heartland-city` | `student-life-district` | - | `DISTRICT_VIEW` | Student hub, commons, wellness, profile/portfolio access | `ChatGPT Image Sep 14, 2026, 09_39_17 PM (7).png` | `student-life-district-overview.png` | `public/assets/metaverse/districts/student-life-district-overview.png` | `READY` | Yes | Yes | No | Approved people-free Student Life background copied into canonical asset root |
| `met-district-public-realm` | `silicon-heartland-city` | `public-realm` | - | `DISTRICT_VIEW` | Central plaza, orientation, wayfinding, gathering spaces | `ChatGPT Image Sep 14, 2026, 09_39_17 PM (8).png` | `public-realm-civic-plaza.png` | `public/assets/metaverse/districts/public-realm-civic-plaza.png` | `READY` | Yes | Yes | No | Approved people-free Public Realm background copied into canonical asset root |
| `met-facility-northstar-data-center` | `silicon-heartland-city` | `data-center-district` | `main-data-center` | `FACILITY_VIEW` | Northstar Data Center facility focus | `ChatGPT Image Sep 14, 2026, 09_39_17 PM (9).png` | `northstar-data-center-facility.png` | `public/assets/metaverse/facilities/northstar-data-center-facility.png` | `READY` | Yes | Yes | No | Approved people-free Northstar Data Center facility background copied into canonical asset root |
| `met-facility-data-center-training` | `silicon-heartland-city` | `data-center-district` | `data-center-training-lab` | `FACILITY_VIEW` | Data Center Training Facility focus | `ChatGPT Image Sep 14, 2026, 09_39_17 PM (9).png` | `data-center-training-facility.png` | `public/assets/metaverse/facilities/data-center-training-facility.png` | `READY` | Yes | Yes | No | Approved people-free source supports both exterior facility slots and is copied into canonical asset root |
| `met-facility-infrastructure-project-zone` | `silicon-heartland-city` | `technology-innovation-district` | `innovation-lab` | `FACILITY_VIEW` | Infrastructure/project work zone | `ChatGPT Image Sep 14, 2026, 10_12_27 PM (1).png` | `infrastructure-project-work-zone.png` | `public/assets/metaverse/facilities/infrastructure-project-work-zone.png` | `READY` | Yes | Yes | No | Approved people-free Infrastructure Zone / project-work background copied into canonical asset root |
| `met-facility-social-commons` | `silicon-heartland-city` | `student-life-district` | `student-hub` | `FACILITY_VIEW` | Social commons/student hub facility background | `ChatGPT Image Sep 14, 2026, 09_39_17 PM (8).png` | `student-social-commons-facility.png` | `public/assets/metaverse/facilities/student-social-commons-facility.png` | `READY` | Yes | Yes | No | Approved people-free Social Commons / Student Commons background copied into canonical asset root |
| `ref-arcade-eco-city-hero` | `silicon-heartland-city` | `learning-arcade-district` | `arcade-hub` | `DISTRICT_VIEW` | Existing eco/city mood reference | `eco-city-hero.jpg` | `eco-city-hero.jpg` | `public/assets/arcade/eco-city-hero.jpg` | `REFERENCE_ONLY` | Unknown | No | Yes | Existing repo asset |
| `ref-arcade-classical-cabinets` | `silicon-heartland-city` | `learning-arcade-district` | `simulation-hall` | `FACILITY_VIEW` | Existing arcade facility mood reference | `classical-arcade-cabinets.jpg` | `classical-arcade-cabinets.jpg` | `public/assets/arcade/classical-arcade-cabinets.jpg` | `REFERENCE_ONLY` | Unknown | No | Yes | Existing repo asset |
| `ref-career-pathways-hero` | `silicon-heartland-city` | `career-education-district` | `career-center` | `DISTRICT_VIEW` | Career & Education visual reference | `hero.jpg` | `hero.jpg` | `public/assets/career/pathways/hero.jpg` | `REFERENCE_ONLY` | Unknown | No | Yes | Existing repo asset |
| `ref-career-infrastructure-family` | `silicon-heartland-city` | `technology-innovation-district` | `innovation-lab` | `FACILITY_VIEW` | Infrastructure/project-work concept reference | `family-infrastructure.jpg` | `family-infrastructure.jpg` | `public/assets/career/pathways/family-infrastructure.jpg` | `REFERENCE_ONLY` | Unknown | No | Yes | Existing repo asset |
| `ref-solutions-infrastructure-globe` | `silicon-heartland-city` | `public-realm` | `central-plaza` | `DISTRICT_VIEW` | Infrastructure/global civic-future reference | `solutions-infrastructure-globe.png` | `solutions-infrastructure-globe.png` | `public/assets/solutions/solutions-infrastructure-globe.png` | `REFERENCE_ONLY` | Unknown | No | Yes | Existing repo asset |

## Production Background Set

| Scope | Asset | Status | Notes |
| --- | --- | --- | --- |
| CITY | Silicon Heartland master city overview | `READY` | Approved people-free source copied to repo |
| DISTRICT | Civic | `READY` | Approved people-free source copied to repo |
| DISTRICT | Career & Education | `READY` | Approved people-free source copied to repo |
| DISTRICT | Data Center | `READY` | Approved people-free source copied to repo |
| DISTRICT | Learning Arcade | `READY` | Approved people-free source copied to repo |
| DISTRICT | Treasury & Commerce | `READY` | Newly approved people-free source copied to repo |
| DISTRICT | Technology & Innovation | `READY` | Approved people-free source copied to repo |
| DISTRICT | Community | `READY` | Approved people-free source copied to repo |
| DISTRICT | Student Life | `READY` | Approved people-free source copied to repo |
| DISTRICT | Public Realm | `READY` | Approved people-free source copied to repo |
| FACILITY | Northstar Data Center | `READY` | Approved people-free source copied to repo |
| FACILITY | Data Center Training Facility | `READY` | Approved people-free source copied to repo |
| FACILITY | Infrastructure / project work zone | `READY` | Newly approved people-free source copied to repo |
| FACILITY | Social commons/facility view | `READY` | Approved people-free source copied to repo |

## Asset Status Summary

READY:

- `public/assets/metaverse/city/silicon-heartland-city-master-overview.png`
- `public/assets/metaverse/districts/civic-district-city-hall-plaza.png`
- `public/assets/metaverse/districts/career-education-district-university-overview.png`
- `public/assets/metaverse/districts/data-center-district-overview.png`
- `public/assets/metaverse/districts/learning-arcade-district-portal-plaza.png`
- `public/assets/metaverse/districts/treasury-commerce-district-overview.png`
- `public/assets/metaverse/districts/technology-innovation-district-overview.png`
- `public/assets/metaverse/districts/community-district-public-realm.png`
- `public/assets/metaverse/districts/student-life-district-overview.png`
- `public/assets/metaverse/districts/public-realm-civic-plaza.png`
- `public/assets/metaverse/facilities/northstar-data-center-facility.png`
- `public/assets/metaverse/facilities/data-center-training-facility.png`
- `public/assets/metaverse/facilities/infrastructure-project-work-zone.png`
- `public/assets/metaverse/facilities/student-social-commons-facility.png`

NEEDS CLEAN VERSION:

- None.

REFERENCE_ONLY:

- `public/assets/arcade/eco-city-hero.jpg`
- `public/assets/arcade/classical-arcade-cabinets.jpg`
- `public/assets/career/pathways/hero.jpg`
- `public/assets/career/pathways/family-infrastructure.jpg`
- `public/assets/solutions/solutions-infrastructure-globe.png`

MISSING:

- None.

## Camera Transition Matrix

| From | To | Trigger | Transition Type | Camera Behavior | Asset Change | Required Unlock? | Accessible Equivalent |
| --- | --- | --- | --- | --- | --- | --- | --- |
| City Overview | Data Center District | District marker, list item, search result | Drill-down | Pan/zoom to district; reduced motion crossfade | City overview -> Data Center district | No | Select Data Center District from list/tree |
| Data Center District | Northstar Data Center | Facility marker/list item | Facility focus | Focus selected facility; breadcrumbs visible | Data Center district -> Northstar facility | No | Open Main Data Center details from list |
| Northstar Data Center | Training Facility | Training Facility waypoint | Facility-to-facility focus | Short lateral focus transition | Northstar facility -> Training facility | No | Choose Data Center Training Lab from sibling list |
| Training Facility | Simulation | Activity card/route handoff | Activity handoff | Fade to canonical learning/simulation route | Facility background -> activity shell | MET-3 projection if gated | Activate simulation from activity list |
| City Overview | Civic District | District marker/list item/search result | Drill-down | Pan/zoom to City Hall/Civic Plaza | City overview -> Civic district | No | Select Civic District from list/tree |
| Civic District | City Hall | City Hall marker/list item | Facility focus | Focus City Hall and civic waypoints | Civic district remains active | No | Open City Hall details from list |
| City Hall | Council Chamber | Council waypoint | Facility focus | Focus council waypoint | Civic district remains active | Future SHF Civic rule if gated | Select Council Chamber from Civic list |
| Council Chamber | Civic Session | Civic activity card | Activity handoff | Fade to canonical SHF Civic route | Facility background -> civic activity route | Future SHF Civic rule if gated | Open session from activity list |
| City Overview | Learning Arcade | District marker/list item | Drill-down | Pan/zoom to portal/plaza entrance | City overview -> Learning Arcade district | No | Select Learning Arcade from list/tree |
| Learning Arcade | Challenge Hub | Challenge Hub marker | Facility focus | Focus challenge entrance and activities | Learning Arcade district remains active | No | Choose Skills Challenge Center from list |
| Challenge Hub | Game/Simulation | Arcade challenge activity card | Activity handoff | Fade to canonical Arcade route | District background -> Arcade route | Arcade/curriculum authority if gated | Open challenge from activity list |
| City Overview | Career & Education | District marker/list item | Drill-down | Pan/zoom to university/career district | City overview -> Career & Education district | No | Select Career & Education from list/tree |
| Career & Education | Career Center | Career Center marker/list item | Facility focus | Focus Career Center waypoint | Career district remains active | No | Open Career Center from facility list |
| Career Center | Pathway Experience | Pathway activity card | Activity handoff | Fade to canonical Career route | District background -> Career route | Career/curriculum authority if gated | Open pathway from activity list |

## Responsive Visual Rules

Desktop:

- Full camera interaction: pan, zoom, selected-location focus, breadcrumbs, district/facility drill-down, transition back outward.
- Navigation controls may sit in a compact top/right or lower/right cluster with visible labels/tooltips.
- Overlay density may show district labels, facility markers, presence summaries, and priority activity cards at once.

Tablet:

- Camera interaction remains available, but overlays collapse into simpler layers.
- Priority is current place, breadcrumbs, selected facility/activity, and a compact marker set.
- Presence and activity panels should use drawers or side sheets instead of dense floating clusters.

Mobile:

- No forced free-camera dependency.
- Default to list/map hybrid with bottom-sheet controls.
- Spatial view can pan/zoom where useful, but all navigation must be available through semantic district/facility/activity lists.
- Presence, chat, tasks, and system controls use bottom sheets or trays with clear close/back behavior.

## Accessibility Visual Rules

- Keyboard navigation for city, district, facility, waypoint, activity, breadcrumbs, camera controls, and system controls.
- Visible focus state for every actionable marker/control.
- Screen-reader place hierarchy: City -> District -> Facility -> Activity.
- Reduced motion: crossfade or instant focus in place of animated pan/zoom.
- Non-spatial navigation: list/tree/search equivalent for every camera path.
- Zoom-safe labels that reflow or collapse into accessible controls instead of overlapping.
- Contrast-safe overlays over bright/dark image regions.
- Color-independent status indicators with text/icon semantics.
- No essential information only inside image pixels.
- All live state rendered as semantic HTML/UI.

## Presence / Chat Visual Placeholders

Do not implement presence/chat in MET-2A. Future placements:

| Level | Placeholder |
| --- | --- |
| City | District-level online counts and activity summaries rendered as overlay chips |
| District | Nearby students, active teams, available instructors/moderators rendered around selected waypoints |
| Facility | Participants, team/group indicators, instructor/moderator indicators, and session capacity rendered in facility panel |
| Activity | Participant list, team state, help/moderation state rendered in activity shell |
| Chat | Nearby/group chat tray tied to selected place; includes block, mute, and report actions |

No actual student names, avatar identities, online counts, or chat content may be baked into background images.

## Remediation Completion

MET-2A remediation copied the approved people-free production backgrounds into the canonical asset structure:

- `public/assets/metaverse/city/`
- `public/assets/metaverse/districts/`
- `public/assets/metaverse/facilities/`
- `public/assets/metaverse/references/`

The newly approved Treasury & Commerce source fills `public/assets/metaverse/districts/treasury-commerce-district-overview.png`.

The newly approved Infrastructure Zone / project-work source fills `public/assets/metaverse/facilities/infrastructure-project-work-zone.png`.

Public Realm and Community each have distinct approved production backgrounds. No shared-background exception is required.

## Implementation Readiness

Verdict: **READY FOR IMPLEMENTATION**

Exact missing assets:

- None.

Repository-local P0:

- None introduced by MET-2A.

Repository-local P1:

- None.

## Final Verdict

MET-2A locks the visual design direction, target asset structure, production/background/reference rules, dynamic overlay boundaries, camera transition model, responsive behavior, accessibility behavior, placeholder plan, and complete approved people-free production asset set. It is ready for MET-2B.
