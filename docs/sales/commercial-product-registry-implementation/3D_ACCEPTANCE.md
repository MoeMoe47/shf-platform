# SHU Commercial Product Registry 3D Acceptance

## Result

Status: PASS for scoped API route integration and authorization enforcement.

## Canonical API Path

`/commercial-products`

The route base is registry-owned, not Sales-owned. Sales receives a projection from `/commercial-products/sales-read-model`.

## Implemented Surfaces

- Authenticated read routes for list, detail, slug, sources, buyers, forms, gates, funding, entitlements, relationships, summary, distributions, and Sales projection.
- Authenticated governed mutation routes for create, descriptive update, lifecycle transition, readiness review, sellability review, gate review, source references, buyer compatibility, commercial forms, funding metadata, entitlement references, relationships, regulated metadata, implementation/support, renewal/expansion, social selling, and governance-state metadata.
- Bounded filtering, pagination, and sorting.
- `CONNECTED_EMPTY` handling for empty persisted registry.
- Structured error mapping.
- Route-to-service actor propagation.

## Permission Matrix

- Reader: `commercial_product.read`
- Creator: `commercial_product.create`
- Descriptive/metadata editor: `commercial_product.edit`
- Lifecycle transition authority: `commercial_product.transition_lifecycle`
- Retirement authority: `commercial_product.retire`
- Readiness reviewer: `commercial_product.review_readiness`
- Sellability reviewer: `commercial_product.review_sellability`
- Legal reviewer: `commercial_product.review_legal`
- Regulatory reviewer: `commercial_product.review_regulatory`
- Pricing reviewer: `commercial_product.review_pricing`
- Margin reviewer: `commercial_product.review_margin`
- Commission reviewer: `commercial_product.review_commission`
- Sponsorship/social/partner reviewer: `commercial_product.review_sponsorship`

Default role assignment remains conservative. Reviewer capabilities are reserved unless explicitly assigned by role governance.

## Acceptance Mapping

- Canonical routes exist: PASS.
- Backend authentication enforced: PASS.
- Authorization enforced per capability: PASS.
- Generic edit cannot bypass governed state operations: PASS.
- Lifecycle route governed: PASS.
- Readiness route governed: PASS.
- Sellability route governed: PASS.
- Review gates governed by gate type: PASS.
- Source references governed: PASS.
- Buyer/forms use 3A vocabularies: PASS.
- Funding remains compatibility metadata, not eligibility: PASS.
- Entitlements remain references: PASS.
- Relationships reject self-link and duplicate active relation through service validation: PASS.
- Regulated metadata protected by regulatory capability: PASS.
- Pricing/margin/commission remain metadata: PASS.
- Audit actor propagated to service: PASS.
- Empty registry valid: PASS.
- Summary/distribution counts come from persisted registry rows through service projection: PASS.
- Filtering/pagination safe: PASS.
- No seed/demo products: PASS.
- Frontend/UI not implemented: PASS.
- SHF-Next unchanged: PASS.

## Verification Commands

- `./node_modules/.bin/tsx --test tests/commercial-product-registry-routes.integration.test.ts tests/commercial-product-registry-service.test.ts`
- `npm --prefix apps/shs-api run typecheck`

An attempted `npm --prefix apps/shs-api test -- ...` was abandoned because the package script expands `tests/*.test.ts` before appended arguments and therefore launched unrelated live-test/database suites. That run produced unrelated failures from missing live services and fixture database state; it was not used as 3D evidence.

## PostgreSQL Acceptance

The existing 3B and 3C PostgreSQL acceptance files remain the intended disposable-database checks:

- `tests/commercial-product-registry-postgres.acceptance.test.ts`
- `tests/commercial-product-registry-service-postgres.acceptance.test.ts`

They require `SHS_TEST_DATABASE_URL`; without it they skip by design and do not touch production/shared databases.

## No-Seed Proof

The route test asserts no 32-candidate/demo strings appear in the read response. The service test continues to assert no 32-candidate runtime seed exists in service source.

## Deferred

Frontend UI, SHF-Next, candidate seed data, Solution Builder, Account Intelligence, Grant History, price creation, price calculation, grant eligibility calculation, margin calculation, commission calculation, and revenue ledger authority remain out of scope for 3D.
