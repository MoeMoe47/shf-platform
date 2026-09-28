# GEO-1 Wave 5B Existing-Map Regression Plan

## Purpose

Protect current map behavior before any production Spatial adapter or source mapping is introduced.

## Coverage Strategy

Quick Map remains the reference-quality baseline from Waves 4A–4E and is reused rather than duplicated. Wave 5B adds estate-level checks for route presence, source identity, publication, dependencies, and disconnected implementations.

| Estate family | Test approach | Boundary |
| --- | --- | --- |
| Quick Map | Reuse 56 legacy, 18 Wave 4A, 30 Wave 4B, 15 Wave 4C, 8 Wave 4D, 3 fixture tests, and 4 browser tests | No new mapping |
| Exchange / Capital | Static contract checks for route, Mapbox token, remote GeoJSON, and missing-token fallback | No token or network authority |
| SHF Impact | Route/source/static publication checks and sample-state assertions | Draft records remain unpublished |
| IEP county | Local GeoJSON schema, geometry derivation, fallback/error checks | Geometry provenance remains open |
| Disconnected globes | Export/dependency/static disposition checks | No mounting or restoration |
| Estate integrity | Registry counts, coordinate isolation, source identity, known fallback defect | No production fixes |

## Result Classes

```text
PASS
KNOWN_EXISTING_DEFECT
KNOWN_EXTERNAL_DEPENDENCY
BLOCKED_BY_PROVENANCE
REGRESSION
UNEXPECTED_FAILURE
```

## Browser Scope

The existing Chromium Quick Map parity/accessibility tests remain the browser baseline. New Wave 5B checks are static/unit-level unless a route can be exercised without live external services. The absent API service is recorded as an environmental dependency, not converted into a fabricated pass.
