# GEO-1 Wave 6B ODOT Source Contract

## Source

| Field | Contract |
| --- | --- |
| Publisher | `ODOT Office of Technical Services` |
| Service | ODOT TIMS County FeatureServer |
| Layer | `County` / layer `0` |
| FeatureServer | `https://tims.dot.state.oh.us/ags/rest/services/Boundaries/County/FeatureServer/0` |
| Service item | `5a65fb89de864e0b97bbcb346dd761f3` |
| Coverage | 88 Ohio counties |
| Update statement | Annual |
| Native/default CRS | Web Mercator, WKID `102100`, latest WKID `3857` |
| Analysis output | GeoJSON requested with `outSR=4326` |
| Primary identity | `FIPS_COUNTY_CD` |

## Identity

`FIPS_COUNTY_CD` is the only proposed source record identity. A future loader
must require exactly 5 numeric characters, Ohio prefix `39`, uniqueness across
the 88-feature set, and non-null values. `OBJECTID`, feature order, county
name, and `AREA_ID` are not identity.

## Geometry

The current service returns `Polygon` and `MultiPolygon` GeoJSON. A future
adapter may validate those types and finite longitude/latitude coordinates, but
must not repair, simplify, round, or infer geometry. The service's native
Web-Mercator representation and a WGS84 export must remain distinct metadata;
no production transform is approved by this qualification.

## Minimal Feature

The proposed Spatial feature contains only:

- stable FIPS;
- county label;
- Polygon/MultiPolygon geometry;
- ODOT authority and snapshot provenance;
- retrieval/version identity;
- publication and verification state.

Population, elevation, county seat, ODOT district, area metrics, and other
attributes remain source-side data until a named operational use case requires
them.

## Authority Boundaries

ODOT owns the operational geometry. Spatial coordinates and projects it. A
future client consumes it. ODOT geometry does not verify SHS events, traffic
incidents, workflows, outcomes, or publication state.

ODOT and Census features for the same FIPS remain distinct features because
their authorities, purposes, source snapshots, and potentially geometries are
distinct.

## Proposed Naming

Subject to contract review, use neutral values:

```text
domain: odot-operational-geography
featureType: county
sourceAuthority: ohio-dot-tims-county
sourceRecordId: FIPS_COUNTY_CD
```

The existing deterministic Spatial feature-ID helper must generate IDs. No
ODOT ID may reuse a Census feature ID.
