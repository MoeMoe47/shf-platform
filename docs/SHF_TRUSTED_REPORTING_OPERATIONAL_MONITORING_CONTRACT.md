# SHF Trusted Reporting Operational Monitoring Contract

## Authority and boundary

Operational telemetry describes runtime behavior only. It is not Evidence,
Truth, a Metric Registry definition, an institutional audit decision, or a
public report. Telemetry cannot grant approval, change population eligibility,
or fabricate a report result.

The TypeScript and Python runtime adapters emit the same allowlisted event
shape: `event_name`, `severity`, `component`, `category`, `timestamp`,
`outcome`, and safe scalar `metadata`. The default sink is structured stdout or
the runtime logger; a future Azure Monitor/Application Insights exporter can be
attached without coupling reporting code to Azure. Sink failure is isolated and
never blocks canonical work.

## Severity and outcomes

`INFO` records successful lifecycle signals. `WARNING` records degradation,
retry, quarantine, throttling, or expected security/domain rejection.
`ERROR` records infrastructure or delivery failure. `CRITICAL` is reserved for
sustained inability to persist canonical state, schema/integrity failure, or
equivalent unsafe operation.

Outcomes distinguish `SUCCESS`, `EXPECTED_DOMAIN_REJECTION`,
`DATA_UNAVAILABLE`, `SYSTEM_FAILURE`, and `SECURITY_ANOMALY`. Invalid
credentials, missing sign-offs, unverified sources, and ordinary permission
denials are not outage alerts by themselves.

## Safe event model

Metadata is allowlisted to request/correlation references, route/event class,
status, reason, limiter class, migration state, safe counts, durations,
backend, worker state, and hashed producer references. Passwords, tokens,
HMAC signatures, database URLs, payloads, participant identifiers, Evidence,
and Truth data are rejected from emitted metadata.

## Alert conditions

`evaluateBacklogAlerts` produces code-level conditions for pending count,
oldest pending age, quarantine growth, and pending work without recent
success. The thresholds are configured with:

- `SHS_MONITOR_BACKLOG_MAX_PENDING`
- `SHS_MONITOR_BACKLOG_MAX_OLDEST_AGE_SECONDS`
- `SHS_MONITOR_BACKLOG_NO_SUCCESS_AGE_SECONDS`
- `SHS_MONITOR_QUARANTINE_DELTA_THRESHOLD`

Production requires positive explicit values. Development/test uses clearly
marked defaults only. These values are `PRODUCTION_POLICY_VALUE_REQUIRED`, not
institutionally approved thresholds.

## Signal coverage

| Component | Signals | Type/severity | Status |
|---|---|---|---|
| SHS API | request internal errors, auth/session failures | structured `ERROR`/security signal | Hook implemented |
| Agent Fabric ingestion | accepted, idempotent replay, validation/auth rejection, persistence failure | `INFO`/expected rejection/`CRITICAL` | Hook implemented |
| PostgreSQL | limiter backend failure and DB dependency errors | `ERROR` | Hook implemented at limiter; generic adapter available |
| Migration readiness | current, pending, drift, unknown history, unavailable | readiness state | Existing readiness contract |
| Outbox worker | claimed, success, retry, quarantine, failure | `INFO`/`WARNING`/`ERROR` | Hook implemented; backlog repository exists |
| Rate limiter | allowed, rejected, backend failure by class | aggregate operational signal | Hook implemented in SHS and Agent Fabric |
| Truth pipeline | projection/evidence/source/truth errors | domain vs system classification | Existing typed errors; telemetry adapter available |
| Metric calculator | success, unknown metric, unavailable, calculation failure | operational outcome | Existing typed errors; adapter available |
| Reporting service | generation/persistence failure and unavailable authoritative data | outcome classification | Existing typed errors; adapter available |
| Governance | denied, missing authority/sign-off, stale version, system failure | expected denial vs error | Existing route/service boundaries; adapter available |
| Publication | snapshot, authorization, execution, projection, integrity failures | expected rejection vs `ERROR` | Existing typed route errors; adapter available |
| Public projection | successful read, unavailable, internal failure, throttling | public operational aggregate | Public route and limiter hooks; no identity logging |

## Health, readiness, and backlog

Liveness means the process/event loop is alive. Readiness means required
dependencies and schema are safe for work. Alerts indicate attention is needed;
they do not automatically change liveness or readiness. Worker downstream
outage may be degraded while liveness remains healthy. Public health responses
must remain aggregate and secret-free; detailed backlog/status access belongs to
an internal authenticated operational surface when deployed.

Existing worker backlog fields are the source for pending, leased, retryable,
quarantined, oldest-pending, and last-success state. No second worker-state
store or telemetry database is introduced.

## Correlation, security, and deployment

Existing request/correlation and immutable event identifiers remain distinct;
telemetry does not replace either. Internal HMAC authentication, producer/event
binding, tenant/org authorization, and reporting governance remain mandatory.
Azure Monitor, Application Insights, and Log Analytics are deferred exporters,
not local runtime dependencies. Azure remains
`DEFERRED_EXTERNAL_INFRASTRUCTURE`; Auth0 remains
`DEFERRED_EXTERNAL_CONFIGURATION`; Hub remains
`WAITING_FOR_REAL_CANONICAL_DATA`.
