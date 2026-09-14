# IOH-3 — Membership & Role Administration Hardening

## 1. Executive Result

IOH-3 hardens the existing canonical `MembershipService` for bounded organization-admin membership administration. Organization admins may administer memberships only inside their active organization and only for permitted organization-scoped target roles. Platform authority remains explicit.

Invitation functionality is deferred. The repository does not have canonical production invitation persistence, hashed token storage, expiry, revocation, or acceptance state. Implementing that safely would require an owner-reviewed migration and migration-number collision review.

## 2. Repository Baseline

| Check | Result |
| --- | --- |
| Worktree | `/Users/mikeslate/Projects/shrv1-codex-next` |
| Branch | `codex/identity-org-hardening` |
| Starting HEAD | `95e6833f053da5f9cc501f256f4b8a0a14995dae` |
| IOH-1/2 | Complete; context and multi-org hardening consumed. |
| Git safety | No commit, no push, no migration. |

## 3. IOH-2 Inputs

IOH-2 established server-authoritative active organization context, revoked membership invalidation, role/permission recomputation, tenant isolation, and safe no-org/no-role states. IOH-3 verifies membership revocation and role changes feed those semantics on subsequent authoritative context resolution.

## 4. Membership Lifecycle

Actual repository lifecycle remains minimal:

| State | Allowed From | Allowed To | Authority Required | Audit Event |
| --- | --- | --- | --- | --- |
| `active` | membership assignment | `revoked`; role changed | `identity.membership.assign` or `identity.membership.revoke` in active org | `identity.membership.assigned`, `identity.membership.role_changed`, `identity.membership.revoked` |
| `revoked` | `active` | none in IOH-3 | Not supported locally | Existing revoke event remains evidence |

Suspended, removed, invited, pending, and reactivated membership states are not canonical repository states in IOH-3.

## 5. Invitation Model

Invitation functionality is deferred. IOH-3 does not implement invite persistence, acceptance, token generation, or delivery.

Reason: a safe canonical invitation model needs durable invitation state, one-time hashed token storage, expiry, revocation, acceptance replay protection, and identity-provider binding. That requires a reviewed migration and owner decision separate from the approved bounded membership-administration direction.

## 6. Existing User Invitation

Deferred with the invitation model. Existing users may still receive direct membership assignment only through backend-authorized `MembershipService.assign()` after user, organization, role, tenant, and actor authority validation.

## 7. New User Invitation

Deferred. IOH-3 does not create a fake local identity system for pre-user invites. External identity/provider registration remains outside this phase.

## 8. Role Assignment

Role assignment is backend-only through `MembershipService.assign()` and `MembershipService.changeRole()`. Client-supplied role IDs are validated against canonical roles and target-role policy.

## 9. Target Role Policy

| Actor Authority | Target Role | Allowed? | Reason |
| --- | --- | ---: | --- |
| Org admin in active org | `operator`, `program_manager`, `reviewer`, `reviewer_verifier`, `instructor`, `student`, `read_only_viewer`, `program_worker`, `auditor`, `leadership_funder_viewer` | Yes | Explicit bounded org-admin target roles. |
| Org admin in active org | Organization-owned custom role | Yes | Role belongs to the same organization and is organization-scoped. |
| Org admin in active org | `org_admin`, `partner_org_admin` | No | Admin-role assignment remains platform/owner controlled. |
| Org admin in active org | `super_admin`, `shs_admin`, `shf_admin`, platform/global role | No | Platform authority cannot be created by org admin. |
| Platform actor | Platform or org role | Yes | Platform authority remains explicit. |
| Non-admin | Any membership role operation | No | Missing backend permission. |

## 10. Self-Escalation Prevention

Non-platform users cannot change their own membership role or revoke their own membership through the org-admin service path. Client role labels remain non-authoritative.

## 11. Last-Admin Protection

Implemented for non-platform actors. Revoking or demoting the last active `org_admin` or `partner_org_admin` in an organization fails with `LAST_ADMIN_REQUIRED`.

Platform-authorized recovery remains possible because platform actors are explicitly exempt from the guard.

## 12. Initial Organization Admin Handoff

Not implemented in IOH-3. Onboarding activation already creates organization infrastructure, relationships, and entitlements, but IOH-0 did not find a secure first-admin membership handoff. That remains a separate owner decision requiring identity-provider binding; email match alone is not sufficient authority.

## 13. Member List

Existing member list remains bounded to the active organization unless the actor has platform authority. It returns minimum membership facts: member ID, user ID, organization ID, status, effective dates, role ID/name, and timestamps.

## 14. Membership Creation

Direct membership creation is not client-authority. `MembershipService.assign()` validates:

- authenticated actor
- membership assignment permission
- active organization scope
- target user exists and is active
- role exists and is valid for the organization
- target-role policy
- duplicate active membership

Membership IDs are now server-derived.

## 15. Suspension

Not canonical in current membership table usage. No `suspended` transition is implemented in IOH-3.

## 16. Revocation

Revocation sets membership `status='revoked'`, closes `effective_to`, emits `identity.membership.revoked`, and causes IOH-2 active org resolution to fail on the next authoritative context resolution.

## 17. Removal

Hard removal is not implemented. IOH-3 preserves durable membership history through revocation.

## 18. Role Removal

Role removal is represented as role change/demotion only when another role is assigned. Active membership without a usable role yields a no-permission/no-role-safe IOH context rather than a fallback role.

## 19. Multi-Org Administration

| User | Org A | Org B | Operation | Expected |
| --- | --- | --- | --- | --- |
| User is operator in A and B | Admin acts in A | No admin authority in B | Change A role | Org B unchanged. |
| User is operator in A and B | Admin acts in A | No admin authority in B | Revoke A membership | Org B membership remains. |
| Admin in A | Org A active | Org B target | Change Org B role | Denied/not found from A scope. |

## 20. Tenant Isolation

`actorOrganization()` still requires active organization and matching derived tenant. Org A admin cannot list, assign, change, or revoke Org B memberships.

## 21. Platform Admin Boundary

Platform actors remain explicit through `isPlatformGlobalRole()`. IOH-3 does not model platform admins as synthetic org admins in every organization.

## 22. Duplicate Membership

Duplicate active membership for the same user and organization is service-blocked:

- same role: replayed idempotently
- different role: `DUPLICATE_ACTIVE_MEMBERSHIP`

No migration was added for a database unique index in IOH-3.

## 23. Duplicate Invitation

Deferred with invitations. No invitation authority was introduced.

## 24. Invitation Expiration

Deferred with invitations. Expiration must be server-side and durable when the canonical invitation model is approved.

## 25. Invitation Revocation

Deferred with invitations. Revocation must make tokens unusable when implemented.

## 26. Token Security

Deferred with invitations. Future invitation tokens should be stored hashed, one-time, expiring, and revocable.

## 27. Audit Events

Implemented/reused audit events:

- `identity.membership.assigned`
- `identity.membership.role_changed`
- `identity.membership.revoked`

Invitation audit events are deferred until canonical invitations exist.

## 28. IOH-2 Context Invalidation

Tests verify revoked membership produces `MEMBERSHIP_REVOKED` on next IOH-2 context resolution. Role changes recompute `organization_scoped_roles` and permission context on subsequent authoritative resolution.

## 29. EXR Boundary

IOH owns membership state, role policy, backend authority, and admin capability projection. EXR owns page composition, shell placement, and workflow presentation.

## 30. NCA Boundary

NCA remains responsible for notification delivery. IOH-3 emits canonical audit evidence; it does not implement invitation emails or membership-change notifications.

## 31. Privacy

Member administration exposes minimum membership facts and does not expose unrelated org memberships, hidden platform metadata, or private contact data beyond existing identity records.

## 32. Security Tests

| Test | Evidence |
| --- | --- |
| Non-admin cannot administer membership | `IOH-3 non-admin cannot perform membership administration` |
| Admin cannot assign prohibited target role | `IOH-3 org admin can assign bounded org roles...` |
| Self-escalation blocked | `IOH-3 self-escalation...` |
| Org A admin cannot administer Org B | `IOH-3 role change and revocation remain scoped...` |
| Duplicate membership prevented | `IOH-3 self-escalation and duplicate active membership...` |
| Revoked membership loses IOH-2 authority | `IOH-3 last-admin protection and revocation invalidation...` |
| Org A role change does not alter Org B | `IOH-3 role change and revocation remain scoped...` |
| Last-admin protection | `IOH-3 last-admin protection...` |

## 33. Positive Tests

| Test | Evidence |
| --- | --- |
| Valid membership assignment | IOH-3 bounded role assignment test |
| Existing custom org role assignment | IOH-3 custom role assignment test |
| Role assignment/change | IOH-3 scoped role change test |
| Membership revocation | IOH-3 revocation invalidation and existing integration test |
| Multi-org independent role states | IOH-3 scoped role change test |

Invitation positive tests are deferred because invitations are not implemented.

## 34. Validator

`scripts/validate-ioh-membership-role-admin.mjs` validates canonical membership owner, canonical role owner, lifecycle states, target-role policy, self-escalation prevention, org isolation, duplicate active membership protection, invitation deferral, revocation behavior, IOH-2 invalidation, audit evidence, and EXR/NCA boundaries.

Run with `npm run ioh:membership:validate`.

## 35. Migration Decision

No migration was added. Existing membership/role tables support bounded admin hardening. Invitations would require a migration, so they remain deferred.

NCA reached migration 143 independently. IOH-3 does not create migration 143 or any migration, avoiding cross-branch collision risk.

## 36. P0 / P1 Findings

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | No confirmed cross-org authority, tenant isolation failure, or privilege escalation path remains in IOH-3 scope. |
| Repository-local P1 | 0 | Bounded membership/role administration is hardened locally. Invitations and first-admin handoff remain owner/migration decisions, not partially implemented gaps. |

## 37. Owner Decisions Encountered

| Decision | Status |
| --- | --- |
| Bounded org-admin membership administration | Approved by owner clarification and implemented. |
| Canonical invitation model | Not approved in this clarification; deferred. |
| Initial organization admin handoff | Not approved in this clarification; deferred. |
| Full suspended/reactivated membership lifecycle | Not canonical in current schema; deferred. |

## 38. Files Created

| File | Purpose |
| --- | --- |
| `apps/shs-api/tests/ioh3-membership-role-admin.test.ts` | Focused IOH-3 membership/role policy tests. |
| `scripts/validate-ioh-membership-role-admin.mjs` | IOH-3 validator. |
| `docs/architecture/IOH-3_MEMBERSHIP_ROLE_ADMINISTRATION_HARDENING.md` | IOH-3 report. |

## 39. Files Modified

| File | Purpose |
| --- | --- |
| `apps/shs-api/src/domain/identity/service/membership-service.ts` | Bounded role policy, duplicate protection, self-change prevention, last-admin guard, role change, audit. |
| `apps/shs-api/src/domain/identity/api/routes.ts` | Adds bounded membership role-change endpoint. |
| `package.json` | Adds `ioh:membership:validate`. |

## 40. Git State

Working tree contains IOH-0 through IOH-3 artifacts and source/test changes. No commit or push was performed.

## 41. IOH-3 Decision

IOH-3 is complete when focused tests, IOH-1/2 regressions, membership integration tests, validator, typecheck/build, and `git diff --check` pass.

## 42. Exact Next Phase

IOH-4 — Organization Admin / Entitlement Experience, only after explicit owner instruction.
