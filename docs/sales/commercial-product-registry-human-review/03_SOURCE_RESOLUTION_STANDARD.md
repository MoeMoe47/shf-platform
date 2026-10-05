# Source Resolution Standard

`CommercialProductReviewService.recordSourceResolution` supports `UNRESOLVED`, `RESOLVED`, `REJECTED_SOURCE`, `STALE`, and `NEEDS_REVIEW`. A resolved source requires a canonical source-authority domain, authority reference, evidence reference, and no remaining source requirements. Demo, fixture, mock, marketing, keyword-scan, and UI/data-surface paths are rejected as authority references.

Source decisions require the separate `commercial_product.review_source_authority` capability and human actor/org context. Each update supersedes rather than overwrites the prior source-resolution row, and emits canonical `audit_events` records. A source resolution is not a review-gate approval or production-onboarding authorization.
