# SHU Commercial Product Registry 3B Acceptance

Result target: durable PostgreSQL foundation for the Commercial Product Registry, with no API routes, no frontend UI, no SHF-Next edits, and no production candidate seed rows.

## Acceptance Mapping

| Requirement | Evidence |
| --- | --- |
| Correct next migration number | Migration head was `152`; new file is `153_commercial_product_registry_foundation.sql`. |
| Canonical registry tables exist | Migration creates 13 `commercial_product*` tables. |
| Registry authority independent from Sales | Core product table has no `tenant_id`, `organization_id`, Sales opportunity/account fields, or Sales route integration. |
| No source authority duplicated | `commercial_product_source_authorities` has a product/type/domain/record/version unique index. |
| No production seed data | Migration has no `INSERT INTO commercial_products`; acceptance verifies an empty registry after migration before fixtures. |
| Readiness/sellability/lifecycle constrained | `commercial_products` has checks from the 3A vocabulary and DB acceptance negative cases. |
| Review gates constrained | Gate type/status checks plus approval authority/reference guard. |
| Buyer/form/source relationships persist | Repository acceptance inserts and lists each on PostgreSQL. |
| Product relationships structurally safe | Self-relation guard and duplicate active direct edge unique index. Full cycle detection deferred. |
| Funding compatibility is not eligibility | Funding table uses relationship status/category, has no eligibility column, and rejects eligibility language in metadata. |
| Pricing/margin remain metadata | Governance table stores policy/reference/status/date/currency metadata only; no product price amount column or computation. |
| Commission remains metadata | Commission fields are status/policy references only; acceptance rejects calculation-shaped policy references. |
| Recruiting is not revenue | Governance revenue classification check rejects recruiting/recruitment and operational revenue truth values. |
| Regulated-program authority remains external | Regulatory metadata stores external authority/reference fields and does not encode SHU as a credential authority. |
| Audit authority remains canonical | No new audit table; docs specify `audit_events` service hook for 3C. |
| Repository contract implemented | `CommercialProductRegistryRepository` defines current and future persistence methods. |
| PostgreSQL repository proves persistence | `PostgresCommercialProductRegistryRepo` supports the bounded proof slice. |
| Disposable PostgreSQL tests pass | `apps/shs-api/tests/commercial-product-registry-postgres.acceptance.test.ts` is designed for `SHS_TEST_DATABASE_URL`. |
| Migration status clean | Acceptance calls `runMigrations` and `inspectMigrations` and asserts no pending/drift/unknown migrations. |
| Typecheck passes | Run `npm --prefix apps/shs-api run typecheck`. |
| No API routes added | No files under `api/` or `server.ts` changed for this phase. |
| No frontend UI added | No root `src/` UI files changed for this phase. |
| SHF-Next unchanged | This repository phase does not touch SHF-Next. |
| 32 candidates not seeded | Candidate design artifacts remain documentation only; production migration inserts zero products. |

## PostgreSQL Acceptance Coverage

The PostgreSQL acceptance test proves:

1. empty registry is valid after migration
2. create product persists
3. retrieve product by slug and list products round trip
4. invalid family rejected
5. invalid readiness rejected
6. invalid sellability rejected
7. invalid lifecycle rejected
8. buyer compatibility persists
9. commercial form persists
10. source authority persists and duplicates are rejected
11. gate persists
12. approved gate without authority/reference is rejected
13. product relationship persists
14. prohibited self-relation rejected
15. duplicate relationship prevented
16. canonical organization authority is not duplicated onto core product rows
17. funding compatibility contains no eligibility status
18. no product price computation exists
19. no commission computation exists
20. no candidate seed rows exist after migration alone

## Deferred Work

- Service layer and `audit_events` writes.
- API routes.
- Sales or registry UI.
- Tenant/geography/buyer/entity availability overlays.
- Full product relationship graph-cycle validation.
- Production seeding after separate governance approval.
