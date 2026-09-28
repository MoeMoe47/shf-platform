# GEO-1 Wave 3B Prerequisite Implementation Report

Status: COMPLETE WITH CONDITIONS. The additive shared-contract prerequisites are implemented. The projection runtime is NOT implemented.
Branch: `feature/spatial-engine-projection-wave3b-tests`, from `4ef6e09 test(spatial): freeze Wave 3B projection runtime contract`. Uncommitted, pending review.
Contract: `GEO-1_WAVE3B_RUNTIME_CONTRACT.md` §3, §8, §9 (GEO1-WAVE3B-DEC-010, DEC-015), plus GEO1-WAVE3B-DEC-017 (new, implementation-revealed)

## Files

| File | Change |
|---|---|
| `src/shared/spatial/contracts/constants.js` | modified: new frozen constants (below) |
| `src/shared/spatial/contracts/validation.js` | modified: structured `issues` on all 8 validators; layer policy validation |
| `src/shared/spatial/registries/CoordinateSpaceRegistry.js` | modified: registry codes |
| `src/shared/spatial/registries/SpatialLayerRegistry.js` | modified: registry codes |
| `src/shared/spatial/contracts/duration.js` | new: pure ISO 8601 duration-subset parser (internal, not re-exported) |
| `src/shared/spatial/contracts/registryErrors.js` | new: registry operation codes and coded-error helpers (internal, not re-exported) |
| `docs/architecture/spatial-intelligence/geo-1/GEO-1A_DECISION_LOG.md` | GEO1-WAVE3B-DEC-017 |

Not modified: `defaultLayers.js` and `defaultCoordinateSpaces.js`. No default layer needed a policy value, and none was invented. The Wave 2B runtime (`selectionStore.js`, `interactionBus.js`) is untouched.

## Structured Validation (DEC-010)

`issues` was added to the eight validators named by the contract:

- `validateSpatialProvenance`
- `validatePublicationEligibility`
- `validateCoordinateSpace`
- `validateSpatialLayer`
- `validateTemporalProjection`
- `validateSpatialFeature`
- `validateSpatialSelection`
- `validateSpatialInteraction`

`isPublicProjectionEligible` stays boolean. These are exactly the eight exported validators in `validation.js`; no ninth was invented.

Issue shape: `{ code, field, message, details? }`.

- `errors` is now derived from `issues`, so `issues.length === errors.length` and `issues[i].message === errors[i]` hold by construction.
- `valid === (issues.length === 0)`.
- `details` is used only for `COORDINATE_FAMILY_MISMATCH`, with exactly `expectedCoordinateFamily` and `receivedCoordinateFamily`.
- Nested provenance and publication-eligibility issues keep their code. Their field is prefixed (`provenance.projectionVersion`), and their message keeps the legacy `provenance.<error>` form.

Code assignment follows the frozen vocabulary. Where the contract did not name the exact code for an existing message, this pass chose:

| Message | Code | Reason |
|---|---|---|
| `supportedCoordinateSpaces must contain at least one coordinate space id` | `FIELD_INVALID_TYPE` | the array requirement is structural |
| Coordinate-space `provenance is required` and temporal-projection `provenance is required` | `PROVENANCE_REQUIRED` | matches the code's meaning |
| `sourceTimestamp is required for temporal projection` | `FIELD_INVALID_TIMESTAMP` | the check is timestamp validity |

## Backward Compatibility

- **Equivalence harness:** a scratchpad harness ran the committed (`HEAD`) `validation.js` and the new one over 114 inputs covering every validator. Inputs included valid records, non-objects, missing, invalid, and mismatched fields, unknown spaces and layers, and nested provenance and eligibility failures. `valid` and every `errors` string matched byte-for-byte in all 114 cases (0 mismatches), the `issues`/`errors` twin held in every case, and `isPublicProjectionEligible` matched.
- **Old tests:** all 53 prior tests pass unmodified.
- **Registry lookups:** failures keep their legacy enumerable shape; see DEC-017 below.

## Registry Codes

| Operation | Addition |
|---|---|
| `CoordinateSpaceRegistry.get` failure | `code`: `UNKNOWN_COORDINATE_SPACE` or `COORDINATE_FAMILY_MISMATCH` |
| `SpatialLayerRegistry.get` failure | `code`: `UNKNOWN_LAYER` |
| `assertNoImplicitTransform` failure | `code`: `NO_REGISTERED_TRANSFORM`, or the failed `get` code |
| invalid registration (both registries) | throws with the unchanged message, `error.code = "DEFINITION_INVALID"`, and `error.issues` |
| duplicate registration (both registries) | throws with the unchanged message and `error.code = "DUPLICATE_ID"` |

Success paths are unchanged.

**DEC-017, a new decision revealed during implementation.** `tests/spatialFoundationWave1.test.mjs:103` strictly deep-equals an unknown-space lookup to exactly `{ ok, error }`, so an enumerable `code` would break the frozen baseline. Lookup-failure `code` is therefore attached as a non-enumerable, read-only property:

- `result.code` works as the contract requires.
- Deep equality, `JSON.stringify`, and object spread still see the legacy shape.

Callers must read `code` before copying or serializing a lookup result.

## Layer Policy Validation (DEC-015)

`validateSpatialLayer` appends `LAYER_POLICY_INVALID` issues (with `field` set) after its existing checks. Existing layers without these fields produce no new issues.

| Field | Rule | Absent means |
|---|---|---|
| `stalePolicy` | one of `MARK_STALE`, `SUPPRESS`, `UNAVAILABLE` | behave as `MARK_STALE` (applied by the future runtime; nothing is written to the layer) |
| `maskMode` | one of `HIDE`, `NOTICE`, `GENERALIZED` | `HIDE` (future runtime) |
| `maxSourceAge` | positive duration in the subset; requires non-empty `freshnessAuthority` (issue field `freshnessAuthority`) | no calculated freshness; no global age exists |
| `soonThreshold` | positive duration in the subset; requires `timeAwareCapability === true` (issue field `soonThreshold`) and non-empty `soonThresholdAuthority` (issue field `soonThresholdAuthority`) | EVENT_SOON not calculable; no global threshold exists |

Because `SpatialLayerRegistry.register` rejects invalid layers, a malformed threshold is rejected **at layer registration** (`DEFINITION_INVALID`), not at projection. An orphan `freshnessAuthority` or `soonThresholdAuthority` with no paired value is not rejected, because the contract defines no rule for it.

Duration subset (`parseSpatialDurationMs`): `P[nD][T[nH][nM][nS]]`, integer components, greater than zero. Verified rejections include `PT0S`, `P0D`, `P`, `PT`, `P1DT`, `P1M` (months), `P1Y`, `P1W`, `-PT1H`, `PT1.5H`, `PT2h`, `1h`, and `two hours`. The parser is pure and deterministic, with no clock access and no month or year conversion.

## New Shared Exports (`src/shared/spatial/index.js` via `constants.js`)

Frozen by contract §9:

- `VALIDATION_ISSUE_CODES` (19 codes)
- `VALIDATION_ISSUE_DETAIL_KEYS`
- `SPATIAL_LAYER_STALE_POLICIES`
- `SPATIAL_LAYER_MASK_MODES`

Also exported, following the file's existing `*_VALUES` convention for every enum:

- `SPATIAL_LAYER_STALE_POLICY_VALUES`
- `SPATIAL_LAYER_MASK_MODE_VALUES`

Not exported from the index: `parseSpatialDurationMs`, `REGISTRY_ERROR_CODES`, `registryError`, and `registryFailure`. These are internal helpers imported directly by the modules that need them.

## Tests

| Suite | Before | After |
|---|---|---|
| Wave 1 | 18/18 | 18/18 |
| Wave 2A | 11/11 | 11/11 |
| Wave 2B | 13/13 | 13/13 |
| Wave 3A | 11/11 | 11/11 |
| **Baseline total** | **53/53** | **53/53** (no test modified) |
| Wave 3B PASS | 3 (R01–R03) | **5** (D07, T05, R01–R03) |
| Wave 3B EXPECTED_MISSING_RUNTIME | 60 | **58** (57 runtime entry + D02 directory) |
| CONTRACT / REGRESSION / UNEXPECTED | 0 / 0 / 0 | 0 / 0 / 0 |

D07 and T05 turned green because the shared prerequisites now exist, and for no other reason. Every remaining red test depends on `src/system/spatial/projection/`.

The D02 string-parsing patterns were run against all files in `src/shared/spatial/contracts/` and found 0 matches.

## Build

`npm run build`: PASS, with the same 11 known unrelated warnings (ASL lesson JSON imports and chunk size). The local ESLint installation (`@eslint/js` missing) was not addressed, as instructed.

## Scope Confirmation

- `src/system/spatial/projection/` does not exist.
- There is no adapter registry, projection pipeline, state resolver, masking, emergency handling, client sanitization, or projection diagnostics runtime.
- There is no map, Quick Map, Mapbox, SHF route, or `entityToCounty` change, and no domain authority change, persistence, migration, or coordinate transform.

## Conditions

1. DEC-017 is a new decision. It should be reviewed alongside this change.
2. The new layer policy fields are validated, but their runtime behavior (`MARK_STALE` default, `HIDE` default, freshness and EVENT_SOON calculation) belongs to the not-yet-implemented projection runtime.
