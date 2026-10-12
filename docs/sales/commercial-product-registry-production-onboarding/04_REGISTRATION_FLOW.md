# Registration Flow

Execution requires `confirmation: "ONBOARD_CANDIDATE"` and runs inside a transaction.

The service:

1. Locks the candidate production-onboarding stream with a PostgreSQL advisory transaction lock.
2. Checks existing 4I lineage for idempotency.
3. Locks latest source resolution and latest gate decisions.
4. Recomputes dry-run eligibility inside the transaction.
5. Rejects stale expected versions.
6. Creates the canonical `commercial_products` row only if eligible.
7. Copies source references, buyers, forms, review-gate state, funding compatibility metadata, entitlement references, regulated metadata, implementation/support metadata, renewal metadata, and governance metadata as references or metadata.
8. Inserts `commercial_product_production_onboardings` lineage.
9. Writes canonical `audit_events`.

The initial lifecycle/readiness/sellability are preserved from governed candidate state. Onboarding does not imply `ACTIVE`, `GREEN`, or `SELL_NOW`.
