# GEO-0 Spatial Intelligence Roadmap V0.9

Status: PROVISIONAL
Created: 2026-09-27
Scope: Spatial Intelligence program GEO-0 through GEO-10

## Authority Boundary

This roadmap is an audit artifact. It does not implement GEO-1 and does not restore, redesign, delete, consolidate, or migrate any existing spatial implementation. Any later phase must re-check repository state before changing source code.

## Repository Baseline

| Check | Result |
|---|---|
| Working directory | `/Users/mikeslate/Projects/silicon-heartland-spatial-intelligence` |
| Repository root | `/Users/mikeslate/Projects/silicon-heartland-spatial-intelligence` |
| Branch | `feature/spatial-intelligence-geo0` |
| Starting tree | Clean |
| Starting HEAD | `2651e17 feat(fabric): harden run execution safety` |

## Current-State Summary

The repository already contains several spatial-adjacent surfaces and assets:

- Active geography UI exists in Ohio county geometry, operational globe, Mapbox command map, CivicSure geography frames, and exchange/command-center node maps.
- Static/demo geography is significant. `docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json` already classifies SHF impact Ohio map and IEP command county metrics as static/demo or provenance-insufficient, not institutional reporting authority.
- Public GeoJSON assets exist under `public/geo/` and `public/assets/maps/`.
- Runtime spatial dependencies exist in `package.json`: `d3-geo`, `globe.gl`, `mapbox-gl`, `maplibre-gl`, `react-globe.gl`, `three`, `three-globe`, and `topojson-client`.
- Backend jurisdiction and geography-level concepts exist, but no PostGIS/geometry/geography database implementation was found in the reviewed migrations.

## Roadmap

| Phase | Name | Purpose | Entry Gate | Exit Evidence | GEO-0 Validation |
|---|---|---|---|---|---|
| GEO-0 | Recovery and Forensics | Inventory spatial assets, implementations, historical recovery folders, authority boundaries, and gaps. | Correct repo, branch, and clean tree. | This GEO-0 packet. | COMPLETE in this packet. |
| GEO-1 | Canonical Spatial Authority Charter | Define ownership, allowed data classes, spatial source authority, and non-authoritative demo boundaries. | GEO-0 complete. | Charter, owner decisions, acceptance criteria. | READY WITH BLOCKERS. Owner decisions required. |
| GEO-2 | Spatial Asset and Source Registry | Canonicalize asset/source metadata without moving assets. | GEO-1 charter accepted. | Registry schema and source records for current assets. | NOT STARTED. Existing assets identified. |
| GEO-3 | Spatial Data Contracts | Define county, jurisdiction, geometry, feature, coordinate, and provenance contracts. | GEO-2 registry accepted. | Type/schema contracts and migration plan if persistence is required. | NOT STARTED. Current contracts are partial. |
| GEO-4 | Map Runtime Boundary | Decide runtime engines and route-level loading rules across d3/SVG, Globe, Mapbox, MapLibre, and Three. | GEO-3 contracts accepted. | Runtime boundary spec and bundle/performance policy. | NOT STARTED. Current Vite chunks expose map dependency boundaries. |
| GEO-5 | Spatial Truth and Reporting Boundary | Bind spatial claims to Evidence, Truth, Metric Registry, Reporting, and public disclosure only where approved. | GEO-3 plus Reporting authority decisions. | Claim eligibility and public-safe projection rules. | NOT STARTED. Existing reporting registry flags key gaps. |
| GEO-6 | CivicSure / GPA Jurisdiction Integration | Connect jurisdiction/source-scope models to spatial read surfaces without turning maps into authority. | GEO-5 approved. | Jurisdiction resolution acceptance tests. | NOT STARTED. Backend jurisdiction schema exists. |
| GEO-7 | User Experience and Accessibility Acceptance | Validate spatial views for accessible alternatives, keyboard behavior, text equivalents, and responsive framing. | GEO-4 implementation boundary accepted. | UI acceptance matrix and Playwright evidence. | NOT STARTED. Needs AX review. |
| GEO-8 | Migration and Preservation Plan | Decide what to preserve, archive, leave untouched, or replace later. | GEO-1 through GEO-7 decisions. | Non-destructive migration/disposition plan. | NOT STARTED. GEO-0 inventories candidates only. |
| GEO-9 | Implementation Readiness Gate | Confirm all dependencies, risks, owners, tests, and rollback are ready before implementation. | GEO-8 accepted. | Go/no-go gate and issue register. | NOT STARTED. |
| GEO-10 | Final Spatial Intelligence Acceptance | Certify spatial intelligence implementation against contracts and repository evidence. | GEO-1 through GEO-9 complete and implementation delivered. | Final acceptance report. | NOT STARTED. |

## Phase Ordering Rules

1. GEO-1 must not start from historical map code alone; it must consume GEO-0 evidence and owner decisions.
2. No phase may treat demo/static county values as institutional reporting metrics without a verified producer, Truth predicate, Metric Registry entry, and Reporting Service path.
3. No phase may delete, restore, or consolidate historical recovery folders without a separate approved preservation plan.
4. No backend spatial persistence may be added until GEO-3 defines whether geometry storage is needed.
5. Any map engine change must preserve route-level lazy-loading and bundle boundaries unless GEO-4 explicitly changes them.

## Recommended Next Step

GEO-1 should create the Canonical Spatial Authority Charter and owner decision lock. It should not implement spatial features.
