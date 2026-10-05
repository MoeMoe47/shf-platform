# Revocation and Expiry

## Revocation

Use canonical Identity membership revocation or change the organization's assigned role to one without the review capability. Both are existing Identity operations and emit canonical `audit_events`. Production Identity reconstructs active memberships and `role_permissions` for authenticated requests; a revoked membership or removed gate capability therefore fails closed on the next request. Existing Product Registry decision/source rows remain append-only and retain the original reviewer actor and organization.

The disposable acceptance provisions reviewer memberships with the Identity membership service, records a test decision, revokes the membership with that same service, confirms a fresh authenticated lookup has no active reviewer identity, and confirms the prior decision remains stored.

## Expiry

Production Identity lookup filters `memberships.effective_from` and `effective_to` against database time. The current `/identity/memberships` assignment API does not accept `effective_to`; there is no supported ordinary operator flow to schedule expiry through that endpoint. The disposable test writes an expired `effective_to` only as an unmistakable test fixture to prove identity lookup denies the expired membership. Until Identity exposes controlled expiry provisioning, operators must set a calendar revocation action and use membership revocation; do not claim a register date alone expires authorization.
