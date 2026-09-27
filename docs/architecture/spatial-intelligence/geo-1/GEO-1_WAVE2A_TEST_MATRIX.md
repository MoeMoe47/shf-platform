# GEO-1 Wave 2A Test Matrix

Status: executable contract harness plus deferred runtime coverage

Executable harness:

- `tests/spatialSelectionInteractionWave2.test.mjs`

| Test | Status | Notes |
|---|---|---|
| valid selection accepted | IMPLEMENTED | test-only selection harness validates Wave 1 contracts |
| malformed selection rejected | IMPLEMENTED | rejects missing feature/source data |
| unknown feature rejected | IMPLEMENTED | feature catalog lookup required |
| wrong coordinate family rejected | IMPLEMENTED | Wave 1 registry validation |
| wrong coordinate space rejected | IMPLEMENTED | layer/space validation |
| Quick Map selection cannot silently become master-city | IMPLEMENTED | no transform and update rejected |
| METAVERSE selection cannot silently become REAL_WORLD | IMPLEMENTED | family mismatch rejected |
| clearing selection succeeds | IMPLEMENTED | lifecycle becomes `CLEARED` |
| domain record remains unchanged | IMPLEMENTED | frozen fixture remains unchanged |
| selection does not grant authorization | IMPLEMENTED | no auth flag added |
| NOT_PUBLISHED feature cannot become publicly exposed through selection | IMPLEMENTED | public projection remains false |
| REQUEST_DOMAIN_ACTION remains separate from SELECT | IMPLEMENTED | event type/action separation |
| interaction IDs unique | IMPLEMENTED | duplicate id rejected in test harness |
| correlation IDs preserved | IMPLEMENTED | publish result retains correlation id |
| malformed interaction rejected | IMPLEMENTED | required envelope fields checked |
| unknown interaction type rejected | IMPLEMENTED | Wave 1 interaction enum validation |
| subscriber failure does not corrupt selection state | IMPLEMENTED | publish returns isolated subscriber errors |
| stale selection handled safely | IMPLEMENTED | unavailable feature clears selection |
| duplicate subscription behavior deterministic | IMPLEMENTED | insertion order and handles tested |
| no event replay without explicit policy | IMPLEMENTED | late subscriber receives no prior events |

Deferred to Wave 2B:

- production selection store implementation
- production interaction bus implementation
- React integration, if needed
- URL/query sync implementation
- accessibility UI behavior
- map client integration
