# GEO-1 Wave 5E IEP Migration Acceptance

## Decision

`IEP_MIGRATION_COMPLETE_WITH_ROLLBACK`

The IEP county map now uses the governed Spatial path by default while keeping
the existing renderer, route, county identity, domain-data authority, and
navigation authority unchanged. The legacy direct preparation path remains
available only as an explicit development rollback.

## Default Path

```text
public/assets/maps/ohio-counties.geojson
  -> CensusCountyGeometryAdapter
  -> Spatial Projection Pipeline
  -> ClientProjectionResult
  -> IepCountyClientAdapter
  -> OhioCountyOfficialMapV2
```

The Census asset remains the qualified canonical source. It is not a legacy
asset and is not deleted.

## Acceptance

- 88 source counties, 88 Spatial features, 88 client view models, and 88 rendered counties.
- FIPS, geometry, and label parity are exact; missing, duplicate, and extra FIPS are zero.
- Domain joins use only `record.countyFips === countyViewModel.countyFips`.
- Unresolved records remain unresolved and receive no geometry.
- No `entityToCounty` call, Franklin fallback, name matching, or address inference occurs on the migrated path.
- The existing renderer, route, local selection, drawer behavior, and navigation authority remain in place.
- Public Census geography does not publish or expose private/unpublished IEP data.
- Spatial preparation failure presents a controlled error and does not silently select legacy data.
- DEV-only rollback and dual-run diagnostics are explicitly gated and production-inactive.

## Production Preview

The standalone production preview mounted React, rendered 88 counties, and kept
the Spatial path active. The standalone preview also emitted `/api/auth/me`
HTTP 500 because no API service was attached; this is classified as
`EXPECTED_MISSING_SERVICE`, not a Spatial defect.

## Evidence

- Wave 5D cutover tests: `20/20 PASS`
- Wave 5E focused browser acceptance: `2/2 PASS`
- Prior browser set: `10/10 PASS`
- Full Spatial regression: `383/383 PASS`
- IEP regression: `6/6 PASS`
- Production build and preview: `PASS`

## Remaining Conditions

The DEV rollback remains available for operational observation and the
diagnostic dual-run remains available for regression evidence. Future IEP
backend producers must supply `countyFips: string | null`; that future API
condition does not invalidate this repository-controlled migration.
