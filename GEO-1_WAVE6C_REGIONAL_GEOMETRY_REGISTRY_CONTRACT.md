# Wave 6C Regional Geometry Registry Contract

## Authority Split

`regionalSceneRegistry.js` remains authoritative for scene identity, existence,
route order, and approved asset declarations. A separate Regional Geometry
Registry is authoritative for owner-approved scene-local geometry. Spatial
validates and projects approved records; it does not author or approve them.

Proposed geometry source authority:

`silicon-heartland-metaverse-regional-geometry-registry`

This preserves the important distinction that a registered scene can exist
without approved geometry. Current state is 15 registered scenes, 2 implemented
scenes, and 0 geometry-eligible scenes.

## Proposed Record

```text
RegionalSceneGeometryRecord {
  sceneId,
  coordinateFamily: "METAVERSE",
  coordinateSpace: "metaverse.regional-scene",
  geometryType: "Polygon",
  geometry,
  geometryHash,
  status,
  assetAlignment: {
    compositionFamilyId,
    variants,
    assetHashes,
    alignmentStatus
  },
  provenance: {
    sourceAuthority,
    authoredWith,
    authoredAt,
    reviewedAt,
    approvedAt,
    approvalActorId
  },
  version
}
```

`approvalActorId` is an opaque audit identifier when needed. Personal display
names, review notes, filesystem paths, and rejected or superseded payloads do
not enter the production client projection.

## Identity and Hashes

`sceneId` is the exact registry ID. `geometryHash` covers canonical Polygon
content only. The composition-family reference separately covers the approved
asset alignment evidence and variant hashes. Neither hash is a substitute for
the other.

## Eligibility

```text
registered
AND implemented
AND publishable
AND approved geometry exists
AND geometry valid
AND provenance/hash valid
AND asset alignment valid
```

Only `APPROVED` records are Spatial-eligible. No placeholder, full-frame, or
image-derived geometry is permitted merely to satisfy the SpatialFeature
schema.
