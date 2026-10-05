# SHU Commercial Product Registry 3C Acceptance

Phase: `SHU-COMMERCIAL-PRODUCT-REGISTRY-3C`

## Acceptance Matrix

| Requirement | Result |
| --- | --- |
| Service layer implemented | PASS |
| Generic updates cannot bypass governed states | PASS |
| Lifecycle transitions centralized | PASS |
| Readiness review governed | PASS |
| Sellability review governed | PASS |
| Review gates governed | PASS |
| Source authority management validated | PASS |
| Buyer/form management governed | PASS |
| Funding compatibility is not eligibility | PASS |
| Entitlements remain references | PASS |
| Product relationships validated | PASS |
| Regulated authority remains external | PASS |
| Implementation/support metadata governed | PASS |
| Renewal/expansion metadata governed | PASS |
| Social-selling metadata governed | PASS |
| Pricing/margin/commission metadata only | PASS |
| Recruiting is not revenue | PASS |
| Sales read model truthful | PASS |
| Empty registry returns `CONNECTED_EMPTY` | PASS |
| Canonical `audit_events` integration | PASS |
| `GLOBAL_CANONICAL` identity preserved | PASS |
| No candidate seed data introduced | PASS |
| No API routes added | PASS |
| No UI added | PASS |
| SHF-Next unchanged | PASS |

## Focused Test Coverage

New service tests cover:

1. product create succeeds
2. invalid product input rejected
3. generic update cannot change lifecycle
4. generic update cannot change readiness
5. generic update cannot change sellability
6. valid lifecycle transition succeeds
7. invalid lifecycle transition rejected
8. readiness review requires provenance
9. sellability preserves blocker/reason
10. approved gate requires authority/reference
11. funding compatibility cannot become eligibility
12. duplicate buyer mapping rejected
13. duplicate form mapping rejected
14. invalid self-relation rejected
15. duplicate active relationship rejected
16. source authority validated
17. regulated authority metadata preserved
18. pricing remains metadata only
19. margin remains metadata only
20. commission remains metadata only
21. recruiting not representable as revenue
22. audit events invoked for material mutation
23. empty registry produces `CONNECTED_EMPTY`
24. unavailable repository produces `NOT_CONNECTED`
25. summary counts come from actual rows
26. distribution counts come from actual rows
27. no 32-candidate runtime seed exists

## Validation Results

Focused 3A/3C command:

```text
./node_modules/.bin/tsx --test tests/commercial-product-registry-contract.test.ts tests/commercial-product-registry-service.test.ts
```

Result: PASS, 37 tests passed.

Typecheck:

```text
npm --prefix apps/shs-api run typecheck
```

Result: PASS.

3B PostgreSQL acceptance remains available through:

```text
./node_modules/.bin/tsx --test tests/commercial-product-registry-postgres.acceptance.test.ts
```

It is skipped unless `SHS_TEST_DATABASE_URL` points at a disposable PostgreSQL database. 3C did not require production/shared database access.

## Notes

An attempted `npm --prefix apps/shs-api test -- commercial-product-registry-contract.test.ts commercial-product-registry-service.test.ts` run invoked the package-level `tests/*.test.ts` glob before the named files and therefore ran unrelated live/server tests. Those unrelated tests failed because no dependent local API server or shared fixture database was available. The focused `tsx --test` command above was used for the 3C evidence.
