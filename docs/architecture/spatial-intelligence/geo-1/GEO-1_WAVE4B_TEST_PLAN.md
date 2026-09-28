# GEO-1 Wave 4B Quick Map Client Adapter Test Plan

Status: RED CONTRACT FROZEN FOR REVIEW. The production adapter is intentionally
absent.

## Contract Inventory

Every original requirement has an explicit owner. Existing suites provide
supporting preservation evidence where noted, but the adapter-specific contract
cases remain in `tests/spatialQuickMapClientAdapterWave4B.test.mjs`.

| ID | Category | Requirement | Owner | Test file | Implemented | Existing support | Deferred | Expected result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W4B-01 | Valid | PROJECTED result becomes marker | Wave 4B | W4B client suite | Yes | None | - | Missing adapter |
| W4B-02 | Valid | Preserve x/y exactly | Wave 4B | W4B client suite | Yes | Coordinate calibration | - | Missing adapter |
| W4B-03 | Valid | Preserve safe label | Wave 4B | W4B client suite | Yes | MiniMap V2/V3 | - | Missing adapter |
| W4B-04 | Valid | Preserve visual state | Wave 4B | W4B client suite | Yes | None | - | Missing adapter |
| W4B-05 | Valid | Preserve accepted modifiers | Wave 4B | W4B client suite | Yes | Spatial presentation | - | Missing adapter |
| W4B-06 | Valid | Preserve accessibility metadata | Wave 4B | W4B client suite | Yes | MiniMap V3 | - | Missing adapter |
| W4B-07 | Valid | Interaction metadata is intent-only | Wave 4B | W4B client suite | Yes | None | - | Missing adapter |
| W4B-08 | Coordinate | Reject master-city | Wave 4B | W4B client suite | Yes | Spatial Wave 1/2/3 | - | Missing adapter |
| W4B-09 | Coordinate | Reject REAL_WORLD | Wave 4B | W4B client suite | Yes | Spatial Wave 1/2/3 | - | Missing adapter |
| W4B-10 | Coordinate | Reject unknown space | Wave 4B | W4B client suite | Yes | Spatial Wave 1/3 | - | Missing adapter |
| W4B-11 | Coordinate | Reject malformed family | Wave 4B | W4B client suite | Yes | Spatial validation | - | Missing adapter |
| W4B-12 | Coordinate | Reject out-of-range x/y without clamping | Wave 4B | W4B client suite | Yes | Coordinate calibration bounds | - | Missing adapter |
| W4B-13 | Coordinate | Reject missing/NaN/nonnumeric coordinates | Wave 4B | W4B client suite | Yes | Spatial validation | - | Missing adapter |
| W4B-14 | Coordinate | No transform or calibration | Wave 4B | W4B client suite | Yes | Spatial isolation suites | - | Missing adapter |
| W4B-15 | Status | PROJECTED renders; SUPPRESSED omitted | Wave 4B | W4B client suite | Yes | Wave 3B masking | - | Missing adapter |
| W4B-16 | Status | INVALID omitted | Wave 4B | W4B client suite | Yes | Wave 3B masking | - | Missing adapter |
| W4B-17 | Status | STALE preserves permitted presentation | Wave 4B | W4B client suite | Yes | Wave 3B freshness | - | Missing adapter |
| W4B-18 | Status | UNAVAILABLE preserves permitted presentation | Wave 4B | W4B client suite | Yes | Wave 3B presentation | - | Missing adapter |
| W4B-19 | Privacy | RESTRICTED/HIDE creates no marker | Wave 4B | W4B client suite | Yes | Wave 3B M02 | - | Missing adapter |
| W4B-20 | Privacy | RESTRICTED/NOTICE is generic | Wave 4B | W4B client suite | Yes | Wave 3B M03/M07 | - | Missing adapter |
| W4B-21 | Privacy | Hidden result cannot be selectable | Wave 4B | W4B client suite | Yes | Wave 3B M09 | - | Missing adapter |
| W4B-22 | Privacy | No source ID/private provenance/evidence/adapter identity | Wave 4B | W4B client suite | Yes | Wave 3B M05/M08 | - | Missing adapter |
| W4B-23 | Boundary | No internal result/viewer/authorization context | Wave 4B | W4B client suite | Yes | Wave 3B client allowlist | - | Missing adapter |
| W4B-24 | Identity | Visible marker identity stable | Wave 4B | W4B client suite | Yes | Wave 1 feature IDs | - | Missing adapter |
| W4B-25 | Identity | Hidden identity unavailable; notice reference opaque | Wave 4B | W4B client suite | Yes | Wave 3B M06/M07 | - | Missing adapter |
| W4B-26 | Dual source | Legacy and Spatial namespaces coexist | Wave 4B | W4B client suite | Yes | Wave 4A registry baseline | - | Missing adapter |
| W4B-27 | Dual source | Matching labels do not merge | Wave 4B | W4B client suite | Yes | None | - | Missing adapter |
| W4B-28 | Dual source | Matching coordinates do not merge | Wave 4B | W4B client suite | Yes | None | - | Missing adapter |
| W4B-29 | Preservation | Existing markers remain provisional/navigation-owned elsewhere | Wave 4B | W4B client suite | Yes | Wave 4A + Metaverse relationships | - | Missing adapter |
| W4B-30 | Input | Reject raw records/features/internal/malformed inputs | Wave 4B | W4B client suite | Yes | Wave 3B input boundary | - | Missing adapter |

## Boundary Decisions

The 30 original cases do not require production Selection Store or Interaction
Bus wiring. They test only safe interaction metadata; production selection and
event publication belong to Wave 4C.

The 30 original cases do not require browser focus traversal, focus return,
screen-reader journeys, modal keyboard journeys, or rendered non-map parity.
Those belong to Wave 4D.

The existing Quick Map suites remain preservation evidence, not replacements for
the adapter-specific contract. They cover the current source/registry/CSS
behavior; the new suite covers the future sanitized-result boundary.

## Test-only Pilot

The red suite uses the existing test-only Wave 3B fixture authority and
deterministic records. It proves the intended fixture-to-pipeline path up to
the missing production adapter. No current Quick Map registry entry is used as
a production source mapping.

## Failure Classification

`loadQuickMapClient()` fails with `EXPECTED_MISSING_CLIENT_ADAPTER` until
`src/system/spatial/clients/quickMap/index.js` exists. Any other failure is a
contract, regression, or unexpected failure.

## Reconciliation Totals

```text
Original planned cases: 30
Wave 4B tests implemented: 30
Satisfied by existing tests: 0 as primary owner (supporting evidence cited above)
Moved to Wave 4C: 0
Moved to Wave 4D: 0
Removed with documented reason: 0
Unexplained missing: 0
```
