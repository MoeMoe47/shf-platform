# GEO-1 Wave 3B Production Runtime Contract

Status: FROZEN test contract. Production runtime NOT IMPLEMENTED.
Refines: `GEO-1_WAVE3B_DESIGN_ADDENDUM.md` (frozen at `39e9b62`)
Decisions: GEO1-WAVE3B-DEC-008 through GEO1-WAVE3B-DEC-016 in `GEO-1A_DECISION_LOG.md`
Enforced by: `tests/spatialProjectionRuntimeWave3B.test.mjs`, `tests/spatialPresentationStateWave3B.test.mjs`

This document freezes the contract the Wave 3B red tests enforce. Where it is more specific than the design addendum, this document governs. The addendum is not rewritten; its header points here.

## 1. Deviation Rulings

| # | Deviation (from red-test phase) | Ruling | Decision |
|---|---|---|---|
| 1 | Adapter `getDomain()` | ACCEPTED WITH REFINEMENT: self-declared, validated and snapshotted at registration, and checked against every projected feature | DEC-008 |
| 2 | Adapter `getProjectionVersion()` | ACCEPTED WITH REFINEMENT: the adapter is the single version authority; provenance must match it, and a mismatch is `INVALID_PROVENANCE` | DEC-009 |
| 3 | Structured validator `issues` | ACCEPTED WITH REFINEMENT: `issues` is the structured twin of `errors` (same length and order, and `message` equals the legacy string); own code vocabulary; code-to-code mapping into projection diagnostics | DEC-010 |
| 4 | `availabilityReason` | ACCEPTED WITH REFINEMENT: populated if and only if `availabilityState = UNAVAILABLE`; first applicable reason by stage order | DEC-011 |
| 5 | `modifiers` | ACCEPTED WITH REFINEMENT: closed vocabulary, derived only, fixed order, unique, each with an accessibility equivalent | DEC-012 |
| 6 | Restricted NOTICE field set | ACCEPTED: frozen as a constructive allowlist; notice output is identical for every hidden record apart from `resultRef` | DEC-014 |
| 7 | Layer policy fields | ACCEPTED WITH REFINEMENT: added to the canonical layer contract by amendment and validated at registration; a malformed policy rejects the layer | DEC-015 |

Red-test deviations recorded earlier but not in the list above:

| Earlier deviation | Ruling | Decision |
|---|---|---|
| `PROJECTION_DIAGNOSTIC_DETAIL_KEYS` export | ACCEPTED WITH REFINEMENT: exact key list frozen (§6) | DEC-016 |
| `STALE_SOURCE` catalog `blocking: "PER_STALE_POLICY"` | ACCEPTED | DEC-016 |
| Malformed or authority-less `soonThreshold` emits `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` at projection | **REJECTED**: such a layer fails registration (DEC-015). `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` now means only "no threshold declared". Test T05 changed accordingly | DEC-015 |
| Identifier lookup returns `{ ok, ... }` | ACCEPTED | DEC-013 |
| R01 pins the prior baseline at exactly 53 | ACCEPTED (test-only, no contract impact) | n/a |

## 2. Adapter Contract (DEC-008, DEC-009)

| Method | Returns | Rules |
|---|---|---|
| `getDomain()` | string | non-empty, already a normalized spatial id segment (`normalizeSpatialIdSegment(v) === v`); static |
| `getSourceAuthority()` | string | same rule as `getDomain()`; static |
| `getSupportedFeatureTypes()` | string[] | non-empty, unique, normalized segments; static |
| `getSupportedCoordinateSpaces()` | string[] | non-empty, unique, non-empty strings; static |
| `getProjectionVersion()` | string | non-empty; static; the only projection-version authority |
| `canProject(record, context)` | boolean | pure; no mutation |
| `project(record, context)` | SpatialFeature | pure; must not mutate `record`; a thrown error becomes `INVALID_FEATURE` (the error message is never forwarded) |

Registration (`createProjectionAdapterRegistry().register(adapter)`):

1. **Frozen:** the adapter must be a frozen object exposing all seven methods.
2. **Snapshot:** the five identity methods are called once and their values snapshotted. Later changes are ignored.
3. **Invalid adapters:** a failure of rule 1 or of any identity rule is rejected with `INVALID_ADAPTER`.
4. **Collision key:** `` `${domain}::${featureType}` `` for each supported feature type. If any key already exists, the whole registration is rejected atomically with `ADAPTER_COLLISION`. The same adapter object or a new `projectionVersion` still collides.
5. **No replacement:** there is no `replace`, `override`, `unregister`, or `upsert`.

Projection-time checks (`pipeline.project`):

| Check | Diagnostic on failure |
|---|---|
| adapter found for `(record.domain, record.featureType)` | `ADAPTER_NOT_FOUND` |
| `record.sourceAuthority === getSourceAuthority()` | `INVALID_SOURCE_AUTHORITY` |
| `feature.domain === getDomain()`, `feature.featureType` supported, `feature.sourceAuthority === getSourceAuthority()` | `INVALID_FEATURE` |
| `feature.coordinateSpaceId` is in `getSupportedCoordinateSpaces()` | `INVALID_FEATURE` |
| `feature.provenance.projectionVersion === getProjectionVersion()` | `INVALID_PROVENANCE` |

Projection version therefore has one authority: the adapter declares it. Provenance must carry it verbatim. Results reference it only through `feature.provenance.projectionVersion`, and there is no separate result field.

## 3. Structured Validation (DEC-010)

Every Wave 1 validator result gains `issues` alongside its unchanged `{ valid, errors }`:

```text
issue = {
  code      stable VALIDATION_ISSUE_CODES value
  field     dotted path of the offending field, or null for whole-object issues
  message   exactly the legacy error string at the same index in `errors`
  details?  optional; keys limited to VALIDATION_ISSUE_DETAIL_KEYS
}
```

Invariants:

- `issues.length === errors.length`
- `issues[i].message === errors[i]`
- `valid === (issues.length === 0)`

Existing `errors` strings do not change.

`VALIDATION_ISSUE_DETAIL_KEYS = ["expectedCoordinateFamily", "receivedCoordinateFamily"]`

`VALIDATION_ISSUE_CODES`:

| Code | Emitted by |
|---|---|
| `OBJECT_REQUIRED` | any validator given a non-object |
| `FIELD_REQUIRED` | missing required text field |
| `FIELD_INVALID_ENUM` | enum field outside its vocabulary |
| `FIELD_INVALID_TIMESTAMP` | unparseable timestamp |
| `FIELD_INVALID_TYPE` | wrong structural type (e.g. array expected) |
| `FEATURE_ID_INVALID_FORMAT` | non-canonical `featureId` |
| `PROVENANCE_REQUIRED` | provenance missing |
| `PROVENANCE_FIELD_REQUIRED` | provenance field missing |
| `PROVENANCE_TIMESTAMP_INVALID` | provenance `updatedAt` unparseable |
| `PUBLICATION_ELIGIBILITY_REQUIRED` | `publicEligibility` missing |
| `PUBLICATION_ELIGIBILITY_INVALID` | `publicEligibility` level or state invalid |
| `UNKNOWN_COORDINATE_SPACE` | coordinate space not registered |
| `COORDINATE_FAMILY_MISMATCH` | registered space of a different family |
| `UNSUPPORTED_COORDINATE_SPACE` | layer declares an unregistered coordinate space |
| `UNKNOWN_LAYER` | layer not registered |
| `LAYER_COORDINATE_SPACE_UNSUPPORTED` | layer does not support the feature's space |
| `TRANSFORM_AUTHORITY_REQUIRED` | REGISTERED transform without authority |
| `NO_REGISTERED_TRANSFORM` | `assertNoImplicitTransform` between distinct spaces |
| `LAYER_POLICY_INVALID` | invalid Wave 3B layer policy field (§8) |

Validators that gain `issues`:

- `validateSpatialProvenance`
- `validatePublicationEligibility`
- `validateCoordinateSpace`
- `validateSpatialLayer`
- `validateTemporalProjection`
- `validateSpatialFeature`
- `validateSpatialSelection`
- `validateSpatialInteraction`

`isPublicProjectionEligible` stays boolean.

Registries, all additive:

- `CoordinateSpaceRegistry.get` and `SpatialLayerRegistry.get` failures gain `code` (`UNKNOWN_COORDINATE_SPACE`, `COORDINATE_FAMILY_MISMATCH`, `UNKNOWN_LAYER`).
- `assertNoImplicitTransform` failures gain `code` (`NO_REGISTERED_TRANSFORM`, or the code of the failed `get`).
- Registration throws keep their message and gain `error.code`:
  - `DEFINITION_INVALID` for an invalid layer or coordinate-space definition. It also carries `error.issues`, the validator issues.
  - `DUPLICATE_ID` for a duplicate `layerId` or coordinate-space `id`.

  These are registry operation codes, not validation issue codes.

Projection mapping is code-to-code only. It never reads messages:

| Validation issue code | Projection diagnostic |
|---|---|
| `UNKNOWN_COORDINATE_SPACE` | `UNKNOWN_COORDINATE_SPACE` |
| `COORDINATE_FAMILY_MISMATCH` | `COORDINATE_FAMILY_MISMATCH` |
| `UNKNOWN_LAYER`, `LAYER_COORDINATE_SPACE_UNSUPPORTED` | `INVALID_LAYER` |
| `PROVENANCE_REQUIRED`, `PROVENANCE_FIELD_REQUIRED`, `PROVENANCE_TIMESTAMP_INVALID` | `INVALID_PROVENANCE` |
| every other code | `INVALID_FEATURE` |

## 4. Projection Result Contract (DEC-011, DEC-013)

### InternalProjectionResult

Trusted and never serialized to a client:

```text
kind            "INTERNAL"
status          PROJECTED | SUPPRESSED | RESTRICTED | INVALID | UNAVAILABLE | STALE
feature         SpatialFeature as projected, or null when no valid feature exists (INVALID)
dimensions      null for INVALID; otherwise:
  domainState, temporalState, selectionState, availabilityState, availabilityReason,
  freshnessState, verificationState, publicationState, highlightState,
  resolvedVisualState, modifiers
diagnostics     full structured diagnostics
maskMode        HIDE | NOTICE | GENERALIZED (effective layer value)
accessibility   label, description, stateText, selected, highlighted, freshnessText?, verificationText?, keyboardInteractions
viewerContext   the supplied viewer facts used
```

Dimensions are always computed for valid features, including masked ones. Masking limits what the client sees, not what is evaluated.

`availabilityState`, `availabilityReason`, status, and diagnostics are distinct:

| Field | Meaning |
|---|---|
| `status` | exposure outcome of the whole result |
| `availabilityState` | `AVAILABLE` or `UNAVAILABLE`: the fact |
| `availabilityReason` | which authority made it unavailable: `LAYER_LIFECYCLE` (layer `DISCONNECTED`, `UNMOUNTED`, `ARCHIVED`) › `STALE_POLICY` (`stalePolicy: UNAVAILABLE` on stale data) › `DOMAIN_SUPPLIED` (`domainState: UNAVAILABLE`). First applicable in that order. `null` if and only if `AVAILABLE` |
| `diagnostics` | operator-facing events; `LAYER_LIFECYCLE` and `DOMAIN_SUPPLIED` emit none, `STALE_POLICY` emits `STALE_SOURCE` |

### ClientProjectionResult

Built constructively from allowlists. It is never produced by deleting fields from an internal result.

| Status | Client result | `featureId` | `feature` | `presentation` | Geometry | Diagnostics |
|---|---|---|---|---|---|---|
| `PROJECTED` | full client result | yes | PROJECTED allowlist | client dimensions | precise | none |
| `STALE` | full client result | yes | PROJECTED allowlist | client dimensions | precise | `STALE_SOURCE` |
| `UNAVAILABLE` | placeholder result | yes | UNAVAILABLE allowlist | client dimensions | precise (viewer eligible) | `STALE_SOURCE` when reason is `STALE_POLICY`, else none |
| `RESTRICTED` + `HIDE` (default) | `null` (omitted) | n/a | n/a | n/a | n/a | n/a |
| `RESTRICTED` + `NOTICE` | notice (§7) | no | no | `{ resolvedVisualState }` | none | `RESTRICTED` |
| `RESTRICTED` + `GENERALIZED` | notice + `geometry` if the source supplied `generalizedGeometry`; otherwise the NOTICE shape exactly | no | no | `{ resolvedVisualState }` | source-generalized only | `RESTRICTED` |
| `SUPPRESSED` | `null` (omitted) | n/a | n/a | n/a | n/a | n/a |
| `INVALID` | `null` (omitted) | n/a | n/a | n/a | n/a | n/a |

Full client result keys (PROJECTED, STALE, UNAVAILABLE): `kind: "CLIENT"`, `status`, `resultRef`, `featureId`, `layerId`, `presentation`, `feature`, `accessibility`, `diagnostics`.

Client `presentation` (full results): `domainState` (as rendered; an unrendered emergency is `null`), `temporalState`, `selectionState`, `availabilityState`, `availabilityReason`, `freshnessState`, `verificationState`, `publicationState`, `highlightState`, `resolvedVisualState`, `modifiers`.

Client `feature` allowlists:

- **PROJECTED / STALE:** `featureId`, `featureType`, `domain`, `sourceAuthority`, `sourceRecordId`, `coordinateFamily`, `coordinateSpaceId`, `layerId`, `geometry`, `title`, `label`, `description`, `verificationState`, `publicationState`, `publicEligibility`, `updatedAt`, `allowedInteractions`, `provenance`
- **UNAVAILABLE:** `featureId`, `featureType`, `domain`, `sourceAuthority`, `sourceRecordId`, `coordinateFamily`, `coordinateSpaceId`, `layerId`, `geometry`, `label`, `verificationState`, `publicationState`, `publicEligibility`, `updatedAt`, `allowedInteractions` (always `[]`), `provenance`

Client `provenance` allowlist: `sourceAuthority`, `verificationState`, `publicationState`, `updatedAt`, `freshness`.

`resultRef`: opaque, unique per client result, not derived from `featureId`, `sourceRecordId`, domain, or authority.

Lookup: `lookupForClient(featureId, { records, viewer })` returns `{ ok: true, result }` or `{ ok: false, diagnostics: [{ code: "FEATURE_NOT_AVAILABLE", message }] }`. The failure response is byte-identical for unknown and hidden identifiers.

## 5. Modifier Model (DEC-012)

`resolvedVisualState` is the one dominant visual state (addendum §8). `modifiers` is the non-dominant presentation context.

| Modifier | Derived when | Accessibility equivalent |
|---|---|---|
| `SELECTED` | `selectionState = SELECTED` | `accessibility.selected = true` (`aria-selected`) |
| `HIGHLIGHTED` | `highlightState` has at least one source | `accessibility.highlighted = true` |
| `STALE` | `freshnessState = STALE` | `accessibility.freshnessText` |
| `UNVERIFIED` | `verificationState = UNVERIFIED` | `accessibility.verificationText = "Unverified"` |

Rules:

1. **Closed vocabulary:** exactly these four values.
2. **Fixed order:** `SELECTED`, `HIGHLIGHTED`, `STALE`, `UNVERIFIED`. Each value appears at most once.
3. **Derived only:** any caller-supplied `modifiers` input is ignored.
4. **Always derived:** a modifier is present whenever its condition holds, even when the same condition is also the dominant state (for example `SELECTED` resolves `SELECTED` and has modifier `SELECTED`).
5. **Presentation only:** modifiers never carry domain values and are never written into any dimension.
6. **Hidden from ineligible clients:** masked client results carry no `modifiers` (the NOTICE presentation is exactly `{ resolvedVisualState }`).

Examples:

- `resolvedVisualState = EMERGENCY` with `modifiers = [SELECTED]`
- A masked client sees `resolvedVisualState = RESTRICTED` and no modifiers.

## 6. Diagnostic Catalog Refinements (DEC-008, DEC-016)

- **`INVALID_ADAPTER` joins the catalog:** stage `REGISTRY`, `ERROR`, not client-safe, blocking (the registration), `resultStatus: null`. The catalog now holds 17 codes.
- **`STALE_SOURCE`:** its catalog `blocking` is `"PER_STALE_POLICY"`, and emitted instances carry a boolean.
- **Detail keys:** `PROJECTION_DIAGNOSTIC_DETAIL_KEYS` is exactly `["expectedCoordinateFamily", "field", "issueCode", "maskMode", "receivedCoordinateFamily", "stalePolicy"]`. No payload key (title, label, description, geometry, generalizedGeometry, evidenceReference, sourceRecordId, payload, record, feature) may ever be added.
- **`EVENT_SOON_THRESHOLD_NOT_CONFIGURED`:** emitted only for time-aware layers that declare no `soonThreshold`. A malformed threshold cannot reach projection (DEC-015).

## 7. Restricted NOTICE Allowlist (DEC-014)

Permitted, and nothing else:

```text
kind            "CLIENT"
status          "RESTRICTED"
resultRef       opaque, per-response
layerId         the layer id
presentation    { resolvedVisualState: "RESTRICTED" }
accessibility   { label: "Restricted item", stateText: "Restricted" }
diagnostics     [{ code: "RESTRICTED", message: <catalog message> }]
geometry        GENERALIZED mode only, and only the source-supplied generalizedGeometry
```

`layerId` is permitted because NOTICE is an explicit opt-in by the layer owner to disclose that a restricted item exists on that layer. Layers that do not opt in default to `HIDE`.

Prohibited, as a non-exhaustive illustration (the allowlist governs): `sourceRecordId`, `featureId`, `featureType`, `domain`, `sourceAuthority`, precise geometry, title, label, description, `domainState`, any dimension other than `resolvedVisualState`, `modifiers`, evidence reference, adapter identity, projection version, coordinate provenance, freshness data, and verification data.

Every NOTICE result is identical to every other NOTICE result on the same layer except `resultRef`, so no per-record information exists to leak.

## 8. Layer Policy Amendment (DEC-015)

Added to `GEO-1A_LAYER_CONTRACT.md` by amendment. All fields are optional, and absence has a defined safe behavior:

| Field | Type | Authority | Absent means | Validation (at registration) |
|---|---|---|---|---|
| `stalePolicy` | `MARK_STALE` \| `SUPPRESS` \| `UNAVAILABLE` (`SPATIAL_LAYER_STALE_POLICIES`) | layer owner (`owningDomain`) | behave as `MARK_STALE` (discloses supplied freshness only) | enum |
| `maxSourceAge` | ISO 8601 duration, days/hours/minutes/seconds only (`P[nD][T[nH][nM][nS]]`), greater than zero | `freshnessAuthority` | no calculated freshness; `UNKNOWN` unless the source supplies freshness | format and > 0; requires `freshnessAuthority` |
| `freshnessAuthority` | non-empty string | named freshness authority | n/a | required when `maxSourceAge` is present |
| `soonThreshold` | ISO 8601 duration (same subset), greater than zero | `soonThresholdAuthority` | EVENT_SOON not calculable; `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` on time-aware layers | format and > 0; requires `soonThresholdAuthority` and `timeAwareCapability: true` |
| `soonThresholdAuthority` | non-empty string | named event authority | n/a | required when `soonThreshold` is present |
| `maskMode` | `HIDE` \| `NOTICE` \| `GENERALIZED` (`SPATIAL_LAYER_MASK_MODES`) | layer owner with publication authority | `HIDE` | enum |

- Separate authority fields were chosen over a single `policyAuthority`, because freshness and event timing can belong to different authorities ("separate authorities").
- Years and months are excluded from durations because their length varies.
- An invalid field makes `validateSpatialLayer` return `LAYER_POLICY_INVALID` (with `field` set). `SpatialLayerRegistry.register` then throws, as it already does for invalid layers.
- The existing default layers declare none of these fields and remain valid.

## 9. Runtime Entry

`src/system/spatial/projection/index.js` exports:

- `createProjectionAdapterRegistry`
- `createSpatialProjectionPipeline`, whose pipeline provides `project`, `toClient`, `projectForClient`, `lookupForClient`, and `clientSelectableFeatures`
- `PROJECTION_DIAGNOSTIC_CATALOG` (17 codes)
- `PROJECTION_DIAGNOSTIC_DETAIL_KEYS`
- `PRODUCTION_EMERGENCY_AUTHORITIES` (`[]`)

`src/shared/spatial/index.js` additionally exports:

- `VALIDATION_ISSUE_CODES`
- `VALIDATION_ISSUE_DETAIL_KEYS`
- `SPATIAL_LAYER_STALE_POLICIES`
- `SPATIAL_LAYER_MASK_MODES`
