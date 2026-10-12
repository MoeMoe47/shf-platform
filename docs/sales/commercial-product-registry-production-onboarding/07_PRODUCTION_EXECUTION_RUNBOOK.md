# Production Execution Runbook

Actual production execution is separate and must be explicit.

Required preconditions:

- Confirm the database target is the intended production environment.
- Confirm real source authority state is persisted through 4C source resolution.
- Confirm real human review decisions are persisted through 4C review decision history.
- Confirm no `TEST_ONLY` evidence, reviewer, source, or authority references are used.
- Confirm the operator has `commercial_product.production_onboard`.
- Run dry-run for exactly one candidate.
- Review all blockers, versions, proposed lifecycle, readiness, sellability, provenance, funding, entitlement, and regulated metadata.
- Execute exactly one candidate with `confirmation: "ONBOARD_CANDIDATE"` and expected versions from dry-run.
- Verify audit events, lineage, canonical product detail, `/commercial-products`, and `/commercial-products/sales-read-model`.

Never run a wildcard or bulk production onboarding operation. 4I intentionally has no bulk endpoint.
