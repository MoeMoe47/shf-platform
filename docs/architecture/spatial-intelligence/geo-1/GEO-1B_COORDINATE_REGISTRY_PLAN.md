# GEO-1B Coordinate Registry Plan

Every coordinate space must have a stable id, family, units, origin, axis orientation, bounds/range, source, provenance, and version.

## REAL_WORLD

| Stable id | Purpose | Units | Guardrail |
|---|---|---|---|
| `real-world:lat-lng:wgs84` | latitude/longitude point projection | degrees | requires explicit lat/lng source |
| `real-world:geojson:county` | county geometry | GeoJSON | requires geometry provenance |
| `real-world:geojson:state` | state geometry | GeoJSON | requires geometry provenance |
| `real-world:jurisdiction-ref` | textual jurisdiction/service geography | ids/text | not geometry |

## METAVERSE

| Stable id | Purpose | Units | Guardrail |
|---|---|---|---|
| `metaverse:quick-map:v1` | Quick Map image projection | normalized percent over 1448 x 1086 | no transform to master-city |
| `metaverse:master-city:v1` | master city plate projection | normalized percent over approximately 1672 x 941 | no transform to quick-map |
| `metaverse:regional-scene:v1` | scene-specific regional projection | scene-local coordinates | scene-local unless mapped |
| `metaverse:camera-world:v1` | camera/world presentation | runtime camera/world units | presentation only |
| `metaverse:traced-system:v1` | future traced route/path systems | declared by registry | blocked until registry and provenance exist |

## Cross-Space Protection

- Feature geometry must declare its coordinate space.
- Registry lookup must reject unknown coordinate-space ids.
- Selection and interaction payloads must carry coordinate family and space.
- Tests must reject Quick Map coordinates passed as master-city coordinates.
- No transform registry entry means no conversion.
