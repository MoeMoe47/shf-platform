# GEO-1 Wave 3A Acceptance Gate

Status: COMPLETE WITH CONDITIONS

Wave 3A is complete when the projection and presentation-state design is documented and backed by an executable contract harness without production map integration.

## Acceptance Criteria

- projection adapter contract defined
- projection result model defined
- projection eligibility defined
- public/private boundary preserved
- presentation state model defined
- state priority/conflict strategy defined
- selection integration defined
- highlight model decided
- temporal boundary defined
- provenance continuity defined
- adapter registry designed
- diagnostics defined
- accessibility projection defined
- test matrix defined
- executable contract harness added
- no real map integrated
- no domain authority transferred
- no coordinate transform invented

## Verification Record

Verified after SCHEDULED reconciliation (GEO1-WAVE3A-DEC-003) against baseline `18abbd9`:

| Suite | Result |
|---|---|
| `tests/spatialFoundationWave1.test.mjs` | 18/18 PASS |
| `tests/spatialSelectionInteractionWave2.test.mjs` | 11/11 PASS |
| `tests/spatialSelectionInteractionRuntimeWave2.test.mjs` | 13/13 PASS |
| `tests/spatialProjectionStateWave3.test.mjs` | 11/11 PASS (11 test cases covering the 29 matrix rows) |
| Total | 53/53 PASS |
| `npm run build` | PASS (known unrelated warnings only: ASL lesson JSON dynamic/static import, chunk size) |

Scope checks:

- no files under `src/`, `apps/`, `public/`, or migrations changed since `18abbd9`
- the harness is not imported by any production module
- harness adapter, registry, and resolver are test-local fixtures only
- harness constants resolve to real Wave 1 exports (`SPATIAL_STATES`, `PUBLICATION_ELIGIBILITY_LEVELS`), so assertions are not vacuous

## Resolved Drift

1. `SCHEDULED` authority class: RESOLVED by GEO1-WAVE3A-DEC-003. Wave 3A had drifted from GEO-1A and GEO-1B, and GEO-1A is unamended. `SCHEDULED` is DOMAIN_SUPPLIED and carried in `domainState`. `temporalState` holds `TEMPORAL_STATES` categories only. A future `effectiveStart` alone yields `upcoming`, never `SCHEDULED`. The design and harness are reconciled.

## Open Conditions

Conditions carried into Wave 3B (numbering kept from the takeover review):

2. `EMERGENCY` priority. GEO-1B lets `EMERGENCY` outrank other states only when a confirmed emergency authority supplies it, and GEO-1A requires verification for public use. The Wave 3A conflict rules leave out this qualifier. The Emergency adapter is still BLOCKED in the GEO-1B Domain Adapter Plan.
3. Masking of non-projected results. The harness fixture returns the full `feature` alongside `SUPPRESSED` and `RESTRICTED` results. Wave 3B must not carry that pattern into production: non-`PROJECTED` results must not deliver unmasked features to clients.
4. `ADAPTER_COLLISION` is used by the harness but is not in the canonical diagnostic list.
5. `highlightState` is designed but neither resolved nor tested by the harness. `EVENT_SOON` has no defined threshold and is untested.
6. Stale handling is hard-coded (`freshness === "stale"` -> `STALE` / `UNAVAILABLE`), while GEO-1A requires "according to layer policy".
7. The harness maps diagnostics by matching substrings in validation error messages. This is acceptable for a fixture only. Wave 3B needs structured error codes.

## Wave 3B Readiness

READY WITH CONDITIONS.

Conditions:

- address Open Conditions 2–7 in the Wave 3B design or tests
- implement projection pipeline and presentation state resolver from this contract
- keep adapter fixtures separate from domain adapters
- preserve multi-dimensional state
- keep selection as presentation modifier only
- keep no-transform and no-publication-authority guards active
