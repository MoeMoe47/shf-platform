# GEO-1 Wave 3B Red Test Report

Status: RED-TEST CONTRACT RECONCILED AND FROZEN. Production runtime NOT IMPLEMENTED, and nothing here claims production readiness.
Branch: `feature/spatial-engine-projection-wave3b-tests` (from `39e9b62 docs(spatial): freeze Wave 3B projection runtime design`)
Contract: `GEO-1_WAVE3B_RUNTIME_CONTRACT.md` (GEO1-WAVE3B-DEC-008 through DEC-016)
Test plan: `GEO-1_WAVE3B_TEST_PLAN.md`

## Summary

| Measure | Count |
|---|---|
| Wave 3B tests planned | 63 |
| Wave 3B tests written | 63 |
| Deferred | 0 |
| Currently passing | 3 (R01, R02, R03) |
| Expected failing (`EXPECTED_MISSING_RUNTIME`) | 60 |
| Contract failures | 0 |
| Regression failures | 0 |
| Unexpected failures | 0 |

Prior Spatial baseline, unchanged: Wave 1 18/18, Wave 2A 11/11, Wave 2B 13/13, Wave 3A 11/11, **53/53 PASS**. `npm run build` passes with only the 11 known warnings (ASL lesson JSON imports and chunk size), and the build output contains no reference to the test fixtures.

## Count Changes from Reconciliation

The totals are unchanged (63 tests: 3 pass, 60 expected-red). No test was added or removed. The reasons behind the red results shifted:

| Cause | Before | After |
|---|---|---|
| runtime entry `src/system/spatial/projection/index.js` missing | 58 | 57 |
| runtime directory missing (D02) | 1 | 1 |
| shared export `VALIDATION_ISSUE_CODES` missing (D07) | 0 | 1 (was gated on `result.issues`) |
| shared export `SPATIAL_LAYER_STALE_POLICIES` missing (T05) | 0 | 1 (T05 re-scoped to layer validation by DEC-015) |

T05 no longer needs the runtime entry. It now exercises Wave 1 layer validation.

## Classification Method

Each test is classified from its own TAP result:

| Class | Rule |
|---|---|
| `EXPECTED_MISSING_RUNTIME` | the failure message begins with `EXPECTED_MISSING_RUNTIME:`. The helper raises this only when the runtime entry or directory is absent, or when a required additive Wave 1 export is absent (`requireSharedExport`). Presence decides, never an assertion outcome, so a broken implementation cannot be reported as expected |
| `REGRESSION_FAILURE` | any failing R-family test |
| `CONTRACT_FAILURE` | any other assertion failure |
| `UNEXPECTED_FAILURE` | anything else |

## Failure Classification

| Class | Tests |
|---|---|
| EXPECTED_MISSING_RUNTIME (60) | E01–E07, M01–M10, D01–D07, S01–S13, T01–T08, F01–F08, P01–P07 |
| CONTRACT_FAILURE (0) | none |
| REGRESSION_FAILURE (0) | none |
| UNEXPECTED_FAILURE (0) | none |
| PASS (3) | R01 prior suites (exactly 53 pass), R02 coordinate isolation / no transform / no Franklin fallback, R03 no production import of fixtures |

D07 already passes its legacy-string assertions before reaching the export gate. They prove the Wave 1 `errors` strings and registry `error` strings are intact.

## Missing Production Modules

Runtime entry `src/system/spatial/projection/index.js` must export:

- `createProjectionAdapterRegistry`
- `createSpatialProjectionPipeline`, whose pipeline provides `project`, `toClient`, `projectForClient`, `lookupForClient`, and `clientSelectableFeatures`
- `PROJECTION_DIAGNOSTIC_CATALOG` (17 codes)
- `PROJECTION_DIAGNOSTIC_DETAIL_KEYS`
- `PRODUCTION_EMERGENCY_AUTHORITIES` (`[]`)

Additive Wave 1 changes. Existing behavior and strings are unchanged:

| File | Change |
|---|---|
| `src/shared/spatial/contracts/constants.js` | `VALIDATION_ISSUE_CODES`, `VALIDATION_ISSUE_DETAIL_KEYS`, `SPATIAL_LAYER_STALE_POLICIES`, `SPATIAL_LAYER_MASK_MODES` |
| `src/shared/spatial/contracts/validation.js` | `issues` twin on all 8 validators; layer policy validation (`LAYER_POLICY_INVALID`) |
| `src/shared/spatial/registries/CoordinateSpaceRegistry.js`, `SpatialLayerRegistry.js` | `code` on `get` and `assertNoImplicitTransform` failures; `error.code` (`DEFINITION_INVALID`, `DUPLICATE_ID`) and `error.issues` on registration throws |

Recommended internal split behind the runtime entry. The tests do not require these exact files:

- `src/system/spatial/projection/adapterRegistry.js`
- `src/system/spatial/projection/projectionDiagnostics.js`
- `src/system/spatial/projection/presentationResolver.js`
- `src/system/spatial/projection/clientProjection.js`
- `src/system/spatial/projection/projectionPipeline.js`

## Authority Notes

- **Emergency:** every EMERGENCY test uses `wave3b-test-only-confirmed-emergency-authority`. E03 asserts `PRODUCTION_EMERGENCY_AUTHORITIES` is empty and that a pipeline built with the production default never renders EMERGENCY.
- **Viewer eligibility:** comes from fixture viewer contexts that stand in for identity-supplied facts. Spatial only compares them.
- **Layer policy:** the fields are accepted into the layer contract (DEC-015) but exist today only as fixture data. `SpatialLayerRegistry` does not validate them yet; T05 enforces that it will.

## Scope Confirmation

- no production runtime written
- no files under `src/`, `apps/`, or `public/` changed
- no map, Quick Map, Mapbox, SHF route, or `entityToCounty` change
- no domain authority change, persistence, migration, or coordinate transform

## Runtime Readiness

READY WITH CONDITIONS for Wave 3B runtime implementation against this frozen contract. Conditions are listed in `GEO-1_WAVE3B_ACCEPTANCE_GATE.md`.
