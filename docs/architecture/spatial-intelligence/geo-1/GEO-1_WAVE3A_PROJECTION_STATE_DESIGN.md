# GEO-1 Wave 3A Projection / Presentation State Design

Status: design and executable contract harness only

Wave 3A defines how domain-owned data becomes a validated `SpatialFeature` and how presentation state is resolved without becoming domain authority. It does not integrate Quick Map, existing maps, route/path runtime, full temporal intelligence, backend persistence, or domain write paths.

## Canonical Pipeline

```text
Domain / Engine Record
        ↓
Projection Adapter
        ↓
Projection Eligibility
        ↓
SpatialFeature Validation
        ↓
Layer Assignment
        ↓
Presentation State Resolution
        ↓
Spatial Client
```

No stage creates domain truth.

## Projection Adapter Contract

Production-facing conceptual interface:

```text
canProject(record, context)
project(record, context)
getSourceAuthority()
getSupportedFeatureTypes()
getSupportedCoordinateSpaces()
```

Adapters preserve `domain`, `sourceAuthority`, `sourceRecordId`, provenance, publication state, verification state, coordinate family, and coordinate space. An adapter may transform representation into `SpatialFeature`; it may not transform authority.

## Projection Result Model

Canonical result statuses:

- `PROJECTED`
- `SUPPRESSED`
- `RESTRICTED`
- `INVALID`
- `UNAVAILABLE`
- `STALE`

Every non-`PROJECTED` result must include machine-readable diagnostics. Invalid records are not silently dropped.

## Projection Eligibility

Projection eligibility checks:

- valid source identity
- valid coordinate family
- registered coordinate space
- valid geometry/coordinates
- valid layer
- provenance
- verification state
- publication eligibility
- authorization context where supplied
- freshness/staleness

Spatial must not invent authorization.

## Public / Private Projection

A feature can be spatially valid but not eligible for a viewer. `PUBLIC`, `AUTHENTICATED`, `ORGANIZATION`, `OPERATOR`, `ADMIN`, `RESTRICTED`, and `NOT_PUBLISHED` affect projection output separately from feature validity.

`NOT_PUBLISHED` should produce `SUPPRESSED`. `RESTRICTED` should produce `RESTRICTED` or masked output according to supplied eligibility and viewer context. Spatial does not approve publication.

## Presentation State Model

State is multi-dimensional. Do not collapse domain, temporal, selection, availability, verification, and publication dimensions into one string.

Recommended shape:

```text
domainState
temporalState
selectionState
availabilityState
verificationState
publicationState
highlightState
resolvedVisualState
```

Supported visual states:

- `NORMAL`
- `SELECTED`
- `NEXT`
- `SCHEDULED`
- `EVENT_SOON`
- `EVENT_LIVE`
- `MISSION_ACTIVE`
- `EMERGENCY`
- `RESTRICTED`
- `CLOSED`
- `COMPLETED`
- `UNAVAILABLE`

State authority classes:

| State | Authority class |
|---|---|
| NORMAL | SPATIAL_CALCULATED |
| SELECTED | SPATIAL_CALCULATED |
| NEXT | DOMAIN_SUPPLIED |
| SCHEDULED | DOMAIN_SUPPLIED (GEO1-WAVE3A-DEC-003) |
| EVENT_SOON | TEMPORAL_CALCULATED_FROM_DOMAIN_TIME |
| EVENT_LIVE | TEMPORAL_CALCULATED_FROM_DOMAIN_TIME |
| MISSION_ACTIVE | DOMAIN_SUPPLIED |
| EMERGENCY | DOMAIN_SUPPLIED |
| RESTRICTED | AUTHORIZATION/PUBLICATION_SUPPLIED |
| CLOSED | DOMAIN_SUPPLIED |
| COMPLETED | DOMAIN_SUPPLIED |
| UNAVAILABLE | SPATIAL_CALCULATED |

Amendment (GEO1-WAVE3A-DEC-003): an earlier draft of this design classified `SCHEDULED` as `TEMPORAL_CALCULATED_FROM_DOMAIN_TIME`. That conflicted with the GEO-1A State Projection Contract and the GEO-1B State Engine Plan, and it has been corrected. `SCHEDULED` is a domain lifecycle status carried in `domainState`. Spatial must not derive it from a future `effectiveStart`.

## State Conflict Rules

Priority should preserve dimensions and derive final treatment:

1. `RESTRICTED` or `UNAVAILABLE` controls visibility/availability.
2. `EMERGENCY` and `MISSION_ACTIVE` remain domain facts if supplied, even when selected.
3. `SELECTED` is a presentation modifier, not a domain fact.
4. Temporal states require source time and never infer missing dates. A future start time alone yields the temporal category `upcoming`, never `SCHEDULED`.
5. Verification/publication state remains traceable and is not overwritten by selection.

Example: `MISSION_ACTIVE + SELECTED + RESTRICTED` resolves to a restricted visual treatment, retains `MISSION_ACTIVE` in domain state, and records `SELECTED` as selection state.

## Selection Integration

Wave 2B selection influences only `selectionState`. It must not overwrite domain, mission, emergency, publication, verification, temporal, or availability state.

## Highlight Model

Decision: highlight is separate from selection and transient/non-authoritative.

Potential highlight sources include search, hover/focus, evidence result, route, alert, synchronized panel, and selection. Highlight must support keyboard and non-pointer sources.

## Temporal Boundary

Wave 3A defines temporal inputs only:

- `effectiveStart`
- `effectiveEnd`
- `sourceTimestamp`
- `timezone`
- `freshness`

`temporalState` holds a temporal category from `TEMPORAL_STATES` (GEO-1A Temporal Projection Contract), not a visual state. It is calculated deterministically from valid source-authorized timestamps: `upcoming` when `effectiveStart` is in the future, `live` when `now` falls inside `[effectiveStart, effectiveEnd]`, and `ended` when `effectiveEnd` has passed. Missing or unparseable dates yield no temporal category and are not inferred.

`EVENT_LIVE` and `EVENT_SOON` may be resolved from a temporal category for event-sourced features. `EVENT_SOON` still needs an approved threshold. `SCHEDULED` is not a temporal derivation: it resolves only from a domain-supplied `domainState` (GEO1-WAVE3A-DEC-003). A domain-supplied `SCHEDULED` record with no start date keeps `SCHEDULED` and an unknown date label.

## Provenance Continuity

Provenance must survive:

```text
domain record -> adapter -> SpatialFeature -> presentation state -> client
```

Rendered features remain traceable to source authority, source record, projection adapter, evidence reference, and projection version.

## Adapter Registry Design

Conceptual API:

```text
register(adapter)
getAdapter(domain, featureType)
listAdapters()
```

Adapters must not override each other silently. Collision on domain and feature type is rejected unless an explicit versioned replacement policy is later approved.

## Diagnostics

Canonical diagnostic codes:

- `UNKNOWN_COORDINATE_SPACE`
- `COORDINATE_FAMILY_MISMATCH`
- `INVALID_PROVENANCE`
- `NOT_PUBLISHED`
- `RESTRICTED`
- `STALE_SOURCE`
- `INVALID_LAYER`
- `ADAPTER_NOT_FOUND`
- `INVALID_FEATURE`
- `INVALID_SOURCE_AUTHORITY`
- `INVALID_TEMPORAL_SOURCE`

Diagnostics must avoid leaking private data.

## Accessibility Projection

Every projected feature should provide nonvisual representation:

- accessible label
- description
- state text
- selected state
- unavailable/restricted text
- keyboard-equivalent interaction metadata

A map feature must not exist only as pixels.
