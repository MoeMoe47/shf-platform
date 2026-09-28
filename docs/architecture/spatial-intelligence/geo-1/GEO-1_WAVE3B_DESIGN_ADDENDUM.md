# GEO-1 Wave 3B Design Addendum

Status: design only. No production runtime.
Refined by: `GEO-1_WAVE3B_RUNTIME_CONTRACT.md` (GEO1-WAVE3B-DEC-008 through DEC-016). Where that contract is more specific, it governs. This text is kept as frozen at `39e9b62`.
Baseline: `954560b test(spatial): freeze Wave 3A projection state contract`
Decisions: GEO1-WAVE3B-DEC-001 through GEO1-WAVE3B-DEC-007 in `GEO-1A_DECISION_LOG.md`

This addendum resolves the seven open conditions carried out of the Wave 3A acceptance gate before any production projection pipeline, adapter registry, or presentation state resolver is written. It refines Wave 3A. It does not override GEO-1A or GEO-1B. Where Wave 3A and the earlier contracts differed, the difference is recorded as a decision.

Governing rule: Spatial may derive presentation from authoritative inputs. It must not invent domain state, authorization, publication approval, verification, geography, coordinate transforms, emergency authority, event state, or mission state.

## Repository Evidence Used

| Evidence | Location | Bearing |
|---|---|---|
| Emergency/Dispatch is capability metadata, not an engine | `GEO-1A_ENGINE_CLIENT_BOUNDARY.md`, `GEO-1A_GAPS_AND_BLOCKERS.md`, `src/system/metaverse/regionalSceneRegistry.js` (`emergencyCapabilities` string lists) | No confirmed emergency authority exists in the repository |
| Emergency adapter BLOCKED | `GEO-1B_DOMAIN_ADAPTER_PLAN.md` | EMERGENCY cannot be rendered from a real source in Wave 3B |
| `featureId` embeds `sourceRecordId` | `src/shared/spatial/contracts/featureIds.js` (`spatial:<domain>:<type>:<authority>:<recordId>`) | Exposing `featureId` exposes `sourceRecordId`. Knowing a record ID lets a caller compute a `featureId`. |
| Selection store blocks only `NOT_PUBLISHED` | `src/system/spatial/selectionStore.js` (`allowNotPublishedSelection`) | Viewer-scoped eligibility must be enforced before features reach the store |
| Layers declare no freshness or stale policy | `src/shared/spatial/registries/defaultLayers.js`, `validateSpatialLayer` | No stale rule exists to inherit. Undeclared policy must not invent one. |
| All default layers have `timeAwareCapability: false` | `defaultLayers.js` | Temporal visuals must be gated on the layer capability |
| "Soon" thresholds are domain-specific and inconsistent | assignments `due_soon` = 3 days (`apps/shs-api/src/domain/assignments/model/assignment.ts`), `DUE_SOON_DAYS = 3` (`UpcomingAssignmentsCard.jsx`), Hub "Due Soon" = 7 days (`hubTourSteps.js`); no event "soon" threshold exists | No generic EVENT_SOON threshold is supported by evidence |
| Validation returns free-form strings | `src/shared/spatial/contracts/validation.js`, `CoordinateSpaceRegistry.get` | Structured codes need an additive Wave 1 change |
| Registries reject duplicates | `SpatialLayerRegistry.register` throws on duplicate `layerId` | No-silent-override is the existing convention |
| Operational severity vocabulary | `apps/shs-api/src/observability/operational-telemetry.ts` (`INFO`, `WARNING`, `ERROR`, `CRITICAL`) | Reuse this vocabulary rather than invent one |
| API error convention | `{ code, message, status }` domain errors (e.g. `ShfCivicError`) | Stable machine code plus a human message |

## 1. Presentation State Dimensions

Wave 3A's multi-dimensional model is retained. One dimension is added.

| Dimension | Values | Authority | Notes |
|---|---|---|---|
| `domainState` | one of `NEXT`, `SCHEDULED`, `MISSION_ACTIVE`, `EMERGENCY`, `CLOSED`, `COMPLETED`, `UNAVAILABLE`, or `null` | owning domain | single domain-supplied value; Spatial never writes it |
| `temporalState` | `TEMPORAL_STATES` category or `null` | calculated from source time | GEO1-WAVE3A-DEC-003 |
| `selectionState` | `SELECTED` or `null` | Spatial selection context (Wave 2B) | presentation modifier only |
| `availabilityState` | `AVAILABLE` or `UNAVAILABLE` | Spatial from layer lifecycle and stale policy, or domain-supplied | no longer overloaded with freshness |
| `freshnessState` | `CURRENT`, `STALE`, `UNKNOWN` | source-supplied, or calculated from a layer-declared maximum age | **new**, see §6 |
| `verificationState` | `VERIFICATION_STATES` | verification authority | passed through verbatim |
| `publicationState` | `PUBLICATION_ELIGIBILITY_LEVELS` | publication authority | passed through verbatim; Spatial never upgrades it |
| `highlightState` | `null` or `{ sources: [...] }` | transient Spatial presentation | sources: `SEARCH`, `HOVER`, `FOCUS`, `EVIDENCE`, `ROUTE`, `ALERT`, `SYNC_PANEL`, `SELECTION`; never persisted |
| `resolvedVisualState` | one `SPATIAL_STATES` value | derived | render output only; never written back to any dimension |

Justification for `freshnessState` (GEO1-WAVE3B-DEC-005): the Wave 3A harness overloaded staleness into `availabilityState`. That loses information, because a stale feature under a mark-stale policy is still available. GEO-1A Temporal Projection Contract rule 4 says stale data is marked stale *or* unavailable according to layer policy, which makes these two separate facts.

A domain may not supply `NORMAL`, `SELECTED`, `RESTRICTED`, `EVENT_SOON`, or `EVENT_LIVE` as `domainState`. Selection and the normal state belong to Spatial, restriction to authorization and publication, and event timing to the temporal dimension. An out-of-vocabulary or forbidden `domainState` produces `INVALID_DOMAIN_STATE`. (An event domain may supply an explicit soon flag; see §5.)

## 2. EMERGENCY Authority (Open Condition 1)

Decision GEO1-WAVE3B-DEC-001. **EMERGENCY is a domain-supplied fact, never a visual inference.**

| Question | Decision |
|---|---|
| Who may supply EMERGENCY? | Only a source authority registered as a confirmed emergency authority for the layer. The registration is explicit and allowlisted, and must be backed by the GEO-4/GEO-8 engine evidence required by `GEO-1A_ENGINE_CLIENT_BOUNDARY.md`. **No such authority exists in the repository today, so the production allowlist ships empty.** |
| May Spatial ever infer EMERGENCY? | No. It is never inferred from titles, layer names, `ALERT` highlight sources, capability metadata such as `emergencyCapabilities`, temporal proximity, or any other visual context. |
| Does EMERGENCY outrank presentation states? | Yes. For an eligible viewer it outranks domain lifecycle states, temporal visuals, `SELECTED`, and `NORMAL` in `resolvedVisualState`. |
| Does EMERGENCY outrank publication or availability restrictions? | No. Visibility is decided first. `RESTRICTED`, `NOT_PUBLISHED`, and `UNAVAILABLE` control what may be rendered. Spatial never broadcasts an emergency the publication authority has not made visible to the viewer. If an emergency must reach a wider audience, the owning authority publishes it at that level. |
| EMERGENCY + SELECTED | Both are preserved. `domainState = EMERGENCY` and `selectionState = SELECTED`, and the result resolves to `EMERGENCY` with the selected modifier (outline, `aria-selected`). |
| EMERGENCY + RESTRICTED | Internally both are preserved. For a viewer who is not eligible, the client receives the masked restricted form (§3) with no `domainState`, so the emergency is not disclosed. |
| Unverified or unconfirmed source claims EMERGENCY | The claim is retained internally in `domainState` for audit, with diagnostic `EMERGENCY_AUTHORITY_NOT_CONFIRMED` (operator-only) when the authority is not allowlisted. It is not rendered as EMERGENCY. `resolvedVisualState` is resolved as if no domain state was supplied. If the authority is allowlisted but `verificationState` is not `VERIFIED`, the claim is not rendered on public surfaces (GEO-1A State Projection Contract: "required for public use"). Operator surfaces may render it as EMERGENCY with state text "Unverified emergency report". |
| Stale emergency | The layer stale policy applies (§6). In every case a stale emergency never renders as a current emergency: it is marked stale, suppressed, or unavailable. Spatial does not upgrade the policy for emergencies. |

Resolved conflict example (`domainState = EMERGENCY`, `selectionState = SELECTED`, `publicationState = RESTRICTED`, `availabilityState = AVAILABLE`), with a confirmed and verified authority:

| Layer | Stored / returned |
|---|---|
| InternalProjectionResult | all four dimensions stored verbatim; `resolvedVisualState = RESTRICTED`; `freshnessState` as supplied |
| Client, viewer not eligible, layer mask mode `HIDE` (default) | nothing: the feature is omitted |
| Client, viewer not eligible, layer mask mode `NOTICE` | `{ resultRef, status: RESTRICTED, layerId, resolvedVisualState: RESTRICTED, accessibility: { label: "Restricted item", stateText: "Restricted" } }`. No `domainState`, selection, `featureId`, title, or geometry. |
| Client, viewer eligible under supplied authorization | `status: PROJECTED`, `resolvedVisualState = EMERGENCY`, `selectionState = SELECTED`, full client-eligible feature |

`RESTRICTED` is relative to the viewer. It is decided from the publication level and viewer context supplied by the identity system. Spatial compares supplied facts; it does not grant access.

Wave 3B consequence: production tests exercise EMERGENCY through a test-only allowlisted fixture authority. Production configuration registers no emergency authority. Rendering EMERGENCY from a real source stays BLOCKED until an emergency engine is confirmed.

Deferred: a domain that needs EMERGENCY concurrently with another lifecycle state (for example `MISSION_ACTIVE`) would need a separate emergency dimension. No such source exists. Revisit when an emergency engine is confirmed.

## 3. Non-Projected Feature Masking (Open Condition 2)

Decision GEO1-WAVE3B-DEC-002. There are two result layers.

`InternalProjectionResult` is trusted and server-side or engine-internal. It is never serialized to a client as is:

```text
status
feature            full SpatialFeature, when adapter produced one
dimensions         all presentation dimensions
diagnostics        full structured diagnostics (§7), including operator-only
viewerContext      the supplied authorization/eligibility facts used
maskMode           HIDE | NOTICE | GENERALIZED (from layer/source policy)
```

`ClientProjectionResult` is produced only by the redaction step from an internal result and a viewer context:

```text
status
resultRef          opaque, per-response, not derived from featureId or sourceRecordId
featureId          only when status ∈ {PROJECTED, STALE, UNAVAILABLE}
layerId
presentation       client-eligible dimensions + resolvedVisualState
feature            client-eligible fields only (see table)
accessibility      label, description, stateText, selected, keyboard metadata
diagnostics        only diagnostics with safeForClient = true, reduced to { code, message }
```

Per-status client contract:

| Status | Client receives | Full SpatialFeature | title / label / geometry | featureId | sourceRecordId | provenance | client diagnostics |
|---|---|---|---|---|---|---|---|
| `PROJECTED` | feature | yes, client-eligible fields | yes | yes | yes (embedded in featureId; record is eligible) | client subset | none |
| `STALE` | feature + stale marker | yes, client-eligible fields | yes | yes | yes | client subset incl. freshness | `STALE_SOURCE` |
| `UNAVAILABLE` | placeholder | no | label + geometry only (viewer already eligible) | yes | yes | client subset | `STALE_SOURCE` or none |
| `RESTRICTED` | nothing (`HIDE`, default) or notice (`NOTICE`) or source-generalized geometry (`GENERALIZED`) | no | generic label only; geometry only if the source supplied a generalized geometry | no | no | no | `RESTRICTED` (generic) |
| `SUPPRESSED` | nothing, omitted | no | no | no | no | no | none |
| `INVALID` | nothing, omitted | no | no | no | no | no | none; operator-only via internal result |

Rules:

1. Eligibility is evaluated before any other stage exposes data (§8). No client field for a non-eligible record is computed from the source payload.
2. Spatial never generalizes geometry itself. Rounding or offsetting coordinates would create geography. `GENERALIZED` mask mode requires a generalized geometry supplied by the source or publication authority.
3. Client provenance subset: `sourceAuthority`, `verificationState`, `publicationState`, `updatedAt`, `freshness`. `evidenceReference`, `coordinateProvenance`, `projectionAdapter`, `projectionVersion`, and `sourceReference` are internal or operator-only unless the evidence authority marks the evidence reference as eligible at the viewer's level.
4. `ORGANIZATION`, `OPERATOR`, and `ADMIN` features are handled exactly like `RESTRICTED` for viewers who do not satisfy the supplied authorization. Spatial compares; the identity system decides.
5. **No existence oracle.** Every lookup by identifier (selection, deep link, `getFeature`, synchronized panel) resolves through the same eligibility gate with the viewer context. An unknown `featureId` and a known but non-eligible `featureId` return an identical client response carrying the single client-safe code `FEATURE_NOT_AVAILABLE`. Knowing or computing a `featureId` grants nothing.
6. The Wave 2B selection store must be seeded only with client-visible features (`PROJECTED`, `STALE`, `UNAVAILABLE` for an eligible viewer). This closes the gap where the store checks only `NOT_PUBLISHED`. It is enforced in the Wave 3B pipeline, not by changing Wave 2B semantics.
7. Suppressed and invalid results are omitted without placeholders or counts, so the client cannot infer that hidden records exist.

The Wave 3A fixture, which returns the full `feature` alongside `SUPPRESSED` and `RESTRICTED`, models the internal result only. It must not be copied into the client layer.

## 4. Adapter Collision (Open Condition 3)

Decision GEO1-WAVE3B-DEC-003. `ADAPTER_COLLISION` joins the canonical vocabulary.

| Aspect | Decision |
|---|---|
| Trigger | `register(adapter)` when an adapter is already registered for the same `(domain, featureType)` key. Re-registering the identical adapter object is also a collision. |
| Fatal? | Fatal for that registration: severity `ERROR`, `blocking: true`. It does not crash the registry. |
| Registration | Rejected atomically. The existing adapter stays and the registry is unchanged. |
| Replacement | Not supported. No silent override, no last-write-wins. Any future replacement requires an explicit, versioned replacement policy decision, which is not in Wave 3B. |
| Versioning | `projectionVersion` (GEO-1B Provenance Model Plan) is metadata on the adapter. It does not create a separate registry key, so two versions of one adapter still collide. |
| Public visibility | `safeForClient: false`. This is registry configuration, not viewer data. |
| Logging | The registry returns the structured diagnostic `{ ok: false, diagnostics: [...] }`, consistent with existing registry `get()` result objects. It may also emit through an injected logger using operational telemetry severity. No persistence. |

The key stays `(domain, featureType)` as in Wave 3A. An adapter declares its supported coordinate spaces through `getSupportedCoordinateSpaces()`. It does not register separately per coordinate space.

## 5. EVENT_SOON Threshold (Open Condition 5)

Decision GEO1-WAVE3B-DEC-004. **Options A and B are allowed. D is the default. C is rejected.**

Evidence: the repository has no event "soon" threshold. Existing "soon" semantics are domain-specific and disagree (assignments 3 days, Hub pipeline 7 days). A Spatial-owned global number (option C) would invent event semantics.

- **A. Domain-supplied:** an event authority may supply an explicit soon flag on the source record. The adapter maps it to `temporalState = soon`. It is not placed in `domainState`.
- **B. Domain-configured threshold:** Spatial may calculate `soon` only when all of these hold:

| Input | Requirement |
|---|---|
| `effectiveStart` | valid timestamp with explicit offset or `Z`, or a local timestamp plus a declared `timezone` |
| `currentTime` | injected clock; never read implicitly |
| `timezone` | required when `effectiveStart` has no offset; used for display labels; calculation runs on absolute instants |
| `soonThreshold` | ISO 8601 duration supplied on the record or by layer configuration, with a named `soonThresholdAuthority` that is the event authority for the layer |
| `sourceAuthority` | an event authority for a layer with `timeAwareCapability: true` |

Window: `effectiveStart − soonThreshold ≤ currentTime < effectiveStart` gives `soon`. `currentTime ≥ effectiveStart` falls through to `live` (end supplied and not passed), `ended`, or `null`. The lower boundary is inclusive and the upper boundary exclusive.

- **D. Default:** with no supplied flag and no configured threshold, EVENT_SOON is non-calculable. A future event resolves to `upcoming` only. When the layer is time-aware, diagnostic `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` (INFO, operator-only) is recorded.

Wave 3B ships with no configured threshold, so EVENT_SOON is exercised only through fixture configuration in tests.

Refinement of Wave 3A: temporal visual states (`EVENT_SOON`, `EVENT_LIVE`) are resolved only on layers with `timeAwareCapability: true`. The `temporalState` category may still be recorded on any layer. The frozen Wave 3A harness computes on a non-time-aware fixture layer. It is not changed; the production tests enforce the gate.

## 6. Stale Handling by Layer Policy (Open Condition 6)

Decision GEO1-WAVE3B-DEC-005.

Existing layer conventions: layers declare `visibilityPolicy`, `publicPrivateEligibility`, `timeAwareCapability`, and uppercase `lifecycleStatus` enums, and nothing about freshness. Wave 3B adds an optional layer field `stalePolicy` and an optional `maxSourceAge`.

Candidate policies reviewed:

| Candidate | Outcome |
|---|---|
| `MARK_STALE` (render with stale marker) | **accepted** |
| `SUPPRESS` | **accepted** |
| `UNAVAILABLE` | **accepted** |
| `REQUIRE_REFRESH` | rejected: implies Spatial triggers a domain fetch or refresh, which is runtime and persistence behavior outside Spatial |
| `DOMAIN_DECIDES` | rejected: the domain already expresses this through `publicationState`, `domainState`, or by not sending the record; a Spatial policy value adds nothing |

Freshness:

1. **Supplied freshness wins.** The source supplies `freshness` (`current` or `stale`), mapped to `freshnessState` `CURRENT` or `STALE`.
2. **Calculated freshness** is allowed only when the layer declares `maxSourceAge` (ISO 8601 duration) together with `freshnessAuthority`. `STALE` when `currentTime − sourceTimestamp > maxSourceAge`, using the injected clock.
3. **Otherwise `UNKNOWN`.** No default age exists. `UNKNOWN` is neither stale nor current. It has no visual marker, and the provenance or inspection text reads "Freshness not reported".

Policy application (when `freshnessState = STALE`):

| `stalePolicy` | Result status | Geometry renderable | Inspectable | Selection |
|---|---|---|---|---|
| `MARK_STALE` | `STALE` | yes, with static stale marker | yes | preserved |
| `SUPPRESS` | `SUPPRESSED` (`STALE_SOURCE`) | no | no | removed from client set; Wave 2B store invalidates the selection on feature update |
| `UNAVAILABLE` | `UNAVAILABLE` (`STALE_SOURCE`) | yes, disabled marker | label and provenance only | preserved as context; actions disabled |
| undeclared | treated as `MARK_STALE` | yes, with marker | yes | preserved |

Undeclared policy defaults to `MARK_STALE` because that only discloses freshness the source already supplied (GEO-1A Provenance and Verification Contract: "Spatial displays ... freshness metadata supplied by authoritative systems"). It hides nothing and invents nothing.

Interactions:

- **Stale + RESTRICTED:** restriction is evaluated first. Masked clients receive no freshness information.
- **Stale + EMERGENCY:** policy applies unchanged. A stale emergency never renders as current (§2).
- **Accessibility text:** `MARK_STALE` gives "Information may be out of date (last updated <sourceTimestamp>)". `UNAVAILABLE` gives "Unavailable: information is out of date". `UNKNOWN` gives "Freshness not reported" in inspection only.

## 7. Structured Diagnostics (Open Condition 7)

Decision GEO1-WAVE3B-DEC-006.

Schema, following the repository `{ code, message }` error convention and the operational telemetry severity vocabulary:

```text
code              stable machine code from the catalog below
severity          INFO | WARNING | ERROR | CRITICAL   (operational-telemetry.ts vocabulary)
stage             REGISTRY | ADAPTER | VALIDATION | LAYER | ELIGIBILITY | FRESHNESS | STATE_RESOLUTION
blocking          boolean: whether projection is blocked
resultStatus      projection status this diagnostic produces
safeForClient     boolean
message           static text per code; never interpolates source payload
featureId         optional, internal only
layerId           optional
coordinateSpaceId optional, internal only
sourceAuthority   optional, internal only
details           optional allowlisted keys (e.g. field name, expected family); never raw source values
```

`CRITICAL` is not assigned to any Wave 3B code. It is reserved for future integrity violations that should page an operator.

Client reduction: only diagnostics with `safeForClient: true` are sent, reduced to `{ code, message }`.

Production rules:

1. Diagnostics are created with their code at the point of detection. Classifying human-readable messages (`error.includes("layer")`) is forbidden in production.
2. Wave 1 validators and registries currently return strings. Wave 3B adds a parallel structured `issues` array (`{ code, field }`) to their results **additively**. Existing `errors` strings and all Wave 1 and Wave 2 behavior and tests stay unchanged (preservation before replacement).
3. No source payload (titles, descriptions, geometry, private field values) appears in `message` or `details`.

### Canonical Diagnostic Catalog

| Code | Stage | Severity | Client-safe | Blocks projection | Result status |
|---|---|---|---|---|---|
| `ADAPTER_NOT_FOUND` | REGISTRY | ERROR | no | yes | `INVALID` |
| `ADAPTER_COLLISION` | REGISTRY | ERROR | no | yes (the registration) | n/a; registration rejected |
| `INVALID_SOURCE_AUTHORITY` | ADAPTER | ERROR | no | yes | `INVALID` |
| `INVALID_FEATURE` | VALIDATION | ERROR | no | yes | `INVALID` |
| `INVALID_PROVENANCE` | VALIDATION | ERROR | no | yes | `INVALID` |
| `UNKNOWN_COORDINATE_SPACE` | VALIDATION | ERROR | no | yes | `INVALID` |
| `COORDINATE_FAMILY_MISMATCH` | VALIDATION | ERROR | no | yes | `INVALID` |
| `INVALID_LAYER` | LAYER | ERROR | no | yes | `INVALID` |
| `INVALID_DOMAIN_STATE` | VALIDATION | ERROR | no | yes | `INVALID` |
| `INVALID_TEMPORAL_SOURCE` | VALIDATION | WARNING | no | no; temporal dimension left `null` | unchanged |
| `NOT_PUBLISHED` | ELIGIBILITY | INFO | no | yes | `SUPPRESSED` |
| `RESTRICTED` | ELIGIBILITY | INFO | yes (generic message only) | yes, masked | `RESTRICTED` |
| `FEATURE_NOT_AVAILABLE` | ELIGIBILITY | INFO | yes | yes | client-facing lookup response only |
| `STALE_SOURCE` | FRESHNESS | WARNING | yes | per stale policy | `STALE`, `SUPPRESSED`, or `UNAVAILABLE` |
| `EMERGENCY_AUTHORITY_NOT_CONFIRMED` | STATE_RESOLUTION | WARNING | no | no; EMERGENCY not rendered | unchanged |
| `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` | STATE_RESOLUTION | INFO | no | no | unchanged |

The 12 Wave 3A codes plus `ADAPTER_COLLISION` are required. Four codes are added with justification:

- `INVALID_DOMAIN_STATE` stops a domain supplying Spatial-owned states (§1).
- `FEATURE_NOT_AVAILABLE` removes the existence oracle (§3 rule 5).
- `EMERGENCY_AUTHORITY_NOT_CONFIRMED` makes a rejected emergency claim auditable (§2).
- `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` makes the non-calculable default visible to operators (§5).

When several diagnostics apply, all are recorded internally. The result status is chosen by stage order (§8).

## 8. Presentation Resolution Order (Part 4)

Decision GEO1-WAVE3B-DEC-007. **Render priority is not authority priority.** Each dimension keeps its own authority. The resolution order decides only which stage may stop exposure and which value `resolvedVisualState` takes. No later stage overwrites an earlier dimension, and `resolvedVisualState` is never written back.

Algorithm (stages run in order; stages 1–3 may terminate client exposure):

1. **Data eligibility:** adapter lookup, source authority, SpatialFeature validation (coordinate space, family, layer, provenance), and `domainState` vocabulary check, including EMERGENCY authority allowlist. Blocking failure → `INVALID`, internal only.
2. **Visibility / publication:** `NOT_PUBLISHED` → `SUPPRESSED`. Viewer does not satisfy the supplied publication level or authorization → `RESTRICTED` in the layer's mask mode. Masked results stop here and carry no further dimensions to the client.
3. **Availability / freshness:** layer lifecycle `DISCONNECTED`, `UNMOUNTED`, or `ARCHIVED` → `UNAVAILABLE`. Compute `freshnessState` (§6) and apply `stalePolicy`.
4. **Domain facts:** record `domainState` verbatim, dropping only an unconfirmed EMERGENCY from rendering (§2).
5. **Temporal presentation:** record the `temporalState` category. Derive a temporal visual (`EVENT_LIVE`, `EVENT_SOON`) only on time-aware layers.
6. **Selection:** `selectionState` from the Wave 2B store, for client-visible features only.
7. **Highlight:** `highlightState` from transient sources. It never affects stages 1–6.
8. **Resolved visual treatment:** the first applicable value in this list: `RESTRICTED` › `UNAVAILABLE` › confirmed `EMERGENCY` › domain lifecycle (`CLOSED`, `COMPLETED`, `MISSION_ACTIVE`, `SCHEDULED`, `NEXT`, or domain `UNAVAILABLE`) › temporal visual (`EVENT_LIVE`, `EVENT_SOON`) › `SELECTED` › `NORMAL`. Modifiers are layered on top without replacing the state: selected outline and `aria-selected`, highlight, stale marker, verification badge.

`domainState` is one value from one owning domain, so domain lifecycle states never compete with each other.

Example: `RESTRICTED` controls what can be rendered, and `EMERGENCY` remains stored as the domain fact in the internal result (§2 table).

## 9. State Coverage Matrix (Open Condition 4)

"Tested" refers to the frozen Wave 3A fixture harness. Fixture coverage does not count as production coverage, so every state gets a Wave 3B production test (see test plan).

| State | Authority class | Source fields | Spatial may calculate | Wave 3A tested | Wave 3B tests | Key conflicts | Accessibility representation |
|---|---|---|---|---|---|---|---|
| NORMAL | SPATIAL_CALCULATED | none | yes (default) | yes (implicit) | S01 | overridden by any state | label; stateText "Normal" |
| SELECTED | SPATIAL_CALCULATED | Wave 2B selection | yes | yes | S02 | modifier over every state; masked features are not selectable | `aria-selected`; static outline |
| NEXT | DOMAIN_SUPPLIED | `domainState` from route/workflow authority | no (route-derived NEXT deferred to route/path wave) | **no** | S03 | + SELECTED | numbered/static marker; "Next step" |
| SCHEDULED | DOMAIN_SUPPLIED (WAVE3A-DEC-003) | `domainState`; dates optional | no | yes | S04 | future start alone ≠ SCHEDULED | date label or "Date not provided" |
| EVENT_SOON | DOMAIN_SUPPLIED flag or TEMPORAL_CALCULATED with configured threshold | `effectiveStart`, `soonThreshold`, `soonThresholdAuthority`, `timezone` | only with configured threshold (§5) | **no** | S05, T01–T08 | domain lifecycle outranks; non-time-aware layer never shows | static badge "Starting soon" |
| EVENT_LIVE | TEMPORAL_CALCULATED from source time | `effectiveStart`, `effectiveEnd` | yes, time-aware layers only | yes | S06 | CLOSED/COMPLETED outrank | static "Live now" label |
| MISSION_ACTIVE | DOMAIN_SUPPLIED | `domainState` from mission authority | no | yes | S07 | + SELECTED, + RESTRICTED | static mission status text |
| EMERGENCY | DOMAIN_SUPPLIED by allowlisted emergency authority | `domainState`, `verificationState` | no, **never** | **no** | S08, E01–E07 | outranks presentation, not visibility | high-contrast static alert; "Emergency" or "Unverified emergency report" (operator) |
| RESTRICTED | AUTHORIZATION/PUBLICATION_SUPPLIED | `publicEligibility`, viewer context | compared, not granted | yes | S09, M02–M04 | outranks all for rendering | "Restricted item" |
| CLOSED | DOMAIN_SUPPLIED | `domainState` | no | yes (vs future start) | S10 | outranks temporal | static "Closed" |
| COMPLETED | DOMAIN_SUPPLIED | `domainState` | no | **no** | S11 | outranks temporal | static "Completed" |
| UNAVAILABLE | SPATIAL_CALCULATED (lifecycle, stale policy) or DOMAIN_SUPPLIED | layer `lifecycleStatus`, `stalePolicy`, `domainState` | yes, from declared policy/lifecycle only | **no** (dimension set, never asserted) | S12, F03 | outranks domain and temporal | "Unavailable" + reason text |

States with no Wave 3A coverage that need new tests: NEXT, EVENT_SOON, EMERGENCY, COMPLETED, UNAVAILABLE. `highlightState` also had no Wave 3A coverage.

States not calculable by Spatial in Wave 3B: NEXT, SCHEDULED, MISSION_ACTIVE, EMERGENCY, CLOSED, COMPLETED (domain-supplied), RESTRICTED (compared, not calculated), and EVENT_SOON without a configured threshold.

## 10. Scope Guard

This addendum creates no production file. Wave 3B production work, when authorized, is limited to:

- a projection pipeline, adapter registry, presentation resolver, and client redaction step under `src/shared/spatial/` and `src/system/spatial/`
- additive `issues` codes in Wave 1 validators

It excludes map, Quick Map, Mapbox, SHF route, and `entityToCounty` changes, domain adapters for real sources, persistence, and coordinate transforms.
