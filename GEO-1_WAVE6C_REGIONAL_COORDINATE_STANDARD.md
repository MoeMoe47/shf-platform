# GEO-1 Wave 6C Regional Coordinate Standard

## Frozen Space

```text
id: metaverse.regional-scene
family: METAVERSE
origin: top-left
x: increases right
y: increases down
bounds: 0..100 on both axes
units: scene-normalized units
point: [x, y]
```

This is a Regional numeric convention, not an alias for `metaverse.quick-map`,
`metaverse.master-city`, or `metaverse.camera-world`. Equal numeric bounds do
not establish coordinate equivalence or a transform.

## Image Fit

The current Regional renderer uses `CUSTOM` fit behavior:

1. `MetaverseCamera` computes an aspect-locked world rectangle from the
   declared scene aspect ratio.
2. The rectangle uses `background-size: cover` and centered positioning.
3. The world rectangle uses `1.08` overscan.
4. The background and marker/layer boxes receive the same camera transform.

The declared scene aspect ratio is currently the DAY/reference ratio. A variant
whose intrinsic dimensions differ is not automatically aligned.

## Canonical Versus Viewport Coordinates

Canonical geometry is stable `[x, y]` scene-normalized data. Viewport pixels,
camera pan, zoom, overscan, and responsive layout are derived presentation
state and must never be persisted as geometry.

## Authoring Conversion

For an approved rendered image-local rectangle with width `w` and height `h`,
an authoring point `(px, py)` maps to:

```text
x = 100 * px / w
y = 100 * py / h
```

The authoring surface must first resolve the actual image-local rectangle after
fit/crop handling. This is same-scene authoring conversion, not a cross-space
transform.

## Rendering Conversion

The inverse maps canonical coordinates into the resolved image-local rectangle:

```text
px = w * x / 100
py = h * y / 100
```

The existing camera world/layer transform then applies presentation pan and
zoom. No Quick Map, master-city, or camera-world conversion is involved.

## Precision

Persist finite numeric values without forced destructive rounding. Canonical
serialization must be stable for hashing, but validation must not alter vertex
values.

## Polygon Meaning

The initial Polygon represents an owner-approved scene coverage area. It is not
an image-frame placeholder, route, object mask, water area, camera frustum, or
real-world geography.

## Full-Frame Decision

`SCENE_SPECIFIC_TRACE_REQUIRED`. A full-frame rectangle is not justified merely
to satisfy the SpatialFeature geometry invariant.
