# GEO-1 Wave 6B ODOT Snapshot Governance

## Recommendation

Use a governed local snapshot for any future production adapter. Do not make
the adapter fetch the live ODOT service at runtime.

## Snapshot Identity

Each approved snapshot must retain:

```text
publisher
service
layer
serviceItemId
sourceUrl
retrievedAt
sourceUpdatedAt (when exposed)
sourceSpatialReference
requestedOutputSpatialReference
snapshotHash
featureCount
schemaVersion
adapterVersion
attribution
rightsStatus
```

No canonical dataset version was exposed by the current layer, service, or
item metadata. The retrieval timestamp plus SHA-256 snapshot hash is therefore
the reproducible snapshot identity; it must not be renamed as an invented
dataset version.

## Current Analysis Snapshot

- Retrieved: `2026-09-28T20:45:12Z`
- Query: `where=1=1`, `outFields=*`, `returnGeometry=true`, `outSR=4326`, `f=geojson`
- URL: `https://tims.dot.state.oh.us/ags/rest/services/Boundaries/County/FeatureServer/0/query`
- Response SHA-256: `221566f91bcf2f35ff1490e6307433aa66f02684e07b8583924d19ca51e14691`
- Feature count: `88`
- Coordinate output: WGS84 longitude/latitude GeoJSON requested from a service whose native/default reference is Web Mercator `102100` / `3857`.

This file was written to `/tmp` for analysis only and did not replace the
repository asset.

## Refresh Policy

Refresh should be controlled by the source owner or an approved annual review
cadence, not by application startup. A refresh process must:

1. retrieve the official service export;
2. record request and metadata hashes;
3. compare FIPS set, schema, geometry hashes, bounds, and relevant attributes;
4. produce a human-reviewed change report;
5. obtain rights/use approval where terms are unclear;
6. approve or reject the new snapshot; and
7. retain the prior approved snapshot for rollback.

The service advertises annual updates, but no exact refresh date or canonical
version number was exposed.

## Change Detection

The comparison must ignore service-managed `OBJECTID` and treat changes in
`FIPS_COUNTY_CD`, geometry, schema, or operational attributes as explicit
review findings. It must never overwrite the governed snapshot automatically.
