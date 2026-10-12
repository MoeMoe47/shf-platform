# Commercial Product Registry 4I Executive Summary

4I adds governed, one-candidate-at-a-time production onboarding from reviewed candidate state into the canonical Commercial Product Registry.

The flow is:

`CANDIDATE -> SOURCE AUTHORITY -> HUMAN REVIEW GATES -> REASSESSMENT -> ELIGIBILITY -> EXPLICIT OPERATOR AUTHORIZATION -> CANONICAL REGISTRATION -> AUDIT -> SALES READ MODEL`

4I does not bulk import candidates, approve reviews, resolve source authority, assign reviewers, set `SELL_NOW`, set `GREEN`, or promote lifecycle to `ACTIVE`. It consumes persisted 4C human review decisions and source resolutions, then writes the canonical product only when the eligibility contract is satisfied and an operator with `commercial_product.production_onboard` explicitly confirms execution.

Production execution remains separate from implementation acceptance. Acceptance fixtures may use `TEST_ONLY` authority state in disposable PostgreSQL only.
