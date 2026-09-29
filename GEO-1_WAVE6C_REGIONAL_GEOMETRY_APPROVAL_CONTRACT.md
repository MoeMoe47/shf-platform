# Wave 6C Regional Geometry Approval Contract

## Lifecycle

```text
DRAFT → REVIEW → APPROVED → SUPERSEDED
                 └──────→ REJECTED
```

Saving a draft never makes it Spatial-eligible. Editing an APPROVED record
creates a new DRAFT version; it never silently overwrites the approved record.

## Approval Authority

Approval belongs to the Metaverse Regional geometry authority represented by
`silicon-heartland-metaverse-regional-geometry-registry`. Spatial is a
consumer and validator, not the geometry owner or approver.

## Review Checklist

- exact registered and implemented scene
- correct approved composition family
- Polygon in `METAVERSE / metaverse.regional-scene`
- coordinates within 0..100 and finite
- closed, non-zero-area Polygon with valid vertices
- boundary represents owner-approved scene coverage, not mobility geometry
- DAY/DUSK/NIGHT alignment remains valid
- geometry and asset-family hashes match their payloads
- provenance and approval metadata are complete
- no route, Traffic, Water, Transit, or navigation authority is included

## Oil Rig Meaning

The Oil Rig Polygon represents the owner-approved usable regional-world extent
of the Oil Rig scene in its canonical scene-local frame. It supports scene
coverage presentation, scene selection/hit testing, and future scene-level
spatial containment. It is not the oil platform silhouette, image rectangle,
road, navigable water, vessel zone, incident area, or route geometry.

This is semantically justified because it supplies the missing scene-level
SpatialFeature geometry for those governed uses; it does not exist merely to
 satisfy a schema.

## Draft Export and Import

The future tracer exports `RegionalSceneGeometryDraft` containing only
`sceneId`, coordinate space, Polygon, geometry hash, composition-family
reference, authoring metadata, and `status: DRAFT`. It excludes navigation,
mobility, React state, and client commands.

The tracer may import DRAFT or REVIEW records. APPROVED records are read-only
inputs; editing one starts a new draft version.
