# Real Reviewer Readiness Checklist

Before inviting a real reviewer, verify:

- Canonical active user identity and verified authentication.
- Active membership in the intended organization and matching tenant context.
- An organization-scoped Identity role containing only Product Registry read plus one required gate capability.
- The role assignment and reviewer organization recorded in the assignment register.
- Candidate assignment routed by an operator; understand that 4D does not enforce candidate-specific write scope.
- Current review packet and exact evidence bundle/reference from the governing source authority.
- Authority type/reference acceptable for that gate; external regulatory, legal, funding, entitlement, evidence, partner, and financial authorities remain external.
- Access to the authenticated SHS API and approved operator instructions; no shared test credentials.
- Operator support for structured errors, history, and reassessment checks.
- Revocation owner/date; use Identity membership revocation or role change. For expiry, use a scheduled revocation until the assignment API supports expiry.
- Confirmation that no production onboarding, readiness/sellability change, price, margin, commission, or approval is implied by packet access.

Candidate-specific API authorization and managed temporary assignment are blockers to claiming fully scoped or automatically expiring assignments.
