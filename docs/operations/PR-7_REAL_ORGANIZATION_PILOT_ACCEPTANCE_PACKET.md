# PR-7 Real-Organization Pilot Acceptance Packet

This is a production-shaped acceptance checklist. It is not evidence of a real customer, legal approval, or provider activation.

## Organization
- [ ] Organization record created or linked through the canonical onboarding path.
- [ ] Pilot/test classification recorded; no fabricated customer identity.
- [ ] Tenant and organization scope verified.
- [ ] Relationship owner/operator/accountability verified.

## Activation
- [ ] Onboarding reviewed and approved.
- [ ] Organization activated exactly once.
- [ ] Requested and approved services recorded.
- [ ] Entitlements visible and scoped.
- [ ] Suspended/revoked entitlement denial tested.

## Users and Service
- [ ] Admin/operator role verified.
- [ ] Ordinary user role verified.
- [ ] Unauthorized service access denied.
- [ ] Active organization context verified.
- [ ] Primary workflow read and write paths completed.

## Evidence and Reporting
- [ ] Canonical evidence reference generated.
- [ ] Actor, organization, tenant, source, timestamp, and provenance retained.
- [ ] Organization report/status projection generated.
- [ ] Private data did not become public automatically.
- [ ] Correction/recompute behavior checked where applicable.

## CivicSure Provider Self-Service
- [ ] Provider workspace is available only to the authenticated provider organization.
- [ ] Provider sees only its own evidence requests, findings, and corrective actions.
- [ ] Provider submission uses canonical Evidence provenance and retains actor, provider, tenant, and source references.
- [ ] Provider can respond to findings and corrective actions without self-verifying, publishing, or triggering payment.
- [ ] Direct-ID cross-provider access is denied.

## Safety and Operations
- [ ] Cross-organization direct-ID access denied.
- [ ] Invalid input, stale ID, failed provider, and revoked entitlement fail safely.
- [ ] `/health/live` and `/health/ready` checked.
- [ ] Correlation ID and audit/event references captured.
- [ ] Recovery and provider-outage runbooks reviewed.
- [ ] WF-040 remains intact and unrestricted Agent Fabric execution is denied.

## Usability and Handoff
- [ ] User can identify the starting point and next action.
- [ ] Empty, unavailable, and denied states are understandable.
- [ ] Keyboard, labels, focus, contrast, and responsive layout reviewed.
- [ ] Support path and escalation boundary identified.
- [ ] Documentation gaps recorded in `docs/architecture/DGAL_REAL_PILOT_INPUTS.md`.

## Final Decision
- [ ] Product owner accepts the bounded pilot evidence.
- [ ] External organization, identity, legal, provider, and deployment dependencies are separately recorded.
- [ ] No P0 or repository-local P1 remains.
- [ ] PR-7 status is recorded as RESOLVED only when all scoped gaps have closure evidence.
- [x] Repository-local PR0-GAP-027 provider self-service closure evidence is recorded; real provider participant UAT remains an external PR0-GAP-028 requirement.
