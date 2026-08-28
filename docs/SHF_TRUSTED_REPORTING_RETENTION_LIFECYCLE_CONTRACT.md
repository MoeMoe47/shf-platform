# SHF Trusted Reporting Retention and Lifecycle Contract

Status: `CODE_COMPLETE_PRODUCTION_POLICY_VALUES_PENDING`

## Authority and classes

Retention is a maintenance concern, not a Truth, Metric Registry, reporting,
or governance authority. The allowlisted lifecycle manager is the only
repository-owned cleanup path. It does not accept arbitrary table names and it
does not run during API startup.

| Class | Meaning | Automatic deletion |
|---|---|---|
| `IMMUTABLE_INSTITUTIONAL_HISTORY` | Truth/Evidence/Source lineage, governance and publication history, audit, migration history | Never |
| `LONG_LIVED_CANONICAL_STATE` | Current canonical identity, memberships, reports and authoritative records | Never by this mechanism |
| `BOUNDED_OPERATIONAL_STATE` | Rate windows and safely acknowledged delivered outbox rows | Allowlisted, configured, batched |
| `SHORT_LIVED_SECURITY_STATE` | Expired or revoked SHS sessions | Allowlisted, configured, batched |
| `DERIVED_REGENERABLE_STATE` | Rebuildable projections or aggregates | No deletion in this slice |
| `DEVELOPMENT_ONLY` | Local JSONL/SQLite, fixtures, sample and demo stores | Environment-specific, outside production lifecycle |
| `LEGACY_NONCANONICAL` | Browser/localStorage, static/demo and old publisher paths | Separate audit required |
| `UNKNOWN_REQUIRES_DECISION` | No current Trusted Reporting store | None identified |

## Persistence inventory

| Store/table | Owner and purpose | Authority / lifecycle | Sensitive data | Enforcement |
|---|---|---|---|---|
| `integration_outbox` | SHS transactional delivery queue | Bounded operational; only old `DELIVERED` rows with canonical downstream acknowledgment represented by delivered status may be cleaned | Event references/payload | Allowlisted delivered cleanup; pending, retryable, leased and quarantined are preserved |
| `rate_limit_windows` | SHS/Agent Fabric shared abuse-control counters | Bounded operational | Service/user key reference | Expired rows only, indexed and batch-limited |
| `shs_identity_sessions` | SHS opaque browser sessions | Short-lived security state | Identity linkage | Expired or old revoked rows only; active rows preserved |
| `identity_provider_links` | SHS canonical provider-subject mapping | Long-lived canonical state | Provider subject | Never cleaned by this mechanism |
| `organizations`, `users`, `memberships`, `roles`, `role_permissions` | SHS identity and authorization | Long-lived canonical state | Identity/membership | No automatic deletion |
| Operational Events, Evidence, Sources, Truth claims/versions/history | Agent Fabric Truth Spine | Immutable institutional history | Potential participant-linked data | No automatic deletion |
| `audit_events` and public-population governance events | Institutional audit/governance | Immutable institutional history | Actor/scope references | No automatic deletion |
| Report drafts/revisions, artifacts, distribution and disclosure records | SHS reporting and restricted distribution | Long-lived canonical state / immutable decision history | Organization and recipient data | No automatic deletion |
| Eligibility, disclosure, snapshots, publication authorities/authorizations/publications | Public governance and publication history | Immutable institutional history | Scope and actor references | No automatic deletion; snapshots remain immutable |
| `shf_public_impact_projections` | Published public read model | Derived/regenerable plus published-state availability | Public-safe data | No cleanup in this slice; current published state must remain available |
| `schema_migrations` | Deployment history | Immutable institutional history | None | Never cleaned |
| Agent Fabric JSONL/SQLite stores | Local development persistence | Development-only | May contain test data | Not a production lifecycle target |
| Browser `localStorage`, static/demo/sample records, legacy publishers | Presentation/noncanonical compatibility | Legacy noncanonical | May contain user-entered data | Separate legacy cleanup decision required |
| Durable telemetry/log sinks | Operational observability | Bounded operational, deployment-owned where external | Must be redacted | Azure/log retention configuration remains external |

## Never-delete boundary

The lifecycle manager contains no target for Truth, Evidence, Sources, Truth
history, report history, governance sign-offs, eligibility, disclosure,
snapshots, publication authorization/history, public projections, audit events,
identity links, memberships, or migration history. Revocation is represented by
state/history in the owning subsystem, not by deleting prior decisions.

## Allowlisted cleanup

Commands are:

```text
npm run lifecycle:status
npm run lifecycle:plan
npm run lifecycle:cleanup
```

`cleanup` requires the CLI's explicit `--confirm` flag. Every target uses
database time, indexed predicates, a bounded batch, `FOR UPDATE SKIP LOCKED`,
and an atomic transaction. Repeated runs are idempotent. Plan/status perform
queries only and expose aggregate counts and oldest timestamps, never payloads.

The cleanup targets are expired `rate_limit_windows` rows, expired or old
revoked sessions, and `integration_outbox` rows with `delivery_status =
'DELIVERED'` plus an aged `delivered_at`. Pending, retryable, active leased,
failed-final, and quarantined outbox rows are never candidates. Quarantined
rows require manual review/replay/closure. Identity links are never session-TTL
data. No cleanup deletes through a caller-supplied table or identifier.

## Policy and failure behavior

Supported configuration names:

```text
SHS_RETENTION_RATE_LIMIT_WINDOW_SECONDS
SHS_RETENTION_DELIVERED_OUTBOX_SECONDS
SHS_RETENTION_EXPIRED_SESSION_SECONDS
SHS_RETENTION_REVOKED_SESSION_SECONDS
SHS_RETENTION_CLEANUP_BATCH_SIZE
```

Missing duration values produce `production_policy_value_required_no_delete`.
There is no production duration default. The batch size has a bounded safe
default of 100 and may be overridden. Invalid values fail closed. Cleanup
errors roll back the current batch and exit non-zero; telemetry contains only
safe target/count/result metadata.

No legal or institutional duration is asserted. Production duration approval
remains `PRODUCTION_POLICY_VALUE_REQUIRED` and
`INSTITUTIONAL_RETENTION_POLICY_REQUIRED` where applicable.

## Referential integrity and deployment

Session and outbox cleanup is deliberately limited to rows whose owning tables
do not serve as canonical-history parents. Local runtime proof verified the
foreign-key-backed session identity remained intact and that pending outbox
state remained present. Azure ACA may invoke this as a separate maintenance
job/worker step later; Azure is not required by the implementation.

Future archival or deletion of canonical institutional data requires a separate
institutional authority, audit record, approved policy, and restore proof. It
is not part of lifecycle maintenance.
