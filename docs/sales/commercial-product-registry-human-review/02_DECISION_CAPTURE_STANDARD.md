# Decision Capture Standard

`CommercialProductReviewService.recordDecision` accepts only the declared decision fields. Identity must match the 4B candidate/product map. The actor must be an authenticated human user with active organization context and the exact gate-specific capability. `commercial_product.edit` and `sales.admin` are not substitutes.

`APPROVED` and `NOT_REQUIRED` require an allowed gate-specific authority type, authority reference, evidence reference(s), reviewer, organization, and reviewed timestamp. `BLOCKED` and `STALE` require a reason. Stale remains distinct from pending. Unsupported fields, including price, commission-rate, or funding-eligibility fields, are rejected.

Each decision is immutable. A later decision must name the current decision ID in `supersedesDecisionId`; the new row gets the next stream version. The service emits canonical audit events for recording and supersession in the same transaction. No decision mutates product lifecycle, readiness, sellability, price, margin, or commission calculations.
