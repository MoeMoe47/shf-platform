# GEO-1 Wave 3A Test Matrix

Executable contract harness:

- `tests/spatialProjectionStateWave3.test.mjs`

Verified result: 11/11 test cases PASS. Several matrix rows are covered together in a single case. Harness gaps are listed under Open Conditions in `GEO-1_WAVE3A_ACCEPTANCE_GATE.md`.

| Test | Status |
|---|---|
| valid domain fixture projects | IMPLEMENTED |
| invalid record rejected | IMPLEMENTED |
| missing source authority rejected | IMPLEMENTED |
| unknown coordinate space rejected | IMPLEMENTED |
| coordinate family mismatch rejected | IMPLEMENTED |
| NOT_PUBLISHED suppressed | IMPLEMENTED |
| RESTRICTED handled safely | IMPLEMENTED |
| provenance preserved | IMPLEMENTED |
| sourceRecordId preserved | IMPLEMENTED |
| selection creates presentation selection state only | IMPLEMENTED |
| selection does not alter domain fixture | IMPLEMENTED |
| selected + restricted conflict handled deterministically | IMPLEMENTED |
| selected + mission-active retains mission information | IMPLEMENTED |
| stale feature marked/suppressed according to policy | IMPLEMENTED |
| missing temporal values are not inferred | IMPLEMENTED |
| valid event time can produce deterministic temporal category (`upcoming`, `live` -> `EVENT_LIVE`) | IMPLEMENTED |
| SCHEDULED not derived from future start time alone (GEO1-WAVE3A-DEC-003) | IMPLEMENTED |
| domain-supplied SCHEDULED preserved alongside selection | IMPLEMENTED |
| domain CLOSED with future start never resolves to SCHEDULED | IMPLEMENTED |
| domain-supplied SCHEDULED with missing dates keeps unknown date | IMPLEMENTED |
| adapter collision rejected | IMPLEMENTED |
| missing adapter diagnosed | IMPLEMENTED |
| invalid layer rejected | IMPLEMENTED |
| accessible label preserved | IMPLEMENTED |
| Quick Map/master-city isolation still passes | IMPLEMENTED |
| REAL_WORLD/METAVERSE isolation still passes | IMPLEMENTED |
| no Franklin County fallback introduced | IMPLEMENTED |
| no domain mutation | IMPLEMENTED |
| no publication authority created | IMPLEMENTED |

Deferred to Wave 3B:

- production projection adapter registry implementation
- production projection pipeline implementation
- production presentation state resolver implementation
- map client consumption
- Quick Map integration
