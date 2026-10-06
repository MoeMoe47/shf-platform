# 4F Reviewer Scope Executive Summary

Phase: `SHU-COMMERCIAL-PRODUCT-REGISTRY-4F`

4F adds candidate-scoped and expiring reviewer assignments to the Commercial Product Registry human-review path. Identity remains authoritative for users, memberships, roles, and capabilities. Product Registry stores only review assignment scope metadata: reviewer, organization, candidate, canonical commercial product id, allowed gates, effective window, revocation state, provenance, version, and audit trail.

Effective authorization is the conjunction of authenticated identity, active organization membership, the required Identity capability, active candidate assignment, matching gate, matching organization, `effective_at <= now`, `expires_at > now`, and not revoked. The write service repeats this check inside the same transaction as decision/source-resolution mutation.

This phase does not approve products, fabricate reviewer decisions, run production onboarding, create product tenant ownership, or modify SHF-Next. `GLOBAL_CANONICAL` product identity remains the candidate/product map from the reviewed manifests.

