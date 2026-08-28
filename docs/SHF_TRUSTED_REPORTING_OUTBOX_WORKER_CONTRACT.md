# SHF Trusted Reporting Outbox Worker Contract

## Scope and authority

The SHS PostgreSQL `integration_outbox` table is the canonical delivery queue
for authenticated SHS-to-Agent-Fabric operational events. Producer state and
the outbox insert remain one transaction. The worker is an internal runtime,
not a human identity and not an institutional governance auditor.

## Event identity and delivery guarantee

Each row has one stable `outbox_event_id` and producer-scoped
`idempotency_key`. Retries send the same payload and idempotency identity. The
transport is at-least-once; Agent Fabric's tenant/organization/producer/key
deduplication provides the idempotent downstream effect. A successful response
or an idempotent replay is the only success acknowledgment. The worker never
writes directly to Truth.

## Claim, lease, and concurrency

`claimPending` uses PostgreSQL `FOR UPDATE SKIP LOCKED` and a short transaction.
Rows enter `DELIVERING` with `lease_owner`, database-time `lease_expires_at`,
and an incremented `attempt_count`. Expired delivery leases are reclaimable by
another worker. Completion, retry, and terminal updates require the current
lease owner, so a stale worker cannot finalize a reclaimed row.

## Retry, backoff, and terminal handling

Configuration is explicit through `SHS_TRUSTED_REPORTING_WORKER_*` variables.
Defaults are batch 20, 60-second leases, 8 attempts, five-second exponential
backoff capped at 15 minutes, and a ten-second request timeout. HTTP 408/429/
5xx and connection/timeouts are retryable. Invalid HMAC/configuration,
validation, authentication, authorization, and other 4xx responses are
permanent failures. A retryable event at the attempt limit is retained as
`QUARANTINED`; other permanent failures remain `FAILED_FINAL`. Payloads are
never deleted or automatically replayed. Any future replay is an explicit
operator operation preserving the canonical event identity and failure history.

## Failure and recovery semantics

Database or Agent Fabric failure cannot produce delivery success. A crash
before claim leaves work pending; a crash after claim leaves a bounded lease
that can be reclaimed; a crash after downstream acceptance but before the local
update may retry the same event and is suppressed downstream by idempotency.
The continuous worker stops claiming after SIGTERM/SIGINT and allows an
unfinished lease to expire. Its loop is liveness-oriented: downstream outage
does not itself imply process death. Readiness requires the database, current
migration schema, worker configuration, and HMAC material to be available;
downstream outage is reported as degraded work rather than a restart storm.

## Operational health and security

`getBacklogStatus` exposes only aggregate pending, leased, quarantined, oldest
pending, and last-success values for later monitoring. Structured operational
logs should use event IDs and classifications only. Database URLs, HMAC
material, participant payloads, and sensitive lineage are never logged. Lease
ownership is a runtime identity and has no SHS role or governance authority.

Migration `029_trusted_reporting_outbox_worker_hardening.sql` adds lease,
reclamation, failure-classification, quarantine, and polling indexes without
rewriting migrations 001-028. Migration orchestration remains the separate
deployment step. A future Azure Container App may run this process with
`minReplicas >= 1` and ingress disabled; correctness does not depend on Azure.

## Proof boundary

Local PostgreSQL 16.12 runtime proof verified durable schema application,
repository recreation, concurrent claim exclusion, lease expiry/reclamation,
ownership-scoped completion, and persisted retry state. Existing isolated
Agent Fabric tests verify the same stable idempotency key returns the original
operational event rather than creating a duplicate. No Azure/Auth0 operation,
real Hub claim, or production data was used.
