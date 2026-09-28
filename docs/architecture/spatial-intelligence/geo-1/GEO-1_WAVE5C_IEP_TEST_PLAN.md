# GEO-1 Wave 5C IEP Adapter Test Plan

## Scope

These are planned tests for source qualification and a future geometry-only adapter. They do not authorize production implementation in the current pass.

## Planned Cases

| ID | Category | Requirement | Expected result |
| --- | --- | --- | --- |
| IEP-01 | Source | Asset path and selected governed copy are explicit | PASS after asset reconciliation |
| IEP-02 | Source | Original publisher is recorded | BLOCKED until evidence exists |
| IEP-03 | Source | Source URL and retrieval/version metadata are recorded | BLOCKED until evidence exists |
| IEP-04 | License | Use, redistribution, attribution, and modification terms are recorded | BLOCKED until evidence exists |
| IEP-05 | Identity | Every feature has a publisher-backed stable ID | PASS structurally; authority pending |
| IEP-06 | Identity | Duplicate IDs are rejected | PASS |
| IEP-07 | Geometry | Feature count and Polygon/MultiPolygon types are stable | PASS against qualified asset |
| IEP-08 | Geometry | Null or malformed geometry is rejected | PASS |
| IEP-09 | Geometry | Unexpected non-Ohio feature is rejected or diagnosed | PASS after accepted scope rule |
| IEP-10 | Coordinates | Longitude/latitude order is preserved | PASS |
| IEP-11 | Coordinates | Coordinate family is REAL_WORLD | PASS after registry acceptance |
| IEP-12 | Coordinates | Unregistered space or family mismatch is rejected | PASS |
| IEP-13 | Coordinates | No implicit transform is applied | PASS |
| IEP-14 | Provenance | Missing provenance blocks projection | PASS |
| IEP-15 | Provenance | Adapter/version mismatch is diagnosed | PASS |
| IEP-16 | Projection | Qualified county projects to a SpatialFeature | BLOCKED until qualification |
| IEP-17 | Projection | Source authority and source ID survive projection | BLOCKED until qualification |
| IEP-18 | Projection | Existing Spatial validation is reused | PASS when implemented |
| IEP-19 | Publication | Unpublished attached IEP data is suppressed | PASS when implemented |
| IEP-20 | Privacy | Base geometry cannot expose private attached data | PASS when implemented |
| IEP-21 | Integrity | Unknown county remains unresolved | PASS |
| IEP-22 | Integrity | Adapter never invokes Franklin fallback | PASS |
| IEP-23 | Integrity | Text-only county labels cannot create geometry | PASS |
| IEP-24 | Mutation | Adapter does not mutate domain records or source geometry | PASS |
| IEP-25 | Regression | Existing IEP map still loads the governed asset unchanged | PASS in Wave 5B baseline |
| IEP-26 | Regression | Existing county interactions remain unchanged | PASS in Wave 5B baseline |

## Test Data Rules

Use repository geometry only after provenance/license qualification, and use isolated fixtures for malformed, duplicate, unknown, and unpublished cases. Do not manufacture production authorities or source IDs. The Franklin fallback test remains a known-defect observation owned by Wave 5B; it is not a qualification success criterion.

## Provenance Recovery Cases

| ID | Requirement | Result |
| --- | --- | --- |
| IEP-27 | Trace both assets to their first repository introduction | PASS: independent introductions found |
| IEP-28 | Reconcile feature sets by a documented stable candidate | PASS structurally via FIPS-like keys |
| IEP-29 | Record property schemas and identifier systems separately | PASS |
| IEP-30 | Measure geometry differences rather than assuming formatting-only change | PASS: all 88 matched geometries differ |
| IEP-31 | Do not select a canonical asset without external evidence | PASS |
| IEP-32 | Record every current consumer and path assumption | PASS |

Both assets have 88 features. The first uses `GEO_ID`/feature IDs and Census-like fields; the second uses `FIPS_COUNTY_CD`/sequential `OBJECTID` values and additional operational fields. All 88 county identities reconcile through the FIPS-like candidate, but zero geometries are byte-identical and zero remain identical after six-decimal rounding. This is evidence of distinct resolution/source content, not proof of derivation.

## Official Matching Cases

| ID | Requirement | Result |
| --- | --- | --- |
| IEP-33 | Candidate A matches official Census 2010 county product and scale | PASS: `1:20,000,000`, 88/88 IDs, attributes, and normalized point sets |
| IEP-34 | Candidate A preserves Census use restrictions and acknowledgement | PASS with condition: visual small-scale use only |
| IEP-35 | Candidate B matches official ODOT TIMS service by FIPS and schema | PASS: 88/88 IDs, 82/88 exact attributes |
| IEP-36 | Candidate B geometry matches official WGS84 GeoJSON export | PASS with condition: 85/88 exact; 3 service-managed differences |
| IEP-37 | ODOT copyright text is not treated as a license | PASS |
| IEP-38 | Spatial base contract excludes nonessential ODOT attributes | PASS when adapter is implemented |
