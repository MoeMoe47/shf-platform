# SHF Trusted Reporting Production Policy Register

Date: 2026-08-26
Status: `SHF_PRODUCTION_POLICY_BASELINE_V1_RECORDED`

This register records the institutionally approved SHF Trusted Reporting
Production Operational Policy Baseline v1. Approval applies to SHF Trusted
Reporting and shared technical infrastructure only. Policy approval is separate
from deployment configuration and runtime proof; production startup must
continue to fail closed when required values are absent.

## Decision summary

### Approved SHF baseline v1

The rate-limit window mechanics, monitoring threshold mechanics, lifecycle
batching, and operational retention predicates are code-complete and accept the
approved values below without schema or code changes. Staging may use the
staging column explicitly; it must not be inherited implicitly by production.

### Approved SHF baseline v1

The approved operational values are marked `APPROVED_SHF_BASELINE_V1` below.
They may be tuned through existing configuration points only under controlled
review. False positives, legitimate load, backlog behavior, and abuse signals
must be monitored after activation.

### Requires security/operations approval

Future changes to approved operational values or limiter scope require security
and operations review before rollout.

### Requires privacy/legal approval

Any duration involving sessions, identity-linked security records, participant-
linked operational references, audit records, or recipient information requires
privacy/legal review. Canonical institutional records remain no-automatic-delete
regardless of these recommendations.

### Requires executive risk approval

Backup/recovery targets and any future change to canonical-history retention
require executive risk acceptance and institutional authority.

## Policy register

| Policy ID | Configuration | Subsystem / meaning | Staging recommendation | Production recommendation | Owner / approval | Status |
|---|---|---|---:|---:|---|---|
| RL-PUBLIC-01 | `SHS_RATE_LIMIT_PUBLIC_READ_MAX` + `_WINDOW_SECONDS` | Public Impact availability and scraping control | `300 / 60s` | `120 / 60s` | Security + Operations | APPROVED_SHF_BASELINE_V1 |
| RL-AUTH-01 | `SHS_RATE_LIMIT_AUTH_LOGIN_MAX` + `_WINDOW_SECONDS` | Login/session credential-abuse control | `10 / 300s` | `10 / 300s` | Security | APPROVED_SHF_BASELINE_V1 |
| RL-USER-01 | `SHS_RATE_LIMIT_AUTHENTICATED_USER_MAX` + `_WINDOW_SECONDS` | Normal authenticated user APIs | `120 / 60s` | `60 / 60s` | Security + Operations | APPROVED_SHF_BASELINE_V1 |
| RL-GOV-01 | `SHS_RATE_LIMIT_GOVERNANCE_MUTATION_MAX` + `_WINDOW_SECONDS` | Approval, disclosure, snapshot, and publication mutations | `30 / 60s` | `10 / 60s` | Security + Governance Operations | APPROVED_SHF_BASELINE_V1 |
| RL-EXP-01 | `SHS_RATE_LIMIT_EXPENSIVE_OPERATION_MAX` + `_WINDOW_SECONDS` | Report generation and expensive operations | `10 / 300s` | `5 / 300s` | Operations + Reporting Owner | APPROVED_SHF_BASELINE_V1 |
| RL-ING-01 | `SHS_RATE_LIMIT_INTERNAL_INGESTION_MAX` + `_WINDOW_SECONDS` | SHS internal ingestion class | `300 / 60s` | `300 / 60s` | Security + Operations | APPROVED_SHF_BASELINE_V1 |
| RL-ING-02 | `SHS_RATE_LIMIT_INTERNAL_INGESTION_MAX` + `_WINDOW_SECONDS` | Agent Fabric producer-aware ingestion | `300 / 60s` | `300 / 60s` | Security + Operations | APPROVED_SHF_BASELINE_V1 |
| MON-01 | `SHS_MONITOR_BACKLOG_MAX_PENDING` | Pending outbox backlog warning | `10` | `100` | Operations | APPROVED_SHF_BASELINE_V1 |
| MON-02 | `SHS_MONITOR_BACKLOG_MAX_OLDEST_AGE_SECONDS` | Oldest pending event warning | `300s` | `900s` | Operations | APPROVED_SHF_BASELINE_V1 |
| MON-03 | `SHS_MONITOR_BACKLOG_NO_SUCCESS_AGE_SECONDS` | Delivery stall while work exists | `600s` | `900s` | Operations | APPROVED_SHF_BASELINE_V1 |
| MON-04 | `SHS_MONITOR_QUARANTINE_DELTA_THRESHOLD` | Quarantine growth warning | `1` | `1` | Operations + Security | APPROVED_SHF_BASELINE_V1 |
| RET-01 | `SHS_RETENTION_RATE_LIMIT_WINDOW_SECONDS` | Expired rate-window cleanup age | `3600s` | `86400s` | Security + Operations | APPROVED_SHF_BASELINE_V1 |
| RET-02 | `SHS_RETENTION_DELIVERED_OUTBOX_SECONDS` | Delivered outbox cleanup after downstream acknowledgment | `604800s` | `2592000s` | Operations + Reporting Owner | APPROVED_SHF_BASELINE_V1 |
| RET-03 | `SHS_RETENTION_EXPIRED_SESSION_SECONDS` | Expired session cleanup age | `86400s` | `86400s` | Security + Privacy | PRIVACY_REVIEW_REQUIRED |
| RET-04 | `SHS_RETENTION_REVOKED_SESSION_SECONDS` | Revoked-session cleanup age | `604800s` | `2592000s` | Security + Privacy | PRIVACY_REVIEW_REQUIRED |
| RET-05 | `SHS_RETENTION_CLEANUP_BATCH_SIZE` | Maximum rows per cleanup transaction | `100` | `100` | Operations | APPROVED_SHF_BASELINE_V1 |
| REC-01 | `SHF_BACKUP_RPO_TARGET` | Maximum acceptable data-loss interval | `24h test target` | `15m target` | Executive Risk + Operations | APPROVED_SHF_BASELINE_V1 |
| REC-02 | `SHF_BACKUP_RTO_TARGET` | Maximum acceptable restoration interval | `4h test target` | `60m target` | Executive Risk + Operations | APPROVED_SHF_BASELINE_V1 |
| REC-03 | `SHF_BACKUP_FREQUENCY` | Desired backup cadence | `daily test` | `15m or provider minimum` | Operations | DEPLOYMENT_CONFIGURATION_PENDING |
| REC-04 | `SHF_BACKUP_RETENTION` | Backup retention expectation | `7d synthetic` | `35d target` | Executive Risk + Operations | APPROVED_SHF_BASELINE_V1 |
| REC-05 | `SHF_RESTORE_TEST_CADENCE` | Restore drill cadence | `before staging sign-off` | `quarterly` | Operations + Executive Risk | APPROVED_SHF_BASELINE_V1 |
| LOG-01 | `SHF_OPERATIONAL_LOG_RETENTION` | Application-owned operational log retention | `7d local` | `deployment-selected` | Operations + Privacy | DEPLOYMENT_CONFIGURATION_PENDING |

The two internal-ingestion rows share the existing service-aware mechanism;
Agent Fabric additionally reads `SHS_RATE_LIMIT_INTERNAL_INGESTION_MAX` and
`SHS_RATE_LIMIT_INTERNAL_INGESTION_WINDOW_SECONDS`. They are not two additive
quotas unless Operations explicitly chooses that policy.

## Rate-limit rationale

The proposed public-read value allows ordinary browsing while limiting a single
client to a modest sustained rate. Login is intentionally tight. Authenticated
and governance values key from server-resolved identity/scope, not client
headers or body fields. Expensive operations are lower because their cost is
not equivalent to ordinary reads. Internal ingestion is producer-aware and
large enough to accommodate bounded worker recovery without allowing one
producer to consume every producer's bucket.

Fixed windows use PostgreSQL/database time and atomic upserts. Values can be
changed through environment configuration without a schema change; changing
them still requires operational review and rollout control. Limits supplement,
and never replace, authentication, authorization, HMAC, scope, or governance.

## Monitoring severity and response

| Condition | Initial severity | Response |
|---|---|---|
| Pending backlog or oldest age threshold | `WARNING` | Inspect worker health, downstream availability, and retry backlog |
| Quarantine threshold | `WARNING` | Manual review; do not delete or auto-replay |
| No successful delivery with pending work | `ERROR` | Investigate worker, Agent Fabric, credentials, and database |
| Schema drift/unknown history or canonical persistence failure | `CRITICAL` | Stop governed operation and restore schema/dependency correctness |
| Expected 403/429 or legitimate governance refusal | `INFO`/`WARNING` | Aggregate for abuse review; never page as outage by default |

These thresholds are operational signals, not reporting metrics. Staging should
use lower thresholds to expose faults quickly; production should avoid alert
noise from normal bursts.

## Retention boundary

Truth, Evidence, Sources, Truth history, governance sign-offs, eligibility and
disclosure decisions, snapshots, publication authorization/history, publications,
public projections, audit history, identity links, and migration history remain
`NO AUTOMATIC DELETION`. No proposed operational value changes that boundary.

The operational recommendations apply only to expired rate windows, expired or
revoked sessions, and delivered outbox rows that satisfy the existing
downstream-acknowledgment and lease-free predicates. Quarantined, pending,
retryable, and leased outbox rows remain manual-review or active work.

## Configuration readiness and gaps

Rate-limit, monitoring, and lifecycle variables already exist and are accepted
by the code mechanisms. Production values are intentionally required at startup
for rate limiting and monitoring; missing lifecycle durations produce no-delete
behavior. No code configuration gap was found.

Backup/RPO/RTO, backup frequency/retention, restore cadence, and external log
retention are not application-owned runtime variables today. They are
`DEPLOYMENT_CONFIGURATION_PENDING` and must be represented in the later Azure
deployment/operations contract, without placing secrets or provider-specific
credentials in this register.

## Approval scope and deployment separation

`APPROVED_SHF_BASELINE_V1` is effective for SHF Trusted Reporting as policy
version v1. The values are operationally tunable through the listed existing
configuration points, subject to controlled review and monitoring of false
positives and load. Approval does not configure an environment, create Azure
resources, prove runtime behavior, or approve future SHS commercial-reporting
policy. A later configuration change must preserve the distinction between SHF
Trusted Reporting policy and future SHS commercial-reporting policy.

Application-owned approved values map to existing rate-limit, monitoring, and
lifecycle configuration points. Recovery targets are approved policy targets,
while their Azure implementation and runtime restore drill remain pending.
Session retention remains unapproved and must not be enabled beyond safe
no-delete behavior without privacy/legal review.
