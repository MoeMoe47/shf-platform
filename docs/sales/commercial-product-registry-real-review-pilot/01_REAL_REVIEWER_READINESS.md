# Real Reviewer Readiness

Each reviewer must pass this checklist before activation:

- Authenticated Identity user exists in `users`.
- Intended organization is confirmed.
- Active membership exists in `memberships`.
- Membership is effective now and not expired.
- Organization is active.
- Exact reviewer function is confirmed.
- Gate-specific capability is present through canonical `roles` and `role_permissions`.
- Candidate assignment is explicit.
- Gate assignment is explicit.
- `effective_at` and `expires_at` are confirmed.
- Source-resolution authority is separately confirmed when `SOURCE_AUTHORITY` is assigned.
- Reviewer understands they do not become an external regulator, funding award authority, pricing calculator, or production onboarding authority.
- Reviewer understands no self-provisioning, no assignment extension, and no production onboarding controls exist in the reviewer flow.
- Reviewer understands evidence requirements for APPROVED and reason requirements for BLOCKED.
- Operator has the revocation path ready before activation.

Readiness fails closed when any item is missing.
