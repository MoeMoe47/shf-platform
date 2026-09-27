# GEO-1B Foundation Architecture

Status: implementation plan only

GEO-1B translates GEO-1A contracts into an implementation-ready architecture. It does not build the Spatial Engine.

## Proposed Structure

```text
Spatial Engine
├── Coordinate Space Registry
├── Feature Registry
├── Layer Registry
├── Selection Engine
├── Highlight / State Engine
├── Temporal Projection
├── Route / Path Projection
├── Viewport / Camera State
├── Interaction Bus
├── Domain Adapter Contract
└── Public / Private Projection Boundary
```

## Module Plan

| Module | Purpose | Inputs | Outputs | Dependencies | Authority boundary | Persistence | State | Location | Consumers | Testing | Phase |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Coordinate Space Registry | Register coordinate families and spaces | coordinate definitions, provenance | validated coordinate-space lookup | GEO-1A coordinate contract | owns metadata, not transforms unless registered | versioned registry file first | mostly stateless | shared | adapters, clients, tests | isolation and validation tests | Wave 1 |
| Feature Registry | Normalize projected feature metadata | adapter projections | feature collection | coordinate registry, publication boundary | owns projected identity only | no canonical domain persistence | stateless | shared | layers, selection, clients | contract tests | Wave 1 |
| Layer Registry | Define layer metadata and policies | layer definitions | layer lookup and eligibility hints | feature registry, public/private model | owns layer identity, not data truth | versioned registry file first | stateless | shared | map clients, adapters | registry validation tests | Wave 1 |
| Selection Engine | Coordinate shared selected feature state | interactions, URL/query state, auth context | selection context | feature registry, interaction bus | owns selection, not permission or truth | client session/query only initially | stateful | browser/shared | panels, maps | lifecycle and accessibility tests | Wave 2 |
| Highlight / State Engine | Convert eligible source state into presentation state | feature state, temporal data, selection | visual state tokens | temporal projection, verification metadata | owns presentation calculation only | none initially | stateless with selection input | shared/browser | clients | conflict and no-fabrication tests | Wave 3 |
| Temporal Projection | Calculate time-aware presentation categories | source timestamps, timezone, freshness | temporal projection state | provenance model | owns display category, not scheduler | none | stateless | shared | state engine, timelines | timezone/freshness tests | Wave 3 |
| Route / Path Projection | Present domain route/path geometry | route records, path geometry, coordinate space | projected paths | coordinate registry, adapters | owns route display, not route authority | none initially | stateless | shared/browser | map clients | path coordinate tests | Wave 4 |
| Viewport / Camera State | Share viewport/camera intent | map events, saved view hints | viewport/camera context | coordinate registry | owns camera state only | browser session first | stateful | browser | maps, panels | sync and reset tests | Wave 2 |
| Interaction Bus | Carry spatial events | publisher events | subscriber events | selection engine, auth handoff | owns event envelope, not action approval | debug log only if approved later | stateful runtime | browser/shared | maps, panels, adapters | event and replay tests | Wave 2 |
| Domain Adapter Contract | Define how domains project eligible records | domain read models | spatial features/layers/actions | all contracts | adapters do not mutate source truth | none in shared contract | stateless | shared/server/frontend as needed | domains, projection layer | adapter contract tests | Wave 1 |
| Public / Private Projection Boundary | Enforce projection eligibility | auth context, publication state, feature metadata | filtered projections | domain adapters, identity/publication inputs | enforces, does not authorize | none | stateless | server/shared/client defense-in-depth | adapters, clients | boundary tests | Wave 3 |
