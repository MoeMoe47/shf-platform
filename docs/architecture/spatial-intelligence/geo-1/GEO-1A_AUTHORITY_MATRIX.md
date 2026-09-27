# GEO-1A Authority Matrix

Default rule: Spatial may not mutate canonical state. Any exception requires repository evidence and a later implementation-phase decision.

| Domain | Source Authority | Spatial May Read | Spatial May Project | Spatial May Request Action | Spatial May Mutate Canonical State | Evidence |
|---|---|---:|---:|---:|---:|---|
| SHF | SHF domain, Truth/reporting publication gates | YES | YES | YES | NO | `src/data/shfImpactData.js`, `src/pages/shf-command/SHFImpactCommandCenter.jsx` |
| SHS | SHS operational systems | YES | YES | YES | NO | `src/pages/exchange/unified-truth/components/SHSOperationalMapboxMap.jsx` |
| Exchange / Capital | Exchange / Capital and Truth Spine | YES | YES | YES | NO | `src/routes/exchangeRoutes.jsx`, `src/router/CapitalRoutes.jsx` |
| CivicSure | CivicSure/GPA assurance services | YES | YES | YES | NO | `apps/shf-web/src/pages/civicsure/explorer/civicsureExplorerMockData.js`, `apps/shs-api/migrations/099_government_program_assurance_source_scope.sql` |
| Career | Career domain | YES | YES | YES | NO | Metaverse destination and mission references in GEO-0 packet |
| Curriculum | Curriculum domain | YES | YES | YES | NO | Metaverse learning/curriculum references in GEO-0 packet |
| Learning Arcade | Learning Arcade domain | YES | YES | YES | NO | Metaverse learning/activity references in GEO-0 packet |
| Workforce | Workforce domain | YES | YES | YES | NO | GEO-0 roadmap domain boundary |
| Projects | Projects domain | YES | YES | YES | NO | GEO-0 roadmap domain boundary |
| Opportunities | Opportunities domain | YES | YES | YES | NO | Metaverse opportunities references in GEO-0 packet |
| Data Center Initiative | Owning initiative/domain services | YES | YES | YES | NO | Metaverse asset and facility references in GEO-0 packet |
| BOS | BOS domain/service authority | YES | YES | YES | NO | GEO-0 roadmap domain boundary |
| OAS | OAS domain/service authority | YES | YES | YES | NO | GEO-0 roadmap domain boundary |
| Agent Fabric | Agent Fabric | YES | YES | YES | NO | GEO-0 roadmap domain boundary |
| Truth Spine | Truth Spine | YES | YES | YES | NO | GEO-0 authority boundary |
| Oracle | Oracle | YES | YES | YES | NO | GEO-0 authority boundary |
| Watchtower | Watchtower | YES | YES | YES | NO | GEO-0 authority boundary |
| Events | Events domain | YES | YES | YES | NO | Metaverse event references in GEO-0 packet |
| Missions | Missions domain | YES | YES | YES | NO | `apps/shs-api/src/domain/metaverse/missions/mission-location-resolver.ts` |
| Metaverse | Metaverse registries and engines | YES | YES | YES | NO | `apps/shs-api/src/domain/metaverse/registry/city-registry.ts`, `src/system/metaverse/metaverseNavigationModel.js` |
| Traffic | Traffic authority or engine when confirmed | YES | YES | YES | NO | `src/system/metaverse/metaverseRoadTraceRegistry.js` |
| Water Mobility | Water mobility authority or engine when confirmed | YES | YES | YES | NO | `src/system/metaverse/metaverseRiverFlowRegistry.js`, `src/system/metaverse/regionalSceneRegistry.js` |
| River Flow | River behavior authority or registry | YES | YES | YES | NO | `src/system/metaverse/metaverseRiverFlowRegistry.js` |
| Ocean | Ocean/regional scene authority | YES | YES | YES | NO | `src/system/metaverse/regionalSceneRegistry.js` |
| Transit | Transit authority when confirmed | YES | YES | YES | NO | GEO-0 found registry-only/pending transit evidence |
| Emergency / Dispatch | Emergency/dispatch authority when confirmed | YES | YES | YES | NO | GEO-0 found metadata/capability evidence only |
| Identity | Identity/auth services | YES | LIMITED | YES | NO | Route guard and permission systems remain external |
