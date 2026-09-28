# GEO-1 Wave 5D IEP Spatial Client Adapter

## Scope

Wave 5D adds a dedicated REAL_WORLD county client and a development/test
dual-run comparison seam. The default IEP map remains on its existing local
GeoJSON and D3 path.

## Production Flow

```text
qualified Census source
  -> CensusCountyGeometryAdapter
  -> Spatial Projection Pipeline
  -> sanitized ClientProjectionResult
  -> IepCountyClientAdapter
  -> safe county view model
```

The client accepts only `census-geography` / `county` results in
`REAL_WORLD` / `real-world.county-geojson`. It preserves qualified Polygon or
MultiPolygon geometry and explicit FIPS identity without transforms, repair,
simplification, or rounding.

## View Model

The allowlisted model contains `id`, `countyFips`, `label`, `geometry`,
`presentation`, `accessibility`, and `interaction`. It excludes source
authority, raw provenance, viewer context, domain records, navigation, and
route data.

## Domain Join

The only join is:

```text
iepRecord.countyFips === countyViewModel.countyFips
```

Null remains unresolved. No entity inference, label matching, or Franklin
fallback is available in the client.

## Dual-Run Boundary

`isIepSpatialDualRunEnabled()` requires both development mode and
`?iepSpatialDualRun=1`. `runIepSpatialDualRun()` compares the legacy feature
collection with models produced from real `ClientProjectionResult` values.
The seam is not connected to the default route and cannot switch production
rendering by query string alone.

## Interaction and Publication

The model exposes only presentation-level selection metadata. It does not
navigate or own IEP detail/workflow state. Public Census geometry does not
alter IEP record visibility, authorization, or publication.
