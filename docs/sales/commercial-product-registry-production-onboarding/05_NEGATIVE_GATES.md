# Negative Gates

Production onboarding fails closed for:

- Missing source authority.
- Missing required review decision.
- `BLOCKED` gate.
- `STALE` gate.
- `UNKNOWN` mandatory gate.
- Missing evidence on approval/not-required decisions.
- Unauthorized operator.
- Generic editor.
- Reviewer without onboarding authority.
- `sales.admin` without onboarding authority.
- Regulated candidate missing regulatory authority.
- Stale candidate/source/review version.
- Duplicate or concurrent onboarding.
- Protected-field injection.

The service consumes persisted state only. It never fabricates decisions, approvals, assignments, evidence, source resolution, pricing, margin, commission, customer eligibility, grant award, reimbursement approval, or funding guarantee.
