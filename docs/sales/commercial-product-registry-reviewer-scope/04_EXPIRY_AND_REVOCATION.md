# Expiry And Revocation

Authorization is evaluated at use time. Cleanup jobs are not required for safety.

Temporal rules:

- `effective_at` must be at or before the database/server current time.
- `expires_at` must be after the database/server current time.
- New assignments must have `expires_at > effective_at` and future expiry at write time.
- Future-effective assignments do not authorize reads or writes.
- Expired assignments do not authorize reads or writes.

Revocation changes assignment status to `REVOKED`, records `revoked_at`, `revoked_by_actor_id`, increments `version`, and preserves the original assignment row. Revocation requires `commercial_product.review_assignment.manage` and active Identity membership in the assignment organization.

Prior decision/source-resolution history remains append-only and readable only through the actor's current read scope or explicit full-review-read capability.

