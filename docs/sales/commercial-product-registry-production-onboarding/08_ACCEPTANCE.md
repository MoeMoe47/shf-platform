# Acceptance

Implementation acceptance uses disposable PostgreSQL only. Test-only fixtures may create explicit `TEST_ONLY` review/source state to prove machinery, but must not claim real production approval.

Acceptance must verify:

- Eligibility contract exists and blocks missing/blocked/stale/unknown/missing-evidence states.
- Human review and source authority are consumed, never fabricated.
- `commercial_product.production_onboard` is required.
- Dry-run performs zero mutation.
- One-candidate execution creates one canonical product.
- Idempotent rerun returns already-onboarded.
- Concurrent duplicate execution is protected by transaction lock and unique lineage constraints.
- Candidate/product/source/review lineage is persisted.
- Funding remains compatibility metadata only.
- Entitlements remain references.
- Pricing, margin, and commission are not invented.
- No automatic `SELL_NOW`, `GREEN`, or `ACTIVE`.
- Sales read model returns the onboarded test product.
- Migration status is clean.
- SHF-Next remains unchanged.
