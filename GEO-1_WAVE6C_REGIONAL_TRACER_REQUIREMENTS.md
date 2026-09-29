# Wave 6C Regional Geometry Tracer Requirements

## Scope

The future tracer is a DEV-only authoring tool for approved Regional geometry.
It is not a Spatial adapter, client, route controller, or mobility editor.

## Proposed Route

`/metaverse/oil-rig?metaverseDev=1&regionalGeometryAuthoring=1`

Both the existing DEV gate and the explicit authoring flag are required. The
tool must not appear in normal production UI.

## Required Capabilities

- scene selector limited to implemented, authorable scenes
- DAY/DUSK/NIGHT reference selector
- asset and composition-family reference display
- normalized 0..100 coordinate overlay and live readout
- Polygon point placement, vertex drag/insert/delete, close, undo, redo, reset
- DRAFT import and export
- bounds and Polygon validation
- geometry-hash preview
- alignment-family warning and asset-hash display
- status/lifecycle indicator
- Polygon fill/outline preview

## Boundaries

The tracer must not create coordinates, infer geometry from filenames or image
dimensions, edit scene assets, modify route order, or touch Traffic, Water,
Transit, Quick Map, master-city, or camera-world coordinates.

## Future Entry Requirements

The tool may be built only after the coordinate standard, geometry registry
schema, approval flow, export schema, asset alignment evidence, and validator
contract are frozen. A DRAFT does not change Regional adapter readiness.
