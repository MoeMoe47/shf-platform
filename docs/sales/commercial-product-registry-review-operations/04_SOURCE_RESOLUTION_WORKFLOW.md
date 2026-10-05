# Source Resolution Workflow

Only a caller with `commercial_product.review_source_authority` may record a source resolution. `RESOLVED` requires a contract source-authority domain, authority reference, evidence reference, and no remaining mandatory requirements. Known demo, fixture, mock, UI, and marketing references are rejected.

Each new source resolution is append-only. Superseding a previous row requires its exact ID and may include `expectedVersion`. This status is independent of review completion, production-onboarding eligibility, and sellability. Source resolution records references, never copied source payloads.
