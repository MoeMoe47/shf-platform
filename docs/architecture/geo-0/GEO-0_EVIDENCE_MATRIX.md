# GEO-0 Evidence Matrix

Created: 2026-09-27

| Evidence ID | Claim Tested | Evidence | Finding | GEO Impact |
|---|---|---|---|---|
| GEO-EV-001 | Workspace was correct before work began. | `pwd`, `git rev-parse --show-toplevel`, `git branch --show-current`, `git status`, `git log -1 --oneline`. | Directory/root matched expected path; branch was `feature/spatial-intelligence-geo0`; tree was clean; HEAD was `2651e17`. | GEO-0 entry gate satisfied. |
| GEO-EV-002 | Current repo has active spatial dependencies. | `package.json`. | `d3-geo`, `globe.gl`, `mapbox-gl`, `maplibre-gl`, `react-globe.gl`, `three`, `three-globe`, `topojson-client` are present. | GEO-4 must preserve runtime boundaries. |
| GEO-EV-003 | Build config already treats map dependencies specially. | `vite.config.js`. | Manual chunks split Mapbox, MapLibre, geo support, and map support; Capital route filters Mapbox preload. | GEO-4 must not collapse bundle boundaries casually. |
| GEO-EV-004 | Ohio county geometry renders from static GeoJSON. | `src/pages/iep-command-v2/OhioCountyNeutralBase.jsx`; `public/assets/maps/ohio-counties.geojson`. | Component fetches static Ohio county GeoJSON and derives paths/centroids with d3-geo. | GEO-2/GEO-3 need asset/source provenance and geometry contracts. |
| GEO-EV-005 | SHF Ohio map overlays static page-local values. | `src/pages/shf-command/SHFOhioMapEngine.jsx`. | County metrics are hardcoded constants; values are not tied to backend Evidence/Truth/Reporting. | GEO-5 must prevent static values from becoming authority. |
| GEO-EV-006 | IEP command county profile data is static/demo-like. | `src/pages/iep-command-v2/countyProfiles.js`; `docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json`. | Reporting registry classifies IEP command as fabricated/static, restricted, and not for institutional reporting. | GEO-5/GEO-8 must preserve reporting exclusion unless later authority is created. |
| GEO-EV-007 | Operational globe consumes static GeoJSON and hardcoded coordinates. | `src/components/globe/OperationalGlobe.jsx`; `public/geo/us-states.geojson`; `public/geo/us-counties.geojson`. | Globe overlays Ohio/Franklin geometry, hardcoded city/county points, and outcome arcs. | GEO-3 must classify visual coordinates separately from authoritative source records. |
| GEO-EV-008 | Mapbox operational map exists and publishes UI map context. | `src/pages/exchange/unified-truth/components/SHSOperationalMapboxMap.jsx`. | Component uses Mapbox, remote county GeoJSON, local layer steps, operational points, and localStorage event publication. | GEO-4/GEO-5 must define remote asset and UI-state boundaries. |
| GEO-EV-009 | CivicSure explorer geography frame is explicitly demo-only. | `apps/shf-web/src/pages/civicsure/explorer/civicsureExplorerMockData.js`. | Header warns DEMO / FRAME DATA; markers are decorative and not real coordinates. | GEO-5 must keep this outside assurance/reporting authority. |
| GEO-EV-010 | Backend has jurisdiction metadata, not spatial geometry persistence. | `apps/shs-api/migrations/099_government_program_assurance_source_scope.sql`. | `gpa_jurisdictions` includes jurisdiction type/name/geographic reference/provenance; no geometry/geography column. | GEO-3 must decide if geometry persistence is needed. |
| GEO-EV-011 | Public reporting already scopes records by geography level. | `apps/shs-api/migrations/025_report_publications.sql`. | `shf_public_impact_projections.geography_level` is constrained to COUNTY, STATE, ORGANIZATION_WIDE. | GEO-5 can reuse reporting scope concepts without adding authority. |
| GEO-EV-012 | Existing reporting governance flags spatial provenance gaps. | `docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json`. | SHF Impact Ohio Map is static/provenance-insufficient; Exchange public impact is noncanonical; IEP command is fabricated/static. | GEO-0 must not claim current spatial maps are verified reporting systems. |
| GEO-EV-013 | Historical spatial recovery candidates exist. | `_LOCKED_*MAP*`, `_LOCKED_*COUNTY*`, `_frozen_checkpoints/*map*`, `_recovery_shf_command_*`, `_restore_real_shf_command_*`. | Historical folders contain prior map/county command work. | GEO-8 must handle preservation/disposition; GEO-0 does not restore them. |

## Command Evidence

Fresh commands run during GEO-0:

- `pwd`
- `git rev-parse --show-toplevel`
- `git branch --show-current`
- `git status`
- `git log -1 --oneline`
- `rg --files`
- `rg -n` spatial/geography searches across `src`, `apps`, `docs`, `ui`, `contracts`, `public`, `package.json`, and `vite.config.js`
- `find public -maxdepth 4 -type f | rg -i "(geo|map|county|ohio|spatial|json|svg)$"`
- Focused `sed` reads of the evidence files named above
