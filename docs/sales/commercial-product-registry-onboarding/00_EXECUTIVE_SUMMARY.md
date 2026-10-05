# 4A Governed Candidate Onboarding

## Decision

All 32 audited candidates were reconciled against Design-2 and the 3A runtime contract. The generated manifest retains original audit readiness and sellability values, proposes conservative lifecycle and entity values, and keeps audit references separate from Product Registry authority. Current disposition totals are READY_TO_REGISTER 0, REVIEW_REQUIRED 24, SOURCE_AUTHORITY_MISSING 8, CONTRACT_INVALID 0, BLOCKED 0, and REJECTED_DUPLICATE 0. REVIEW_REQUIRED records may be registered in REVIEW because their source and contract minimums pass; they are not approved for sale or pilot activity.

The manifest is an operator input and defaults to dry-run. No migration, application startup, or production database is seeded. Disposable PostgreSQL acceptance is the only apply target used in this phase.

## Reconciliation outputs

See [the machine-readable manifest](commercial-product-onboarding-manifest.json), [the 32-candidate matrix](32_CANDIDATE_ONBOARDING_MATRIX.md), and [acceptance evidence](05_ACCEPTANCE.md). Counts are generated from the manifest and are reported separately as audited, ready, review-required, blocked, source-missing, contract-invalid, and disposable-registered.

## Boundaries

- 3A contract enums are the persisted vocabulary. Unmapped audit/design values remain visible in explicit `unmapped_*` fields and are never passed to the service.
- Readiness and sellability remain the audited states. `UNKNOWN` remains `UNKNOWN`; `PILOT` is not upgraded.
- Source references point to discovered repository paths with original FOUND/PARTIAL status. Demo-only, fixture-only, audit-only, and NOT_FOUND evidence does not become source authority.
- Funding is compatibility metadata. No buyer eligibility is represented.
- Pricing, margin, and commission remain statuses and references. No numeric amounts or calculations are created.
- The importer calls `CommercialProductRegistryService`; service mutations remain the source of canonical `audit_events`.

Production execution was not performed.
