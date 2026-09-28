# GEO-1 Wave 5D IEP Spatial Cutover Report

## Data path

Previous default:

```text
/assets/maps/ohio-counties.geojson -> direct IEP map parsing -> OhioCountyOfficialMapV2
```

Current default:

```text
/assets/maps/ohio-counties.geojson
  -> CensusCountyGeometryAdapter
  -> Spatial Projection Pipeline
  -> ClientProjectionResult
  -> IepCountyClientAdapter
  -> OhioCountyOfficialMapV2
```

The renderer, D3 screen projection, route, styling, detail drawer, and local
selection behavior remain intact. D3's real-world GeoJSON to SVG screen
projection is renderer presentation, not an engine coordinate transform.

## Rollback and failure policy

`iepLegacyMap=1` activates the legacy direct path only in development and only
when explicitly requested. Spatial preparation failures produce a controlled
unavailable/error state; they do not silently fall back to legacy data. The
legacy path remains retained for Wave 5E observation and retirement review.

## Identity and authority

County identity remains validated five-digit Ohio FIPS. Domain joins remain
`record.countyFips === countyViewModel.countyFips`. No `entityToCounty`, name
matching, Franklin fallback, navigation transfer, publication transfer, or ODOT
data was introduced.

## Verification

- County count: `88/88`
- FIPS parity: exact
- Geometry parity: exact
- Label parity: exact
- Cutover unit tests: `20/20 PASS`
- Development cutover/rollback browser tests: `2/2 PASS`
- Existing IEP/dual-run/accessibility/Quick Map browser set: `10/10 PASS`
- Full Spatial regression after cutover: `383/383 PASS`
- IEP regression: `6/6 PASS`
- Production preview: React mounted and 88 paths rendered
- Production query `iepSpatialDualRun=1`: did not activate diagnostics
- Production source marker: absent outside DEV
- Census and ODOT assets: byte-stable
- Build: `PASS`

The production preview emitted one non-fatal `500` for `/api/auth/me` because
the standalone preview has no API service attached; it did not prevent React
mounting or county rendering.

## Status

`WAVE_5D_COMPLETE_WITH_ROLLBACK_CONDITION`

Wave 5E owns rollback observation, final parity closure, and legacy-path
retirement. This cutover remains uncommitted for review.
