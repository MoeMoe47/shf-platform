# GEO-1B Module Boundary Matrix

| Module | Owns | Reads | Produces | Must Not Own | Runtime | Persistence | Consumers |
|---|---|---|---|---|---|---|---|
| Coordinate Space Registry | family and coordinate-space metadata | registry definitions | validated coordinate-space records | source geography truth, unregistered transforms | shared | versioned static registry first | adapters, tests, map clients |
| Feature Registry | projected feature identity | domain projections | normalized feature records | canonical domain records | shared | none initially | layers, selection, clients |
| Layer Registry | layer identity and layer policy metadata | layer definitions | layer records | source data, metrics, approvals | shared | versioned static registry first | map clients, adapters |
| Selection Engine | active spatial selection context | features, interactions, URL/query hints | selection state | permissions, verification, domain mutation | browser/shared | session/query only | panels, maps |
| Highlight / State Engine | presentation states | domain state refs, selection, temporal state | visual state tokens | domain workflow state | shared/browser | none | map clients |
| Temporal Projection | display time category | timestamps and freshness | temporal projection | scheduler, event authority | shared | none | state engine |
| Route / Path Projection | path presentation | route geometry and coordinate spaces | projected routes | traffic/transit/water authority | shared/browser | none | map clients |
| Viewport / Camera State | viewport/camera context | map viewport events | viewport model | coordinate truth | browser | session only | maps, panels |
| Interaction Bus | event envelope and dispatch | events from publishers | delivered interactions | action approval | browser/shared | none initially | maps, panels |
| Domain Adapter Contract | projection interface | domain read models | feature/layer/action projections | source authority | shared/server/frontend | none | domain adapters |
| Public / Private Projection Boundary | projection eligibility filtering | auth context, publication state | filtered feature sets | identity/auth authority | server/shared/client | none | adapters, clients |
