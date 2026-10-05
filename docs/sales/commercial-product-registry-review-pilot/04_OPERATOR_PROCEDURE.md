# Operator Procedure

1. Identify the actual reviewer and verify canonical `user_id`, active organization membership, and organization status through Identity.
2. Select one operational profile and verify its exact capability list; never use `super_admin`, `sales.admin`, or generic edit as a review profile.
3. Provision an organization-scoped Identity role containing `commercial_product.read` plus only the assigned gate capability, then assign the reviewer through the existing Identity membership process. Profile templates do not create roles.
4. Record the membership/role assignment reference, effective period, assigned gate, and operator-routed candidate in the assignment register. Candidate routing is not API-enforced in 4D; do not represent it as technical isolation.
5. Retrieve the authenticated packet and send only the assigned packet and evidence references to the reviewer through approved channels.
6. The reviewer verifies evidence against the authority standard and submits a decision through the authenticated `/commercial-product-reviews` operation. Actor and organization are server-derived.
7. The API validates gate capability, status, authority/evidence shape, and supersession, then records immutable history and canonical audit events.
8. Read reassessment and history; confirm unresolved gates remain unresolved and source resolution is not confused with approval or sellability.
9. Repeat only for separately assigned gates. Request a separate production-onboarding authorization after review criteria are met; 4E has no apply action.
10. Revoke the membership or remove the reviewer capability through Identity when the assignment ends. Verify a fresh request is denied and retain existing decision history.

The 4E acceptance uses test identities, test organizations, and `test-only://` authority/evidence references in disposable PostgreSQL. Its decisions are test fixtures, not human approvals.
