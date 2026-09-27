# GEO-1A Quick Map Boundary

Metaverse Quick Map is a future Spatial Engine client.

It is not:

- destination authority
- traffic authority
- mission authority
- event authority
- emergency authority
- publication authority
- identity authority

## Current Coordinate Boundary

GEO-0 confirmed that Quick Map uses a normalized coordinate space over a 1448 x 1086 image. Master-city road, river, and destination traces use a separate normalized coordinate space over an approximately 1672 x 941 source plate.

No transform may be assumed between Quick Map and master-city.

## Future Role

Quick Map may consume Spatial Engine projections, emit shared selections, show layer state, highlight routes, and present eligible temporal/spatial state after GEO-1B or later implementation phases.

Quick Map must not become the source of destination identity, traffic state, mission state, event state, emergency state, or authority decisions.
