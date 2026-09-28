# GEO-1 Wave 5C Census County Adapter Acceptance Gate

## Gate Status

Contract/red-test phase. **Production adapter: NOT IMPLEMENTED.**

## Must Be True Before Implementation

- Candidate A remains the governed Census 2010 `1:20,000,000` visual county source.
- `sourceAuthority` is `us-census-bureau-2010-cartographic-boundary`.
- `domain` is neutral `census-geography`; IEP remains a consuming context.
- `featureType` is `county` and source IDs are validated five-digit Ohio FIPS values.
- IDs are derived from Census `GEO_ID` and checked against `STATE`/`COUNTY`; names and array order are rejected as identity.
- `real-world.county-geojson` is used with `REAL_WORLD` family and GeoJSON longitude/latitude order, with no transform.
- Geometry is Polygon or MultiPolygon, finite, Ohio-scoped, and passed through without repair or simplification.
- Required Census provenance and attribution/use constraints are retained.
- Public base geography remains separate from IEP publication eligibility.
- The adapter does not import `entityToCounty.js`, create a Franklin fallback, add ODOT attributes, or mutate the existing IEP map.
- The existing seven-method Wave 3 adapter interface is used.
- The 26-case red suite is written and has no contract, regression, or unexpected failures.
- The four runtime integration checks pass without changing the IEP client path.

## Required Verification

- Wave 5B regression: `37/37 PASS`.
- IEP regression: `6/6 PASS`.
- Existing combined Spatial suites remain green.
- `npm run build` passes.
- `git diff --check` passes.
- The production adapter module is absent during this contract phase and is not registered in startup.

## Explicit Non-Goals

No production adapter, registry registration, IEP map onboarding, source mapping migration, GeoJSON replacement, ODOT merge, coordinate transform, publication-state change, or `entityToCounty` fix is part of this gate.

## Exit Status

The current status is `READY WITH CONDITIONS` for a later implementation phase, not production adapter readiness. Implementation begins only after review of the contract, red-suite classification, and Census use restrictions.
