# IOH-4 — Organization Administration & Entitlement Experience

## 1. Executive Result

IOH-4 replaces the legacy demo identity-management surface with a bounded organization-administration experience. The experience consumes canonical IOH-1/2/3 context, membership, role, service-entitlement, and relationship sources without becoming authority.

Organization admins can understand their active organization, members, roles, service states, relationship summary, security/access boundaries, and read-only settings. They may invoke only backend-authorized IOH-3 membership/role actions. Service entitlement, relationship, organization lifecycle, MFA, SSO, and SCIM authority remain outside this phase.

## 2. Repository Baseline

| Check | Result |
| --- | --- |
| Worktree | `/Users/mikeslate/Projects/shrv1-codex-next` |
| Branch | `codex/identity-org-hardening` |
| Starting HEAD | `95e6833f053da5f9cc501f256f4b8a0a14995dae` |
| IOH-1/2/3 | Complete and consumed. |
| Git safety | No commit, no push, no migration. |

## 3. IOH-3 Inputs

IOH-3 supplied bounded membership administration, target-role policy, self-escalation prevention, last-admin protection, duplicate active membership protection, revocation semantics, audit evidence, and IOH-2 context invalidation. IOH-4 uses those services directly rather than creating a new member or role authority.

## 4. Organization Admin Scope

| Capability | Organization Admin | Platform Admin | Source Authority | UI State |
| --- | --- | --- | --- | --- |
| Organization profile | Own active org only | Cross-org where permitted | `organizations` / identity service | Read-only |
| Members | Own active org only | Cross-org where permitted | `MembershipService` | List and permitted actions |
| Roles | Target-role policy only | Platform policy | IOH-3 membership/role policy | Assignable options only |
| Services | Display own org states | Provider/platform management | Service catalog entitlements | Read-only status |
| Relationships | Relevant summary | Relationship domain | Organization relationships | Read-only |
| Settings | Read-only in IOH-4 | Platform/source-domain managed | Source domains | No editable settings |

## 5. Organization Context

The page displays active organization name/status, membership status, actor role, security/access boundaries, service summary, and relationship summary. Internal tenant IDs remain out of the base UI.

## 6. Organization Profile

The profile displays display name, legal name, type, status, and mission/eligibility summary where available. Direct profile reads are now active-org bounded for ordinary org admins.

## 7. Organization Status

Organization status is displayed as a status badge. Non-active organizations show a suspended/non-operational state and disable member actions in the UI while backend policy remains authoritative.

## 8. Members

Members are loaded from `MembershipService.list()` through the active organization. The UI shows minimum necessary facts: user ID, membership status, role, effective dates where projected, and permitted actions.

## 9. Member Detail

IOH-4 does not add a separate member-detail route. Detail remains the bounded row projection: identity display, membership status, role, and available backend actions.

## 10. Roles

Role options come from `MembershipService.listAssignableRoles()` and are filtered by the IOH-3 target-role policy. Platform roles are hidden from ordinary org-admin assignment.

## 11. Protected / Last Admin Behavior

Last-admin and prohibited-role blocks remain backend enforced. The UI surfaces backend error reasons such as `LAST_ADMIN_REQUIRED` or `TARGET_ROLE_FORBIDDEN` instead of treating controls as authority.

## 12. Services

Services are projected from service catalog plus organization entitlements.

| Service State | Visible? | Actionable? | Next Action | Authority |
| --- | ---: | ---: | --- | --- |
| `ACTIVE` | Yes | Yes, where permissioned | Open where permitted | Service entitlement guard |
| `PENDING` | Yes if projected | No | Wait for approval | Source workflow |
| `SUSPENDED` | Yes | No | Contact support | Service catalog |
| `REVOKED` | Yes | No | Contact support | Service catalog |
| `EXPIRED` | Yes | No | Contact support | Service catalog |
| `AVAILABLE_FOR_DISCOVERY` | Yes | No | Request/contact support | Catalog display only |

## 13. Entitlement Authority Boundary

Organization admins cannot self-grant service entitlements. Existing service catalog guards still require provider or platform authority for entitlement mutation.

## 14. Active Services

Active services are shown as available to open only where downstream permissions and service route guards permit access.

## 15. Pending Services

Pending services are distinct from active services when projected. IOH-4 does not invent a request table or approval workflow.

## 16. Suspended / Revoked Services

Suspended, revoked, and expired services remain visible as context but non-actionable.

## 17. No-Service State

Organizations with no active service show a coherent no-service state: the organization is valid, but no active service entitlement is available.

## 18. Relationship Summary

Relationships are read-only context. Display does not imply membership or entitlement, and editing remains in the relationship source domain.

## 19. Owner / Operator / Accountable Organization

IOH-4 exposes only context needed for organization administration. Deeper owner/operator/accountable semantics remain workflow/reporting-specific.

## 20. Security / Access

The page states active org context is required, org admin is distinct from platform admin, and MFA/SSO/SCIM are not implemented in IOH-4.

## 21. Organization Settings

| Setting | Read/Write | Authority | Reason |
| --- | --- | --- | --- |
| Legal name | Read-only | Source-domain managed | Canonical update workflow is outside IOH-4. |
| Display name | Read-only | Source-domain managed | Canonical update workflow is outside IOH-4. |
| Organization status | Read-only | Platform/onboarding managed | Lifecycle changes are not org-admin UI authority. |
| Service entitlements | Read-only | Service catalog managed | Org admins cannot self-grant services. |
| Relationships | Read-only | Relationship domain managed | Mutation requires explicit relationship permission. |

## 22. Platform Admin Boundary

Platform authority remains explicit. IOH-4 does not model platform admins as organization admins in every org.

## 23. SHF / SHS Admin Boundary

SHF/SHS/platform administrative responsibilities remain permission-projected, not collapsed into a generic super-admin console.

## 24. Onboarding Handoff

The organization-admin experience assumes canonical activation has already produced a valid organization and active membership. Applicant access is not upgraded by IOH-4.

## 25. Initial Admin Experience

First-admin handoff remains deferred until provider-backed identity binding is resolved. IOH-4 does not grant admin based on email alone.

## 26. Multi-Org Administration

| User | Org | Role | Admin Capability | Expected UI |
| --- | --- | --- | --- | --- |
| Same user | Org A | `org_admin` | Members/roles for Org A | Controls visible and backend authorized. |
| Same user | Org B | `operator` | No org-admin mutation | Controls absent/disabled; backend denies. |
| Platform actor | Any authorized org | platform role | Explicit platform capability | Platform authority remains labeled. |

## 27. Stale Role / Membership

If admin role or membership is revoked, IOH-2 context refresh removes active authority and IOH-4 route/API calls fail safely.

## 28. Audit / Activity

IOH-4 does not add a broad activity feed. Membership assignment, role change, revocation, entitlement mutation, and relationship mutation continue to emit source-domain audit evidence where implemented.

## 29. Help / Support

Service and suspended/no-service states point to support/request paths conceptually. IOH-4 does not merge OGL, DGAL, NCA, or human support delivery.

## 30. EXR Boundary

EXR owns shell placement, information architecture, and experience composition. IOH-4 provides bounded org-admin data and behavior at the existing identity route.

## 31. NCA Boundary

NCA remains responsible for notification delivery and state. IOH-4 does not implement notification delivery.

## 32. Responsive Acceptance

The page uses responsive grids, horizontal overflow for tables, semantic tables/lists, and stable controls intended for 375px, tablet, and desktop.

## 33. Accessibility

The surface uses semantic headings, tables, labels, disabled controls, role/status regions, text status labels, keyboard-native buttons/selects, and no color-only status.

## 34. Empty States

Required empty states are represented: no members beyond initial admin, no pending invites, no active services, no relationships, and no editable settings.

## 35. Error States

Unauthorized/unavailable context shows a safe retry state. Suspended organization, forbidden role action, stale membership, and backend action denial display user-readable status.

## 36. Security Tests

| Test | Evidence |
| --- | --- |
| Org A admin cannot administer Org B | `IOH-4 organization profile read is active-org bounded...` |
| Non-admin cannot mutate membership | `IOH-4 stale or non-admin membership authority cannot mutate` |
| Stale admin role cannot mutate | Same backend permission/IOH-2 refresh path. |
| Revoked membership cannot administer | IOH-2/IOH-3 regressions. |
| Admin cannot self-grant entitlement | `IOH-4 org admin cannot directly self-grant service entitlement` |
| Admin cannot assign prohibited role | `TARGET_ROLE_FORBIDDEN` regression. |
| Platform-only setting not changed | Settings matrix read-only. |
| Suspended org operational action blocked | UI disables actions; backend remains authority. |

## 37. Positive Tests

Positive tests cover own-org overview, member list/status, role display, service states, no-service state, relationship summary, and multi-org/profile scoping.

## 38. Browser Acceptance

Browser acceptance covers the existing `/identity` route with active services, pending/no-service copy, member list, role action controls, suspended/read-only language, settings read-only behavior, and mobile rendering.

## 39. Validator

`scripts/validate-ioh-org-admin-experience.mjs` validates bounded surface, no platform leakage, IOH-3 member consumption, role policy, entitlement authority preservation, read-only relationship summary, active org requirement, multi-org scoping, suspended semantics, settings bounds, EXR/NCA boundaries, no MFA/SSO/SCIM, and no migration.

Run with `npm run ioh:org-admin:validate`.

## 40. Migration State

No migration was added. Existing organization, membership, role, service catalog, entitlement, and relationship data support this experience. No migration-number collision with NCA 143 was introduced.

## 41. P0 / P1 Findings

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | No cross-org authority, tenant isolation failure, auth bypass, or entitlement self-grant remains in IOH-4 scope. |
| Repository-local P1 | 0 | Organization admin experience is now coherent locally without duplicate authority. |

## 42. Files Created

| File | Purpose |
| --- | --- |
| `apps/shs-api/src/domain/identity/service/organization-admin-experience-service.ts` | Bounded org-admin projection. |
| `apps/shs-api/tests/ioh4-org-admin-experience.test.ts` | IOH-4 focused tests. |
| `scripts/validate-ioh-org-admin-experience.mjs` | IOH-4 validator. |
| `docs/architecture/IOH-4_ORGANIZATION_ADMINISTRATION_ENTITLEMENT_EXPERIENCE.md` | IOH-4 report. |

## 43. Files Modified

| File | Purpose |
| --- | --- |
| `apps/shs-api/src/domain/identity/api/routes.ts` | Adds org-admin overview and active-org profile bound. |
| `apps/shs-api/src/domain/identity/service/membership-service.ts` | Adds assignable-role projection using IOH-3 target policy. |
| `src/pages/admin/identity/IdentityManagement.jsx` | Replaces legacy demo identity UI with bounded org-admin experience. |
| `package.json` | Adds `ioh:org-admin:validate`. |

## 44. Git State

Working tree contains IOH-0 through IOH-4 artifacts and source/test changes. No commit or push was performed.

## 45. IOH-4 Decision

IOH-4 is complete when focused tests, browser acceptance, validators, IOH regressions, typecheck/build, and `git diff --check` pass.

## 46. Exact Next Phase

IOH-5 — Session / Revocation / Identity Gateway Hardening, only after explicit owner instruction.
