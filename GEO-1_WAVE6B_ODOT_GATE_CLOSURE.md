# GEO-1 Wave 6B ODOT Gate Closure

## Gate Status

| Gate | Status | Finding |
| --- | --- | --- |
| Rights | `RIGHTS_GATE_REQUIRES_WRITTEN_CLARIFICATION` | Public access is clear; redistribution, modification, retained snapshots, and commercial use are not fully stated. |
| Snapshot governance | `SNAPSHOT_GATE_CLEAR_WITH_CONDITIONS` | Contract, identity, lifecycle, approval, refresh, and rollback rules are frozen; tooling and an approved active snapshot do not exist. |
| First consuming client | `NO_JUSTIFIED_CLIENT` | No current client needs ODOT detail with a complete authority/publication/regression contract. |

## Coordinate Space

`REUSE_EXISTING_SPACE` conditionally. An approved snapshot must be WGS84
longitude/latitude GeoJSON matching `real-world.county-geojson`. Publisher
identity belongs in provenance, not in a new coordinate space. Native Web
Mercator output must remain explicitly labeled and cannot be treated as WGS84.

## Proposed Adapter Contract

```text
domain: odot-operational-geography
sourceAuthority: ohio-dot-tims-county
featureType: county
sourceRecordId: validated five-digit FIPS_COUNTY_CD
```

Minimal input: `FIPS_COUNTY_CD`, `COUNTY`, Polygon/MultiPolygon geometry, and a
reference to approved snapshot metadata and rights status.

## Census Coexistence

ODOT and Census features for the same FIPS are distinct Spatial features with
distinct authority, provenance, geometry, and purpose. No deduplication is
permitted.

## Red-Test Readiness Plan

Prepare, but do not implement, an 18-case contract covering source authority,
snapshot identity, FIPS integrity, geometry, coordinate space, provenance,
rights metadata, no live network, Census coexistence, publication separation,
client isolation, and immutability.

## Final Decision

`BLOCKED_BY_CLIENT`

This is a gate-closure result, not a rejection of ODOT as a future source.
Rights clarification and an approved snapshot contract remain independent
conditions.
