# GEO-1 Wave 5C Census County Adapter Test Plan

## Scope

This is a pre-implementation contract. The dedicated suite uses the actual qualified Census asset and is expected to report `EXPECTED_MISSING_ADAPTER` until the production module is intentionally implemented. No placeholder export is permitted.

## Reconciliation

| ID | Category | Requirement | Test status before implementation |
| --- | --- | --- | --- |
| CCA-01 | API | Canonical adapter factory and seven Wave 3 methods exist | EXPECTED_MISSING_ADAPTER |
| CCA-02 | Source | All 88 qualified Census records are recognized | EXPECTED_MISSING_ADAPTER |
| CCA-03 | Identity | All five-digit Ohio FIPS IDs are unique and complete | EXPECTED_MISSING_ADAPTER |
| CCA-04 | Identity | `GEO_ID` suffix agrees with `STATE` + `COUNTY` | EXPECTED_MISSING_ADAPTER |
| CCA-05 | Identity | Wrong state prefix is rejected | EXPECTED_MISSING_ADAPTER |
| CCA-06 | Identity | Unknown FIPS is rejected | EXPECTED_MISSING_ADAPTER |
| CCA-07 | Identity | County name alone cannot establish identity | EXPECTED_MISSING_ADAPTER |
| CCA-08 | Provenance | Publisher, dataset, vintage, scale, URL, path, and adapter version survive | EXPECTED_MISSING_ADAPTER |
| CCA-09 | Provenance | Missing provenance rejects projection | EXPECTED_MISSING_ADAPTER |
| CCA-10 | Provenance | Projection version is preserved and mismatch is rejected | EXPECTED_MISSING_ADAPTER |
| CCA-11 | Geometry | Polygon is accepted unchanged | EXPECTED_MISSING_ADAPTER |
| CCA-12 | Geometry | MultiPolygon is accepted unchanged | EXPECTED_MISSING_ADAPTER |
| CCA-13 | Geometry | Null or malformed geometry is rejected | EXPECTED_MISSING_ADAPTER |
| CCA-14 | Geometry | Unsupported geometry type is rejected | EXPECTED_MISSING_ADAPTER |
| CCA-15 | Geometry | Non-finite or out-of-bounds coordinates are rejected | EXPECTED_MISSING_ADAPTER |
| CCA-16 | Mutation | Source record and geometry are not mutated; no simplification/repair occurs | EXPECTED_MISSING_ADAPTER |
| CCA-17 | Coordinates | `REAL_WORLD` + `real-world.county-geojson` is accepted | EXPECTED_MISSING_ADAPTER |
| CCA-18 | Coordinates | METAVERSE, wrong space, and family mismatch are rejected | EXPECTED_MISSING_ADAPTER |
| CCA-19 | Coordinates | No implicit transform, normalization, or calibration exists | EXPECTED_MISSING_ADAPTER |
| CCA-20 | Publication | Public base geometry does not publish private/unpublished attached IEP data | EXPECTED_MISSING_ADAPTER |
| CCA-21 | Integrity | Unknown county is rejected/unresolved with no default county | EXPECTED_MISSING_ADAPTER |
| CCA-22 | Integrity | Adapter has no `entityToCounty`/Franklin fallback dependency | EXPECTED_MISSING_ADAPTER |
| CCA-23 | Integrity | Text-only county labels cannot create geometry | EXPECTED_MISSING_ADAPTER |
| CCA-24 | Output | Output contains justified base geography only, not ODOT/IEP/UI fields | EXPECTED_MISSING_ADAPTER |
| CCA-25 | Regression | Existing IEP map and governed Census asset remain unchanged | EXPECTED_MISSING_ADAPTER |
| CCA-26 | Regression | Existing county interactions and Wave 5B behavior remain unchanged | EXPECTED_MISSING_ADAPTER |

## Baseline Coverage

The current IEP regression suite and Wave 5B harness independently protect existing map behavior. CCA-25 and CCA-26 retain explicit adapter-boundary assertions so implementation cannot silently alter that behavior. They do not authorize rerouting the map through Spatial.

## Required Classification

Before adapter implementation:

```text
PASS: 0
EXPECTED_MISSING_ADAPTER: 26
CONTRACT_FAILURE: 0
REGRESSION_FAILURE: 0
UNEXPECTED_FAILURE: 0
```

After implementation, all 26 cases must pass with zero failures. Existing Spatial, IEP, Wave 5B, and build baselines remain independently required.

## Runtime Integration Checks

`tests/spatialCensusCountyAdapterRuntimeWave5C.test.mjs` adds four focused implementation checks for registry registration, real Projection Pipeline execution, client provenance allowlisting, publication separation, and geometry/coordinate continuity. These are reported separately from the original 26-case contract.
