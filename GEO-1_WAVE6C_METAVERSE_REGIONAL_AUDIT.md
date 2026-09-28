# GEO-1 Wave 6C Metaverse Regional Audit

## Scope

Wave 6C qualifies the existing Metaverse regional scene surface for a future
Spatial contract. It does not add an adapter, change scene assets, or change
navigation behavior.

## Implemented Surface

| Item | Evidence | Finding |
| --- | --- | --- |
| Route | `src/pages/metaverse/MetaverseCityPage.jsx` | `/metaverse/:scene` is delegated to the regional page when the slug is implemented. |
| Page | `src/pages/metaverse/MetaverseRegionalScenePage.jsx` | Mounted regional client; uses the existing Metaverse shell, camera, minimap, time-of-day, and route controls. |
| Registry | `src/system/metaverse/regionalSceneRegistry.js` | Canonical presentation registry for scene declarations and route context. |
| Route test | `tests/metaverseRegionalScenes.test.mjs` | Locks the route sequence, registry validation, implemented slugs, assets, and shell integration. |
| Scene assets | `public/assets/metaverse/regional/` | Owner-approved presentation assets for the implemented regional scenes. |

The registry contains 15 ordered route stops:

`oil-rig`, `open-sea`, `shipping-corridor`, `harbor-in-distance`,
`harbor-approach`, `container-yard`, `freight-highway`, `farms`, `woods`,
`river`, `bridge`, `mountain-region`, `final-approach`, `gateway`,
`silicon-heartland-city`.

Only `oil-rig` and `open-sea` currently appear in `REGIONAL_SCENES` and are
implemented by the registry validation test. The other 13 stops are route
context, not fabricated production scene features.

## Qualification Finding

The regional system is a real mounted client with stable registry identifiers,
but its current authority is presentation-oriented. It does not yet provide a
verified production feature contract for all route stops, a separate source
record authority, or a client-safe Spatial projection boundary.

Status: `QUALIFIED_WITH_CONDITIONS` for a future regional-scene contract.

Conditions are recorded in the Wave 6C acceptance gate and must be closed
before runtime implementation.
