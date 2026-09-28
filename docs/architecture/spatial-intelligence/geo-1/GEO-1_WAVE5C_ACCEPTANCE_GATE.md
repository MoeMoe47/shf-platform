# GEO-1 Wave 5C IEP Acceptance Gate

## Current Decision

**QUALIFIED_WITH_CONDITIONS**

The current source qualification decision is **QUALIFIED_WITH_CONDITIONS** for the narrow Census base-geometry path only. No production adapter, source mapping, migration, or publication change is permitted until the implementation conditions are reviewed.

## Frozen First-Adapter Contract

The proposed first adapter is a neutral `census-geography` / `county` adapter over `public/assets/maps/ohio-counties.geojson`, matched to the U.S. Census Bureau 2010 Cartographic Boundary File, State-County, `1:20,000,000`. Its source authority is `us-census-bureau-2010-cartographic-boundary`; its source record ID is the validated five-digit Ohio FIPS derived from Census `GEO_ID`; and its coordinate space is the existing `real-world.county-geojson` registry entry. IEP remains a consumer context, not the geometry authority.

The adapter is strictly for small-scale statewide/county visual geography. It does not support parcel, address, survey-grade, precise boundary adjudication, or entity-to-county inference. Candidate B remains an unchanged ODOT legacy dependency and is not merged into this contract.

## Required Before Adapter Implementation

- original publisher and source URL confirmed;
- retrieval/import provenance and geometry vintage recorded;
- license and redistribution terms confirmed;
- attribution/modification requirements recorded;
- one governed copy selected and the duplicate asset reconciled;
- stable publisher-backed county identifier accepted;
- coordinate ownership confirmed;
- `REAL_WORLD` county coordinate space accepted and registered;
- base geometry publication semantics separated from attached IEP data;
- source authority and verification authority identified;
- adapter contract and client compatibility reviewed;
- existing IEP regression coverage remains green;
- no dependency on the Franklin County fallback.
- the exact adapter API is the existing Wave 3 interface: `getDomain`, `getSourceAuthority`, `getSupportedFeatureTypes`, `getSupportedCoordinateSpaces`, `getProjectionVersion`, `canProject`, and `project`;
- FIPS validation requires five digits, Ohio state prefix `39`, agreement with Census `GEO_ID`/`STATE`/`COUNTY`, and membership in the qualified 88-feature source set;
- geometry is Polygon or MultiPolygon with finite longitude/latitude coordinates and is passed through without repair, simplification, rounding, reprojection, or transform;
- base-geometry publication is independent from publication of attached IEP records;
- the 26-case Census county adapter red contract is green or has been explicitly reviewed before implementation begins.

## Production Prohibitions in This Phase

- do not create `src/system/spatial` IEP adapter code;
- do not modify either GeoJSON asset;
- do not create production county source IDs;
- do not alter IEP publication state;
- do not fix `entityToCounty.js` here;
- do not add a coordinate transform;
- do not migrate the existing map.

## Acceptance Evidence

The existing IEP regression suite and Wave 5B map-estate harness pass without modifying production behavior. Structural inspection found 88 features, no duplicate or missing observed IDs, no null geometry, and Polygon/MultiPolygon geometry. Those observations are insufficient to clear provenance, licensing, or ownership.

The two files are both 88-feature FeatureCollections but have different schemas, local identifiers, hashes, bounds, and geometry detail. All 88 county identities reconcile through the FIPS-like candidate; none of the 88 matched geometries are identical. No repository evidence establishes which is upstream, derived, canonical, or licensed.

Candidate A provenance is confirmed against the official 2010 Census product, with conditional use restrictions. Candidate B provenance is confirmed against ODOT TIMS, but its complete reuse terms remain unresolved. The duplicate relationship is now an explicit source disposition rather than an unexplained duplicate.

## Official Matching Decision

The external comparison establishes a qualified Census source for a constrained base-geometry use and a strong ODOT TIMS source match for a separate operational source. The local files remain unchanged. The adapter may proceed only as a narrowly scoped, read-only Census visual-geometry adapter after the Census attribution and scale restrictions are encoded in the implementation contract. ODOT-based geometry or attributes require a separate source-use decision.

Approved conditional status: `QUALIFIED_WITH_CONDITIONS`.

## Implementation Prohibition

This contract pass creates no production adapter file, registry registration, source mapping, IEP map integration, coordinate transform, or `entityToCounty` change. The companion red suite is expected to fail only because the production adapter module is intentionally absent.

## Exit Classification

Reclassify only after evidence review using one of the approved outcomes:

- `QUALIFIED_FOR_PRODUCTION_ADAPTER`
- `QUALIFIED_WITH_CONDITIONS`
- `BLOCKED_BY_PROVENANCE`
- `BLOCKED_BY_LICENSE`
- `BLOCKED_BY_IDENTITY`
- `BLOCKED_BY_COORDINATE_OWNERSHIP`
- `NOT_READY`
