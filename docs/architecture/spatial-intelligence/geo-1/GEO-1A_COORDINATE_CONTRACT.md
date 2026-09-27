# GEO-1A Coordinate Contract

## CoordinateFamily

`REAL_WORLD`

Real geographic coordinates, boundaries, service geography, and jurisdictional scopes.

`METAVERSE`

Virtual scene coordinates, normalized image coordinates, SVG/canvas coordinates, route/path coordinates, regional scene coordinates, and camera/world coordinates.

## CoordinateSpace

Each projected spatial feature must declare:

- `family`
- `coordinateSpaceId`
- `units`
- `origin`
- `axisOrientation`
- `boundsOrRange`
- `sourceAssetOrGeography`
- `transformAvailability`
- `transformAuthority`
- `provenance`
- `version`

## Rules

1. No implicit conversion between `REAL_WORLD` and `METAVERSE`.
2. No implicit conversion between two `METAVERSE` spaces.
3. Quick Map and master-city remain separate spaces until calibrated.
4. Unknown coordinates remain unknown.
5. Textual jurisdiction does not equal geometry.
6. County names must not be inferred from unrelated entity data.
7. Demo coordinates must be labeled as demo.

## Known Spaces From GEO-0

| Coordinate space | Family | Units | Source | Transform status |
|---|---|---|---|---|
| latitude-longitude | REAL_WORLD | degrees | real-world coordinate producers | Transform authority not defined in GEO-1A |
| county-geojson | REAL_WORLD | GeoJSON geometry | local or remote county/state geometry | Provenance required before authority use |
| jurisdiction-text | REAL_WORLD | text/ids | domain records and migrations | Not geometry |
| quick-map | METAVERSE | normalized percent over 1448 x 1086 source image | Metaverse Quick Map registry | No confirmed transform to master-city |
| master-city | METAVERSE | normalized percent over approximately 1672 x 941 city plate | Metaverse road/river/destination registries | No confirmed transform to quick-map |
| regional-scene | METAVERSE | scene-specific image/viewport coordinates | Metaverse regional scene registry | Scene-local unless mapped |
| camera-world | METAVERSE | runtime camera/world state | Metaverse runtime clients | Presentation state only |
