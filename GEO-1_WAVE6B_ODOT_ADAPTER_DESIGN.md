# GEO-1 Wave 6B ODOT Adapter Design

## Status

Design only. No adapter, registry entry, transform, snapshot ingestion, or
runtime network dependency is implemented.

## Boundary

```text
approved ODOT snapshot
    -> validated ODOT source record
    -> future ODOT geometry adapter
    -> SpatialFeature
    -> approved operational client
```

The adapter must not fetch the ODOT service, mutate the snapshot, merge Census
features, infer county identity, attach domain overlays, or construct UI/map
objects.

## Proposed Contract

The future adapter should expose the repository's established adapter methods
and use a separate collision identity from Census:

```text
domain: odot-operational-geography
featureType: county
coordinate space: existing REAL_WORLD county space only if its semantics fit
source authority: ohio-dot-tims-county
source record: validated FIPS_COUNTY_CD
```

A new coordinate space is not justified merely because ODOT is a different
publisher. The existing `real-world.county-geojson` space is acceptable only
if the approved snapshot is WGS84 GeoJSON with the same coordinate semantics;
the service-native Web Mercator form must not be mislabeled.

## Publication

Displayability of public ODOT base geometry does not publish any attached SHS
operational record. Domain publication, authorization, and verification remain
separate inputs.

## Proposed Tests

Plan: 18 focused contract cases across rights metadata, snapshot identity,
88-record FIPS validation, geometry validity, provenance retention, no-network
adapter behavior, Census/ODOT feature coexistence, and publication separation.
Add client-specific parity tests only after a real consumer is selected.
