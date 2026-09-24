# MET-15 Clean Plate Asset Plan

This plan covers the production metaverse scenes currently wired through `METAVERSE_PRODUCTION_BACKGROUND_SET` in `src/system/metaverse/metaverseVisualAssets.js`.

MET-15 does not generate or edit image files. Existing images remain usable as environment plates, while final clean-plate production is tracked as P1 asset work where traffic, people, or distractions need visual cleanup.

| Scene | Current asset | Production status | Traffic cleanup needed? | People cleanup needed? | Day variant? | Dusk variant? | Night variant? | Overlay path support? | Replacement filename recommendation |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| silicon-heartland-city | `public/assets/metaverse/city/silicon-heartland-city-master-overview.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `silicon-heartland-city-master-overview-clean-dusk.png`, plus `-day.png`, `-night.png` |
| civic-district | `public/assets/metaverse/districts/civic-district-city-hall-plaza.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `civic-district-city-hall-plaza-clean-dusk.png`, plus variants |
| career-education-district | `public/assets/metaverse/districts/career-education-district-university-overview.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `career-education-district-university-overview-clean-dusk.png`, plus variants |
| data-center-district | `public/assets/metaverse/districts/data-center-district-overview.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `data-center-district-overview-clean-dusk.png`, plus variants |
| learning-arcade-district | `public/assets/metaverse/districts/learning-arcade-district-portal-plaza.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `learning-arcade-district-portal-plaza-clean-dusk.png`, plus variants |
| treasury-commerce-district | `public/assets/metaverse/districts/treasury-commerce-district-overview.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `treasury-commerce-district-overview-clean-dusk.png`, plus variants |
| technology-innovation-district | `public/assets/metaverse/districts/technology-innovation-district-overview.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `technology-innovation-district-overview-clean-dusk.png`, plus variants |
| community-district | `public/assets/metaverse/districts/community-district-public-realm.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `community-district-public-realm-clean-dusk.png`, plus variants |
| student-life-district | `public/assets/metaverse/districts/student-life-district-overview.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `student-life-district-overview-clean-dusk.png`, plus variants |
| public-realm | `public/assets/metaverse/districts/public-realm-civic-plaza.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `public-realm-civic-plaza-clean-dusk.png`, plus variants |
| main-data-center | `public/assets/metaverse/facilities/northstar-data-center-facility.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `northstar-data-center-facility-clean-dusk.png`, plus variants |
| data-center-training-lab | `public/assets/metaverse/facilities/data-center-training-facility.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `data-center-training-facility-clean-dusk.png`, plus variants |
| innovation-lab | `public/assets/metaverse/facilities/infrastructure-project-work-zone.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `infrastructure-project-work-zone-clean-dusk.png`, plus variants |
| student-hub | `public/assets/metaverse/facilities/student-social-commons-facility.png` | NEEDS_TRAFFIC_CLEANUP | Yes | No prominent people currently classified | Missing | Current fallback | Missing | Yes | `student-social-commons-facility-clean-dusk.png`, plus variants |

## Clean Plate Requirements

- Preserve architecture, composition, district identity, roads, lanes, lighting, green infrastructure, transit cues, and cinematic Silicon Heartland style.
- Remove prominent frozen cars, buses, service vehicles, and any frozen crowd activity that would conflict with MET-15 overlay movement.
- Retain only distant parked vehicles where they read as static context and do not sit directly under curated overlay traffic paths.
- Keep road lanes visually clean enough for overlay traffic, transit, and service routes.
- Do not bake live state into images: no counts, assignment status, eligibility, names, credentials, market facts, civic decisions, or presence.

## P1 Asset Production

All current production scenes are usable as fallbacks, but final clean plates and full `DAY`/`NIGHT` variants remain P1 asset-production work. No cleanup is marked complete until replacement files exist in `public/assets/metaverse/**` and the manifest points to them.
