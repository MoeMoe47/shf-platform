# GEO-1A Decision Log

## GEO1A-DEC-001

Decision ID: GEO1A-DEC-001
Question: Should Spatial own domain state?
Decision: No. Spatial owns projection and coordination behavior only.
Alternatives considered: Centralize domain state in Spatial; leave every map isolated.
Repository evidence: GEO-0 found SHF, Exchange/Capital, CivicSure, Metaverse, missions, and reporting authorities already exist separately.
Reason: Centralizing domain truth in Spatial would transfer authority and risk fabricating or overriding source systems.
Affected phases: GEO-1 through GEO-10.
Revisit condition: Only if a future governance decision explicitly creates a spatial source-of-truth service.

## GEO1A-DEC-002

Decision ID: GEO1A-DEC-002
Question: Should Quick Map and master-city coordinates be treated as one space?
Decision: No. They remain separate coordinate spaces.
Alternatives considered: Normalize all Metaverse coordinates into one shared 0-100 plane.
Repository evidence: GEO-0 confirmed Quick Map image dimensions differ from the master-city plate and no transform was found.
Reason: Shared numeric ranges do not prove shared geometry.
Affected phases: GEO-3, GEO-4, GEO-8, GEO-10.
Revisit condition: A calibrated transform registry with evidence and tests exists.

## GEO1A-DEC-003

Decision ID: GEO1A-DEC-003
Question: Should disconnected maps/globes be removed when Spatial Engine starts?
Decision: No. Preserve until GEO-10 acceptance evidence supports retirement.
Alternatives considered: Delete disconnected implementations during GEO-1 or GEO-4.
Repository evidence: GEO-0 identified disconnected or checkpoint-only map/globe candidates.
Reason: Preservation before replacement protects recovery evidence and parity analysis.
Affected phases: GEO-8, GEO-10.
Revisit condition: GEO-10 parity/migration gate accepts retirement.

## GEO1A-DEC-004

Decision ID: GEO1A-DEC-004
Question: Should route presence imply authority?
Decision: No. Routes and mounts prove presentation availability only.
Alternatives considered: Treat mounted components as authoritative.
Repository evidence: GEO-0 found mounted maps with hardcoded, suppressed, or unverified data.
Reason: Presentation cannot approve, verify, or publish domain data.
Affected phases: GEO-1 through GEO-7.
Revisit condition: None; this is a standing authority rule.

## GEO1-WAVE6C-DEC-001

Decision ID: GEO1-WAVE6C-DEC-001
Question: Is the Metaverse regional surface ready for a Spatial contract?
Decision: QUALIFIED_WITH_CONDITIONS for a future `regional-scene` contract only.
Alternatives considered: Implement a regional adapter immediately; block all
regional work; treat route context as geometry.
Repository evidence: `regionalSceneRegistry.js` defines 15 stable route IDs,
`MetaverseRegionalScenePage.jsx` is mounted for implemented slugs, and
`metaverse.regional-scene` is already registered. The existing tests confirm
only `oil-rig` and `open-sea` as implemented scenes; route context and mobility
registries remain separate presentation/reference systems.
Reason: The client and coordinate family are real, but the current registry is
not yet a confirmed geographic source authority and the full route is not
implemented as scene features. The first scope must be scene features only;
Spatial must not assume route, traffic, water, transit, or navigation authority.
Affected phases: Wave 6C and a future regional contract/runtime phase.
Revisit condition: A reviewed source/feature contract names the scene authority
and closes the implemented-scene coverage and client-boundary conditions.

## GEO1-WAVE6C-DEC-002

Decision ID: GEO1-WAVE6C-DEC-002
Question: What geometry may represent a Regional scene for Spatial?
Decision: Use an owner-authored scene coverage Polygon in a future dedicated
Regional Geometry Registry; do not use image bounds, route order, Quick Map,
master-city, or mobility traces.
Repository evidence: The existing SpatialFeature contract requires geometry;
the Regional registry supplies stable scene declarations and assets but no
scene-local geometry. Existing authoring tools provide reusable normalized
point-editing patterns, but their Traffic/River authorities are distinct.
Reason: A separate approved geometry registry preserves scene identity and
geometry ownership without transferring authority to Spatial or fabricating
coordinates from presentation assets.
Affected phases: Wave 6C-G and future Regional adapter implementation.
Revisit condition: An approved Regional coordinate standard, geometry payload,
or a repository-backed alternative spatial representation exists.

## GEO1-WAVE6C-DEC-003

Decision ID: GEO1-WAVE6C-DEC-003
Question: Are DAY/DUSK/NIGHT assets proven to share one geometry frame?
Decision: No. Alignment is `INSUFFICIENT_EVIDENCE` for Oil Rig and Open Sea.
Repository evidence: Oil Rig variants share `1536x1024` dimensions but have no
landmark registration metadata; Open Sea variants differ in dimensions
(`1584x993`, `1580x995`, `1578x997`).
Reason: Visual similarity is not sufficient to approve shared geometry.
Affected phases: Wave 6C-G authoring and later adapter eligibility.
Revisit condition: Measured alignment evidence or an approved variant-specific
geometry policy.

## GEO1-WAVE6C-DEC-004

Decision ID: GEO1-WAVE6C-DEC-004
Question: What coordinate semantics should govern regional scene geometry?
Decision: Freeze `metaverse.regional-scene` as METAVERSE scene-normalized
`0..100` coordinates, top-left origin, x-right/y-down, with `[x,y]` points.
Alternatives considered: persistent pixels, `0..1`, Quick Map reuse, and
scene-defined bounds.
Repository evidence: The Regional camera computes an aspect-locked world box
with centered cover rendering and shared camera transforms; existing Metaverse
authoring models use explicit normalized scene values and the coordinate
registry already separates Regional Scene from Quick Map, master-city, and
camera-world.
Reason: Normalized scene-local coordinates remain stable across responsive
viewport sizes without claiming equivalence to another Metaverse space.
Affected phases: Wave 6C-G authoring and future Regional adapter/client work.
Revisit condition: A reviewed asset-frame calibration or a materially different
canonical Regional rendering contract is approved.

## GEO1-WAVE1-DEC-001

Decision ID: GEO1-WAVE1-DEC-001
Question: What format should projected spatial feature IDs use in Wave 1?
Decision: Use `spatial:<domain>:<featureType>:<sourceAuthority>:<sourceRecordId>`.
Alternatives considered: Use domain record id only; use random UUIDs; omit source authority.
Repository evidence: GEO-1B identified feature IDs as a foundation blocker and required stable, deterministic, namespaced IDs that preserve source authority.
Reason: Including source authority avoids pretending that two domains with the same record id own the same feature, while still preserving deterministic projection identity.
Affected phases: GEO-1 Wave 1, GEO-3, GEO-6, GEO-10.
Revisit condition: Revisit if a later canonical source-id service exists.

## GEO1-WAVE1-DEC-002

Decision ID: GEO1-WAVE1-DEC-002
Question: Should Wave 1 register coordinate transforms?
Decision: No. Wave 1 registers coordinate spaces only and rejects cross-space transforms.
Alternatives considered: Add placeholder transforms; allow normalized METAVERSE spaces to interoperate.
Repository evidence: GEO-0 and GEO-1A found no confirmed Quick Map to master-city transform.
Reason: Shared normalized ranges are not evidence of shared geometry.
Affected phases: GEO-1 Wave 1, GEO-3, GEO-8.
Revisit condition: Revisit only when an explicit transform registry with evidence and tests exists.

## GEO1-WAVE2A-DEC-001

Decision ID: GEO1-WAVE2A-DEC-001
Question: Should the Wave 1 feature ID format be accepted for Wave 2 planning?
Decision: ACCEPT `spatial:<domain>:<featureType>:<sourceAuthority>:<sourceRecordId>`.
Alternatives considered: Add version to the ID; preserve source colons literally; use domain record IDs only; switch to random UUIDs.
Repository evidence: Wave 1 tests prove deterministic normalization, namespace safety, source-authority preservation, and collision separation by authority.
Reason: The format is stable, URL-safe after normalization, case-normalized, and preserves source authority without inventing domain identity. Source record IDs containing colons are normalized for ID safety while the original source record remains in `sourceRecordId` and provenance.
Affected phases: GEO-1 Wave 2A, GEO-1 Wave 2B, GEO-3, GEO-6.
Revisit condition: Revisit only if a canonical source-id service or source authority requires versioned projected identity.

## GEO1-WAVE2A-DEC-002

Decision ID: GEO1-WAVE2A-DEC-002
Question: What runtime shape should Wave 2B use for shared selection?
Decision: Design for a pure JavaScript in-memory single-selection store first.
Alternatives considered: React context first; existing SHS Event Bus; browser storage; network/distributed event infrastructure.
Repository evidence: The repo contains small no-dependency local event helpers and larger SHS event/command bus systems; GEO-1B recommends lightweight shared modules under `src/shared/spatial/`.
Reason: Single in-memory selection is deterministic, testable, framework-light, and avoids persistence, authorization, or domain mutation.
Affected phases: GEO-1 Wave 2B, GEO-7.
Revisit condition: Revisit when a real client needs React provider ergonomics, multi-selection, URL sync, or cross-tab sync.

## GEO1-WAVE2A-DEC-003

Decision ID: GEO1-WAVE2A-DEC-003
Question: Should spatial interactions replay by default?
Decision: No. Transient interactions are not replayed; canonical selection state is stored separately; domain actions are never replayed automatically.
Alternatives considered: Replay all events to late subscribers; replay only last event per type; persist event history.
Repository evidence: GEO-1A and GEO-1B separate selection state from interaction envelopes and prohibit domain authority transfer.
Reason: No replay is safer for UI interactions and avoids accidental domain action re-execution.
Affected phases: GEO-1 Wave 2B.
Revisit condition: Revisit only for development-only debugging hooks or an explicitly approved replay design.

## GEO1-WAVE2B-DEC-001

Decision ID: GEO1-WAVE2B-DEC-001
Question: Should publishing a `SELECT` interaction automatically mutate the selection store?
Decision: No. The Interaction Bus and Selection Store remain separate modules; consumers explicitly call `select(...)` after validating intent and feature projection.
Alternatives considered: Auto-wire bus `SELECT` events into the store; make the store publish bus events on every mutation.
Repository evidence: Wave 2A required loop prevention and a strict distinction between selection context and domain/action events.
Reason: Explicit coordination prevents hidden circular event loops and avoids surprise state mutation from transient events.
Affected phases: GEO-1 Wave 2B, Wave 3, future map integrations.
Revisit condition: Revisit only if a later adapter owns an explicit, tested coordination layer.

## GEO1-WAVE3A-DEC-001

Decision ID: GEO1-WAVE3A-DEC-001
Question: Should presentation state be a single collapsed value?
Decision: No. Model presentation state as dimensions: domain, temporal, selection, availability, verification, publication, highlight, and resolved visual treatment.
Alternatives considered: Store one final state string only.
Repository evidence: GEO-1A and Wave 2B preserve authority boundaries; selection must not overwrite mission, emergency, publication, or verification state.
Reason: Multi-dimensional state preserves source authority and prevents selection or highlight from destroying domain facts.
Affected phases: GEO-1 Wave 3B, GEO-7, GEO-10.
Revisit condition: Revisit only if a future renderer needs an additional derived display token while preserving source dimensions.

## GEO1-WAVE3A-DEC-002

Decision ID: GEO1-WAVE3A-DEC-002
Question: Should highlight be the same thing as selection?
Decision: No. Highlight is transient, non-authoritative presentation context separate from selection.
Alternatives considered: Treat highlight as selected state.
Repository evidence: Wave 2B defines selection as canonical local context; Wave 3A includes search, hover/focus, evidence, route, alert, synchronized panel, and selection as possible highlight sources.
Reason: Highlight can be temporary and multi-source, while selection is shared context.
Affected phases: GEO-1 Wave 3B and future client integrations.
Revisit condition: Revisit if a later accessibility review requires additional highlight categories.

## GEO1-WAVE3A-DEC-003

Decision ID: GEO1-WAVE3A-DEC-003
Question: Is `SCHEDULED` a domain-supplied lifecycle state, or may Spatial calculate it from source time?
Prior contract(s): GEO-1A State Projection Contract lists `SCHEDULED` as "supplied" by event/mission/domain authority. GEO-1B State Engine Plan says Spatial may not calculate `SCHEDULED` (must be supplied). GEO-1A Temporal Projection Contract and GEO-1B TemporalProjection type define temporal *categories* (`current`, `upcoming`, `soon`, `live`, `ended`, `scheduled_later`), which are separate from `SPATIAL_STATES`.
Conflict: The Wave 3A design draft classified `SCHEDULED` as `TEMPORAL_CALCULATED_FROM_DOMAIN_TIME`. The Wave 3A harness derived `SPATIAL_STATES.SCHEDULED` from `effectiveStart > now` and stored a visual state in the `temporalState` dimension.
Canonical decision: Wave 3A drifted, and GEO-1A stands unamended. `SCHEDULED` means the source authority has placed the record in a scheduled lifecycle status. It is a domain fact carried in `domainState`, not a function of the clock.
Authority class: DOMAIN_SUPPLIED (event, mission, or other owning domain authority).
Required source data: an explicit domain lifecycle status mapped to `SCHEDULED` by the projection adapter, plus `sourceAuthority`, `sourceRecordId`, and provenance. `effectiveStart`, `effectiveEnd`, `timezone`, and `sourceTimestamp` are optional context for the date label.
What Spatial may calculate: the temporal category (`TEMPORAL_STATES`, e.g. `upcoming`, `live`, `ended`) from valid source-authorized timestamps, stored in `temporalState`. Within its display priority, Spatial may resolve a domain-supplied `SCHEDULED` into `resolvedVisualState`.
What Spatial may not infer: `SCHEDULED` from a future `effectiveStart` alone; `SCHEDULED` for records the domain holds as draft, cancelled, closed, or any other non-scheduled status; missing start or end dates for a domain-supplied `SCHEDULED` record (its date label stays unknown).
Reason: Repository domains treat scheduled as a lifecycle status that is independent of time. `shf_civic_elections.status` is `DRAFT | SCHEDULED | OPEN | CLOSED | ... | CANCELLED` (migration 148), and live sessions are `draft | scheduled | open | in_progress | completed | cancelled | expired` (`apps/shs-api/src/domain/live-learning/model/live-session.ts`). A draft or cancelled record with a future start time is not scheduled, so deriving `SCHEDULED` from time would invent domain state and violate GEO1A-DEC-001.
Affected files/phases: `GEO-1_WAVE3A_PROJECTION_STATE_DESIGN.md`, `GEO-1_WAVE3A_TEST_MATRIX.md`, `GEO-1_WAVE3A_ACCEPTANCE_GATE.md`, `tests/spatialProjectionStateWave3.test.mjs`; GEO-1 Wave 3B resolver; GEO-7/GEO-10 temporal work. GEO-1A and GEO-1B contracts are unchanged.
Revisit condition: Only if a source domain explicitly delegates scheduled-status derivation to Spatial through a documented, tested contract.

## GEO1-WAVE3B-DEC-001

Decision ID: GEO1-WAVE3B-DEC-001
Question: Who may supply EMERGENCY, and how does it interact with selection, restriction, verification, and staleness?
Decision: EMERGENCY is a domain-supplied fact, never a visual inference. Only a source authority explicitly allowlisted as a confirmed emergency authority may supply it. It outranks presentation states (domain lifecycle, temporal, SELECTED, NORMAL) in `resolvedVisualState`, but it does not outrank visibility: RESTRICTED, NOT_PUBLISHED, and UNAVAILABLE decide what may be rendered. Claims from non-allowlisted authorities are retained internally with `EMERGENCY_AUTHORITY_NOT_CONFIRMED` and not rendered. Unverified claims are not rendered on public surfaces. A stale emergency follows layer stale policy and never renders as current. The production allowlist ships empty.
Alternatives considered: Let any domain supply EMERGENCY; let EMERGENCY override restriction for safety; infer EMERGENCY from alert context or capability metadata.
Repository evidence: GEO-1B State Engine Plan ("only when supplied by a confirmed emergency authority"); GEO-1A State Projection Contract (verification "required for public use"); GEO-1A Engine/Client Boundary and Gaps (Emergency/Dispatch is metadata-only); GEO-1B Domain Adapter Plan (Emergency BLOCKED); `regionalSceneRegistry.js` holds only `emergencyCapabilities` strings.
Reason: Spatial must not create emergency authority or broadcast what the publication authority has not made visible.
Affected phases: GEO-1 Wave 3B, GEO-4, GEO-8.
Revisit condition: When an emergency engine is confirmed with runtime evidence, or a domain needs EMERGENCY concurrent with another lifecycle state.

## GEO1-WAVE3B-DEC-002

Decision ID: GEO1-WAVE3B-DEC-002
Question: What may a client receive for non-projected results?
Decision: Separate `InternalProjectionResult` (trusted, full feature, all dimensions and diagnostics) from `ClientProjectionResult` (redacted per viewer). SUPPRESSED and INVALID are omitted from clients entirely. RESTRICTED defaults to HIDE; NOTICE returns only an allowlisted placeholder; GENERALIZED returns only source-supplied generalized geometry, and Spatial never generalizes coordinates. `featureId` is exposed only for PROJECTED, STALE, and UNAVAILABLE results. Masked results use an opaque, per-response `resultRef`. Every lookup by identifier passes the eligibility gate, and unknown and hidden identifiers return the identical `FEATURE_NOT_AVAILABLE` response. The selection store is seeded only with client-visible features.
Alternatives considered: Return the feature with a status flag (Wave 3A fixture pattern); expose `featureId` on masked placeholders.
Repository evidence: `featureIds.js` embeds `sourceRecordId` in `featureId`, so the ID is both a disclosure and an injection vector; `selectionStore.js` checks only NOT_PUBLISHED; GEO-1A Public/Private Boundary rules 6–7; GEO-1B defense-in-depth table.
Reason: Knowing or computing an identifier must not yield private geometry, payload, or proof of existence.
Affected phases: GEO-1 Wave 3B and all client integrations.
Revisit condition: Only with a publication-authority decision that a masked-ID scheme is required.

## GEO1-WAVE3B-DEC-003

Decision ID: GEO1-WAVE3B-DEC-003
Question: Is ADAPTER_COLLISION canonical, and may adapters be replaced?
Decision: Yes, `ADAPTER_COLLISION` joins the catalog (REGISTRY stage, ERROR, blocking the registration, not client-safe). A second registration for the same `(domain, featureType)`, including the identical adapter or a different `projectionVersion`, is rejected atomically and the registry is left unchanged. Replacement is not supported; any future replacement requires an explicit, versioned replacement policy decision.
Alternatives considered: Last-write-wins; version-keyed coexistence.
Repository evidence: `SpatialLayerRegistry.register` rejects duplicate ids; the Wave 3A harness already used the code; GEO-1B Provenance Model Plan treats `projectionVersion` as metadata.
Reason: A silent override would change which authority's projection logic is applied without a trace.
Affected phases: GEO-1 Wave 3B.
Revisit condition: When a replacement or version-migration policy is proposed.

## GEO1-WAVE3B-DEC-004

Decision ID: GEO1-WAVE3B-DEC-004
Question: What threshold defines EVENT_SOON?
Decision: No Spatial-owned threshold. EVENT_SOON is allowed only from (A) a domain-supplied soon flag or (B) a domain-configured ISO 8601 `soonThreshold` with a named `soonThresholdAuthority`, on a time-aware layer, with a valid absolute `effectiveStart` (offset, or local plus declared timezone) and an injected clock. The window `start − threshold ≤ now < start` is inclusive at the lower boundary and exclusive at the upper. The default (D) is non-calculable: a future event is `upcoming` only, with `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` recorded for operators.
Alternatives considered: Global fixed threshold (15/30/60 minutes); Spatial presentation-only threshold (option C).
Repository evidence: No event "soon" threshold exists. Existing "soon" semantics are domain-specific and inconsistent: assignments `due_soon` is 3 days (`assignment.ts`, `UpcomingAssignmentsCard.jsx`) and Hub pipeline "Due Soon" is 7 days (`hubTourSteps.js`).
Reason: Choosing a number would invent event semantics that belong to the event authority.
Affected phases: GEO-1 Wave 3B, GEO-7 temporal work.
Revisit condition: When an event authority publishes a threshold.

## GEO1-WAVE3B-DEC-005

Decision ID: GEO1-WAVE3B-DEC-005
Question: How is staleness decided and applied?
Decision: Add an explicit `freshnessState` dimension (CURRENT, STALE, UNKNOWN), separate from `availabilityState`. Freshness is source-supplied, or calculated only from a layer-declared `maxSourceAge` with a `freshnessAuthority`; otherwise it is UNKNOWN. Layers may declare `stalePolicy` of `MARK_STALE`, `SUPPRESS`, or `UNAVAILABLE`, and an undeclared policy behaves as `MARK_STALE`. Restriction is evaluated before freshness. `REQUIRE_REFRESH` and `DOMAIN_DECIDES` are rejected.
Alternatives considered: Overload staleness into availability (Wave 3A fixture); a global default maximum age; `REQUIRE_REFRESH` and `DOMAIN_DECIDES` policies.
Repository evidence: GEO-1A Temporal Projection Contract rule 4 ("marked stale or unavailable according to layer policy"); GEO-1A Spatial Integrity Policy; GEO-1A Provenance contract (Spatial displays supplied freshness); `defaultLayers.js` declares no freshness policy.
Reason: A stale-but-available feature is a distinct fact. Undeclared rules must not be invented, and disclosing supplied freshness hides nothing.
Affected phases: GEO-1 Wave 3B; the layer contract gains optional fields when implemented.
Revisit condition: When a layer needs a policy not expressible by the three values.

## GEO1-WAVE3B-DEC-006

Decision ID: GEO1-WAVE3B-DEC-006
Question: What structure do projection diagnostics use?
Decision: Diagnostics are objects `{ code, severity, stage, blocking, resultStatus, safeForClient, message, featureId?, layerId?, coordinateSpaceId?, sourceAuthority?, details? }`. Severity uses the operational telemetry vocabulary (INFO, WARNING, ERROR, CRITICAL; CRITICAL is unassigned in Wave 3B). Messages are static per code and details are allowlisted; no source payload appears in either. Clients receive only `safeForClient` diagnostics, reduced to `{ code, message }`. Production must never classify message text. Wave 1 validators gain additive structured `issues` codes, and their existing `errors` strings are preserved. The catalog is the 12 Wave 3A codes plus `ADAPTER_COLLISION`, `INVALID_DOMAIN_STATE`, `FEATURE_NOT_AVAILABLE`, `EMERGENCY_AUTHORITY_NOT_CONFIRMED`, and `EVENT_SOON_THRESHOLD_NOT_CONFIGURED`.
Alternatives considered: FATAL severity; string-only diagnostics; replacing Wave 1 error strings.
Repository evidence: `operational-telemetry.ts` `OperationalSeverity`; `{ code, message, status }` domain error convention; Wave 3A harness string mapping; `validation.js` string errors.
Reason: Stable codes are required for safe redaction and for tests; string parsing is brittle and leaks.
Affected phases: GEO-1 Wave 3B.
Revisit condition: When an operator paging integration requires CRITICAL codes.

## GEO1-WAVE3B-DEC-007

Decision ID: GEO1-WAVE3B-DEC-007
Question: In what order is presentation resolved, and how does render priority relate to authority?
Decision: Eight stages run in order: data eligibility, visibility/publication, availability/freshness, domain facts, temporal, selection, highlight, resolved visual. Stages 1–3 may end client exposure. The resolved visual is the first applicable value in: RESTRICTED › UNAVAILABLE › confirmed EMERGENCY › domain lifecycle › temporal visual › SELECTED › NORMAL. Selection, highlight, stale, and verification are modifiers. Render priority does not change authority: no stage overwrites another dimension, and `resolvedVisualState` is never written back.
Alternatives considered: A single priority list that doubles as authority ranking.
Repository evidence: GEO-1B State Engine Plan priority; GEO1-WAVE3A-DEC-001 (multi-dimensional state); GEO-1A Authority Charter non-transfer rule.
Reason: What may be shown and who owns a fact are different questions. Conflating them lets visibility erase domain truth, or lets domain state bypass visibility.
Affected phases: GEO-1 Wave 3B resolver and all clients.
Revisit condition: When a new dimension is added.

## GEO1-WAVE3B-DEC-008

Decision ID: GEO1-WAVE3B-DEC-008
Question: How does a projection adapter declare its identity, and how is it validated at registration?
Decision: Adapters self-declare `getDomain()`, `getSourceAuthority()`, `getSupportedFeatureTypes()`, `getSupportedCoordinateSpaces()`, and `getProjectionVersion()` alongside `canProject()` and `project()`. Registration requires a frozen adapter, calls the identity methods once, and snapshots their values. It rejects malformed identity with the new catalog code `INVALID_ADAPTER` (REGISTRY, ERROR, not client-safe, blocking). The collision key is `${domain}::${featureType}` for each supported type, and any collision rejects the whole registration. At projection, the record's domain and authority and the feature's domain, type, authority, and coordinate space must match the declared identity.
Alternatives considered: Caller-supplied domain at `register(adapter, domain, featureType)` (Wave 3A fixture); deriving domain from projected features.
Repository evidence: The Wave 3A fixture registry accepted domain from the caller, which let an adapter be filed under a domain it does not serve. The domain cannot be derived before projection. `createSpatialFeatureId` requires normalized segments.
Reason: Self-declared, snapshotted identity removes caller ambiguity and makes collision detection and authority checks deterministic.
Affected phases: GEO-1 Wave 3B.
Revisit condition: If adapters must serve multiple domains.

## GEO1-WAVE3B-DEC-009

Decision ID: GEO1-WAVE3B-DEC-009
Question: Where does projection version live, and who is its authority?
Decision: The adapter's `getProjectionVersion()` is the single authority. `feature.provenance.projectionVersion` must equal it; a mismatch is `INVALID_PROVENANCE` and is never silently overwritten. Results reference the version only through provenance. No separate result-level version field exists.
Alternatives considered: A version on each result; a pipeline-stamped version; independent adapter and provenance versions.
Repository evidence: GEO-1B Provenance Model Plan requires `projectionVersion` in provenance; Wave 1 `validateSpatialProvenance` requires it.
Reason: One authority with an enforced reference prevents conflicting version claims.
Affected phases: GEO-1 Wave 3B.
Revisit condition: When a versioned replacement policy (DEC-003) is proposed.

## GEO1-WAVE3B-DEC-010

Decision ID: GEO1-WAVE3B-DEC-010
Question: How do Wave 1 validators gain machine-readable results without breaking callers?
Decision: Every validator result adds `issues: [{ code, field, message, details? }]` as the structured twin of `errors`: same length and order, and `message` equals the legacy string. Codes come from the new `VALIDATION_ISSUE_CODES` vocabulary, and `details` keys are limited to `VALIDATION_ISSUE_DETAIL_KEYS`. Registry `get` and `assertNoImplicitTransform` failures gain `code`. Registration throws gain `error.code` and `error.issues`. Projection maps issue codes to diagnostic codes through a code-to-code table and never reads messages. Existing `errors` strings are unchanged.
Alternatives considered: Reuse projection diagnostic codes inside validators; replace `errors` with objects.
Repository evidence: `validation.js` returns strings; the Wave 3A harness parsed them; the Wave 1 and Wave 2 suites assert on those strings.
Reason: Validators serve more callers than projection, so they need their own vocabulary. The twin shape preserves compatibility and makes parity testable.
Affected phases: Wave 1 contracts (additive), GEO-1 Wave 3B.
Revisit condition: When all callers migrate to `issues` and a deprecation of `errors` is proposed.

## GEO1-WAVE3B-DEC-011

Decision ID: GEO1-WAVE3B-DEC-011
Question: Is `availabilityReason` a canonical field or a duplicate of diagnostics?
Decision: Canonical. It is populated if and only if `availabilityState = UNAVAILABLE`, with the first applicable reason in stage order: `LAYER_LIFECYCLE`, then `STALE_POLICY`, then `DOMAIN_SUPPLIED`. Status is the exposure outcome, `availabilityState` is the fact, `availabilityReason` is the authority behind the fact, and diagnostics are operator events. `LAYER_LIFECYCLE` and `DOMAIN_SUPPLIED` emit no diagnostic.
Alternatives considered: Derive the reason from diagnostics; omit the reason.
Repository evidence: Two of the three reasons have no diagnostic; S12 of the Wave 3B test plan requires the reason.
Reason: A reason field is the only non-redundant record of which authority made a feature unavailable.
Affected phases: GEO-1 Wave 3B.
Revisit condition: When a new availability source is added.

## GEO1-WAVE3B-DEC-012

Decision ID: GEO1-WAVE3B-DEC-012
Question: How is non-dominant presentation context represented?
Decision: `modifiers` is a closed vocabulary (`SELECTED`, `HIGHLIGHTED`, `STALE`, `UNVERIFIED`) in fixed order, unique, and derived only; caller input is ignored. Each modifier is present whenever its condition holds and has an accessibility equivalent (`selected`, `highlighted`, `freshnessText`, `verificationText`). Modifiers never carry domain values and are omitted from masked client results.
Alternatives considered: Boolean flags per condition; allowing domain values as modifiers; omitting a modifier that equals the dominant state.
Repository evidence: GEO1-WAVE3B-DEC-007 layers modifiers over `resolvedVisualState`; GEO-1A Layer Contract requires text equivalents.
Reason: A closed, derived, ordered list is testable and cannot smuggle domain facts or hidden state.
Affected phases: GEO-1 Wave 3B and all clients.
Revisit condition: When a new presentation-only condition needs representation.

## GEO1-WAVE3B-DEC-013

Decision ID: GEO1-WAVE3B-DEC-013
Question: What are the exact internal and client projection result shapes?
Decision: Freeze `InternalProjectionResult` and `ClientProjectionResult` as specified in `GEO-1_WAVE3B_RUNTIME_CONTRACT.md` §4. Internal results always evaluate all dimensions for valid features, including masked ones. Client results are built constructively from per-status allowlists: PROJECTED/STALE feature allowlist, UNAVAILABLE feature allowlist without title or description, a 5-key client provenance allowlist, and omission of SUPPRESSED, INVALID, and HIDE results. Identifier lookup returns `{ ok, result }` or `{ ok: false, diagnostics: [FEATURE_NOT_AVAILABLE] }`.
Alternatives considered: Deriving client results by deleting known private fields; a `NOT_AVAILABLE` result status.
Repository evidence: GEO1-WAVE3B-DEC-002; `featureId` embeds `sourceRecordId`.
Reason: Allowlisting cannot leak a field nobody remembered to delete.
Affected phases: GEO-1 Wave 3B and all clients.
Revisit condition: When a new client surface needs a different field set.

## GEO1-WAVE3B-DEC-014

Decision ID: GEO1-WAVE3B-DEC-014
Question: What exactly may a RESTRICTED NOTICE result contain?
Decision: Only `kind`, `status`, `resultRef`, `layerId`, `presentation: { resolvedVisualState: "RESTRICTED" }`, `accessibility: { label: "Restricted item", stateText: "Restricted" }`, and `diagnostics: [{ code: "RESTRICTED", message }]`. GENERALIZED mode may add `geometry` only from source-supplied `generalizedGeometry`. Apart from `resultRef`, every NOTICE result on a layer is identical. `layerId` is permitted because NOTICE is an explicit layer-owner opt-in; the default remains HIDE.
Alternatives considered: Removing known private fields from a feature copy; including `featureId` for client selection.
Repository evidence: GEO-1A Public/Private Boundary rule 6; GEO1-WAVE3B-DEC-002.
Reason: A fixed, record-independent notice cannot disclose record data.
Affected phases: GEO-1 Wave 3B and all clients.
Revisit condition: When a publication authority requires a per-record masked reference.

## GEO1-WAVE3B-DEC-015

Decision ID: GEO1-WAVE3B-DEC-015
Question: Which Wave 3B layer policy fields join the canonical layer contract, and when are they validated?
Decision: Amend `GEO-1A_LAYER_CONTRACT.md` with the optional fields `stalePolicy`, `maxSourceAge` + `freshnessAuthority`, `soonThreshold` + `soonThresholdAuthority`, and `maskMode`, with the types, defaults, and rules in `GEO-1_WAVE3B_RUNTIME_CONTRACT.md` §8. `validateSpatialLayer` validates them at registration (`LAYER_POLICY_INVALID`), so a malformed policy rejects the layer. This supersedes the red-test expectation that a malformed or authority-less `soonThreshold` registers and is diagnosed at projection. `EVENT_SOON_THRESHOLD_NOT_CONFIGURED` now means only "no threshold declared".
Alternatives considered: A single `policyAuthority`; runtime-only validation; keeping the fields fixture-only.
Repository evidence: `SpatialLayerRegistry.register` already rejects invalid layers; default layers declare none of the fields; GEO1-WAVE3B-DEC-004 and DEC-005.
Reason: Fail-fast registration keeps invalid policy out of runtime. Separate authorities follow the governing principle.
Affected phases: Wave 1 layer contract (additive), GEO-1 Wave 3B.
Revisit condition: When a layer needs a policy outside these fields.

## GEO1-WAVE3B-DEC-016

Decision ID: GEO1-WAVE3B-DEC-016
Question: How are the diagnostic catalog representation details frozen?
Decision: `PROJECTION_DIAGNOSTIC_DETAIL_KEYS` is exactly `expectedCoordinateFamily`, `field`, `issueCode`, `maskMode`, `receivedCoordinateFamily`, `stalePolicy`, and payload keys are permanently excluded. `STALE_SOURCE` catalog `blocking` is `"PER_STALE_POLICY"`, while emitted instances carry a boolean. The catalog holds 17 codes: 16 from DEC-006 plus `INVALID_ADAPTER` from DEC-008.
Alternatives considered: An open-ended details object; a boolean catalog `blocking` for `STALE_SOURCE`.
Repository evidence: GEO1-WAVE3B-DEC-006; red-test D01 and D05.
Reason: Frozen keys make "no payload in diagnostics" enforceable.
Affected phases: GEO-1 Wave 3B.
Revisit condition: When a new diagnostic needs a new non-payload detail key.

## GEO1-WAVE3B-DEC-017

Decision ID: GEO1-WAVE3B-DEC-017
Question: How can registry lookup failures gain `code` (DEC-010) without breaking the frozen Wave 1 baseline, which asserts their exact shape?
Decision: Registry failure results from `CoordinateSpaceRegistry.get`, `SpatialLayerRegistry.get`, and `assertNoImplicitTransform` keep their legacy enumerable shape `{ ok: false, error }`. `code` is attached as a non-enumerable, read-only own property. `result.code` works as DEC-010 requires, while strict deep equality, `JSON.stringify`, and object spread still see the legacy shape. Registration throws use ordinary `error.code` and `error.issues` properties, because no baseline test asserts their shape.
Alternatives considered: An enumerable `code` (fails `tests/spatialFoundationWave1.test.mjs` "unknown coordinate-space lookup fails safely", which strictly deep-equals `{ ok, error }`); editing that frozen Wave 1 test; dropping registry codes from DEC-010.
Repository evidence: `tests/spatialFoundationWave1.test.mjs:103`; `node:assert` strict deep equality compares only enumerable own properties.
Reason: This is the only option that honors both the frozen Wave 3B contract and the unmodified Wave 1 baseline. Consumers that copy or serialize a lookup result lose `code` and must read it before copying. In-process lookups are the only current callers.
Affected phases: Wave 1 registries (additive), GEO-1 Wave 3B runtime.
Revisit condition: If a consumer needs `code` after serialization, or when the Wave 1 lookup-shape test is next intentionally revised.

## GEO1-WAVE4B-DEC-018

Decision ID: GEO1-WAVE4B-DEC-018
Question: Where should the first Quick Map client boundary live?
Decision: A framework-neutral adapter will live under `src/system/spatial/clients/quickMap/` and will consume only sanitized `ClientProjectionResult[]` values. The existing Metaverse Quick Map renderer and registry remain separate during migration.
Alternatives considered: Put projection logic in `MetaverseMiniMap.jsx`; replace the existing registry; create a new top-level app.
Repository evidence: `src/components/metaverse/MetaverseMiniMap.jsx`; `src/system/metaverse/metaverseMiniMapRegistry.js`; GEO-1B repository placement plan.
Reason: The adapter coordinates safe presentation without transferring domain, publication, navigation, or coordinate authority.
Affected phases: GEO-1 Wave 4B and later Quick Map client phases.
Revisit condition: When a second client requires a shared adapter abstraction.

## GEO1-WAVE4B-DEC-019

Decision ID: GEO1-WAVE4B-DEC-019
Question: What is the Quick Map marker view model boundary?
Decision: Construct marker models from an explicit allowlist containing safe identity, bounded x/y, label, presentation state, modifiers, accessibility, and interaction intent. Raw records, internal results, private provenance, and domain actions never enter the renderer.
Alternatives considered: Pass ClientProjectionResult through unchanged; clone and delete private fields; reuse the existing registry entry shape as a SpatialFeature.
Repository evidence: Wave 3B client allowlist contract; `MetaverseMiniMap.jsx` marker fields; `featureId` source-record identity risk.
Reason: Constructive projection prevents accidental privacy and authority leakage.
Affected phases: GEO-1 Wave 4B-4D.
Revisit condition: When an accepted renderer capability requires another safe field.

## GEO1-WAVE4B-DEC-020

Decision ID: GEO1-WAVE4B-DEC-020
Question: How will existing registry markers coexist with future Spatial markers?
Decision: Use dual-source rendering with distinct namespaces. Existing registry markers remain client-owned `UNMAPPED`/`PROVISIONAL` presentation records; Spatial fixture or future projected markers retain explicit source identity. Matching labels or coordinates never deduplicate records.
Alternatives considered: Replace registry markers immediately; merge by label; merge by coordinate.
Repository evidence: 9 Quick Map districts are UNMAPPED; 6 infrastructure entries are PROVISIONAL and destination-less; preservation principle.
Reason: Preservation keeps uncertainty visible and prevents synthetic source mapping.
Affected phases: GEO-1 Wave 4B-4E.
Revisit condition: When an owner-reviewed source mapping proves identity equivalence.

## GEO1-WAVE4B-DEC-021

Decision ID: GEO1-WAVE4B-DEC-021
Question: What coordinate and navigation permissions does the Quick Map client have?
Decision: The client accepts only `METAVERSE` features in `metaverse.quick-map`, performs no transforms, and never navigates directly. Existing navigation remains owned by `MetaverseCityPage`; Selection Store and Interaction Bus wiring remain Wave 4C work.
Alternatives considered: Accept master-city coordinates; calibrate during client rendering; let marker activation call navigation directly.
Repository evidence: Quick Map coordinate registry; `MetaverseCityPage.jsx` protected-entry and fast-travel functions; Wave 4A preservation tests.
Reason: Presentation compatibility is distinct from coordinate calibration and domain/navigation authority.
Affected phases: GEO-1 Wave 4B-4D.
Revisit condition: When a registered transform and explicit navigation request contract are separately accepted.

## GEO1-WAVE4C-DEC-022

Decision ID: GEO1-WAVE4C-DEC-022
Question: How should Quick Map Spatial markers join the existing selection and interaction runtime without migrating legacy markers?
Decision: Add an optional framework-neutral Quick Map interaction controller that consumes sanitized Spatial marker models, reuses the existing Selection Store and Interaction Bus, and emits only SELECT, DESELECT, FOCUS, HIGHLIGHT, and request-only OPEN_RECORD. `MetaverseMiniMap` renders these markers as a separate source when supplied; legacy markers remain on their current path.
Alternatives considered: Route every marker through Spatial; add a second selection store; let marker activation navigate directly; wire the existing registry into Spatial without source mappings.
Repository evidence: `src/components/metaverse/MetaverseMiniMap.jsx`; `src/pages/metaverse/MetaverseCityPage.jsx`; `src/system/spatial/selectionStore.js`; `src/system/spatial/interactionBus.js`; Wave 4A preservation tests.
Reason: This preserves current navigation and uncertain registry authority while making the accepted Spatial client path testable and presentation-only.
Affected phases: GEO-1 Wave 4C and Wave 4D.
Revisit condition: When legitimate production source mappings and a separately accepted navigation/record-opening contract exist.

## GEO1-WAVE4D-DEC-023

Decision ID: GEO1-WAVE4D-DEC-023
Question: How should accessibility and non-map parity consume Spatial Quick Map data?
Decision: Use the same sanitized Quick Map marker models for visual markers and a semantic non-map list. Add native-button modal focus entry, Escape close, and focus return to the existing full-map flow. Keep legacy entries separate and do not create a second selection or projection source.
Alternatives considered: Duplicate projection logic for a list; expose raw projection results to accessibility clients; migrate legacy registry markers into Spatial; rely on hover-only semantics.
Repository evidence: `MetaverseMiniMap.jsx` native marker/control buttons; Wave 4B allowlisted marker model; existing legacy activity list; Wave 4C interaction controller.
Reason: Shared safe models keep state and privacy behavior aligned while native controls provide equivalent keyboard activation without moving authority.
Affected phases: GEO-1 Wave 4D-4E.
Revisit condition: When browser certification identifies a concrete focus or non-map parity gap, or when the accepted client model changes.

## GEO1-WAVE5C-DEC-024

Decision ID: GEO1-WAVE5C-DEC-024
Question: What is the first qualified production county geometry contract, and which authority owns it?
Decision: Freeze the first adapter contract around the matched U.S. Census Bureau 2010 Cartographic Boundary File, State-County, `1:20,000,000`, represented by `public/assets/maps/ohio-counties.geojson`. Use neutral domain `census-geography`, feature type `county`, source authority `us-census-bureau-2010-cartographic-boundary`, five-digit Ohio FIPS source record IDs, and the existing `real-world.county-geojson` coordinate space. IEP is a consuming client context and does not own Census geometry. The ODOT file remains a separate legacy dependency.
Alternatives considered: Treat IEP as the source domain; use ODOT as the canonical base geometry; merge both files; use county names or array order as identity.
Repository evidence: official Census match and use restrictions in `GEO-1_WAVE5C_IEP_SOURCE_QUALIFICATION.md`; existing coordinate registry; `createSpatialFeatureId`; ODOT comparison addendum.
Reason: Separate source authority, client context, and operational legacy data while preserving the existing map and the qualified Census scale/use restrictions.
Affected phases: GEO-1 Wave 5C contract and later adapter implementation.
Revisit condition: New authoritative source evidence, a change in the governed Census asset, or a separately approved ODOT operational geometry contract.

## GEO1-WAVE5D-DEC-025

Decision ID: GEO1-WAVE5D-DEC-025
Question: What must be true before the existing IEP county map can consume Census Spatial results?
Decision: Keep Census county geometry and IEP domain records as separate authorities. A future IEP client may consume safe `census-geography::county` results, but it may join domain data only through an explicit validated five-digit `countyFips`. Label matching, address inference, `entityToCounty`, and the Franklin fallback are prohibited. Until that identity exists and is regression-protected, IEP onboarding is `BLOCKED_BY_DOMAIN_IDENTITY`.
Alternatives considered: Join by county label; preserve the resolver fallback; treat IEP as owner of Census geometry; replace the current map immediately.
Repository evidence: `src/pages/iep-command-v2/IEPCommandCenterV2.jsx`; `src/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx`; `src/system/resolvers/entityToCounty.js`; GEO-1 Wave 5C Census adapter contract.
Reason: Explicit identity preserves separate authority, prevents fabricated county associations, and allows geometry onboarding without publishing or mutating IEP domain truth.
Affected phases: GEO-1 Wave 5D planning and later IEP client onboarding.
Revisit condition: IEP source records expose a validated county FIPS identity and the fallback dependency is removed or formally isolated from the Spatial path.

## GEO1-WAVE5D-ID-DEC-026

Decision ID: GEO1-WAVE5D-ID-DEC-026
Question: How should existing IEP county profiles gain identity without changing the current map path?
Decision: Retain the existing normalized county-name keys and display labels, and add an immutable-domain `countyFips` field to the 88 static profiles using exact matches against the qualified Census identity manifest. Use a neutral validator and exact-FIPS join helper for future records. Missing or unmatched identity remains unresolved; no Franklin fallback, fuzzy matching, address inference, or Spatial feature ID storage is permitted.
Alternatives considered: Replace profile keys with FIPS; infer FIPS continuously from labels; call `entityToCounty`; store generated Spatial feature IDs in IEP records.
Repository evidence: `src/pages/iep-command-v2/countyProfiles.js`; `src/shared/spatial/countyIdentity.js`; `public/assets/maps/ohio-counties.geojson`; Wave 5D identity tests.
Reason: Additive identity hardening preserves the current UI contract while establishing a safe domain-to-Census join boundary.
Affected phases: GEO-1 Wave 5D identity remediation and later IEP client onboarding.
Revisit condition: Dynamic IEP record sources expose explicit validated `countyFips`, or the qualified Census identity source changes.

## GEO1-WAVE5D-DYN-DEC-027

Decision ID: GEO1-WAVE5D-DYN-DEC-027
Question: How should dynamic IEP records without an authoritative county relationship behave?
Decision: Dynamic records carry `countyFips: string | null`. Non-null identity must be source-supplied, domain-validated, migrated from an exact qualified static reference, or propagated only from an explicitly county-owned derived parent. Missing or invalid identity remains null and is excluded from geographic joins. `entityToCounty`, labels, addresses, entity text, fuzzy matches, and defaults are prohibited.
Alternatives considered: Infer from student/entity text; default unresolved records to Franklin; reject all non-geographic records; propagate from any parent object.
Repository evidence: `src/shared/spatial/countyIdentity.js`; `src/pages/iep/IEPDashboardPage.jsx`; `src/apps/iep/iepRiskAdapter.js`; dynamic Wave 5D identity tests.
Reason: Preserve valid non-geographic domain data without fabricating county authority, while allowing explicitly county-owned derived presentation models to retain identity.
Affected phases: GEO-1 Wave 5D dynamic identity and later IEP client onboarding.
Revisit condition: A production IEP/API schema supplies authoritative county identity and publication semantics.

## GEO1-WAVE5D-API-DEC-028

Decision ID: GEO1-WAVE5D-API-DEC-028
Question: What production contract governs county identity before an IEP API exists?
Decision: Freeze an additive `countyFips: string | null` contract at the shared domain boundary. Non-null values must be validated Ohio FIPS from the qualified 88-county set; null means unresolved. IEP/domain producers own the relationship, Census owns geometry, and consumers join only by exact FIPS. No speculative API route, backend model, DTO, database migration, or frontend inference is introduced because no production IEP model was found.
Alternatives considered: Infer from county labels; create a speculative IEP table; let Spatial assign identity; reuse the Franklin fallback.
Repository evidence: `apps/shs-api/src/api/router.ts` and active domain modules contain no IEP county producer; `src/pages/iep/IEPDashboardPage.jsx`, `src/pages/iep-command-v2/countyProfiles.js`, and `src/pages/iep-command/IEPCommandCenter.jsx` are frontend-controlled/demo or derived paths; Wave 5D identity contract and tests.
Reason: Define the future producer obligation without fabricating persistence authority, while allowing the current client architecture to consume explicit or unresolved repository-controlled records safely.
Affected phases: GEO-1 Wave 5D API contract and later IEP client onboarding.
Revisit condition: A verified IEP domain/API authority exists with county identity, publication, authorization, and persistence semantics.

## GEO1-WAVE6A-DEC-030

Decision ID: GEO1-WAVE6A-DEC-030
Question: Which additional client should enter the next Spatial qualification phase?
Decision: Select ODOT operational county geography as the sole Wave 6B qualification candidate. Its official TIMS source, stable FIPS crosswalk, and distinct high-resolution operational use case provide stronger evidence than Exchange/Capital, SHF, regional presentation scenes, or disconnected globes. Implementation remains blocked until ODOT reuse terms, versioned snapshot governance, operational publication ownership, and a narrow client contract are confirmed. Census and ODOT remain separate authorities.
Evidence: `GEO-1_WAVE6A_ADDITIONAL_CLIENT_AUDIT.md`, `GEO-1_WAVE6_SOURCE_AUTHORITY_MATRIX_V2.md`, `GEO-1_WAVE6_NEXT_CLIENT_SELECTION.md`, and the Wave 5C ODOT comparison record.
Affected phases: GEO-1 Wave 6A selection and Wave 6B qualification.

## GEO1-WAVE5E-DEC-029

Decision ID: GEO1-WAVE5E-DEC-029
Question: What legacy IEP elements remain after the Spatial-default migration?
Decision: Accept the IEP county migration with the Spatial path as default. Retain the direct legacy preparation path only behind the explicit development `iepLegacyMap=1` rollback seam, retain `iepSpatialDualRun=1` as a development-only diagnostic, and fail closed on Spatial preparation errors rather than silently falling back. The qualified Census asset remains canonical source data; the ODOT asset remains an independent legacy dependency. No legacy element is retired while it remains required by rollback or parity evidence.
Evidence: `GEO-1_WAVE5E_IEP_MIGRATION_ACCEPTANCE.md`, `GEO-1_WAVE5E_LEGACY_DISPOSITION.md`, and `tests/ui/spatial-iep-wave5e-acceptance.spec.mjs`.
Affected phases: GEO-1 Wave 5E migration acceptance and later Wave 6 client onboarding.

## GEO1-WAVE6B-DEC-031

Decision ID: GEO1-WAVE6B-DEC-031
Question: Can ODOT TIMS county geography proceed to production adapter implementation?
Decision: Qualify ODOT TIMS County as a separate operational geography source
with conditions, but do not implement or register an adapter. The official
service and 88-county FIPS crosswalk are confirmed. A governed local snapshot
is the recommended future architecture. Redistribution/modification terms are
not complete, and no justified first consuming operational client is currently
identified, so implementation readiness remains `NOT_READY`. Census and ODOT
features remain distinct authorities.
Evidence: `GEO-1_WAVE6B_ODOT_RIGHTS_QUALIFICATION.md`,
`GEO-1_WAVE6B_ODOT_SNAPSHOT_GOVERNANCE.md`,
`GEO-1_WAVE6B_ODOT_SOURCE_CONTRACT.md`, and the temporary official-service
retrieval recorded in the Wave 6B governance document.
Reason: This preserves official-source identity and operational value without
overclaiming rights, creating a live network dependency, or inventing a client
need.
Affected phases: GEO-1 Wave 6B qualification and any later ODOT adapter/client
implementation.
Revisit condition: Written ODOT use terms, an approved snapshot process, and a
named regression-protected operational client are available.

## GEO1-WAVE6B-R-DEC-032

Decision ID: GEO1-WAVE6B-R-DEC-032
Question: Did ODOT rights, snapshot governance, and client discovery clear the adapter entry gate?
Decision: Close the ODOT source qualification as `QUALIFIED_WITH_CONDITIONS`,
freeze the no-live-fetch governed-snapshot architecture, and keep adapter
implementation `BLOCKED_BY_CLIENT`. Exact County-layer metadata confirms
public-information access and source identity, but does not provide complete
redistribution, modification, retained-snapshot, or commercial-use terms. No
current client has a complete ODOT-specific operational and regression
contract. Census and ODOT remain distinct authorities.
Evidence: `GEO-1_WAVE6B_ODOT_RIGHTS_MATRIX.md`,
`GEO-1_WAVE6B_ODOT_SNAPSHOT_CONTRACT.md`,
`GEO-1_WAVE6B_ODOT_FIRST_CLIENT_DECISION.md`, and
`GEO-1_WAVE6B_ODOT_GATE_CLOSURE.md`.
Reason: Do not create an adapter without both usable rights and a real client
need; preserve the qualified source for a later justified implementation.
Affected phases: GEO-1 Wave 6B-R and future ODOT adapter/client work.
Revisit condition: Written ODOT terms, an approved active snapshot, and a
named regression-protected operational client.

## GEO1-WAVE6C-A-DEC-033

Decision ID: GEO1-WAVE6C-A-DEC-033
Question: Can the Oil Rig regional scene enter geometry-authoring preparation?
Decision: Classify the production Oil Rig DAY/DUSK/NIGHT background family as
`ALIGNED_WITH_TOLERANCE` using eight distributed structural landmarks and a
pre-declared 1.0 scene-normalized-unit tolerance. Permit one shared
composition-family reference, but keep authored geometry under the separate
`silicon-heartland-metaverse-regional-geometry-registry` authority. The future
Polygon represents owner-approved scene coverage, not an image rectangle or
mobility geometry. Oil Rig is `READY_WITH_ALIGNMENT_CONDITION` for a future
DEV-only tracer; no geometry is authored and the Regional adapter remains
`BLOCKED_BY_COORDINATES`.
Evidence: `GEO-1_WAVE6C_OIL_RIG_ALIGNMENT_REPORT.md`,
`GEO-1_WAVE6C_REGIONAL_GEOMETRY_REGISTRY_CONTRACT.md`, and
`GEO-1_WAVE6C_REGIONAL_GEOMETRY_APPROVAL_CONTRACT.md`.
Affected phases: GEO-1 Wave 6C regional geometry authoring preparation.
Revisit condition: A future tracer must create a DRAFT, review it, validate it,
and obtain explicit approval before Spatial eligibility changes.
