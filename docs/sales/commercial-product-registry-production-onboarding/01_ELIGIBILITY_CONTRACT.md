# Eligibility Contract

A candidate is production-onboardable only when all of these are true:

- The 4A candidate contract validates against the canonical registry contract.
- The canonical family, product type, lifecycle, readiness, sellability, buyers, forms, source references, funding metadata, and gate vocabulary are valid.
- Source authority has a latest persisted 4C `RESOLVED` source resolution with no remaining requirements.
- Every required review gate has a latest persisted human decision.
- No required gate is `BLOCKED`, `STALE`, `UNKNOWN`, or missing.
- Approved or not-required decisions carry authority and evidence references.
- Regulated candidates retain regulatory metadata and require regulatory authority; onboarding authority does not substitute for an external regulator or approved training authority.
- Selling and delivery entity state is resolved.
- Reassessment reports `production_onboarding_eligibility: true`.
- No existing product or prior 4I lineage record conflicts with the candidate.

Eligibility is computed by `CommercialProductProductionOnboardingService`; it is not inferred from UI state.
