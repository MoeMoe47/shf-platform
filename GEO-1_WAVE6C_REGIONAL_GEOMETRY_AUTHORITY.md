# GEO-1 Wave 6C Regional Geometry Authority

## Authority Split

The regional scene registry remains authoritative for:

- scene existence
- stable scene ID
- canonical presentation sequence
- declared scene assets

A future dedicated Regional Geometry Registry should be authoritative for:

- scene-local geometry payload
- geometry status and approval
- geometry version/hash
- asset alignment evidence
- geometry provenance

Spatial consumes approved geometry and validates the projection contract. Spatial
does not author, approve, or own the geometry.

## Proposed Registry

`regionalSceneGeometryRegistry` is justified as a separate registry if
geometry is added. Keeping it separate avoids turning the presentation scene
registry into a geometry source of truth and prevents mobility traces from
being mistaken for scene coverage.

Proposed entry fields:

```text
sceneId
coordinateSpace
geometryType
geometry
source
authoringVersion
assetAlignmentVersion
approvalStatus
approvedBy
approvedAt
provenance
geometryHash
```

No registry is implemented in this phase.

## Approval Authority

Approval belongs to the internal Metaverse Regional authoring/scene authority,
not Spatial. Only `APPROVED` geometry may become Spatial-eligible. A trace or
export is not canonical merely because it exists in a developer workspace.

## Non-Mobility Boundary

Regional scene coverage is distinct from Traffic routes, River/Ocean traces,
Water Mobility paths, Sky Bridge/Transit paths, and emergency routes. Those
systems retain their own authorities and registries.
