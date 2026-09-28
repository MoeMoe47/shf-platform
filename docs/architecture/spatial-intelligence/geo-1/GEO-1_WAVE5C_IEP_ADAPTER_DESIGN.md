# GEO-1 Wave 5C IEP Adapter Design

## Status

Contract frozen and implemented for review. **Production adapter: IMPLEMENTED.** The qualified path remains conditional on the Census cartographic-use restrictions, attribution, and governed local asset. No adapter is registered in application startup.

## Boundary

The first adapter, once qualified, will be a narrow read-only Ohio county geometry adapter:

```text
qualified county GeoJSON feature
        -> IEP geometry adapter
        -> SpatialFeature
        -> existing Spatial Projection Pipeline
        -> client-safe projection
```

It will preserve source authority and provenance. It will not make Spatial or IEP the geometry publisher.

## Proposed Input Contract

The adapter may accept only a qualified geometry record containing:

- explicit feature type `county`;
- stable publisher-backed identifier, preferably `GEO_ID`/feature `id` after qualification;
- valid Polygon or MultiPolygon geometry;
- registered `REAL_WORLD` coordinate space;
- source authority and provenance metadata;
- independent publication and verification state.

Unknown county identity is rejected as unresolved. No text-only county name is sufficient.

## Proposed Output Identity

Use the existing deterministic feature-ID helper, not a competing ID format. The eventual inputs would be conceptually:

```text
domain: census-geography
featureType: county
sourceAuthority: us-census-bureau-2010-cartographic-boundary
sourceRecordId: five-digit Ohio FIPS, for example 39055
```

For `GEO_ID` values such as `0500000US39055`, the adapter extracts the final five digits and requires agreement with `STATE === "39"` and a three-digit `COUNTY` value. The accepted source-record set is the 88-feature qualified Census asset; names, array order, and ODOT `OBJECTID` values are not identities.

The resulting ID must be created with `createSpatialFeatureId`, yielding the established form:

```text
spatial:census-geography:county:us-census-bureau-2010-cartographic-boundary:39055
```

## Explicit Non-Responsibilities

The adapter must not:

- call `src/system/resolvers/entityToCounty.js`;
- assign organizations, entities, or records to counties;
- infer geography from arbitrary text;
- join unrelated IEP records;
- publish private IEP data;
- decide authorization or verification;
- create a destination, route, or coordinate transform;
- mutate the existing IEP map or geometry files.

Unknown geography remains `null`/unresolved rather than becoming Franklin County.

## Publication Boundary

The geometry feature's publication eligibility is evaluated independently from any IEP record attached to it. A valid public base geometry cannot carry an unpublished or private IEP record across the projection boundary.

## Coordinate Contract

The adapter uses the existing registered `real-world.county-geojson` space. Its contract is `REAL_WORLD`, source GeoJSON longitude/latitude order, Polygon or MultiPolygon geometry, and no transform. `metaverse.quick-map`, `metaverse.master-city`, and any other coordinate family or space are rejected. The adapter validates coordinates and passes accepted geometry through unchanged; it does not simplify, round, repair, reproject, normalize, or clamp it.

## Provenance Contract

Every projected feature must retain the required runtime provenance fields and the qualified Census metadata needed for traceability: publisher, dataset title, vintage `2010`, scale `1:20,000,000`, local source path, official source URL, source authority, attribution requirement, and projection adapter/version metadata. Missing or mismatched provenance blocks projection. Only the safe provenance subset may cross the existing client boundary.

## Readiness Gate

Implementation satisfies the 88-record identity set, unique valid Ohio FIPS identities, geometry validation, coordinate-space validation, no implicit transform, publication separation, no Franklin fallback dependency, unchanged IEP behavior, and the full 26-case contract. IEP onboarding remains a separate Wave 5D decision.

## Provenance Recovery Constraint

Two independently introduced, non-identical assets exist. The adapter must not select, merge, or normalize them implicitly. A governed source asset and source-of-record decision are prerequisites.

The observed identity systems must remain distinct until qualification:

- `public/assets/maps/ohio-counties.geojson`: feature `id` and `GEO_ID` values such as `39055` / `0500000US39055`;
- `public/geo/ohio-counties.geojson`: sequential `OBJECTID` values and `FIPS_COUNTY_CD` values such as `39145`.

The eventual source record ID must be selected from publisher-backed evidence, not from whichever local key is convenient. The adapter must not choose between the assets based only on file size, detail, or consumer preference.

## Official Source Decision

The recommended first adapter source is Candidate A's matched Census product:

- publisher: U.S. Department of Commerce, U.S. Census Bureau, Geography Division / Cartographic Products Branch;
- product: 2010 Cartographic Boundary File, State-County for United States, `1:20,000,000`;
- URL: `https://www2.census.gov/geo/tiger/GENZ2010/gz_2010_us_050_00_20m.zip`;
- identity: Census `GEO_ID`, with Ohio county FIPS suffix such as `39055`;
- constraint: visual small-scale use, with Census acknowledgement.

Candidate B is confirmed as an ODOT TIMS County export match for operational use, but it should remain a separate source option. Spatial should not import ODOT population, elevation, district, seat, or shape metrics into the base geometry contract. Its service copyright text is not treated as a complete license.
