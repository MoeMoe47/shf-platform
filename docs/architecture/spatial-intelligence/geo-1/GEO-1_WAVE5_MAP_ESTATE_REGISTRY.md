# GEO-1 Wave 5 Map Estate Registry

This planning registry is descriptive. It is not a runtime registry and does not grant authority.

| mapId | name / component | owner domain candidate | route | engine / data | publication boundary | adapter / migration |
| --- | --- | --- | --- | --- | --- | --- |
| `metaverse.quick-map` | Silicon Heartland top map / `MetaverseMiniMap.jsx` | Metaverse presentation; record owners unknown | city page | PNG asset plus registry overlays | Metaverse client visibility | Adapter client-ready; legacy mapping blocked |
| `metaverse.master-city` | master city scene and facility relationships | Metaverse | city page | scene assets and verified relationship registry | Metaverse | Partial; separate from Quick Map |
| `metaverse.regional-scenes` | regional scene maps | Metaverse | `/metaverse/:scene` | scene registry, per-scene quick-map assets | Metaverse | Partial; route references null |
| `shs.operations-mapbox` | operational county map | SHS operations | Exchange unified truth | Mapbox GL + remote GeoJSON | operator/public boundary requires review | Partial / blocked on config and authority |
| `exchange.unified-truth` | Unified Truth Map | Exchange / SHS boundary | `capital.html#/exchange`, unified-truth route evidence | Mapbox | authenticated/operator policy | Partial |
| `shf.public-impact` | Foundation impact map | SHF | `foundation.html#/impact` | Ohio county geometry + SHF data filter | public approval required | Blocked while records are draft |
| `iep.ohio-county` | official Ohio county map | IEP consumes Census geometry; IEP remains domain-data owner | `capital.html#/iep-command-v2` / `IEPCommandCenterV2` | Census-qualified `/assets/maps/ohio-counties.geojson` through `CensusCountyGeometryAdapter` and the Spatial pipeline | geometry public; attached IEP records separately governed | Spatial-managed client accepted; legacy direct path retained only as DEV rollback; migration complete with rollback condition |
| `shf.ohio-engine` | `SHFOhioMapEngine` | SHF candidate | test/unrouted page evidence | county base plus hardcoded metrics | unknown | Blocked |
| `globe.operational` | `OperationalGlobe` | unknown | no confirmed importer | globe.gl + remote GeoJSON | unknown | Unknown / unmounted candidate |
| `globe.real` | `RealGlobe` | unknown | no confirmed importer | globe.gl + remote county data | unknown | Unknown / unmounted candidate |
| `exchange.outcome-globe` | `OutcomeGlobe` | Exchange candidate | no confirmed importer | hardcoded arcs / react-globe | unknown | Unknown / disconnected candidate |
| `regional-route-context` | 15-stop route context | Metaverse presentation | regional scenes | `REGIONAL_ROUTE_SEQUENCE` | Metaverse | No Spatial route authority |

## Evidence Convention

The principal evidence paths are `src/system/metaverse/metaverseMiniMapRegistry.js`, `src/system/metaverse/metaverseDestinationRelationshipRegistry.js`, `src/system/metaverse/regionalSceneRegistry.js`, `src/pages/exchange/unified-truth/components/SHSOperationalMapboxMap.jsx`, `src/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx`, `src/pages/shf-command/components/SHFImpactOhioMap.jsx`, and the globe component files.

## Map / Source Authority Matrix

| Map / client | Feature category | Candidate source | Confirmed authority | Coordinate owner | Publication owner | Adapter status | Migration status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Quick Map | districts / infrastructure | Metaverse registry | UNKNOWN | Metaverse presentation registry candidate | UNKNOWN | Client-ready only | UNMAPPED / PROVISIONAL |
| Master City | facilities / districts | Metaverse relationship registry | Metaverse registry candidate | Metaverse master-city registry | Metaverse | READY WITH CONDITIONS | LEGACY |
| Regional scenes | route/context stops | Regional scene registry | Presentation registry only | Scene assets/registry | Metaverse | PARTIAL | LEGACY |
| Exchange / SHS Mapbox | county/operational signals | Exchange/SHS data surfaces | Boundary unresolved | Mapbox geographic view | Role-dependent | PARTIAL | LEGACY |
| SHF Public Impact | approved county impact | SHF impact data | SHF publication owner; records not approved | County GeoJSON candidate | SHF | BLOCKED | LEGACY |
| IEP County | county geometry | local Ohio GeoJSON | Geometry owner/provenance unresolved | IEP geometry asset | IEP/application policy | PARTIAL | LEGACY |

Wave 5D update: the qualified Census geometry now reaches the existing IEP
renderer through `CensusCountyGeometryAdapter`, the Spatial projection
pipeline, and `IepCountyClientAdapter`. The legacy preparation path is retained
as an explicit development rollback and is not retired.

Wave 5E update: Spatial is the default IEP county path. The old direct
preparation path is no longer the default, but remains a DEV-only rollback and
the dual-run remains a DEV-only diagnostic. Spatial failure is controlled and
does not silently fall back. The IEP migration is accepted with rollback
condition; the Census asset remains canonical and the ODOT asset remains an
independent legacy dependency.

## Wave 6A Revalidation

Wave 6A revalidated the remaining estate. Exchange/Capital remains blocked by
remote source provenance, token/external-service dependency, and mixed domain
identity. SHF remains blocked by publication state. ODOT TIMS is the strongest
next qualification candidate with `QUALIFIED_WITH_CONDITIONS` status; it must
remain a separate authority from Census. Metaverse regional scenes remain
presentation-oriented and partial. OperationalGlobe, RealGlobe, OutcomeGlobe,
and SHFOhioMapEngine remain reference or disposition candidates rather than
Spatial clients.
| Disconnected globes | globe overlays/arcs | component-local/remote data | UNKNOWN | Component-local | UNKNOWN | UNKNOWN | DISPOSITION PENDING |

The matrix intentionally leaves authority dimensions independent. A candidate source is not a confirmed source authority.

## Registry Use

Future implementation work may add evidence links, source IDs, and acceptance dates. It must not turn this planning table into a source-of-truth registry without a separate contract and review.
