# GEO-1A Gaps and Blockers

These are architecture questions for later phases. GEO-1A records them but does not solve implementation-level work prematurely.

| Gap or blocker | Impact | Candidate phase |
|---|---|---|
| Mapbox token/config policy | Exchange / Capital map setup and fallback remain undefined | GEO-4 |
| Remote GeoJSON provenance | Runtime geometry source/license/freshness remain unregistered | GEO-2, GEO-4 |
| Geometry persistence | Backend real-world geometry model is not defined | GEO-3 |
| County/jurisdiction crosswalk | Textual jurisdiction cannot be treated as geometry | GEO-3, GEO-6 |
| Quick Map calibration | Quick Map and master-city cannot be safely transformed | GEO-3, GEO-8 |
| Feature IDs | Canonical projected feature id rules are not implemented | GEO-3 |
| Public publication rules | Spatial eligibility depends on domain publication state | GEO-5 |
| Disconnected globe disposition | Unmounted map/globe candidates require non-destructive review | GEO-8 |
| Engine maturity classification | Transit/Sky Bridge and Emergency/Dispatch need runtime evidence before engine status | GEO-4, GEO-8 |
| Accessibility contract details | Surface-specific keyboard, text, and reduced-motion checks need definition | GEO-7 |
| Entity-to-county fallback remediation | Unknown entities can currently default to Franklin County | GEO-5, GEO-6 |
