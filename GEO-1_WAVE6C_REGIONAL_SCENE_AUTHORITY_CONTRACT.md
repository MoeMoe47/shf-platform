# GEO-1 Wave 6C-R Regional Scene Authority Contract

## Frozen Scope

This contract covers exactly one feature type:

```text
domain: metaverse-regional
featureType: regional-scene
```

It excludes regional transitions, routes, roads, rivers, ocean regions,
Traffic, Water Mobility, Transit, Sky Bridge, emergency state, Quick Map, and
master-city geometry.

## Source Authority

```text
silicon-heartland-metaverse-regional-scene-registry
```

This is justified as the proposed source authority because
`src/system/metaverse/regionalSceneRegistry.js` owns the current scene
declarations, stable scene IDs, canonical route context, and declared asset
references. The authority remains conditional until a future review confirms
that the registry is approved to publish Spatial scene features rather than
only presentation declarations.

## Identity

The source record ID is the exact registry `scene.id` value. Current IDs are
registry-backed values such as `oil-rig`, `open-sea`, and
`silicon-heartland-city`. Labels, filenames, array positions, and route order
are never identity authorities.

The Spatial ID must use the existing helper and the frozen namespace:

```text
spatial:metaverse-regional:regional-scene:silicon-heartland-metaverse-regional-scene-registry:<sceneId>
```

## Coordinate Contract

```text
coordinateFamily: METAVERSE
coordinateSpaceId: metaverse.regional-scene
```

`metaverse.quick-map`, `metaverse.master-city`, `metaverse.camera-world`, and
all REAL_WORLD spaces are rejected. No implicit transform is allowed.

## Eligibility

A scene is eligible only when all of the following are true:

1. It is a member of `REGIONAL_SCENES`, not merely a route-context stop.
2. Its registry declaration passes `validateRegionalSceneRegistry()`.
3. Its required approved asset references and publication status are present.
4. A future approved source record supplies legitimate scene-local geometry or
   another geometry payload accepted by the existing SpatialFeature contract.

The current registry satisfies items 1-3 for `oil-rig` and `open-sea`, but it
does not supply geometry. Therefore the current eligible projection count is
`0` until an owner-approved geometry payload exists. The adapter must not
invent geometry from image dimensions, camera state, filename, or route order.

## Authority Boundaries

- The Metaverse registry owns scene declaration and route context.
- Asset declarations own approved DAY/DUSK/NIGHT references.
- The page/router owns navigation.
- Traffic owns road paths and vehicle movement.
- Water, river, and ocean systems own water traces and movement.
- Transit/Sky Bridge owns future transit authority when qualified.
- Spatial owns only projection, client-safe identity, presentation state, and
  interaction coordination.

Spatial never navigates, starts mobility behavior, changes time-of-day truth,
publishes domain data, or transfers authority between coordinate spaces.
