# Decision Capture Workflow

The route passes a strict allowlist of decision fields to the 4C `CommercialProductReviewService`. The service validates gate/status/authority/evidence, requires an attributable human actor and organization, locks the candidate/gate stream, and appends a new version. A later decision must name the latest decision in `supersedesDecisionId`; optional `expectedVersion` detects stale clients. Prior rows are immutable.

`APPROVED` and `NOT_REQUIRED` require a recognized authority type, authority reference, and evidence references. `BLOCKED` and `STALE` require a reason. Funding review is limited to product compatibility; eligibility, grant awards, and guarantees are rejected as registry authority.

Decision rows and canonical `audit_events` writes share the service transaction. The decision operation never updates readiness, sellability, lifecycle, prices, margins, commission amounts, or onboarding state.
