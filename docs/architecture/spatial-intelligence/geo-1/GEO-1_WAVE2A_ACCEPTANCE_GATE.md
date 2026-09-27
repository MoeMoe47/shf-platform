# GEO-1 Wave 2A Acceptance Gate

Status: COMPLETE WITH CONDITIONS

Wave 2A is complete when design and executable contract harnesses exist without production runtime integration.

## Acceptance Criteria

- Wave 1 committed cleanly
- feature-ID strategy accepted or explicitly refined
- selection lifecycle defined
- selection store contract defined
- interaction envelope defined
- event types defined
- publishers and subscribers defined
- replay policy defined
- stale selection policy defined
- coordinate-space isolation maintained
- public/private selection boundary defined
- accessibility behavior defined
- Wave 2 test matrix exists
- executable Wave 2A test harness exists
- no domain authority transferred
- no map integration occurred
- no production runtime behavior added beyond test helpers

## Wave 2B Readiness

READY WITH CONDITIONS.

Conditions:

- implement production store/bus from the accepted Wave 2A contract
- keep dispatch local and deterministic
- keep selection single-select unless a multi-select contract is added
- keep domain action requests separate from selection
- add URL/query sync only after privacy review
- add accessibility behavior before map integration acceptance
