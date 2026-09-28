# GEO-1 Wave 6C Metaverse Authority Model

## Authority Separation

| Concern | Current authority | Spatial boundary |
| --- | --- | --- |
| Scene existence and declaration | `regionalSceneRegistry.js` / Metaverse presentation policy | Spatial may project a qualified declaration; it does not create scenes. |
| Scene asset selection | Regional scene asset declarations and approved assets | Spatial retains asset reference/provenance; it does not author imagery. |
| Route sequence and next/previous context | `REGIONAL_ROUTE_SEQUENCE` and scene `nextScene`/`previousScene` | Spatial may expose relationship context; router/navigation remains external. |
| Page navigation | `MetaverseCityPage` and in-page navigation | Spatial may request presentation action; it never owns routing. |
| Time of day | Metaverse time-of-day runtime and asset resolver | Spatial may carry presentation context; it does not create environmental truth. |
| Road traffic | Road/traffic registries and dev review tooling | Spatial must not animate, approve, or own traffic behavior. |
| Water/river/ocean | Water, river-flow, ocean, and regional scene systems | Spatial must not claim hydrological or mobility authority. |
| Transit/Sky Bridge | No confirmed production authority; relationship refs remain empty | No Spatial feature or adapter is authorized. |
| Domain workflow | Owning Metaverse/domain systems | Spatial does not mutate canonical domain state. |

## Ownership Rule

Spatial coordinates and presents qualified regional features. It does not become
the authority for scene existence, route order, mobility state, workflow,
publication, or navigation.

The proposed internal source authority is conditional:

`silicon-heartland-metaverse-regional-scene-registry`

That identifier must not be treated as final production authority until a
future contract proves that the registry is the approved source for scene
feature declarations rather than only a presentation registry.

## Publication

Scene visibility is not publication authority for traffic traces, water paths,
transit data, domain records, or hidden development capabilities. Existing
development-only layers remain development-only.
