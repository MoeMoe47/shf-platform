# GEO-1 Wave 3B Production Runtime Implementation Report

Status: COMPLETE WITH CONDITIONS. The generic projection runtime is implemented and verified against the frozen Wave 3B contract. No map or domain integration was performed.

## Runtime Modules

- `src/system/spatial/projection/index.js`: public runtime exports.
- `src/system/spatial/projection/ProjectionAdapterRegistry.js`: immutable identity snapshots, collision rejection, and adapter lookup.
- `src/system/spatial/projection/projectionPipeline.js`: adapter-to-feature projection, eligibility, state dimensions, client projection, and viewer-aware lookup.
- `src/system/spatial/projection/presentationStateResolver.js`: multi-dimensional presentation resolution and modifier ordering.
- `src/system/spatial/projection/diagnostics.js`: static structured diagnostic catalog and client-safe reduction.
- `src/system/spatial/projection/freshness.js`: source-supplied and layer-declared freshness evaluation.
- `src/system/spatial/projection/temporal.js`: deterministic temporal parsing and EVENT_SOON/EVENT_LIVE categorization.

## Adapter Registry

`createProjectionAdapterRegistry()` validates frozen adapters, snapshots identity methods at registration, rejects atomic collisions under `${domain}::${featureType}`, and exposes no replacement or removal API.

## Projection Pipeline

The pipeline preserves adapter authority and provenance, validates the resulting `SpatialFeature`, evaluates publication and viewer eligibility, calculates temporal/freshness dimensions, and returns an internal result that is distinct from the client result.

## Presentation Resolver

Presentation is multi-dimensional: domain, temporal, selection, availability, verification, publication, highlight, freshness, resolved visual state, and ordered modifiers are retained separately. Rendering precedence does not rewrite domain-owned dimensions.

## Internal / Client Boundary

Client results are constructed from explicit allowlists. Invalid and suppressed results are omitted. Restricted records use `HIDE`, `NOTICE`, or source-supplied `GENERALIZED` behavior; hidden and unknown lookup IDs return the same `FEATURE_NOT_AVAILABLE` response shape.

## Diagnostics

The frozen 17-code catalog is implemented with static messages, stage/severity/blocking metadata, safe-for-client flags, and the accepted diagnostic detail-key allowlist. Production logic does not parse human-readable messages.

The earlier 16-code reference is superseded documentation. DEC-008 adds `INVALID_ADAPTER`, and the reconciled Wave 3B test plan explicitly freezes the catalog at 17 codes. No runtime code is undocumented or missing from the frozen catalog.

## Privacy / Masking

Publication and viewer eligibility are evaluated before client projection. Restricted notices contain only the frozen placeholder fields. Generalized output uses only source-supplied generalized geometry; no geometry is invented.

## Emergency Authority

`PRODUCTION_EMERGENCY_AUTHORITIES` is an immutable empty list. EMERGENCY is retained as source state, but rendered only for a confirmed injected authority and appropriate verification/viewer context. Spatial never infers EMERGENCY from labels, layers, highlights, or keywords.

## Temporal Behavior

- `SCHEDULED` is domain-supplied only.
- `EVENT_SOON` uses a domain-supplied flag or an explicit layer threshold and authority. The window is inclusive at `start - threshold` and exclusive at `start`.
- `EVENT_LIVE` requires valid source start/end data on a time-aware layer.
- Local timezone values are resolved deterministically, including the tested DST transition. No implicit system clock is read; callers provide the clock.

## Freshness Behavior

Freshness supports `CURRENT`, `STALE`, and `UNKNOWN`. It uses supplied freshness first, otherwise a layer-declared positive `maxSourceAge`. Stale policies are `MARK_STALE`, `SUPPRESS`, and `UNAVAILABLE`, with `MARK_STALE` as the safe default.

## Accessibility

Projected results provide accessible labels, state text, selected/highlighted state, freshness text, verification text, and restricted/unavailable semantics without requiring a map renderer.

## Provenance

Source authority, source record ID, adapter identity, projection version, evidence reference, coordinate provenance, freshness, and timestamps remain available internally. Client provenance is reduced to the accepted safe subset. Adapter projection-version mismatches produce `INVALID_PROVENANCE`.

## Verification

| Suite | Result |
|---|---:|
| Wave 1 | 18/18 PASS |
| Wave 2A | 11/11 PASS |
| Wave 2B | 13/13 PASS |
| Wave 3A | 11/11 PASS |
| Wave 3B runtime | 27/27 PASS |
| Wave 3B presentation | 36/36 PASS |
| Combined Spatial | 116/116 PASS |

`npm run build`: PASS. Existing Vite warnings about ASL JSON import shape and large chunks remain outside this phase.

## Scope Confirmation

No Quick Map, Mapbox, SHF, Exchange, master-city, Metaverse scene, backend persistence, domain adapter integration, route/path engine, Geographic Command Center, emergency authority, or coordinate transform was added. The existing `entityToCounty` fallback was not modified.

## Remaining Conditions

1. The runtime is generic and has no production domain adapters.
2. The runtime is intentionally uncommitted for review.
3. Map and Quick Map clients remain future integration work.
