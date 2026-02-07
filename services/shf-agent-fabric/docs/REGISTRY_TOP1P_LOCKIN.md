REGISTRY TOP 1% LOCK-IN CHECKLIST

A) DATA INTEGRITY + IMMUTABILITY
[ ] Strict schema validation per kind (app, agent, business)
[ ] Canonical hashing rules are deterministic and versioned
[ ] Append-only event log (no silent mutation)
[ ] Entity versioning: rev, prev_hash, changed_fields
[ ] Lifecycle enforcement: allowed transitions only
[ ] Idempotency keys for write operations

B) SECURITY + GOVERNANCE
[ ] RBAC roles (admin, auditor, operator, readonly)
[ ] Scoped keys + rotation process
[ ] Rate limiting + abuse protection
[ ] Input hardening: size limits, allowlists
[ ] Redaction rules in logs and responses
[ ] Break-glass admin flow is audited

C) AUDIT + COMPLIANCE OUTPUTS
[ ] Signed registry snapshot export
[ ] Signed event log export (time windows)
[ ] Verification endpoint: recompute hashes, detect tamper
[ ] Proof bundle generator (export + signatures)
[ ] Audit summary endpoint (counts, diffs, anomalies)

D) OPERATIONS
[ ] Pagination/filter/search for registry and events
[ ] Concurrency safety (locks) for writes
[ ] Backup + restore scripts and a restore drill
[ ] Deep health checks + integrity check
[ ] Schema migration tooling

E) QUALITY GATES
[ ] CI hard gates for lint/type/test/contract
[ ] Coverage minimum for registry + events
[ ] Golden vectors for hashing + lifecycle transitions
[ ] One-command smoke test script
