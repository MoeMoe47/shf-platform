# 4A Acceptance

## Evidence

The 4A unit suite validates manifest totals, contract enums, stable IDs, state preservation, source gaps, dry-run no-write behavior, service-only apply, and idempotency. PostgreSQL acceptance runs migrations through the current latest migration against a disposable local instance, creates only temporary organization/user fixtures, applies ready candidates through `CommercialProductRegistryService`, checks registry and audit rows, reruns apply, and disposes of the database.

The focused verification completed against disposable PostgreSQL on 2026-10-05. The manifest reconciles exactly:

- audited candidates: 32;
- READY_TO_REGISTER: 0;
- REVIEW_REQUIRED: 24;
- SOURCE_AUTHORITY_MISSING: 8;
- BLOCKED, CONTRACT_INVALID, and REJECTED_DUPLICATE: 0;
- registered in disposable acceptance: 24;
- registered sellability totals: PILOT 10, DEVELOP 11, NEEDS_REVIEW 3, NOT_SELLABLE 0, SELL_NOW 0;
- registered readiness totals: YELLOW 10, UNKNOWN 14, RED 0, GREEN 0, BLUE 0;
- source, buyer, form, review-gate, funding-compatibility, regulated metadata, pricing, margin, commission, renewal, and support persistence passed;
- second apply inserted no duplicate products, mappings, relationships, or audit mutations;
- migration status: `pending: []`, `drift: []`, `unknownApplied: []`;
- migrations and application startup contain no Product Registry product insert/auto-seed.

Commands run:

```sh
npx tsx --test tests/commercial-product-onboarding.test.ts tests/commercial-product-registry-contract.test.ts tests/commercial-product-registry-service.test.ts tests/commercial-product-registry-routes.integration.test.ts
DATABASE_URL=<disposable> SHS_TEST_DATABASE_URL=<disposable> npx tsx --test tests/commercial-product-onboarding-postgres.acceptance.test.ts
DATABASE_URL=<disposable> SHS_TEST_DATABASE_URL=<disposable> npx tsx --test tests/commercial-product-registry-postgres.acceptance.test.ts
DATABASE_URL=<disposable> SHS_TEST_DATABASE_URL=<disposable> npx tsx --test tests/commercial-product-registry-service-postgres.acceptance.test.ts
npm run typecheck
git diff --check
```

Focused contract/service/route tests passed 48/48; each of the 4A, 3B, and 3C disposable PostgreSQL acceptance tests passed; typecheck and diff check passed. Production/shared databases were not used. The temporary PostgreSQL cluster was stopped after verification.
