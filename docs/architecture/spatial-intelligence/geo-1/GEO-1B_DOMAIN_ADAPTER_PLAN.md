# GEO-1B Domain Adapter Plan

Adapters are read-only projection boundaries unless a domain explicitly receives an action request. They do not mutate canonical state.

| Domain | Adapter readiness | Rationale |
|---|---|---|
| SHF | PARTIAL | Impact data and map surfaces exist, but public approval and entity-to-county fallback risks block direct authority use |
| SHS | PARTIAL | Operational map evidence exists, but source-of-record and Mapbox config policy need definition |
| Exchange / Capital | PARTIAL | Mounted route exists; token, remote geometry, and draft/local behavior require policy |
| CivicSure | PARTIAL | GPA/jurisdiction concepts exist; demo geography must remain non-authoritative |
| Career | PARTIAL | Metaverse/career references exist; canonical projection needs source contracts |
| Workforce | NOT YET JUSTIFIED | Roadmap/domain references exist; no GEO-1B adapter evidence sufficient for implementation |
| Projects | NOT YET JUSTIFIED | Roadmap/domain references exist; adapter evidence not yet sufficient |
| Opportunities | PARTIAL | Metaverse opportunity services exist in API domain; projection contract still needed |
| Events | PARTIAL | Metaverse event adapters exist; spatial/public boundaries need contract tests |
| Missions | READY WITH CONDITIONS | Mission resolver and projection service exist; must keep mission authority external |
| Metaverse | READY WITH CONDITIONS | Registries and runtime services exist; coordinate separation remains mandatory |
| Traffic | PARTIAL | Road trace/traffic authoring evidence exists; full traffic authority not confirmed |
| Water | PARTIAL | River flow/regional water evidence exists; behavior authority needs classification |
| Transit | BLOCKED | GEO-0 found registry-only/pending transit evidence |
| Emergency | BLOCKED | GEO-0 found capability metadata, not a confirmed dispatch engine |
