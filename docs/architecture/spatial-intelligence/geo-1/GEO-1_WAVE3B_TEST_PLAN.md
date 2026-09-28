# GEO-1 Wave 3B Test Plan

Status: red tests IMPLEMENTED (63/63) and reconciled with `GEO-1_WAVE3B_RUNTIME_CONTRACT.md` (GEO1-WAVE3B-DEC-008 through DEC-016). Production runtime NOT IMPLEMENTED. See `GEO-1_WAVE3B_RED_TEST_REPORT.md`.
Design source: `GEO-1_WAVE3B_DESIGN_ADDENDUM.md` (frozen at `39e9b62`)

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
| E04 | Allowlisted but unverified EMERGENCY is not rendered on a public surface, and renders with "Unverified emergency report" text on an operator surface. Amended (DEC-012): operator result carries modifier `UNVERIFIED` and `verificationText`. |
| E05 | EMERGENCY + SELECTED preserves both dimensions, resolves to `EMERGENCY`, and keeps the selected modifier |
| E06 | EMERGENCY + RESTRICTED: internal result keeps `domainState = EMERGENCY`; client for a non-eligible viewer gets the `HIDE` or `NOTICE` form with no `domainState` and no emergency text (leak probe) |
| E07 | Stale EMERGENCY under each of `MARK_STALE`, `SUPPRESS`, `UNAVAILABLE`, and undeclared policy never renders as a current emergency |

## Masking and Internal / Client Boundary (M): 10

| ID | Requirement |
|---|---|
| M01 | `NOT_PUBLISHED` is omitted from client results with no placeholder, count, or payload (leak probe) |
| M02 | `RESTRICTED` with default `HIDE` is omitted from client results |
| M03 | `RESTRICTED` with `NOTICE` returns only the allowlisted fields `resultRef`, `status`, `layerId`, `resolvedVisualState`, and generic `accessibility` (exact key-set assertion). Amended (DEC-014): exact diagnostics, and every NOTICE on a layer identical apart from `resultRef`. |
| M04 | `GENERALIZED` returns only source-supplied generalized geometry. Without it, no geometry is returned. Spatial never derives a generalized coordinate |
| M05 | `INVALID` results leak no title, label, geometry, `featureId`, or `sourceRecordId` to the client (leak probe) |
| M06 | ID injection: lookup of a computed `featureId` for a hidden record returns a response byte-identical to lookup of a nonexistent `featureId` (`FEATURE_NOT_AVAILABLE`) |
| M07 | `resultRef` is not equal to or derivable from `featureId` or `sourceRecordId`, and differs across responses |
| M08 | Client provenance for `PROJECTED` contains only the client subset. `evidenceReference`, `coordinateProvenance`, `projectionAdapter`, `projectionVersion`, and `sourceReference` are absent unless explicitly eligible. Amended (DEC-013): exact client result keys and feature allowlist. |
| M09 | The selection store seeded by the pipeline contains only client-visible features, so selecting a hidden `featureId` fails |
| M10 | `ORGANIZATION`, `OPERATOR`, and `ADMIN` records are masked for viewers whose supplied context does not satisfy the level, and projected for viewers whose context does. Spatial grants nothing from missing context |

## Diagnostics (D): 7

| ID | Requirement |
|---|---|
| D01 | Every catalog code is emitted as a structured object with `code`, `severity`, `stage`, `blocking`, `resultStatus`, `safeForClient`, and `message` matching the catalog row. Amended (DEC-008/DEC-016): the catalog is 17 codes, including `INVALID_ADAPTER`. |
| D02 | Static check: production projection modules contain no classification of diagnostic or error message text (no `.includes(`, `.match(`, `.startsWith(`, or regex test applied to error or message strings) |
| D03 | `ADAPTER_COLLISION` is returned as a structured diagnostic, registration is rejected, and the registry is unchanged (`listAdapters` identical, `getAdapter` returns the original) |
| D04 | Re-registering the identical adapter object and registering a same-key adapter with a different `projectionVersion` both collide. Amended (DEC-008): registration also rejects malformed identity with `INVALID_ADAPTER` and snapshots identity. |
| D05 | Diagnostic `message` values are static per code and `details` contains only allowlisted keys (leak probe). Amended (DEC-016): detail keys are exactly the frozen list. |
| D06 | Client results carry only `safeForClient` diagnostics, reduced to `{ code, message }` with no `featureId`, `sourceAuthority`, `coordinateSpaceId`, or `details` |
| D07 | Wave 1 validators expose additive structured `issues` codes. Their existing `errors` strings are unchanged (Wave 1 suite still passes unmodified). Amended (DEC-010): `issues` is the twin of `errors` across all 8 validators; registry `code`s; `DUPLICATE_ID` throw code. |

## States (S): 13

Each state test also asserts the accessibility `stateText` from the addendum §9.

| ID | Requirement |
|---|---|
| S01 | NORMAL when no other dimension applies |
| S02 | SELECTED as a presentation modifier. The record, feature, and all other dimensions are unchanged. Amended (DEC-012): modifier `SELECTED` is present even when it is dominant. |
| S03 | NEXT only when domain-supplied. Spatial never derives NEXT |
| S04 | SCHEDULED only when domain-supplied. A future start alone gives `upcoming` and NORMAL (GEO1-WAVE3A-DEC-003) |
| S05 | EVENT_SOON from a domain-supplied soon flag. Without a flag or configured threshold, never calculated |
| S06 | EVENT_LIVE from source start and end on a time-aware layer only |
| S07 | MISSION_ACTIVE domain-supplied, preserved with SELECTED |
| S08 | EMERGENCY domain-supplied (cross-reference E01) |
| S09 | RESTRICTED is compared from supplied eligibility, never granted |
| S10 | CLOSED outranks temporal visuals |
| S11 | COMPLETED outranks temporal visuals |
| S12 | UNAVAILABLE from layer lifecycle (`DISCONNECTED`, `UNMOUNTED`, `ARCHIVED`), from stale policy, and from domain supply. Each case records its reason. Amended (DEC-011): the reason is `null` when AVAILABLE; precedence is LAYER_LIFECYCLE › STALE_POLICY › DOMAIN_SUPPLIED. |
| S13 | Domain-supplied `NORMAL`, `SELECTED`, `RESTRICTED`, `EVENT_SOON`, `EVENT_LIVE`, or an unknown value produces `INVALID_DOMAIN_STATE` |

## EVENT_SOON and Temporal (T): 8

| ID | Requirement |
|---|---|
| T01 | With no threshold and no domain flag, a future event resolves to `upcoming` and never `soon`. `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` is recorded on time-aware layers |
| T02 | With a configured threshold (fixture layer config with `soonThresholdAuthority`), `soon` and `EVENT_SOON` apply inside the window |
| T03 | Boundaries: `currentTime = start − threshold` gives `soon` (inclusive). `currentTime = start` is not `soon`. `currentTime < start − threshold` gives `upcoming` |
| T04 | Timezone: a local `effectiveStart` with a declared `timezone` resolves on the absolute instant, including across a DST transition. A local `effectiveStart` without `timezone` gives `INVALID_TEMPORAL_SOURCE` and no temporal category |
| T05 | A malformed or missing-authority `soonThreshold` gives no calculation, with a diagnostic. **Superseded (DEC-015):** now tests that layer policy fields are validated at registration (`LAYER_POLICY_INVALID`, `DEFINITION_INVALID`). |
| T06 | Temporal visuals never appear on layers with `timeAwareCapability: false`. The category may still be recorded |
| T07 | Domain CLOSED or COMPLETED outranks EVENT_SOON and EVENT_LIVE |
| T08 | Determinism: the same inputs and injected clock give identical results. No implicit system clock read |

## Freshness and Stale Policy (F): 8

| ID | Requirement |
|---|---|
| F01 | `MARK_STALE` gives `STALE` status, renderable, inspectable, a stale marker, and the stale accessibility text |
| F02 | `SUPPRESS` gives `SUPPRESSED` with `STALE_SOURCE`, and the feature is omitted from the client |
| F03 | `UNAVAILABLE` gives `UNAVAILABLE` status, a disabled marker, and label and provenance only. Amended (DEC-013): UNAVAILABLE feature allowlist. |
| F04 | Undeclared policy behaves as `MARK_STALE` |
| F05 | No supplied freshness and no `maxSourceAge` give `freshnessState = UNKNOWN`, which is neither stale nor current and has no marker |
| F06 | Layer-declared `maxSourceAge` with `freshnessAuthority` calculates STALE and CURRENT against the injected clock. Without `freshnessAuthority`, no calculation. Amended (DEC-015): `maxSourceAge` without `freshnessAuthority` is rejected at registration (T05); no `maxSourceAge` means UNKNOWN. |
| F07 | Stale + selected: selection is preserved under `MARK_STALE` and `UNAVAILABLE`, and invalidated via the Wave 2B store when `SUPPRESS` removes the feature |
| F08 | Stale + restricted: restriction is evaluated first, and a masked client receives no freshness data |

(Stale + emergency is E07.)

## State Preservation and Provenance (P): 7

| ID | Requirement |
|---|---|
| P01 | Across every combination of dimensions in the fixture set, `domainState` in the result equals the source value |
| P02 | The `temporalState` category is not overwritten by domain, selection, or highlight |
| P03 | Selection mutates no record, feature, or other dimension (frozen inputs) |
| P04 | Highlight is transient: multiple sources, keyboard `FOCUS` and non-pointer sources supported, cleared without residue, never persisted, never alters stages 1–6. Amended (DEC-012): the `HIGHLIGHTED` modifier and the full fixed modifier order. |
| P05 | `publicationState` and `verificationState` pass through verbatim, and Spatial never upgrades either |
| P06 | `resolvedVisualState` is derived only and never fed back into any dimension or the selection store. Amended (DEC-012): caller-supplied modifiers are ignored. |
| P07 | Provenance continuity: `sourceAuthority`, `sourceRecordId`, `projectionAdapter`, and `projectionVersion` survive record → adapter → feature → internal result, and the client subset survives redaction. Amended (DEC-009): a provenance version that differs from the adapter's gives `INVALID_PROVENANCE`. |

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

## Red-Test Implementation

### File Structure

The plan's two-file layout was kept. It matches the repository's one-file-per-wave convention (`tests/spatial*Wave*.test.mjs`), and the fixtures live under the GEO-1B helper location `tests/helpers/spatial/`:

| File | Families | Tests |
|---|---|---|
| `tests/spatialProjectionRuntimeWave3B.test.mjs` | E, M, D, R | 27 |
| `tests/spatialPresentationStateWave3B.test.mjs` | S, T, F, P | 36 |
| `tests/helpers/spatial/wave3bProjectionFixtures.mjs` | test-only fixtures, runtime loader, shared-export gate | n/a |

How missing runtime is detected:

- **Runtime entry:** the helper loads `src/system/spatial/projection/index.js` only if the file exists. A missing entry fails with `EXPECTED_MISSING_RUNTIME`.
- **Additive Wave 1 exports:** `VALIDATION_ISSUE_CODES` and `SPATIAL_LAYER_STALE_POLICIES` are gated on the export's presence, never on an assertion's outcome.

Once the entry or export exists, every failure is real. The helper contains no runtime logic.

### Enforced Contract

The tests enforce `GEO-1_WAVE3B_RUNTIME_CONTRACT.md`: adapter contract §2, structured validation §3, result model §4, modifiers §5, catalog §6, NOTICE allowlist §7, layer policy §8, and entries §9.

### Reconciliation of Red-Test Deviations (GEO1-WAVE3B-DEC-008 through DEC-016)

| Deviation | Ruling | Test effect |
|---|---|---|
| Adapter `getDomain()` | ACCEPTED WITH REFINEMENT (DEC-008) | D04 adds `INVALID_ADAPTER` cases and an identity-snapshot check; D01 catalog grows to 17 |
| Adapter `getProjectionVersion()` | ACCEPTED WITH REFINEMENT (DEC-009) | P07 adds a version-mismatch check (`INVALID_PROVENANCE`) |
| Structured validator `issues` | ACCEPTED WITH REFINEMENT (DEC-010) | D07 rewritten: legacy strings first, then twin parity across 8 validators, registry codes, `DUPLICATE_ID`; issue codes are validator codes (e.g. `UNKNOWN_LAYER`, `PROVENANCE_FIELD_REQUIRED`), not projection codes |
| `availabilityReason` | ACCEPTED WITH REFINEMENT (DEC-011) | S12 adds the null-when-AVAILABLE and precedence cases; F03 checks the client reason |
| `modifiers` | ACCEPTED WITH REFINEMENT (DEC-012) | S02, E04, E06, P04, and P06 assert the vocabulary, order, derivation, and masking |
| Restricted NOTICE field set | ACCEPTED (DEC-014) | M03 asserts exact diagnostics and record-independent output |
| Layer policy fields | ACCEPTED WITH REFINEMENT (DEC-015) | T05 **superseded**: registration validation replaces the runtime diagnostic for malformed thresholds; the invalid fixture layers move to `INVALID_LAYER_POLICY_CANDIDATES`; F06 drops the authority-less case |
| `PROJECTION_DIAGNOSTIC_DETAIL_KEYS` | ACCEPTED WITH REFINEMENT (DEC-016) | D05 asserts the exact key list |
| `STALE_SOURCE` `blocking: "PER_STALE_POLICY"` | ACCEPTED (DEC-016) | unchanged |
| Malformed `soonThreshold` diagnosed at runtime | **REJECTED** (DEC-015) | T05 changed, as above |
| Lookup `{ ok, ... }` | ACCEPTED (DEC-013) | unchanged |
| R01 pins 53 | ACCEPTED (test-only) | unchanged |

The count is unchanged: 63 planned, 63 implemented, 0 deferred. No test was removed. T05 changed scope and is documented above.

### Test Implementation Matrix

| ID | Test file | Test name | Category | Current result | Future runtime requirement | Authority dependency | Implementation dependency |
|---|---|---|---|---|---|---|---|
| E01 | `spatialProjectionRuntimeWave3B.test.mjs` | domain-supplied EMERGENCY from an allowlisted verified authority is preserved and rendered | Emergency | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `pipeline.project`, `toClient`; emergency allowlist; `PRODUCTION_EMERGENCY_AUTHORITIES` | test-only confirmed emergency authority; production allowlist empty | `src/system/spatial/projection/index.js` |
| E02 | `spatialProjectionRuntimeWave3B.test.mjs` | Spatial cannot infer EMERGENCY from title, layer name, alert highlight, or authority | Emergency | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `pipeline.project`, `toClient`; emergency allowlist; `PRODUCTION_EMERGENCY_AUTHORITIES` | test-only confirmed emergency authority; production allowlist empty | `src/system/spatial/projection/index.js` |
| E03 | `spatialProjectionRuntimeWave3B.test.mjs` | unconfirmed authority EMERGENCY is retained internally, diagnosed, not rendered; production allowlist is empty | Emergency | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `pipeline.project`, `toClient`; emergency allowlist; `PRODUCTION_EMERGENCY_AUTHORITIES` | test-only confirmed emergency authority; production allowlist empty | `src/system/spatial/projection/index.js` |
| E04 | `spatialProjectionRuntimeWave3B.test.mjs` | unverified EMERGENCY is not rendered on public surfaces and is labeled unverified for operators | Emergency | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `pipeline.project`, `toClient`; emergency allowlist; `PRODUCTION_EMERGENCY_AUTHORITIES` | test-only confirmed emergency authority; production allowlist empty | `src/system/spatial/projection/index.js` |
| E05 | `spatialProjectionRuntimeWave3B.test.mjs` | EMERGENCY + SELECTED preserves both dimensions and resolves to EMERGENCY with selected modifier | Emergency | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `pipeline.project`, `toClient`; emergency allowlist; `PRODUCTION_EMERGENCY_AUTHORITIES` | test-only confirmed emergency authority; production allowlist empty | `src/system/spatial/projection/index.js` |
| E06 | `spatialProjectionRuntimeWave3B.test.mjs` | EMERGENCY + RESTRICTED keeps the domain fact internally and discloses nothing to a non-eligible client | Emergency | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `pipeline.project`, `toClient`; emergency allowlist; `PRODUCTION_EMERGENCY_AUTHORITIES` | test-only confirmed emergency authority; production allowlist empty; viewer levels | `src/system/spatial/projection/index.js` |
| E07 | `spatialProjectionRuntimeWave3B.test.mjs` | stale EMERGENCY follows the layer stale policy and never renders as a current emergency | Emergency | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `pipeline.project`, `toClient`; emergency allowlist; `PRODUCTION_EMERGENCY_AUTHORITIES` | test-only confirmed emergency authority; production allowlist empty | `src/system/spatial/projection/index.js` |
| M01 | `spatialProjectionRuntimeWave3B.test.mjs` | NOT_PUBLISHED is omitted from client results with no placeholder, count, or payload | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | client redaction from allowlists (contract §4, §7); `projectForClient`, `lookupForClient`, `clientSelectableFeatures` | viewer `grantedLevels` supplied by identity (fixture) | `src/system/spatial/projection/index.js` |
| M02 | `spatialProjectionRuntimeWave3B.test.mjs` | RESTRICTED with default HIDE mask mode is omitted from client results | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | client redaction from allowlists (contract §4, §7); `projectForClient`, `lookupForClient`, `clientSelectableFeatures` | viewer `grantedLevels` supplied by identity (fixture) | `src/system/spatial/projection/index.js` |
| M03 | `spatialProjectionRuntimeWave3B.test.mjs` | RESTRICTED NOTICE returns only the allowlisted placeholder fields | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | client redaction from allowlists (contract §4, §7); `projectForClient`, `lookupForClient`, `clientSelectableFeatures` | layer `maskMode: NOTICE` (fixture) | `src/system/spatial/projection/index.js` |
| M04 | `spatialProjectionRuntimeWave3B.test.mjs` | GENERALIZED returns only source-supplied generalized geometry and never derives one | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | client redaction from allowlists (contract §4, §7); `projectForClient`, `lookupForClient`, `clientSelectableFeatures` | layer `maskMode: GENERALIZED` + source-supplied generalized geometry | `src/system/spatial/projection/index.js` |
| M05 | `spatialProjectionRuntimeWave3B.test.mjs` | INVALID results leak no title, label, geometry, featureId, or sourceRecordId to clients | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | client redaction from allowlists (contract §4, §7); `projectForClient`, `lookupForClient`, `clientSelectableFeatures` | viewer `grantedLevels` supplied by identity (fixture) | `src/system/spatial/projection/index.js` |
| M06 | `spatialProjectionRuntimeWave3B.test.mjs` | feature ID injection: hidden and unknown IDs return byte-identical FEATURE_NOT_AVAILABLE | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | client redaction from allowlists (contract §4, §7); `projectForClient`, `lookupForClient`, `clientSelectableFeatures` | viewer `grantedLevels` supplied by identity (fixture) | `src/system/spatial/projection/index.js` |
| M07 | `spatialProjectionRuntimeWave3B.test.mjs` | resultRef is opaque, per-response, and not derived from featureId or sourceRecordId | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | client redaction from allowlists (contract §4, §7); `projectForClient`, `lookupForClient`, `clientSelectableFeatures` | viewer `grantedLevels` supplied by identity (fixture) | `src/system/spatial/projection/index.js` |
| M08 | `spatialProjectionRuntimeWave3B.test.mjs` | PROJECTED client provenance is limited to the client subset | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | client redaction from allowlists (contract §4, §7); `projectForClient`, `lookupForClient`, `clientSelectableFeatures` | viewer `grantedLevels` supplied by identity (fixture) | `src/system/spatial/projection/index.js` |
| M09 | `spatialProjectionRuntimeWave3B.test.mjs` | selection store seeded by the pipeline contains only client-visible features | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `clientSelectableFeatures` + Wave 2B selection store | viewer `grantedLevels` supplied by identity (fixture) | `src/system/spatial/projection/index.js` + existing `selectionStore.js` (unchanged) |
| M10 | `spatialProjectionRuntimeWave3B.test.mjs` | ORGANIZATION, OPERATOR, and ADMIN levels are compared against supplied viewer context; missing context grants nothing | Masking / boundary | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | client redaction from allowlists (contract §4, §7); `projectForClient`, `lookupForClient`, `clientSelectableFeatures` | viewer `grantedLevels` supplied by identity (fixture) | `src/system/spatial/projection/index.js` |
| D01 | `spatialProjectionRuntimeWave3B.test.mjs` | every catalog code matches the frozen catalog and is emitted as a structured diagnostic | Diagnostics | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `PROJECTION_DIAGNOSTIC_CATALOG` (17), structured diagnostics | none | `src/system/spatial/projection/index.js` |
| D02 | `spatialProjectionRuntimeWave3B.test.mjs` | production projection modules never classify diagnostics by parsing message text | Diagnostics | RED: EXPECTED_MISSING_RUNTIME (directory) | static scan of `src/system/spatial/projection/` and `src/shared/spatial/contracts/` | none | `src/system/spatial/projection/` directory |
| D03 | `spatialProjectionRuntimeWave3B.test.mjs` | ADAPTER_COLLISION rejects registration atomically and leaves the registry unchanged | Diagnostics | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | adapter registry atomic `ADAPTER_COLLISION` | none | `src/system/spatial/projection/index.js` |
| D04 | `spatialProjectionRuntimeWave3B.test.mjs` | identical re-registration and version changes collide; no replacement API exists | Diagnostics | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | adapter registry: collision, `INVALID_ADAPTER`, identity snapshot (DEC-008) | none | `src/system/spatial/projection/index.js` |
| D05 | `spatialProjectionRuntimeWave3B.test.mjs` | diagnostic messages are static per code and details carry no source payload | Diagnostics | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `PROJECTION_DIAGNOSTIC_DETAIL_KEYS` exact list (DEC-016) | none | `src/system/spatial/projection/index.js` |
| D06 | `spatialProjectionRuntimeWave3B.test.mjs` | client results carry only client-safe diagnostics reduced to { code, message } | Diagnostics | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `PROJECTION_DIAGNOSTIC_CATALOG` (17), structured diagnostics | none | `src/system/spatial/projection/index.js` |
| D07 | `spatialProjectionRuntimeWave3B.test.mjs` | Wave 1 validators and registries expose additive structured issues while legacy error strings are unchanged | Diagnostics | RED: EXPECTED_MISSING_RUNTIME (`VALIDATION_ISSUE_CODES` export) | `issues` twin on 8 validators; registry `code`; `DUPLICATE_ID` (DEC-010) | none | `src/shared/spatial/contracts/validation.js`, both registries (additive) |
| R01 | `spatialProjectionRuntimeWave3B.test.mjs` | Wave 1, Wave 2A, Wave 2B, and Wave 3A suites still pass unmodified | Regression | PASS | none (runs prior suites; exactly 53) | none | none |
| R02 | `spatialProjectionRuntimeWave3B.test.mjs` | coordinate isolation, no implicit transform, and no Franklin County fallback remain intact | Regression | PASS | none (Wave 1 registries) | none | none |
| R03 | `spatialProjectionRuntimeWave3B.test.mjs` | no production module imports Wave 3A or Wave 3B test fixtures | Regression | PASS | none (static scan) | none | none |
| S01 | `spatialPresentationStateWave3B.test.mjs` | NORMAL when no other dimension applies | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| S02 | `spatialPresentationStateWave3B.test.mjs` | SELECTED is a presentation modifier that leaves the feature and every other dimension unchanged | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| S03 | `spatialPresentationStateWave3B.test.mjs` | NEXT only when domain-supplied; Spatial never derives NEXT | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| S04 | `spatialPresentationStateWave3B.test.mjs` | SCHEDULED only when domain-supplied; a future start alone is upcoming and NORMAL | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| S05 | `spatialPresentationStateWave3B.test.mjs` | EVENT_SOON from a domain-supplied soon flag; never calculated without a flag or configured threshold | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| S06 | `spatialPresentationStateWave3B.test.mjs` | EVENT_LIVE from source start and end on a time-aware layer only | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| S07 | `spatialPresentationStateWave3B.test.mjs` | MISSION_ACTIVE is domain-supplied and preserved with SELECTED | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| S08 | `spatialPresentationStateWave3B.test.mjs` | EMERGENCY is domain-supplied by an allowlisted authority (see E01) | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | test-only confirmed emergency authority; production allowlist empty | `src/system/spatial/projection/index.js` |
| S09 | `spatialPresentationStateWave3B.test.mjs` | RESTRICTED is compared from supplied eligibility and never granted or upgraded | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | viewer `grantedLevels` supplied by identity (fixture) | `src/system/spatial/projection/index.js` |
| S10 | `spatialPresentationStateWave3B.test.mjs` | CLOSED outranks temporal visuals while the temporal category is retained | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| S11 | `spatialPresentationStateWave3B.test.mjs` | COMPLETED outranks temporal visuals while the temporal category is retained | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| S12 | `spatialPresentationStateWave3B.test.mjs` | UNAVAILABLE from layer lifecycle, stale policy, and domain supply, each recording its reason | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `availabilityReason` precedence (DEC-011) | layer `lifecycleStatus`, `stalePolicy` (fixture) | `src/system/spatial/projection/index.js` |
| S13 | `spatialPresentationStateWave3B.test.mjs` | domain may not supply Spatial-owned, restriction, temporal, or unknown states | State | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | presentation resolution (addendum §8) + accessibility `stateText` | domain-supplied `domainState` (fixture adapter) | `src/system/spatial/projection/index.js` |
| T01 | `spatialPresentationStateWave3B.test.mjs` | no threshold and no domain flag: a future event is upcoming, never soon | EVENT_SOON / temporal | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | temporal category + EVENT_SOON window from injected clock | layer `soonThreshold` + `soonThresholdAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| T02 | `spatialPresentationStateWave3B.test.mjs` | a domain-configured threshold produces EVENT_SOON inside the window | EVENT_SOON / temporal | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | temporal category + EVENT_SOON window from injected clock | layer `soonThreshold` + `soonThresholdAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| T03 | `spatialPresentationStateWave3B.test.mjs` | EVENT_SOON window boundaries: inclusive at start minus threshold, exclusive at start | EVENT_SOON / temporal | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | temporal category + EVENT_SOON window from injected clock | layer `soonThreshold` + `soonThresholdAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| T04 | `spatialPresentationStateWave3B.test.mjs` | timezone: local times resolve on the absolute instant across DST; local time without timezone is invalid | EVENT_SOON / temporal | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | temporal category + EVENT_SOON window from injected clock | layer `soonThreshold` + `soonThresholdAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| T05 | `spatialPresentationStateWave3B.test.mjs` | layer policy fields (soonThreshold, maxSourceAge, stalePolicy, maskMode) are validated at registration | EVENT_SOON / temporal | RED: EXPECTED_MISSING_RUNTIME (`SPATIAL_LAYER_STALE_POLICIES` export) | `validateSpatialLayer` policy validation; `SpatialLayerRegistry` `DEFINITION_INVALID` (DEC-015) | layer owner / named authorities (DEC-015) | `src/shared/spatial/contracts/validation.js`, `constants.js`, `SpatialLayerRegistry.js` (additive) |
| T06 | `spatialPresentationStateWave3B.test.mjs` | temporal visuals never appear on layers without timeAwareCapability | EVENT_SOON / temporal | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | temporal category + EVENT_SOON window from injected clock | layer `soonThreshold` + `soonThresholdAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| T07 | `spatialPresentationStateWave3B.test.mjs` | domain CLOSED or COMPLETED outranks EVENT_SOON and EVENT_LIVE | EVENT_SOON / temporal | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | temporal category + EVENT_SOON window from injected clock | layer `soonThreshold` + `soonThresholdAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| T08 | `spatialPresentationStateWave3B.test.mjs` | temporal resolution is deterministic and never reads the system clock | EVENT_SOON / temporal | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | injected clock only | layer `soonThreshold` + `soonThresholdAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| F01 | `spatialPresentationStateWave3B.test.mjs` | MARK_STALE renders with a stale marker, stays inspectable, and describes staleness | Freshness | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `freshnessState` + layer `stalePolicy` / `maxSourceAge` | layer `stalePolicy`, `maxSourceAge`, `freshnessAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| F02 | `spatialPresentationStateWave3B.test.mjs` | SUPPRESS omits the stale feature from clients with STALE_SOURCE | Freshness | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `freshnessState` + layer `stalePolicy` / `maxSourceAge` | layer `stalePolicy`, `maxSourceAge`, `freshnessAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| F03 | `spatialPresentationStateWave3B.test.mjs` | UNAVAILABLE policy returns a disabled placeholder with label and geometry only | Freshness | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `freshnessState` + layer `stalePolicy` / `maxSourceAge` | layer `stalePolicy`, `maxSourceAge`, `freshnessAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| F04 | `spatialPresentationStateWave3B.test.mjs` | undeclared stale policy behaves as MARK_STALE | Freshness | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `freshnessState` + layer `stalePolicy` / `maxSourceAge` | layer `stalePolicy`, `maxSourceAge`, `freshnessAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| F05 | `spatialPresentationStateWave3B.test.mjs` | unreported freshness is UNKNOWN: neither stale nor current, no marker | Freshness | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `freshnessState` + layer `stalePolicy` / `maxSourceAge` | layer `stalePolicy`, `maxSourceAge`, `freshnessAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| F06 | `spatialPresentationStateWave3B.test.mjs` | layer-declared maxSourceAge calculates freshness; supplied freshness wins; no maxSourceAge means UNKNOWN | Freshness | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `freshnessState` + layer `stalePolicy` / `maxSourceAge` | layer `stalePolicy`, `maxSourceAge`, `freshnessAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` |
| F07 | `spatialPresentationStateWave3B.test.mjs` | stale selection: preserved under MARK_STALE and UNAVAILABLE, cleared when SUPPRESS removes the feature | Freshness | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `clientSelectableFeatures` + Wave 2B `replaceFeatures` | layer `stalePolicy`, `maxSourceAge`, `freshnessAuthority` (DEC-015 fields, fixture data) | `src/system/spatial/projection/index.js` + existing `selectionStore.js` (unchanged) |
| F08 | `spatialPresentationStateWave3B.test.mjs` | stale + restricted: restriction is evaluated first and masked clients get no freshness data | Freshness | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | `freshnessState` + layer `stalePolicy` / `maxSourceAge` | viewer `grantedLevels` supplied by identity (fixture); layer `maskMode` | `src/system/spatial/projection/index.js` |
| P01 | `spatialPresentationStateWave3B.test.mjs` | domainState equals the source value across every dimension combination | Preservation | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | dimension isolation; modifiers (contract §5) | none | `src/system/spatial/projection/index.js` |
| P02 | `spatialPresentationStateWave3B.test.mjs` | temporal category is not overwritten by domain, selection, or highlight | Preservation | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | dimension isolation; modifiers (contract §5) | none | `src/system/spatial/projection/index.js` |
| P03 | `spatialPresentationStateWave3B.test.mjs` | projection with selection mutates no source record, feature, or other dimension | Preservation | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | dimension isolation; modifiers (contract §5) | none | `src/system/spatial/projection/index.js` |
| P04 | `spatialPresentationStateWave3B.test.mjs` | highlight is transient, multi-source, keyboard-capable, and never alters other stages | Preservation | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | dimension isolation; modifiers (contract §5) | none | `src/system/spatial/projection/index.js` |
| P05 | `spatialPresentationStateWave3B.test.mjs` | publication and verification state pass through verbatim and are never upgraded | Preservation | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | dimension isolation; modifiers (contract §5) | none | `src/system/spatial/projection/index.js` |
| P06 | `spatialPresentationStateWave3B.test.mjs` | resolvedVisualState is derived only and never fed back | Preservation | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | dimension isolation; modifiers (contract §5) | none | `src/system/spatial/projection/index.js` |
| P07 | `spatialPresentationStateWave3B.test.mjs` | provenance continuity from record through internal result and client redaction | Preservation | RED: EXPECTED_MISSING_RUNTIME (runtime entry) | provenance continuity; single version authority (DEC-009) | none | `src/system/spatial/projection/index.js` |
