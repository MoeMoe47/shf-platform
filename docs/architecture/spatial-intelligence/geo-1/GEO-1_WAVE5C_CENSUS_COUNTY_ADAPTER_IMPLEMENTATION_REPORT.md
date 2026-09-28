# GEO-1 Wave 5C Census County Adapter Implementation Report

## Scope

Wave 5C implements the first qualified production Spatial adapter for Census county base geometry. It does not onboard the IEP map, alter either GeoJSON asset, register an ODOT adapter, fix `entityToCounty`, or create a coordinate transform.

## Adapter

Production modules:

- `src/system/spatial/adapters/censusCountyGeometryAdapter.js`
- `src/system/spatial/adapters/index.js`

The adapter implements the existing Wave 3 interface: `getDomain`, `getSourceAuthority`, `getSupportedFeatureTypes`, `getSupportedCoordinateSpaces`, `getProjectionVersion`, `canProject`, and `project`.

Frozen values are `census-geography`, `county`, `us-census-bureau-2010-cartographic-boundary`, projection version `1`, and `real-world.county-geojson`.

## Source and Identity

The adapter derives the accepted identity set from the qualified 88-feature Census asset. It validates `GEO_ID`, `STATE === "39"`, three-digit `COUNTY`, `NAME`, `LSAD`, and finite `CENSUSAREA`. Source record IDs are five-digit Ohio FIPS values. Feature IDs are created with `createSpatialFeatureId`; no alternate identity format exists.

## Geometry and Coordinates

Only Polygon and MultiPolygon GeoJSON geometries are accepted. Coordinates must be finite longitude/latitude values within `[-180, 180]` and `[-90, 90]`. The adapter clones and freezes output geometry, preserving the source geometry without simplification, rounding, repair, normalization, or transformation.

The existing `REAL_WORLD` / `real-world.county-geojson` contract is enforced. Metaverse spaces, wrong families, malformed structures, and implicit conversions are rejected.

The shared validator received one additive correction: valid GeoJSON geometry objects are now accepted alongside the existing string geometry fixtures. Existing required-field messages and baseline behavior remain unchanged.

## Provenance

Projected features retain Census publisher, dataset, vintage, scale, local asset path, official source URL, attribution, source authority, adapter name, projection version, and timestamp metadata. The existing Projection Pipeline client allowlist strips qualification-only fields at the client boundary.

## Publication and Authority Boundaries

Base county geometry projects as public geography. Attached IEP records are ignored by the adapter and do not gain publication eligibility. The adapter does not assign entities to counties, invoke `entityToCounty`, authorize actions, navigate, create UI models, or alter domain state.

## Registry Integration

The adapter is registry-compatible and was registered under `census-geography::county` in focused runtime tests. No application startup registration was added because IEP onboarding is deferred to Wave 5D.

## Verification

- Census adapter contract: `26/26 PASS`
- Runtime integration checks: `4/4 PASS`
- Existing Spatial suites: `227/227 PASS`
- Combined Spatial suites including Wave 5C: `257/257 PASS`
- Wave 5B regression: `37/37 PASS`
- IEP regression: `6/6 PASS`
- Build: `PASS`
- `git diff --check`: `PASS`

Asset hashes were unchanged:

```text
public/assets/maps/ohio-counties.geojson
40c161c8b142b71e26f049e97c6644c9aaf0cbb1f2326ca2cfe365b3c288484f

public/geo/ohio-counties.geojson
d562c4a4e424b6bceba03b35750a1846a6ed643c04437b28f631c9f0f485bf43
```

## Remaining Conditions

The IEP map remains on its current path. Wave 5D must separately decide whether and how to consume the Census Spatial projection. The ODOT asset remains an unchanged legacy dependency. The known Franklin County fallback remains out of scope.
