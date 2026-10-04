# SALES-PLATFORM-REMEDIATION-1 Acceptance

Date: 2026-10-04

## DB VERIFICATION / REMEDIATION 1A

| Gate | Status | Evidence |
| --- | --- | --- |
| Safe test PostgreSQL used | PASS | Disposable local PostgreSQL 16.12 on `127.0.0.1:55432`; databases `shs_sales_1a` and `shs_sales_1a_fresh`; no production or shared DB. |
| Migration 151 verified | PASS | Canonical migration ledger contains `151_sales_commercial_foundation.sql`; status clean. |
| Migration re-run/fresh safety | PASS | Fresh database applied through `152`; status returned `pending: []`, `drift: []`, `unknownApplied: []`. |
| PostgreSQL acceptance executes | PASS | `SHS_TEST_DATABASE_URL` set; `tests/sales-postgres.acceptance.test.ts` ran 1/1 and did not skip. |
| Persistence proven against PostgreSQL | PASS | Acceptance counted persisted relationship, discovery, need, and opportunity rows. |
| Tenant isolation proven | PASS | Service tests and PostgreSQL acceptance prove cross-tenant reads return no record. |
| Cross-account service enforcement | PASS | Service tests and PostgreSQL acceptance reject mismatched relationship, discovery, and need references. |
| Cross-account DB enforcement | PASS/PARTIAL | Migration 152 enforces scalar links by composite FK. Opportunity-to-need remains service-layer because actual schema stores needs in JSONB `primary_need_ids`. |
| Canonical Organization authority | PASS | Sales tables FK to canonical `organizations`; no shadow organization authority added. |
| Audit DB proof | PASS | PostgreSQL acceptance proved canonical `audit_events` rows for create and stage transition mutations. |
| sales.admin review | PASS | `RESERVED_FOR_FUTURE_USE`; no endpoint currently requires admin and no synthetic endpoint was added. |
| No browser/demo authority introduced | PASS | No browser storage or demo authority added. |
| Other workstreams undisturbed | PASS | Changes scoped to Sales backend, Sales tests, Sales docs, and forward Sales migration. |

## Test Classification

- SERVICE TEST: `tests/sales-commercial.test.ts`
- ROUTE TEST: `tests/sales-routes.integration.test.ts`
- POSTGRESQL ACCEPTANCE TEST: `tests/sales-postgres.acceptance.test.ts`

Mocks/fakes are not counted as database-backed evidence.

## Verification Commands

- `DATABASE_URL=postgres://postgres@127.0.0.1:55432/shs_sales_1a npm run db:migrate`
  - Result: pass; migrations applied through `152_sales_cross_account_link_constraints.sql`.
- `DATABASE_URL=postgres://postgres@127.0.0.1:55432/shs_sales_1a npm run db:migrate:status`
  - Result: pass; `pending: []`, `drift: []`, `unknownApplied: []`.
- `DATABASE_URL=postgres://postgres@127.0.0.1:55432/shs_sales_1a_fresh npm run db:migrate`
  - Result: pass on a fresh disposable database through 152.
- `DATABASE_URL=postgres://postgres@127.0.0.1:55432/shs_sales_1a_fresh npm run db:migrate:status`
  - Result: pass; `pending: []`, `drift: []`, `unknownApplied: []`.
- `DATABASE_URL=postgres://postgres@127.0.0.1:55432/shs_sales_1a SHS_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55432/shs_sales_1a npx tsx --test tests/sales-postgres.acceptance.test.ts`
  - Result: pass; 1 passed, 0 skipped.
- `npx tsx --test tests/sales-commercial.test.ts tests/sales-routes.integration.test.ts`
  - Result: pass; 26 passed.
- `npm --prefix apps/shs-api run typecheck`
  - Result: pass.
- `git diff --check`
  - Result: pass.

## Actual Schema Findings

PostgreSQL catalog inspection confirmed:

- primary keys on `relationship_id`, `discovery_record_id`, `need_id`, and `opportunity_id`
- canonical `organizations` FKs for `organization_id` and `account_organization_id`
- canonical `users` FKs for actor/owner fields where present
- tenant-scope checks on every Sales table
- enum/value checks for relationship type/status, discovery status, need type/priority/status, opportunity stage/status/currency/value
- scoped partial indexes from migration 151
- migration 152 composite uniqueness and account-scoped scalar FKs

## Remaining Blockers

- Production handoff remains `PRODUCTION_HANDOFF_NOT_CONNECTED`.
- DB-level opportunity-to-need member enforcement is not implemented because `primary_need_ids` is JSONB, not a relational `need_id` column.
