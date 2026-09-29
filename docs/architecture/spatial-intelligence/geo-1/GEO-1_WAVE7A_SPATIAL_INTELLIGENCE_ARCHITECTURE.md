# GEO-1 Wave 7A Spatial Intelligence Architecture and Entry Gates

## Decision

`WAVE_7_ARCHITECTURE_READY_WITH_CONDITIONS`

Wave 7 may proceed to red-contract implementation only. Production reasoning,
new runtime intelligence, cross-space transforms, new source authority, and
client migrations remain out of scope until later Wave 7 gates pass.

## Objective

Wave 7 adds governed Spatial Intelligence on top of the Wave 6 production
projection foundation.

Canonical principle:

`Separate authorities, shared spatial coordination.`

Wave 7 focuses on:

- evidence linkage
- temporal state
- freshness
- same-space spatial relationships
- governed spatial reasoning

Spatial remains a projection and coordination system. It does not become the
authority for source records, Truth, Evidence, Metric Registry values,
publication, navigation, dispatch, service geography, eligibility, or domain
facts.

## Accepted Wave 6 Baseline

Wave 6 completed with conditions at commit
`95df167ef68723ae97d911298b2876564792796c`.

Qualified V1 clients:

- IEP Ohio County Map
- Metaverse Quick Map
- Metaverse Regional Scene - Oil Rig

Known coordinate spaces:

- `real-world.latlng`
- `real-world.county-geojson`
- `metaverse.quick-map`
- `metaverse.master-city`
- `metaverse.regional-scene`
- `metaverse.camera-world`

No implicit transform exists between any of these spaces.

## Canonical Wave 7 Capabilities

Wave 7 capabilities are:

- `SPATIAL_EVIDENCE_LINKAGE`
- `SPATIAL_TEMPORAL_CONTEXT`
- `SPATIAL_FRESHNESS_RESOLUTION`
- `SAME_SPACE_RELATIONSHIPS`
- `GOVERNED_SPATIAL_REASONING`
- `SPATIAL_INTELLIGENCE_RESULT_CONTRACT`
- `INTELLIGENCE_PRIVACY_SANITIZATION`

These capabilities are additive contracts. They do not alter the Wave 6
qualified client behavior.

## Evidence Model

Spatial evidence is a reference model, not a duplicate source record model.

Every SpatialFeature, projection, or intelligence result may reference the
evidence that supports it, but Spatial must not copy the full source record and
must not become a second source of truth.

### Required Evidence Distinctions

Evidence references distinguish:

- `sourceAuthority`
- `sourceRecordId`
- `projectionAdapter`
- `projectionVersion`
- `geometryProvenanceRef`
- `sourceObservedAt`, when the source legitimately supplies an observation time
- `sourceRetrievedAt`, when retrieval is meaningful
- `sourceEffectiveFrom`, when source validity begins
- `sourceEffectiveTo`, when source validity ends
- `sourceApprovalState`, when the source has an approval/publication lifecycle
- `sourcePublicationState`, when publication state is known
- `evidenceHash`
- `evidenceVersion`
- `truthReference`, when an owning Truth Spine record exists
- `metricRegistryReference`, when a registered metric is involved

Fields that are unknown or not source-authorized remain absent or explicitly
`UNKNOWN`; they are not inferred.

### Placement

Wave 7 freezes this split:

- `SpatialFeature.provenance` carries minimal projection provenance needed for
  validation and operator/debug traceability.
- Internal projection results may carry a dedicated
  `evidenceReferences` array for richer source/evidence links.
- Spatial Intelligence results must carry `evidenceReferences`.
- Sanitized client results expose only allowlisted evidence summary fields.

Existing Truth Spine, Evidence, Metric Registry, reporting, publication, and
domain services remain authoritative. Spatial references them when authorized;
it does not create a competing evidence authority.

## Temporal Model

Wave 7 distinguishes source temporal facts from projection-time facts.

Accepted temporal concepts:

| Field | Meaning | Authority |
| --- | --- | --- |
| `observedAt` | When the source observed the condition or geometry. | Source authority |
| `effectiveFrom` | When the source says the record becomes valid. | Source authority |
| `effectiveTo` | When the source says the record stops being valid. | Source authority |
| `retrievedAt` | When the system retrieved or loaded the source. | Retrieval/evidence authority |
| `projectedAt` | When Spatial projected the feature or result. | Spatial projection pipeline |
| `supersededAt` | When a source/evidence authority marks the source as superseded. | Source/evidence authority |

Spatial must not require all fields for all domains. Unknown remains unknown.
Missing temporal fields do not create default validity, freshness, or
expiration.

### Temporal Validity Rules

- A result is temporally valid only for the fields the source can support.
- `effectiveFrom` without `effectiveTo` means "valid from this time until the
  source says otherwise", not perpetual truth.
- `effectiveTo` in the past may support `HISTORICAL` or `EXPIRED` freshness
  when the contract says the record is no longer current.
- `supersededAt` takes precedence over apparent freshness.
- `projectedAt` is evidence of Spatial calculation time only; it is not source
  observation time.
- A temporal state cannot imply verification, publication eligibility, service
  eligibility, dispatch readiness, or navigation authority.

## Freshness Model

Canonical Wave 7 freshness states:

- `CURRENT`
- `STALE`
- `EXPIRED`
- `HISTORICAL`
- `UNKNOWN`

No additional states are accepted in Wave 7A.

### Freshness Rules

- Source authorities own source timestamps.
- Layer/source contracts may define source-specific thresholds.
- Spatial may resolve freshness from source timestamps, source freshness flags,
  approved layer `maxSourceAge`, source effective windows, or supersession
  references.
- `UNKNOWN` is safe and displayable when publication allows it; it must not be
  treated as `CURRENT`.
- `STALE` means usable but age-qualified unless layer policy suppresses or
  marks it unavailable.
- `EXPIRED` means the source validity window ended or the source contract says
  the record must no longer be used as current.
- `HISTORICAL` means the data intentionally represents a historical vintage or
  snapshot and should not be judged stale merely because it is old.
- Freshness differs from validity: stale data may still be valid; invalid,
  malformed, or unpublished data fails the projection/intelligence gate.
- Freshness is presentation and intelligence metadata, not source truth.

Existing `freshnessState`, `verificationState`, `publicationState`,
`stalePolicy`, `maxSourceAge`, and presentation-state behavior must be reused
and extended rather than replaced.

## Relationship Vocabulary

Accepted Wave 7 relationship vocabulary:

- `CONTAINS`
- `WITHIN`
- `INTERSECTS`
- `OVERLAPS`
- `TOUCHES`
- `ADJACENT_TO`
- `DISJOINT`
- `SAME_LOCATION`

Rejected for Wave 7A:

- routing terms such as `REACHABLE`, `NAVIGABLE`, `CONNECTED_BY_ROUTE`
- domain service terms such as `SERVES`, `BELONGS_TO`, `AUTHORIZED_FOR`
- emergency/dispatch terms such as `SHOULD_DISPATCH`, `COVERED_BY_UNIT`

### Relationship Requirements

| Relationship | Geometry prerequisites | Coordinate-space prerequisite | Topology requirement | Persistence |
| --- | --- | --- | --- | --- |
| `CONTAINS` | Polygon/MultiPolygon boundary and Point/Polygon candidate | Same coordinate space or approved transform | Exact when geometry supports it; approximation must be labeled | Derived by default; persisted only with evidence and method version |
| `WITHIN` | Inverse of `CONTAINS` | Same coordinate space or approved transform | Same as `CONTAINS` | Derived by default |
| `INTERSECTS` | Two supported geometries | Same coordinate space or approved transform | Exact intersection test | Derived by default |
| `OVERLAPS` | Two same-dimensional geometries with partial shared area | Same coordinate space or approved transform | Exact topology required | Derived by default |
| `TOUCHES` | Geometries sharing boundary but not interior | Same coordinate space or approved transform | Exact topology required | Derived by default |
| `ADJACENT_TO` | Boundary/contact relationship or approved distance threshold | Same coordinate space or approved transform | Exact topology unless threshold explicitly approved | Derived by default; threshold-derived results must carry limitation |
| `DISJOINT` | Two supported geometries | Same coordinate space or approved transform | Exact non-intersection | Derived by default |
| `SAME_LOCATION` | Points with identical coordinates, identical source geometry hash, or approved tolerance contract | Same coordinate space or approved transform | Exact by default; tolerance requires explicit contract | Derived by default |

Relationships may be persisted only when an accepted source/evidence contract
declares the relationship, method, inputs, version, and authority boundary.
Otherwise they are derived intelligence results.

Critical rule:

Relationships may only be computed between features in the same compatible
coordinate space unless an explicit approved transform exists. Since no
cross-space transforms currently exist, cross-space relationship reasoning must
fail closed.

## Governed Spatial Reasoning

Spatial reasoning result classes:

- `GEOMETRIC_FACT`
- `DOMAIN_FACT`
- `POLICY_DECISION`
- `PRESENTATION_DERIVATION`

Spatial may derive `GEOMETRIC_FACT` and bounded
`PRESENTATION_DERIVATION` results from approved same-space geometry and
projection metadata.

Spatial must not convert geometric facts into `DOMAIN_FACT` or
`POLICY_DECISION` authority.

### Allowed Reasoning

Allowed when inputs are eligible, visible to the caller, in the same coordinate
space, and supported by evidence references:

- feature A is within approved boundary B
- two approved polygons intersect
- feature is outside a jurisdiction polygon
- projected feature is stale
- approved scene polygon contains a scene-local point
- two features are disjoint in the same coordinate space

### Prohibited Without Domain Authority

Prohibited unless the owning domain explicitly supplies and authorizes the fact
or decision:

- this provider serves this county
- this student belongs to this district
- this incident should dispatch this unit
- this road is navigable
- this organization is authorized here
- this route should be followed
- this program is eligible because it is inside a boundary
- this metric is true because a map displays it

## Intelligence Result Contract

Canonical internal result shape:

```js
{
  resultId,
  resultType,
  reasoningClass,
  status,
  inputFeatureIds,
  coordinateFamily,
  coordinateSpaceId,
  relationship,
  value,
  temporal: {
    observedAt,
    effectiveFrom,
    effectiveTo,
    retrievedAt,
    projectedAt,
    supersededAt
  },
  freshnessState,
  verificationState,
  publicationState,
  evidenceReferences,
  derivation: {
    method,
    methodVersion,
    deterministic,
    tolerance,
    transformAuthority
  },
  limitations,
  authorityBoundary,
  diagnostics
}
```

Rules:

- `confidence` is omitted for deterministic topology.
- `confidence` may appear only when a contract defines a measurable
  approximation or probabilistic method.
- `transformAuthority` must be `null` unless an approved transform is used.
- `status` must fail closed for invalid, unpublished, restricted, hidden, or
  cross-space inputs.
- `authorityBoundary` must state that Spatial does not create domain or policy
  authority.

Canonical sanitized client result shape:

```js
{
  kind: "SPATIAL_INTELLIGENCE",
  status,
  resultRef,
  resultType,
  relationship,
  value,
  coordinateSpaceId,
  freshnessState,
  presentation,
  evidenceSummary,
  limitations,
  diagnostics
}
```

Client results must omit restricted source records, hidden feature IDs,
internal approval metadata, filesystem paths, authoring internals, and
sensitive provenance details.

## Privacy Rules

Existing Spatial privacy rules remain binding.

- Hidden inputs return no result or a safe generic restricted result according
  to mask policy.
- Restricted inputs must not leak feature IDs, source record IDs, geometry,
  private provenance, approval metadata, or evidence internals.
- `NOT_PUBLISHED` inputs fail closed.
- Intelligence results must be sanitized at least as strictly as projected
  client features.
- Evidence inspection uses existing authorized evidence/Truth/reporting
  surfaces; Spatial does not expose raw evidence directly.

## Qualified Wave 7 Entry Clients

| Client | Evidence linkage | Temporal/freshness | Relationship reasoning | Wave 7 disposition |
| --- | --- | --- | --- | --- |
| IEP Ohio County Map | Suitable; Census source/provenance and 5-digit FIPS identity are established | Suitable with `HISTORICAL`/`CURRENT` distinction for 2010 base geometry | Suitable for same-space county geometry relationships after topology engine tests | Candidate after evidence/freshness contracts |
| Metaverse Quick Map | Limited; client contract is qualified, but legacy markers remain unmapped/provisional | Limited; no accepted source records for legacy markers | Not suitable for legacy marker reasoning until source authority exists | Defer production reasoning |
| Oil Rig Regional Scene | Strong; approved registry geometry and reviewed/approved provenance exist | Suitable; approved geometry can carry projection time and approval/effective metadata | Strong first candidate for approved polygon contains scene-local point | First Wave 7 candidate |

First Wave 7 candidate:

`Metaverse Regional Scene - Oil Rig / approved scene polygon contains a scene-local point`

Why:

- immutable approved geometry exists
- geometry hash `201e189ef24d2adb` is frozen
- coordinate space is `metaverse.regional-scene`
- Spatial eligibility is `ELIGIBLE`
- relationship can be deterministic
- no cross-space transform is needed
- result can remain a `GEOMETRIC_FACT` without creating navigation, imagery,
  water, traffic, transit, emergency, or publication authority

## Existing Architecture Reuse

Wave 7 must reuse:

- Truth Spine references and verification/public-readiness concepts
- Evidence references and evidence review/approval patterns
- SpatialFeature provenance
- projection result diagnostics
- `freshnessState`
- `verificationState`
- `publicationState`
- Spatial presentation-state resolver
- layer `stalePolicy`, `maxSourceAge`, `maskMode`, and lifecycle policies
- coordinate-space registry and no-transform validation
- default layer registry
- Spatial client sanitization and masking
- Metric Registry references when metrics are involved
- audit/event systems for later non-mutating trace events

## New Authorities

NONE

Wave 7A creates no new authority. It defines contracts and entry gates only.

## Wave 7 Subphases

1. Wave 7A - architecture/contracts
2. Wave 7B - evidence reference plus temporal/freshness contracts
3. Wave 7C - same-space relationship engine
4. Wave 7D - governed reasoning API/service
5. Wave 7E - client integration and acceptance

## Red Contracts

Proposed red-contract files:

- `tests/spatialIntelligenceEvidenceWave7B.test.mjs`
- `tests/spatialIntelligenceTemporalFreshnessWave7B.test.mjs`
- `tests/spatialIntelligenceRelationshipsWave7C.test.mjs`
- `tests/spatialIntelligenceCrossSpaceRejectionWave7C.test.mjs`
- `tests/spatialIntelligencePrivacyWave7D.test.mjs`
- `tests/spatialIntelligenceAuthorityBoundaryWave7D.test.mjs`
- `tests/spatialIntelligenceDeterminismWave7D.test.mjs`
- `tests/spatialIntelligenceClientAcceptanceWave7E.test.mjs`

Required contract coverage:

- evidence completeness without source-record duplication
- temporal semantics for observed/retrieved/effective/projected/superseded
  times
- freshness resolution for `CURRENT`, `STALE`, `EXPIRED`, `HISTORICAL`, and
  `UNKNOWN`
- same-space relationship derivation
- cross-space relationship rejection
- hidden/restricted input behavior
- `NOT_PUBLISHED` input rejection
- domain-authority non-escalation
- deterministic result reproducibility
- client sanitization

## Entry Gates

Wave 7B may begin when:

- this architecture record is accepted
- evidence reference fields are implemented as references, not copied records
- client sanitization rules are preserved

Wave 7C may begin when:

- evidence and temporal/freshness red contracts are green
- relationship vocabulary constants and validators fail closed
- no cross-space transform has been introduced

Wave 7D may begin when:

- same-space relationship engine tests are green
- prohibited domain/policy inference tests are green
- hidden/restricted behavior tests are green

Wave 7E may begin when:

- one qualified client is selected with explicit capability scope
- client acceptance tests prove no behavior regression
- authority boundaries remain documented and tested

## Blockers

NONE for Wave 7A architecture.

Conditions before production runtime:

- red contracts must be implemented and green
- no production reasoning may ship from architecture alone
- no cross-space reasoning may run until a separate transform authority exists
- Quick Map legacy markers remain excluded from reasoning until source
  authority is accepted
- domain facts and policy decisions require owning domain authority
