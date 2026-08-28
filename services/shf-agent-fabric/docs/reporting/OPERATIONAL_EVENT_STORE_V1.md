# Operational Event Store V1

## Classification

The current SHF operational event store is a repository abstraction and development implementation.

- Backend: `jsonl_repository_abstraction`
- Durability class: `development_only`
- Production ready: `false`
- Approved production persistence boundary: `false`

This store must not be described as production durable. It gives the reporting pathway a testable, append-oriented server boundary while the repository awaits an owner-approved production persistence decision.

## Runtime Contract

Operational events are accepted through authenticated Agent Fabric ingestion routes. The server derives actor, tenant, organization, and received timestamp. Client-supplied actor, tenant, organization, and approval fields are not authoritative.

The idempotency scope is:

`tenant_id + organization_id + producer_id + idempotency_key`

Duplicate events in that scope return the already-stored event.

## Deployment Requirement

Before production use, replace or back this repository abstraction with an approved durable database boundary that includes:

- backup and restore policy
- retention enforcement
- migration and rollback procedure
- monitoring and alerting
- operational access controls
- tested tenant isolation
- tested idempotency conflict handling

## Rollback

Because this checkpoint does not migrate real data, rollback is limited to disabling the `/shf/ingestion/*` routes or redirecting clients away from them. Do not delete client browser records during rollback; browser records remain local transport/cache records until a migration flow explicitly confirms durable ingestion.
