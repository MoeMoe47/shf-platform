# GEO-1 Wave 6C Metaverse Regional Client Qualification

## Client

| Field | Evidence |
| --- | --- |
| Route | `/metaverse/:scene`, handled through the hash-aware root entry and `MetaverseCityPage` |
| Component | `src/pages/metaverse/MetaverseRegionalScenePage.jsx` |
| Mounted | Yes for implemented slugs; `MetaverseCityPage` delegates only when `getRegionalSceneBySlug` returns a scene. |
| Current scene coverage | 2 implemented scenes; 15 registered route stops |
| Renderer | Existing Metaverse regional renderer, camera, shell, minimap, and route controls |
| Existing tests | `tests/metaverseRegionalScenes.test.mjs` plus Metaverse shell/mobility tests |

## Client Status

`CLIENT_QUALIFIED_WITH_CONDITIONS`

The client is real and regression-testable, but the complete route registry is
not a complete set of implemented scene features. A future Spatial client must
project only qualified implemented scene records and must preserve route
context as Metaverse-owned metadata.

## Current Accessibility Baseline

The existing regional page reuses the Metaverse shell and route controls. The
Wave 6C audit does not claim a new Spatial accessibility certification. A
future contract must preserve keyboard navigation, focus behavior, reduced
motion, scene labels, and the existing accessible route equivalent.

## Recommended First Scope

`REGIONAL_SCENE_FEATURES_ONLY`

Do not onboard route relationships, traffic, water, transit, or Sky Bridge in
the first implementation. Those systems have separate authorities or remain
unverified.
