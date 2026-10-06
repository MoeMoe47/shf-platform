# Revocation And Expiry Drills

Revocation drill:

1. Create a TEST_ONLY assignment.
2. Confirm queue visibility for the assigned candidate/gate.
3. Revoke through `/commercial-product-reviewer-assignments/:assignmentId/revoke`.
4. Confirm queue access disappears.
5. Confirm new decisions are denied.
6. Confirm prior decisions remain.
7. Confirm `audit_events` records revocation.

Expiry drill:

1. Create a TEST_ONLY assignment with a short future expiry.
2. Confirm access before expiry.
3. Move expiry into the past in disposable PostgreSQL.
4. Confirm queue and decision writes are denied.
5. Confirm prior history remains visible to authorized readers.
6. Confirm reassessment does not become production onboarding.

Multi-org drill:

1. Create org A and org B TEST_ONLY memberships.
2. Assign reviewer in org A.
3. Attempt access in org B.
4. Confirm denial and audit org context remains org A for org A actions.
