# Wave 6C Oil Rig Tracer Implementation
The DEV-only Oil Rig tracer is implemented as an authoring surface over the
existing Regional page and camera world box.

## Scope

- frozen `METAVERSE / metaverse.regional-scene` coordinates
- Polygon draft authoring only
- DAY/DUSK/NIGHT reference switching
- immutable vertex editing, close, undo, redo, reset
- draft import/export and local draft recovery
- validation and deterministic geometry hashing
- no approval, registry write, adapter, or client projection

The gate requires both `import.meta.env.DEV` and the explicit
`regionalGeometryAuthoring=1` query flag, together with the existing
`metaverseDev=1` route gate.

## Route

`/metaverse/oil-rig?metaverseDev=1&regionalGeometryAuthoring=1`

The overlay is rendered as a sibling in the existing camera marker layer, so
it uses the same aspect-locked world rectangle and camera transform as the
background. It does not alter normal scene rendering.
