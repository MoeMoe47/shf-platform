# GEO-1 Wave 6C Metaverse Coordinate Contract

## Coordinate Family

`METAVERSE`

Regional scene coordinates are virtual, scene-local presentation coordinates.
They are not latitude/longitude and do not participate in Census or ODOT
geography.

## Registered Space

`metaverse.regional-scene` is already registered in
`src/shared/spatial/registries/defaultCoordinateSpaces.js` with scene-local
units, scene-defined axes and bounds, and no transform authority.

`metaverse.camera-world` is a separate runtime camera/world presentation space.

## Separation Rules

The following relationships remain explicitly uncalibrated:

```text
metaverse.regional-scene != metaverse.quick-map
metaverse.regional-scene != metaverse.master-city
metaverse.regional-scene != metaverse.camera-world
```

No implicit METAVERSE-to-METAVERSE conversion is permitted. The existing
coordinate registry correctly returns no registered transform between distinct
spaces.

## Route and Trace Coordinates

The regional registry uses scene declarations and route context. City road and
river registries use normalized 0-100 coordinates tied to the Silicon Heartland
city master plate; that does not prove they are regional-scene geometry.
Traffic routes in `src/system/metaverse/traffic/metaverseTrafficRoutes.json`
and river-flow paths are retained as separate reference/presentation systems.

## Contract Condition

A future regional adapter must declare `METAVERSE` plus
`metaverse.regional-scene`, preserve the scene-local coordinates unchanged,
and reject records from Quick Map, master-city, camera-world, and REAL_WORLD
spaces. No calibration or transform is proposed in Wave 6C.
