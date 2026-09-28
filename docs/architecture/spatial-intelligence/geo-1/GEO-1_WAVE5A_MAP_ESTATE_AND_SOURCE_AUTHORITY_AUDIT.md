# GEO-1 Wave 5A Map Estate and Source Authority Audit

## Decision

Wave 5A is **COMPLETE WITH CONDITIONS** as a discovery baseline. No production source mapping is accepted by this audit. Candidate ownership is recorded separately from confirmed authority.

## Estate Summary

The current estate contains 12 confirmed map/client or disconnected implementation records: 8 active or mounted client candidates and 4 disconnected, test-only, frozen, or unmounted candidates. This is an inventory count, not a claim that every record is a production Spatial client.

| Map ID | Current implementation / route | Coordinate family / space | Source authority status | Readiness | Preservation status |
| --- | --- | --- | --- | --- | --- |
| `metaverse.quick-map` | `MetaverseMiniMap.jsx`, city page | METAVERSE / `metaverse.quick-map` | UNKNOWN for legacy records | BLOCKED | ACTIVE |
| `metaverse.master-city` | `MetaverseCityPage.jsx` scene relationships | METAVERSE / master-city space | Metaverse registry candidate | READY WITH CONDITIONS | ACTIVE |
| `metaverse.regional-scenes` | `MetaverseRegionalScenePage.jsx` and `regionalSceneRegistry.js` | METAVERSE / regional scene spaces | Metaverse presentation registry | PARTIAL | ACTIVE |
| `shs.operations-mapbox` | `SHSOperationalMapboxMap.jsx`, unified truth route | REAL_WORLD / Mapbox geographic view | SHS operational candidate; authority boundaries unresolved | PARTIAL | ACTIVE BUT DEGRADED |
| `exchange.unified-truth` | `UnifiedTruthMapRoute.jsx` / Exchange routes | REAL_WORLD / Mapbox geographic view | Exchange/SHS boundary requires confirmation | PARTIAL | ACTIVE |
| `shf.public-impact` | `SHFImpactOhioMap.jsx`, Foundation impact route | REAL_WORLD / Ohio county geometry | SHF publication owner; records currently not public-approved | BLOCKED | ACTIVE BUT DEGRADED |
| `iep.ohio-county` | `OhioCountyOfficialMapV2.jsx` | REAL_WORLD / county GeoJSON | IEP map consumes geometry; provenance owner unresolved | PARTIAL | ACTIVE |
| `shf.ohio-engine` | `SHFOhioMapEngine.jsx` and test page | REAL_WORLD / county GeoJSON | SHF candidate with hardcoded metrics | BLOCKED | DISCONNECTED / RESTORATION CANDIDATE |
| `metaverse.regional-route-context` | regional route sequence and scene quick maps | METAVERSE / regional scene | Presentation registry; route authority not Spatial | PARTIAL | ACTIVE |
| `globe.operational` | `OperationalGlobe.jsx` | REAL_WORLD / globe lat-lng | UNKNOWN | UNKNOWN | UNMOUNTED CANDIDATE |
| `globe.real` | `RealGlobe.jsx` | REAL_WORLD / remote county GeoJSON | UNKNOWN; demo-like direct source | UNKNOWN | UNMOUNTED CANDIDATE |
| `exchange.outcome-globe` | `OutcomeGlobe.jsx` | REAL_WORLD / hardcoded lat-lng arcs | UNKNOWN | UNKNOWN | DISCONNECTED / DEPRECATION CANDIDATE |

Evidence includes `src/system/metaverse/metaverseMiniMapRegistry.js:11-27,68-89`, `src/system/metaverse/regionalSceneRegistry.js:11-33`, `src/pages/exchange/unified-truth/components/SHSOperationalMapboxMap.jsx:31-34,2362-2377`, `src/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx:22-47`, and the globe component files listed above.

## Authority Rules

- A map appearance is not evidence of a canonical domain record.
- Coordinate ownership, source authority, publication authority, and verification authority remain separate fields.
- No legacy Quick Map entry is promoted by this audit.
- No coordinate transform is created between Quick Map, master-city, regional, or REAL_WORLD spaces.
- Existing implementations are preserved until GEO-10-level parity evidence supports retirement.

## Immediate Findings

1. Quick Map has a stable asset and normalized coordinate convention, but its 15 registry entries do not yet have accepted production source records.
2. The master-city relationship registry is a distinct, verified coordinate system and must not be reused as Quick Map geometry.
3. Regional scenes preserve a 15-stop route sequence, but all destination references are explicitly null in the current registry.
4. The Exchange/SHS Mapbox client requires `VITE_MAPBOX_TOKEN` and a remote county GeoJSON URL.
5. SHF public impact code correctly filters on `publicApproved === true`; current sample records are not approved.
6. The Franklin County fallback remains a spatial integrity blocker and is intentionally not changed in Wave 5A.

## Quick Map Legacy Entry Audit

The registry contains 9 district entries and 6 infrastructure entries. The `id` below is a legacy marker identifier, not an accepted canonical source record ID.

| Legacy marker | Classification | Coordinates / destination | Candidate owner | Confirmed source / provenance | Publication / verification | Migration |
| --- | --- | --- | --- | --- | --- | --- |
| `civic-district` | District, UNMAPPED | null / `civic-district` route | Metaverse candidate | UNKNOWN; registry only | UNKNOWN | BLOCKED |
| `career-education-district` | District, UNMAPPED | null / `career-education-district` route | Metaverse candidate | UNKNOWN; registry only | UNKNOWN | BLOCKED |
| `public-realm` | District, UNMAPPED | null / `public-realm` route | Metaverse candidate | UNKNOWN; registry only | UNKNOWN | BLOCKED |
| `data-center-district` | District, UNMAPPED | null / `data-center-district` route | Metaverse candidate | UNKNOWN; registry only | UNKNOWN | BLOCKED |
| `technology-innovation-district` | District, UNMAPPED | null / `technology-innovation-district` route | Metaverse candidate | UNKNOWN; registry only | UNKNOWN | BLOCKED |
| `learning-arcade-district` | District, UNMAPPED | null / `learning-arcade-district` route | Metaverse candidate | UNKNOWN; registry only | UNKNOWN | BLOCKED |
| `treasury-commerce-district` | District, UNMAPPED | null / `treasury-commerce-district` route | Metaverse candidate | UNKNOWN; registry only | UNKNOWN | BLOCKED |
| `community-district` | District, UNMAPPED | null / `community-district` route | Metaverse candidate | UNKNOWN; registry only | UNKNOWN | BLOCKED |
| `student-life-district` | District, UNMAPPED | null / `student-life-district` route | Metaverse candidate | UNKNOWN; registry only | UNKNOWN | BLOCKED |
| `airport` | Infrastructure, PROVISIONAL | 51.8,72.7 / null | Metaverse presentation candidate | UNKNOWN; provisional icon/coordinate only | UNKNOWN | BLOCKED |
| `hospital` | Infrastructure, PROVISIONAL | 10.4,59.4 / null | Metaverse presentation candidate | UNKNOWN; provisional icon/coordinate only | UNKNOWN | BLOCKED |
| `police` | Infrastructure, PROVISIONAL | 10.4,74.1 / null | Metaverse presentation candidate | UNKNOWN; provisional icon/coordinate only | UNKNOWN | BLOCKED |
| `fire` | Infrastructure, PROVISIONAL | 22.8,59.4 / null | Metaverse presentation candidate | UNKNOWN; provisional icon/coordinate only | UNKNOWN | BLOCKED |
| `mall-retail` | Infrastructure, PROVISIONAL | 23.5,74.6 / null | Metaverse presentation candidate | UNKNOWN; provisional icon/coordinate only | UNKNOWN | BLOCKED |
| `marina-harbor` | Infrastructure, PROVISIONAL | 84.3,32.2 / null | Metaverse presentation candidate | UNKNOWN; provisional icon/coordinate only | UNKNOWN | BLOCKED |

The district route strings are navigation references, not source-record identity. The infrastructure coordinates are normalized Quick Map presentation coordinates, not evidence of real-world infrastructure ownership.

## Wave 5A Boundary

This document records discovery only. It does not create adapters, source mappings, migrations, route fixes, publication approvals, geometry persistence, or map behavior changes.
