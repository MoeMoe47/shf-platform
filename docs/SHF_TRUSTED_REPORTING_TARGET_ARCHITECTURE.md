# SHF Trusted Reporting Target Architecture

## Doctrine

Institutional reporting follows:

`real producer -> authenticated Event Gateway -> durable outbox -> operational event store -> Evidence -> Source verification -> Agent Fabric Truth Spine -> Metric Registry -> deterministic calculation -> Reporting Service -> authorized surface`

The Agent Fabric Truth Spine is the canonical institutional truth authority.
Oracle, browser storage, seeds, fixtures, mocks, static values, and frontend
state are not institutional truth authorities.

## Boundaries

### Producer Adapter Layer

Normalizes a real operational action into producer ID, event type, subject,
trusted actor, tenant/organization scope, occurred time, idempotency key, and
minimum metadata. It does not calculate metrics or approve Truth.

### Authenticated Event Gateway

Validates user or service identity, producer/event binding, schema, scope,
correlation, idempotency, payload minimization, and safe errors. Browser
identity and scope are never authoritative.

### Outbox and Delivery

Owns pending backend delivery, retries transient failures, records permanent
failures, and acknowledges only an expected downstream response. The browser is
never the retry authority.

### Operational Event Store

Stores accepted raw operational activity. It is not the Truth Spine and raw
events do not automatically become claims.

### Evidence and Source Verification

Evidence stores minimum provenance and references the operational event. Source
states distinguish authenticated, verified, approved, and public-approved.
Authentication alone does not establish verification.

### Truth Spine

Stores defensible semantic claims with evidence/source references, versioning,
scope, verification history, approval state, and public visibility controls.

### Metric Registry and Calculation

Defines versioned formulas, eligible claims, time windows, null/zero behavior,
suppression, and lineage. Calculations are server-side and deterministic.

### Reporting Service

Composes authorized canonical metric results and returns report/version/lineage
metadata. It does not redefine formulas or approve Truth.

### Report Surface Adapter

Frontend and document consumers display Reporting Service responses. They may
own presentation state and personal progress UX, but not institutional
formulas, approval, verification, scope, persistence, or public eligibility.

## Invariants

1. Browser storage is never institutional authority.
2. Demo, seed, mock, and fixture data never enters Truth, metrics, or reports.
3. Clients cannot provide approval, verification, tenant, organization, or public status.
4. Canonical reports reference registered metrics and source lineage.
5. Public reporting requires explicit public eligibility; approved is not automatically public.
6. Missing data is unavailable, not silently zero.
7. Failed ingestion is pending/rejected, not synchronized.
8. Retries do not duplicate Events, Evidence, or Truth claims.
9. Projected is not verified; verified is not approved; approved is not public.

## Durability boundary

The SHS API outbox has a PostgreSQL migration contract. Agent Fabric operational,
Evidence, and Truth JSONL stores remain development-only until an approved
production persistence boundary, backup/restore policy, retention policy, and
monitoring exist.

## Forbidden patterns

- frontend canonical formulas or report persistence;
- browser administrative credentials or Truth mutation;
- seed/mock/static fallback presented as live data;
- Oracle output promoted directly to Truth;
- automatic source verification or claim approval;
- public metrics without the canonical public predicate;
- deletion before replacement, consumer, migration, and rollback checks pass.
