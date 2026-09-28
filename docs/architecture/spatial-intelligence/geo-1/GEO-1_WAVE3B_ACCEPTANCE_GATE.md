# GEO-1 Wave 3B Acceptance Gate

## Part 1: Design Addendum Gate

Status: COMPLETE WITH CONDITIONS

| Open condition (from Wave 3A gate) | Resolution | Decision |
|---|---|---|
| EMERGENCY priority | Resolved. Domain-supplied by allowlisted authority only; outranks presentation, not visibility; never inferred. Production rendering from a real source is BLOCKED because no emergency authority exists | GEO1-WAVE3B-DEC-001 |
| Non-projected masking | Resolved. Internal and client result layers, per-status client contract, no existence oracle | GEO1-WAVE3B-DEC-002 |
| Adapter collision diagnostics | Resolved. `ADAPTER_COLLISION` is canonical; atomic rejection; no replacement | GEO1-WAVE3B-DEC-003 |
| State coverage | Resolved. Coverage matrix in addendum §9; every state has a Wave 3B test | addendum §9 |
| EVENT_SOON threshold | Resolved. Domain flag or domain-configured threshold only; non-calculable by default | GEO1-WAVE3B-DEC-004 |
| Stale policy | Resolved. `freshnessState` dimension; layer `stalePolicy` of `MARK_STALE`, `SUPPRESS`, or `UNAVAILABLE`; no invented freshness rule | GEO1-WAVE3B-DEC-005 |
| Structured diagnostics | Resolved. Schema plus 16-code catalog; no string-parsing classification in production | GEO1-WAVE3B-DEC-006 |
| Resolution ordering | Resolved. 8-stage algorithm; render priority is separate from authority | GEO1-WAVE3B-DEC-007 |
| Internal/client boundary | Resolved. See addendum §3 | GEO1-WAVE3B-DEC-002 |
| Test plan | Resolved. 63 required production tests | `GEO-1_WAVE3B_TEST_PLAN.md` |

Scope confirmation at design time:

- no map integration
- no Quick Map integration
- no production adapter registry
- no production projection pipeline
- no production state resolver
- no domain authority transfer
- no coordinate transforms
- no production files changed

Conditions:

1. EMERGENCY rendering from any real source remains BLOCKED until GEO-4/GEO-8 confirms an emergency engine and it is allowlisted by decision. Concurrent EMERGENCY with another lifecycle state is deferred.
2. Structured validation codes require an additive change to Wave 1 validators. Existing `errors` strings and all Wave 1 and Wave 2 tests must remain unchanged.
3. EVENT_SOON is non-calculable in production until an event authority supplies a flag or threshold configuration.
4. `stalePolicy`, `maxSourceAge`, `freshnessAuthority`, `soonThreshold`, `soonThresholdAuthority`, and mask mode are new optional layer or record fields. They need to be added to the layer contract when implemented.
5. Route-derived NEXT is deferred to the route/path wave.

## Part 2: Production Wave 3B Gate

Status: NOT STARTED

Production Wave 3B may be accepted only when:

- all 63 tests in `GEO-1_WAVE3B_TEST_PLAN.md` are implemented and pass
- all prior Spatial suites pass unmodified (53 at baseline `954560b`)
- `npm run build` passes
- no production module imports a fixture
- no map, Quick Map, Mapbox, SHF route, or `entityToCounty` change
- no real domain adapter, persistence, migration, or coordinate transform
- no production emergency authority is registered
- no production diagnostic classification parses message strings

## Production Wave 3B Readiness

READY WITH CONDITIONS (conditions 1–5 above).
