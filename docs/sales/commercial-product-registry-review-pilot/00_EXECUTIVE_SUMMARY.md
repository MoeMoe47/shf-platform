# 4E Authorized Reviewer Provisioning & Controlled Human Review Pilot

4E prepares the 4C/4D review flow for least-privilege human use and proves it with test-only identities in disposable PostgreSQL. It creates no real approval and performs no production onboarding.

Reviewer profiles are operational provisioning profiles, not new canonical security roles. The existing Identity authority supplies organization-scoped memberships and `role_permissions`; each profile is `commercial_product.read` plus exactly one gate capability (or the source-resolution capability). `sales.admin`, generic product edit, and reviewer profiles are not universal authority.

The Identity model enforces active organization membership and gate capabilities. It refreshes production identity from membership/role assignments and excludes revoked or expired memberships. Two limitations remain explicit: the current membership API has no expiry input, and 4D does not enforce candidate-specific assignments. Candidate assignment in the register is operator routing only, not an authorization control.

Six representative manifest candidates span core education, Data Center, regulated healthcare, Metaverse, institutional technology, and assurance/reporting. Disposable acceptance uses only test identities and `TEST_ONLY` references. All test decisions are auditable; readiness, sellability, production records, and onboarding remain unchanged.
