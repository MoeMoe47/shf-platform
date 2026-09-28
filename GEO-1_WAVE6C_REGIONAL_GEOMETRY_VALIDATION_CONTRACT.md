# GEO-1 Wave 6C Regional Geometry Validation Contract

## Required Validation

A future geometry validator must require:

- exact registered `sceneId`
- scene membership in `REGIONAL_SCENES`
- implemented scene status
- approved publication status
- exact `METAVERSE` family
- exact `metaverse.regional-scene` coordinate space
- initial geometry type `Polygon`
- non-empty coordinates
- finite coordinates
- chosen coordinate bounds
- at least four positions in every closed ring
- closed polygon rings
- no NaN or infinity
- valid approval/provenance metadata
- geometry hash matching the payload
- no source or geometry mutation

Unknown, unimplemented, unapproved, malformed, or out-of-bounds records must
fail closed. No default scene is permitted.

## Version Metadata

```text
sceneId
geometryVersion
assetReference/version
coordinateSpace
geometryHash
createdAt
approvedAt
approvalStatus
```

Timestamps are audit metadata, not the sole identity. A content hash is
required for reproducibility.

## Client Safety

Client projection may receive presentation geometry, stable identity, safe
provenance, and publication state. It must not receive internal filesystem
paths, rejected/superseded payloads, review notes, or sensitive author data.
