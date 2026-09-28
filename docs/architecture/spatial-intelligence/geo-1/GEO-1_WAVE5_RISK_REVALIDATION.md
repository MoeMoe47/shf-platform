# GEO-1 Wave 5 Risk Revalidation

| Risk | Current status | Repository evidence | Wave 5 implication |
| --- | --- | --- | --- |
| `entityToCounty.js` Franklin fallback | CONFIRMED | `src/system/resolvers/entityToCounty.js:4-9` maps unknown values to Franklin. | Integrity blocker; do not use for Spatial geography. |
| SHF public-impact route | CHANGED | `src/router/FoundationRoutes.jsx:33-43` currently declares `impact`; the separate `shf.html` entry is distinct and still requires route verification. | Preserve route behavior; browser-confirm before onboarding. |
| Quick Map/master-city ambiguity | CONFIRMED | Quick Map registry uses its own asset/dimensions and `quick-map` ID; master-city relationship registry validates another space. | No transform; keep separate adapters/spaces. |
| Exchange Mapbox token | CONFIRMED | `SHSOperationalMapboxMap.jsx:31,2362-2377` reads `VITE_MAPBOX_TOKEN`; missing token renders a fallback at `2619-2622`. | Configuration and failure-mode tests required. |
| Remote county GeoJSON provenance | CONFIRMED | Mapbox component uses Plotly raw GitHub GeoJSON at lines 33-34; local county files also exist. | License/provenance and fallback policy required. |
| Disconnected globe candidates | CONFIRMED | `OperationalGlobe`, `RealGlobe`, and `OutcomeGlobe` exist; no confirmed current importers were found. | Preserve and classify before disposition. |
| Persisted geometry schema | UNKNOWN | Frontend geometry files exist, but no accepted domain geometry persistence contract was established in this pass. | Blocks durable source mapping, not planning. |
| SHF public publication eligibility | CONFIRMED | `shfImpactData.js:19-21` requires `publicApproved === true`; current records at lines 31-38 are sample/unapproved. | Public Spatial projection remains blocked. |
| Transit / Sky Bridge maturity | CONFIRMED | Capability/scene terminology exists, but no confirmed transit engine authority was found. | Keep blocked; no adapter. |
| Emergency / Dispatch maturity | CONFIRMED | Regional scene capability metadata contains emergency terms, but no confirmed authority exists. | Keep production emergency authority empty. |

## Interpretation

No listed risk is resolved merely by the presence of a component or asset. This pass changes no production behavior.
