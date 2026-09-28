# GEO-1 Wave 5C Census County Adapter Contract

## Status

Contract and red-test freeze only. **Production adapter: NOT IMPLEMENTED.** This document does not register a source, alter the IEP map, or authorize migration.

## Governed Source

The adapter contract targets `public/assets/maps/ohio-counties.geojson`, qualified as a representation of the U.S. Census Bureau 2010 Cartographic Boundary File, State-County, `1:20,000,000`.

Official reference: `https://www2.census.gov/geo/tiger/GENZ2010/gz_2010_us_050_00_20m.zip`.

The file is permitted only for the qualified small-scale visual county-overview use, with Census acknowledgement. It is not a parcel, address, survey-grade, precise-boundary-adjudication, or entity-to-county inference source.

## Authority and Identity

| Field | Frozen value |
| --- | --- |
| `domain` | `census-geography` |
| `featureType` | `county` |
| `sourceAuthority` | `us-census-bureau-2010-cartographic-boundary` |
| `coordinateFamily` | `REAL_WORLD` |
| `coordinateSpaceId` | `real-world.county-geojson` |
| `projectionVersion` | `1` for the first implementation, subject to registry review |

The source record ID is the five-digit Ohio FIPS. For `GEO_ID` `0500000US39055`, the adapter extracts `39055` and requires `STATE === "39"` plus a three-digit `COUNTY` value whose concatenation agrees with the extracted value. The accepted set is the qualified 88-feature asset; county name, feature order, and ODOT `OBJECTID` are insufficient.

The feature ID is created only through `createSpatialFeatureId`:

```text
spatial:census-geography:county:us-census-bureau-2010-cartographic-boundary:39055
```

## Adapter API

The production object must implement the existing Wave 3 adapter interface exactly:

```text
getDomain()
getSourceAuthority()
getSupportedFeatureTypes()
getSupportedCoordinateSpaces()
getProjectionVersion()
canProject(record, context)
project(record, context)
```

The proposed factory is `createCensusCountyGeometryAdapter()`. It is not implemented or exported yet. Registration is deferred until this red contract is reviewed.

## Input and Validation

Input is a qualified Census GeoJSON county feature plus immutable qualification/provenance metadata. Required checks are: recognized feature identity, five-digit Ohio FIPS, `GEO_ID`/`STATE`/`COUNTY` consistency, Polygon or MultiPolygon geometry, finite longitude/latitude coordinates within bounds, required provenance, accepted publication/verification state, and the existing registered coordinate space. Unknown identity, malformed geometry, missing provenance, wrong family, wrong space, and unsupported records reject without fallback.

The adapter must not simplify, round, repair, reproject, normalize, clamp, or otherwise mutate geometry. It must not import or call `src/system/resolvers/entityToCounty.js`.

## Output Boundary

The output is a validated SpatialFeature/projection input containing only justified base-geography data: county identity, name where safe, geometry, source authority, source record ID, coordinate identity, layer identity, publication/verification state, and provenance. ODOT district, population, elevation, county seat, Shape metrics, IEP attributes, UI props, Mapbox layers, and Quick Map marker models are outside this adapter.

Provenance must retain publisher, dataset title, vintage `2010`, scale `1:20,000,000`, local source path, official reference, attribution/citation requirement, source authority, and projection adapter/version metadata. The existing Wave 3 client allowlist controls what may leave the internal result.

## Publication Boundary

Public base geometry does not publish attached IEP data. An unpublished or private IEP record remains unpublished even when its county geometry is public. The adapter creates no publication authority and performs no entity-to-county join.

## ODOT Boundary

`public/geo/ohio-counties.geojson` remains an unchanged ODOT operational/legacy dependency. The two files are not merged, and no ODOT attribute or geometry is imported into the Census base contract.

## Deferred Implementation Conditions

The adapter may be implemented only after the red suite is reviewed, the governed asset and attribution constraints remain in force, the existing coordinate-space contract is accepted, and the adapter is tested without changing current IEP behavior.
