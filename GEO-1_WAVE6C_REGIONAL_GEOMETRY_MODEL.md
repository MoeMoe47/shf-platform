# GEO-1 Wave 6C Regional Scene Geometry Model

## Decision

Regional scene geometry means an owner-authored **scene coverage polygon** in
the scene's local coordinate frame. It identifies the bounded presentation
extent that may be projected as a `regional-scene` SpatialFeature. It is not a
road, water, traffic, transit, emergency, or navigation geometry.

The first permitted geometry type is `Polygon`. `Point`, `MultiPolygon`, and
`LineString` are deferred until a concrete scene use case and validator
contract justify them.

## Why Geometry Is Required

`CORE_SPATIALFEATURE_INVARIANT`: the existing SpatialFeature contract and
validator require a geometry payload. This is not merely a Regional adapter or
client convention. The contract must not be weakened to make registry-only
scene declarations projectable.

## Coordinate Decision

The registered `metaverse.regional-scene` space is now frozen as top-left
origin, x-right/y-down, normalized `0..100` scene units. This is a Regional
numeric convention only; it is not equivalent to Quick Map, master-city, or
camera-world coordinates. No cross-space conversion is implicit.

## Pixel Versus Normalized

Normalized scene coordinates are the canonical authoring representation. They
avoid binding stored geometry to a raster resolution and can support aligned
variants. Any image-local conversion is a controlled authoring operation, not
an engine transform, and must be versioned and tested before use.

## Variant Rule

Geometry may be shared across DAY/DUSK/NIGHT only after asset alignment is
proven. The Oil Rig audit now classifies its three production plates as
`ALIGNED_WITH_TOLERANCE` using eight distributed structural landmarks and a
pre-declared 1.0 scene-unit tolerance. The Open Sea variants remain unaudited;
their differing dimensions (`1584x993`, `1580x995`, and `1578x997`) do not by
themselves prove misalignment or alignment.

Oil Rig geometry remains owned by the separate
`silicon-heartland-metaverse-regional-geometry-registry`; the scene registry
continues to own scene identity and assets. No approved geometry exists yet.

## Eligibility

```text
registered
AND implemented
AND publishable
AND approved geometry exists
AND geometry is valid in the frozen regional coordinate space
AND provenance/hash metadata is valid
```

Current eligible count remains `0`.
