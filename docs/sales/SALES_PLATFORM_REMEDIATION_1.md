# SALES-PLATFORM-REMEDIATION-1

Date: 2026-10-04

## Current Architecture

- Sales routes are registered from `apps/shs-api/src/api/router.ts` through `registerSalesRoutes(app)`.
- Routes live at `/sales/relationships`, `/sales/discovery-records`, `/sales/needs`, and `/sales/opportunities`.
- Route authorization uses `sales.read` and `sales.write`.
- `sales.admin` is registered and seeded, but no current Sales endpoint requires it.
- Sales persistence uses `sales_relationships`, `sales_discovery_records`, `sales_needs`, and `sales_opportunities`.
- Sales references canonical `organizations`; it does not create a shadow organization authority.
- Sales mutations write through canonical `audit_events` via `writeAuditEvent`.

## Remediation 1 Summary

- Generic opportunity updates reject direct `stage` mutation with `DIRECT_STAGE_MUTATION_FORBIDDEN`.
- Opportunity stage writes go through `SalesService.updateOpportunity`, `evaluateSalesOpportunityStageTransition`, and `SalesRepo.transitionOpportunityStage`.
- Service validation rejects cross-tenant and cross-account Sales links before persistence.
- Protected input rejection covers tenant/org context, active organization, audit fields, timestamps, version, approval, provenance, verified, and authority-state fields.
- Production handoff remains truthful: `PRODUCTION_HANDOFF_NOT_CONNECTED`.

## DB VERIFICATION / REMEDIATION 1A

### Disposable PostgreSQL Method

Used a local disposable PostgreSQL 16.12 Homebrew cluster on loopback only:

- data dir: `/private/tmp/sales-remediation-1a-pg/data`
- host/port: `127.0.0.1:55432`
- databases: `shs_sales_1a` and `shs_sales_1a_fresh`
- no production, hosted, shared, or existing database was used
- no reset, truncate, drop, or destructive migration was run against an existing database

### Migration Status

Canonical runner: `apps/shs-api` `npm run db:migrate` / `npm run db:migrate:status`.

- `149_fabric_run_authority.sql`: APPLIED
- `150_fabric_run_artifacts.sql`: APPLIED
- `151_sales_commercial_foundation.sql`: APPLIED
- `152_sales_cross_account_link_constraints.sql`: APPLIED
- status after apply: `pending: []`, `drift: []`, `unknownApplied: []`
- fresh disposable database also applied cleanly through 152

### Actual Sales Schema Findings

Migration 151 matches PostgreSQL reality for the Sales foundation:

- all four Sales tables have text primary keys
- `organization_id` and `account_organization_id` reference canonical `organizations`
- `created_by_user_id`, `updated_by_user_id`, and opportunity/relationship owner fields reference `users`
- `tenant_id = 'tenant:' || organization_id` checks are present
- status/type/stage/value/currency checks are present
- scoped partial indexes are present
- timestamps, archive fields, and versions are present

The real-schema acceptance exposed and fixed a repository defect: `SalesRepo.getLinkReference` selected table-specific status columns from every Sales table. It now projects a common nullable status shape per record type.

### Cross-Account DB Enforcement

New forward migration: `apps/shs-api/migrations/152_sales_cross_account_link_constraints.sql`.

It adds composite unique constraints for parent Sales records and composite foreign keys for scalar account-scoped links:

- discovery -> relationship
- need -> discovery
- opportunity -> relationship
- opportunity -> discovery

The composite FKs are `NOT VALID` to avoid scanning or blocking possible historical rows on upgrade, but PostgreSQL enforces them for new direct writes. Service-layer validation remains in place.

Opportunity-to-need DB enforcement was not added because actual schema stores `primary_need_ids` as JSONB, not as a scalar `need_id` relation. Enforcing each JSONB member would require a schema redesign or trigger-based policy, which is outside this safe hardening slice.

### Canonical Organization FK Result

Sales tables already reference canonical `organizations` for Sales organization and account organization. No Sales-owned organization table or duplicate organization authority was introduced.

### Audit DB Proof

PostgreSQL acceptance proved audit rows for:

- relationship create
- discovery create
- need create
- opportunity create
- opportunity stage transition

No Sales-specific audit table was created.

### sales.admin Determination

`RESERVED_FOR_FUTURE_USE`.

Current Sales endpoints are read/write CRUD and governed stage transition paths. No existing Sales endpoint was found that clearly requires privileged `sales.admin`, and no new endpoint was added merely to consume it.

### Remaining Blockers

- Production Sales-to-production handoff remains `PRODUCTION_HANDOFF_NOT_CONNECTED`.
- DB-level opportunity-to-need cross-account enforcement remains service-layer only because `primary_need_ids` is JSONB in the current schema.
