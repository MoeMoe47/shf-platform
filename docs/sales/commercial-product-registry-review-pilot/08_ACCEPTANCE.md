# 4E Acceptance

- 15 operational reviewer profiles are least-privilege bundles: read plus one gate capability, or source-resolution capability.
- Identity roles/memberships remain the only provisioning authority; no parallel permission system or global reviewer role is introduced.
- The six pilot candidates are derived from the 4B manifest and retain their audited readiness/sellability/source states.
- Disposable PostgreSQL acceptance exercises real Identity permission resolution, gate-specific API decisions, cross-gate rejection, source resolution, membership revocation, expiry filtering, audit attribution, history, and reassessment.
- Test approval and source evidence are unmistakably `test-only://`; no real decision is represented.
- Registry products remain empty and onboarding is not executed.
- Candidate-specific assignment is explicitly not enforced by current 4D API; register candidate IDs are operator routing only.
- Membership expiry is recognized by production lookup but cannot be provisioned through the current membership assignment API.
- No SHF-Next changes, production DB writes, real human approvals, or frontend are included.
