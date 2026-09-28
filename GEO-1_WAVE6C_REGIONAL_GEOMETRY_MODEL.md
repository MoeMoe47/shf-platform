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

The registered `metaverse.regional-scene` space is authoritative for the
family and scene-local semantics, but its bounds are currently
`scene-defined`. Existing Traffic, River, and Road authoring tools use
normalized `0..100` values, but that convention has not been explicitly frozen
for regional scene assets. A future authoring contract may adopt `x/y 0..100`,
origin top-left, with units of normalized scene extent, after owner approval.

Until that decision is recorded, the coordinate standard remains unresolved
for production geometry. No pixel-to-normalized conversion is implicit.

## Pixel Versus Normalized

Normalized scene coordinates are the recommended authoring representation once
the Regional coordinate contract is approved. They avoid binding stored
geometry to a particular raster resolution and can support aligned variants.
The conversion from an authoring asset is a controlled authoring operation, not
an engine transform, and must be versioned and tested before use.

## Variant Rule

Geometry may be shared across DAY/DUSK/NIGHT only after asset alignment is
proven. Current evidence is insufficient for both implemented scenes: Oil Rig
variants share dimensions, while Open Sea variants differ (`1584x993`,
`1580x995`, and `1578x997`). No alignment manifest or landmark registration
currently proves a shared geometry frame.

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
