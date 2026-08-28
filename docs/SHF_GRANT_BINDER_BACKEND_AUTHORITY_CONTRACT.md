# SHF Grant Binder Backend Authority Contract

## Review result

The active Grant Binder route is `/grant-binder`. The browser log aggregation
and export view is now paired with a minimal backend-owned Grant Binder
workspace record. The repository still has no funding opportunity, grant
application, or submission domain to extend, and no Trusted Reporting producer
has been implemented.

`shf.adminToolLogs.v1` and `shf.civicMissionLogs.v1` remain legacy browser
operational history. They are not eligible for backfill into Evidence or Truth.

## Required authority prerequisite

The backend-owned **Grant Binder workspace** is now the canonical object for
workspace identity and draft lifecycle. This does not make browser activity
logs canonical and does not authorize Trusted Reporting projection.

The smallest proposed record is:

| Field | Authority | Purpose |
|---|---|---|
| `binder_id` | server-generated | stable canonical subject |
| `tenant_id` | server-derived | tenant isolation |
| `organization_id` | server-derived | organization ownership |
| `created_by` | server-derived | originating actor |
| `created_at` | server-generated | creation time |
| `updated_at` | server-generated | last canonical mutation |
| `lifecycle` | backend-controlled | only states supported by an approved workflow; initially creation/draft only |
| `version` | server-controlled | optimistic/history identity |
| `funding_opportunity_ref` | canonical reference, optional | only if an existing domain supplies it |
| `title` | user content, optional | workspace display identity only |

Requirements: scoped authenticated API, server-owned IDs/timestamps/scope,
backend audit for mutations, deterministic version/history behavior, and no
derived activity totals, percentages, readiness scores, narrative content, or
uploaded documents in the reporting event.

No `READY`, `QUALIFIED`, `APPROVED`, `SUBMITTED`, `AWARDED`, or impact state is
authorized by this review because the current UI has no corresponding durable
business action.

## Producer review

| Candidate | Classification | Decision |
|---|---|---|
| browser `grant.log.recorded` | `OPERATIONAL_ONLY` | retain as legacy browser history; never promote |
| `grant_binder.created.v1` | `DEFENSIBLE_PRODUCER_EVENT` | implemented transactionally through the existing outbox; authenticated ingestion remains next |
| `grant_binder.updated.v1` | `OPERATIONAL_ONLY` / `REDUNDANT_WITH_AUDIT` | do not create for Trusted Reporting now |
| `grant_binder.submitted.v1` | `NOT_JUSTIFIED` / `REQUIRES_LIFECYCLE_SEMANTICS` | no submission workflow exists |

The implemented narrowest event is `grant_binder.created.v1` with producer identity chosen by
the owning backend domain, subject `binder_id`, server-derived tenant/org and
actor, server `occurred_at`, lifecycle/version metadata only, and deterministic
idempotency key `grant-binder:{binder_id}:created`. It would mean only that a
canonical binder workspace was created. It would not mean readiness, eligibility,
submission, award, funding success, impact, or completion.

The backend implementation now includes one minimized, transactionally bound
producer event: `shs.grant_binder` / `grant_binder.created` v1. The event is
written with the binder row and audit record through the existing integration
outbox, uses `grant-binder:{binder_id}:created` idempotency, and carries no
browser logs or report content. It remains operational-only until authenticated
Agent Fabric ingestion is implemented; no Evidence, Truth, metric, or
Reporting Service contract is enabled by this document.
