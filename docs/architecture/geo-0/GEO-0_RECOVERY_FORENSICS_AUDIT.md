# GEO-0 Recovery and Forensics Audit

Created: 2026-09-27
Status: COMPLETE WITH CONDITIONS

## 1. Executive Result

GEO-0 is complete with conditions as an audit-only recovery and forensics packet. The current repository contains working spatial-adjacent surfaces, static/demo geography fixtures, public GeoJSON assets, runtime map dependencies, backend jurisdiction metadata, substantial Metaverse spatial systems, and historical recovery folders. The repository does not currently contain a single canonical Spatial Intelligence authority layer.

No GEO-1 work was implemented. No spatial implementation was restored, redesigned, deleted, consolidated, or migrated.

The targeted completion pass added `GEO-0_TARGETED_COMPLETION_ADDENDUM.md`, which expands this audit with map, layer, engine, route, asset, authority, restoration, opportunity, coordinate, data-flow, gap, spatial-library, Metaverse inventory, roadmap concept, GEO-10 gate, and GEO-1 through GEO-10 validation deliverables.

## 2. Baseline Verification

The required preflight checks passed before any GEO-0 artifacts were written:

| Check | Observed |
|---|---|
| `pwd` | `/Users/mikeslate/Projects/silicon-heartland-spatial-intelligence` |
| `git rev-parse --show-toplevel` | `/Users/mikeslate/Projects/silicon-heartland-spatial-intelligence` |
| `git branch --show-current` | `feature/spatial-intelligence-geo0` |
| `git status` | `?? docs/architecture/geo-0/` |
| `git log -1 --oneline` | `2651e17 feat(fabric): harden run execution safety` |

## 3. Active Spatial Surfaces

| Surface | Evidence | Current Classification |
|---|---|---|
| Ohio county neutral map | `src/pages/iep-command-v2/OhioCountyNeutralBase.jsx` | Active geometry renderer using static GeoJSON and d3-geo. |
| SHF Ohio map engine | `src/pages/shf-command/SHFOhioMapEngine.jsx` | Active map wrapper with static page-local metrics. |
| IEP command center county profiles | `src/pages/iep-command-v2/countyProfiles.js` | Static/fabricated restricted demo data per reporting registry. |
| Operational globe | `src/components/globe/OperationalGlobe.jsx` | Disconnected preservation candidate; no confirmed live importer in current pass. |
| Mapbox operational command map | `src/pages/exchange/unified-truth/components/SHSOperationalMapboxMap.jsx` | Active lazy-loaded Mapbox surface with remote GeoJSON and UI context publication. |
| CivicSure explorer geography frame | `apps/shf-web/src/pages/civicsure/explorer/civicsureExplorerMockData.js` | Explicit demo/frame data with decorative positions. |

Additional targeted findings:

- Exchange / Capital Unified Truth is mounted through Capital Exchange routes and remains token-dependent.
- SHF Public Impact has a stale intended Foundation route; command/admin contexts mount the impact command center, but `foundation.html#/impact` is not handled by the current Foundation entry router.
- `src/system/resolvers/entityToCounty.js` maps unknown entities to Franklin County; this is a confirmed spatial integrity risk.
- Metaverse Quick Map and master-city coordinates are distinct normalized coordinate spaces with no confirmed transform.
- Emergency/dispatch and Sky Bridge/Transit are not confirmed complete engines; current evidence supports capability metadata, registry-only entries, or pending layers.

## 4. Spatial Assets

Static assets found:

- `public/geo/ohio-counties.geojson`
- `public/geo/us-states.geojson`
- `public/geo/us-counties.geojson`
- `public/assets/maps/ohio-counties.geojson`
- `public/assets/maps/clusters/*.geojson`
- `public/assets/maps/usa-base.svg`
- `public/assets/maps/usa-state-lines.svg`

GEO-0 did not verify source license, freshness, geometry precision, or authoritative source lineage for these assets. GEO-2 should register that metadata before any authoritative use.

## 5. Runtime and Bundle Boundary

`package.json` includes spatial runtime dependencies: `d3-geo`, `globe.gl`, `mapbox-gl`, `maplibre-gl`, `react-globe.gl`, `three`, `three-globe`, and `topojson-client`.

`vite.config.js` already splits Mapbox, MapLibre, geo support, Mapbox/MapLibre support, and chart/d3 families into manual chunks. It also contains a Capital route preload filter for Mapbox. GEO-4 should treat this as an existing performance boundary, not incidental code.

## 6. Backend Spatial/Geography Evidence

The backend has jurisdiction and geography scope concepts:

- `apps/shs-api/migrations/099_government_program_assurance_source_scope.sql` defines `gpa_jurisdictions` with `jurisdiction_type`, `canonical_name`, `state_country_code`, `geographic_reference`, `parent_jurisdiction_id`, status, and provenance JSON.
- `apps/shs-api/migrations/025_report_publications.sql` defines `shf_public_impact_projections.geography_level` constrained to `COUNTY`, `STATE`, and `ORGANIZATION_WIDE`.

No reviewed migration showed a canonical PostGIS-style geometry/geography table or authoritative persisted geometry column. GEO-3 must decide whether such persistence is needed.

## 7. Reporting and Truth Boundary

The existing reporting surface registry is a controlling constraint:

- `surface.impact.ohio` is classified as static/provenance-insufficient and requires a real county producer.
- `surface.iep.command` is classified as fabricated/static and marked not for institutional reporting.
- `surface.exchange.public` is classified as noncanonical/provenance-insufficient.

Therefore, current map visualizations and static county values must not be used as verified institutional reporting or public impact authority.

## 8. Historical Recovery Candidates

Historical spatial and command-map candidates were found in locked/frozen/recovery directories, including:

- `_LOCKED_MAP_CLICK_CONTEXT_BRIDGE_V1_20260515_192839`
- `_LOCKED_MAP_CLICK_CONTEXT_BRIDGE_V1_20260515_193058`
- `_LOCKED_REGIONAL_DETAIL_SIDE_RAIL_FIX_20260515_223801`
- `_LOCKED_SHF_HEADER_FOOTER_GLOBE_BRANDING_20260516_101030`
- `_LOCKED_SELECTED_COUNTY_CONTEXT_V1_20260515_185544`
- `_frozen_checkpoints/ohio_map_working_20260407_215302`
- `_frozen_checkpoints/county_layer_stable_20260407_130630`
- `_frozen_checkpoints/iep-command-v2-recovered`
- `_recovery_shf_command_20260514_204202`
- `_restore_real_shf_command_20260514_210237`

These are reference/provenance sources only for GEO-0. They were not restored, removed, or consolidated.

## 9. GEO-1 Through GEO-10 Validation

GEO-1 through GEO-10 are valid future phases only if they consume the evidence and constraints in this packet. GEO-1 should start with an authority charter and owner decision lock. It should not begin by copying historical map code or replacing active surfaces.

## 10. Files Created by GEO-0

- `docs/architecture/geo-0/GEO-0_SPATIAL_INTELLIGENCE_ROADMAP_V0_9.md`
- `docs/architecture/geo-0/GEO-0_SPATIAL_INTELLIGENCE_ROADMAP_V0_9.json`
- `docs/architecture/geo-0/GEO-0_SPATIAL_IMPLEMENTATION_REGISTRY.json`
- `docs/architecture/geo-0/GEO-0_EVIDENCE_MATRIX.md`
- `docs/architecture/geo-0/GEO-0_EVIDENCE_MATRIX.json`
- `docs/architecture/geo-0/GEO-0_PHASE_VALIDATION_MATRIX.md`
- `docs/architecture/geo-0/GEO-0_RISK_REGISTER.md`
- `docs/architecture/geo-0/GEO-0_RECOVERY_FORENSICS_AUDIT.md`
- `docs/architecture/geo-0/GEO-0_COMPLETION_REPORT.md`
- `docs/architecture/geo-0/GEO-0_TARGETED_COMPLETION_ADDENDUM.md`

## 11. GEO-0 Conclusion

GEO-0 is complete with conditions. The repository is ready for a GEO-1 authority-charter phase with conditions, but not for implementation. No GEO-1 implementation was started.
