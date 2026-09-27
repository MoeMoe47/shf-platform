# GEO-1A Spatial Feature Contract

This is a projection contract, not a database schema.

## Conceptual Fields

```text
featureId
featureType
domain
sourceAuthority
sourceRecordId

coordinateFamily
coordinateSpaceId
geometry

layerId

title
label

state
temporalState

verificationState
publicationState

provenance
updatedAt

allowedInteractions
authorizedActionReferences

publicEligibility
```

## Domain Fields

Domain fields identify the owning system and source record:

- `domain`
- `sourceAuthority`
- `sourceRecordId`
- domain-owned status references
- domain-owned action references
- domain-owned verification and publication references

Spatial may carry these fields as references. Spatial does not rewrite their meaning.

## Spatial Projection Fields

Spatial projection fields describe how the feature may be represented:

- `featureId`
- `featureType`
- `coordinateFamily`
- `coordinateSpaceId`
- `geometry`
- `layerId`
- `title`
- `label`
- `state`
- `temporalState`
- `provenance`
- `updatedAt`
- `allowedInteractions`
- `publicEligibility`

## Verification and Publication

`verificationState` and `publicationState` are displayed by Spatial but decided by the owning verification, evidence, reporting, or publication authority.
