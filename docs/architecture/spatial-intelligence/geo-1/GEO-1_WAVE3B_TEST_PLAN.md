# GEO-1 Wave 3B Test Plan

Status: required production tests, specified before implementation (GEO-1B Test Architecture: "Tests must exist before production implementation begins").
Design source: `GEO-1_WAVE3B_DESIGN_ADDENDUM.md`

Placement:

- `tests/spatialProjectionRuntimeWave3B.test.mjs` for pipeline, registry, redaction, and diagnostics
- `tests/spatialPresentationStateWave3B.test.mjs` for resolver, states, temporal, and freshness

Test conventions:

- **Fixtures are test-local.** They are never imported by production modules.
- **Emergency authority is test-only.** EMERGENCY tests use a test-only allowlisted fixture authority. Production configuration registers none.
- **Clocks are injected.** Every temporal and freshness test injects `currentTime`; nothing reads the system clock.
- **Inputs are frozen.** Every input record is `Object.freeze`d, so any mutation throws or is detected.
- **Leak probe.** Leak tests plant a unique marker string (for example `LEAK-PROBE-7f3a`) in the private title, description, geometry, and evidence fields. They then assert that the marker is absent from the JSON of every client result and client diagnostic.

## Emergency (E): 7

| ID | Requirement |
|---|---|
| E01 | Domain-supplied EMERGENCY from an allowlisted, verified authority is preserved in `domainState` and resolves to `EMERGENCY` for an eligible viewer |
| E02 | Spatial cannot infer EMERGENCY. A record with no emergency `domainState`, but with "Emergency" in its title, an `ALERT` highlight source, an emergency-named layer, or `emergencyCapabilities` metadata, never resolves to `EMERGENCY` |
| E03 | EMERGENCY claimed by a non-allowlisted authority is retained internally, emits `EMERGENCY_AUTHORITY_NOT_CONFIRMED` (operator-only), and is not rendered as `EMERGENCY` |
| E04 | Allowlisted but unverified EMERGENCY is not rendered on a public surface, and renders with "Unverified emergency report" text on an operator surface |
| E05 | EMERGENCY + SELECTED preserves both dimensions, resolves to `EMERGENCY`, and keeps the selected modifier |
| E06 | EMERGENCY + RESTRICTED: internal result keeps `domainState = EMERGENCY`; client for a non-eligible viewer gets the `HIDE` or `NOTICE` form with no `domainState` and no emergency text (leak probe) |
| E07 | Stale EMERGENCY under each of `MARK_STALE`, `SUPPRESS`, `UNAVAILABLE`, and undeclared policy never renders as a current emergency |

## Masking and Internal / Client Boundary (M): 10

| ID | Requirement |
|---|---|
| M01 | `NOT_PUBLISHED` is omitted from client results with no placeholder, count, or payload (leak probe) |
| M02 | `RESTRICTED` with default `HIDE` is omitted from client results |
| M03 | `RESTRICTED` with `NOTICE` returns only the allowlisted fields `resultRef`, `status`, `layerId`, `resolvedVisualState`, and generic `accessibility` (exact key-set assertion) |
| M04 | `GENERALIZED` returns only source-supplied generalized geometry. Without it, no geometry is returned. Spatial never derives a generalized coordinate |
| M05 | `INVALID` results leak no title, label, geometry, `featureId`, or `sourceRecordId` to the client (leak probe) |
| M06 | ID injection: lookup of a computed `featureId` for a hidden record returns a response byte-identical to lookup of a nonexistent `featureId` (`FEATURE_NOT_AVAILABLE`) |
| M07 | `resultRef` is not equal to or derivable from `featureId` or `sourceRecordId`, and differs across responses |
| M08 | Client provenance for `PROJECTED` contains only the client subset. `evidenceReference`, `coordinateProvenance`, `projectionAdapter`, `projectionVersion`, and `sourceReference` are absent unless explicitly eligible |
| M09 | The selection store seeded by the pipeline contains only client-visible features, so selecting a hidden `featureId` fails |
| M10 | `ORGANIZATION`, `OPERATOR`, and `ADMIN` records are masked for viewers whose supplied context does not satisfy the level, and projected for viewers whose context does. Spatial grants nothing from missing context |

## Diagnostics (D): 7

| ID | Requirement |
|---|---|
| D01 | Every catalog code is emitted as a structured object with `code`, `severity`, `stage`, `blocking`, `resultStatus`, `safeForClient`, and `message` matching the catalog row |
| D02 | Static check: production projection modules contain no classification of diagnostic or error message text (no `.includes(`, `.match(`, `.startsWith(`, or regex test applied to error or message strings) |
| D03 | `ADAPTER_COLLISION` is returned as a structured diagnostic, registration is rejected, and the registry is unchanged (`listAdapters` identical, `getAdapter` returns the original) |
| D04 | Re-registering the identical adapter object and registering a same-key adapter with a different `projectionVersion` both collide |
| D05 | Diagnostic `message` values are static per code and `details` contains only allowlisted keys (leak probe) |
| D06 | Client results carry only `safeForClient` diagnostics, reduced to `{ code, message }` with no `featureId`, `sourceAuthority`, `coordinateSpaceId`, or `details` |
| D07 | Wave 1 validators expose additive structured `issues` codes. Their existing `errors` strings are unchanged (Wave 1 suite still passes unmodified) |

## States (S): 13

Each state test also asserts the accessibility `stateText` from the addendum §9.

| ID | Requirement |
|---|---|
| S01 | NORMAL when no other dimension applies |
| S02 | SELECTED as a presentation modifier. The record, feature, and all other dimensions are unchanged |
| S03 | NEXT only when domain-supplied. Spatial never derives NEXT |
| S04 | SCHEDULED only when domain-supplied. A future start alone gives `upcoming` and NORMAL (GEO1-WAVE3A-DEC-003) |
| S05 | EVENT_SOON from a domain-supplied soon flag. Without a flag or configured threshold, never calculated |
| S06 | EVENT_LIVE from source start and end on a time-aware layer only |
| S07 | MISSION_ACTIVE domain-supplied, preserved with SELECTED |
| S08 | EMERGENCY domain-supplied (cross-reference E01) |
| S09 | RESTRICTED is compared from supplied eligibility, never granted |
| S10 | CLOSED outranks temporal visuals |
| S11 | COMPLETED outranks temporal visuals |
| S12 | UNAVAILABLE from layer lifecycle (`DISCONNECTED`, `UNMOUNTED`, `ARCHIVED`), from stale policy, and from domain supply. Each case records its reason |
| S13 | Domain-supplied `NORMAL`, `SELECTED`, `RESTRICTED`, `EVENT_SOON`, `EVENT_LIVE`, or an unknown value produces `INVALID_DOMAIN_STATE` |

## EVENT_SOON and Temporal (T): 8

| ID | Requirement |
|---|---|
| T01 | With no threshold and no domain flag, a future event resolves to `upcoming` and never `soon`. `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` is recorded on time-aware layers |
| T02 | With a configured threshold (fixture layer config with `soonThresholdAuthority`), `soon` and `EVENT_SOON` apply inside the window |
| T03 | Boundaries: `currentTime = start − threshold` gives `soon` (inclusive). `currentTime = start` is not `soon`. `currentTime < start − threshold` gives `upcoming` |
| T04 | Timezone: a local `effectiveStart` with a declared `timezone` resolves on the absolute instant, including across a DST transition. A local `effectiveStart` without `timezone` gives `INVALID_TEMPORAL_SOURCE` and no temporal category |
| T05 | A malformed or missing-authority `soonThreshold` gives no calculation, with a diagnostic |
| T06 | Temporal visuals never appear on layers with `timeAwareCapability: false`. The category may still be recorded |
| T07 | Domain CLOSED or COMPLETED outranks EVENT_SOON and EVENT_LIVE |
| T08 | Determinism: the same inputs and injected clock give identical results. No implicit system clock read |

## Freshness and Stale Policy (F): 8

| ID | Requirement |
|---|---|
| F01 | `MARK_STALE` gives `STALE` status, renderable, inspectable, a stale marker, and the stale accessibility text |
| F02 | `SUPPRESS` gives `SUPPRESSED` with `STALE_SOURCE`, and the feature is omitted from the client |
| F03 | `UNAVAILABLE` gives `UNAVAILABLE` status, a disabled marker, and label and provenance only |
| F04 | Undeclared policy behaves as `MARK_STALE` |
| F05 | No supplied freshness and no `maxSourceAge` give `freshnessState = UNKNOWN`, which is neither stale nor current and has no marker |
| F06 | Layer-declared `maxSourceAge` with `freshnessAuthority` calculates STALE and CURRENT against the injected clock. Without `freshnessAuthority`, no calculation |
| F07 | Stale + selected: selection is preserved under `MARK_STALE` and `UNAVAILABLE`, and invalidated via the Wave 2B store when `SUPPRESS` removes the feature |
| F08 | Stale + restricted: restriction is evaluated first, and a masked client receives no freshness data |

(Stale + emergency is E07.)

## State Preservation and Provenance (P): 7

| ID | Requirement |
|---|---|
| P01 | Across every combination of dimensions in the fixture set, `domainState` in the result equals the source value |
| P02 | The `temporalState` category is not overwritten by domain, selection, or highlight |
| P03 | Selection mutates no record, feature, or other dimension (frozen inputs) |
| P04 | Highlight is transient: multiple sources, keyboard `FOCUS` and non-pointer sources supported, cleared without residue, never persisted, never alters stages 1–6 |
| P05 | `publicationState` and `verificationState` pass through verbatim, and Spatial never upgrades either |
| P06 | `resolvedVisualState` is derived only and never fed back into any dimension or the selection store |
| P07 | Provenance continuity: `sourceAuthority`, `sourceRecordId`, `projectionAdapter`, and `projectionVersion` survive record → adapter → feature → internal result, and the client subset survives redaction |

## Regression (R): 3

| ID | Requirement |
|---|---|
| R01 | Wave 1, Wave 2A, Wave 2B, and Wave 3A suites pass unmodified |
| R02 | Quick Map ↔ master-city and METAVERSE ↔ REAL_WORLD isolation, no implicit transform, no Franklin County fallback |
| R03 | No production module imports any Wave 3A or Wave 3B fixture |

## Totals

| Family | Count |
|---|---|
| Emergency | 7 |
| Masking | 10 |
| Diagnostics | 7 |
| States | 13 |
| EVENT_SOON / Temporal | 8 |
| Freshness | 8 |
| Preservation / Provenance | 7 |
| Regression | 3 |
| **Total required Wave 3B production tests** | **63** |
