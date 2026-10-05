# 4D Acceptance

- Review operations are mounted through the canonical SHS API router.
- Every route requires authenticated user and active organization/tenant context.
- Reads use `commercial_product.read`; writes use the 4C gate/source capability map.
- `sales.admin` and generic edit do not confer review authority.
- 4C service/repository preserve append-only histories and canonical audit events.
- Review packet and queue derive only from reviewed manifests and persisted decisions.
- Reassessment is read-only; readiness, sellability, lifecycle, and onboarding are not mutated.
- No production onboarding, migration seed, demo record, or frontend route exists.
- No SHF-Next files are modified.

Disposable PostgreSQL verification is required for the full acceptance report; no shared/production database may be used.
