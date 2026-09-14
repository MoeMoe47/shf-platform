# IOH Owner Decision Lock

Pre-IOH-1 Architecture Decision Package

## 1. Executive Summary

IOH-0 established that identity and organization infrastructure is not greenfield. Backend authority already exists for canonical organizations, users, memberships, organization-scoped roles, permissions, active organization validation, organization relationships, onboarding activation, service entitlements, tenant derivation, and foundational Auth0-compatible Identity Gateway behavior.

The owner decision lock narrows IOH-0's decision register into four categories:

| Category | Meaning | Count |
|---|---|---:|
| `ARCHITECTURE_DETERMINED` | Required by existing security/canonical authority; not optional owner preference. | 16 |
| `OWNER_APPROVAL_REQUIRED` | Product/policy decision needed before the relevant IOH phase. | 8 |
| `LATER_PHASE_DECISION` | Real decision, but not blocking IOH-1 contracts. | 7 |
| `EXTERNAL_DEPENDENCY` | Requires provider/tenant/configuration or external policy outside repository-local code. | 4 |

IOH-1 may begin after the owner approves the genuinely blocking product choices listed in section 32: active organization persistence/route behavior, the minimum membership/role data contract, and whether IOH-1 may include entitlement and relationship summary projections in `/auth/me` or a sibling context endpoint.

## 2. IOH-0 Baseline

Source read completely: `docs/architecture/IOH-0_IDENTITY_ORGANIZATION_EXPERIENCE_HARDENING_AUDIT.md`.

Authoritative IOH-0 facts used here:

- P0 findings: 0.
- P1 findings: 7.
- Backend authority is strong; product experience is weak.
- Active organization authority is backend/server validated; frontend header/localStorage is only a selector.
- Multi-organization membership exists backend-side; product switching is not ready.
- Organization admin member/role UX is incomplete.
- Production invitations are absent.
- Last-admin and target-role policy evidence was not found.
- Entitlements are backend-authoritative but not coherently reflected in navigation/landing.
- Identity Gateway is foundational/code-complete but not production-ready until external Auth0/session/database proof and provider lifecycle policy are complete.

## 3. Governing Authority Laws

These are locked by architecture and security:

| Law | Classification |
|---|---|
| Authentication does not equal authorization. | `ARCHITECTURE_DETERMINED` |
| Organization selection does not equal organization membership. | `ARCHITECTURE_DETERMINED` |
| Membership does not equal relationship. | `ARCHITECTURE_DETERMINED` |
| Role label does not equal permission. | `ARCHITECTURE_DETERMINED` |
| Entitlement does not equal navigation visibility. | `ARCHITECTURE_DETERMINED` |
| UI state does not equal backend authority. | `ARCHITECTURE_DETERMINED` |
| Client-selected organization context must never grant authority. | `ARCHITECTURE_DETERMINED` |

## 4. Active Organization Decision

Classification: `OWNER_APPROVAL_REQUIRED` for persistence and route behavior; `ARCHITECTURE_DETERMINED` for authority.

CURRENT STATE

Backend accepts `x-shs-organization-id` / `x-organization-id` as a selector and validates it against active membership or explicit platform authority. Multi-org users must provide an active organization. Frontend operator clients often persist `shfOperatorOrganizationId` in localStorage.

PROBLEM

The selector is secure as backend input, but the product behavior is inconsistent: refreshes, stale memberships, suspended orgs, and route invalidation are not coherently handled.

OPTION A

Purely client-selected context. This is rejected because UI state cannot be authority.

OPTION B

Server-validated contextual state: client may remember a preferred active organization selector, but every request is validated by backend membership/org status and receives server-derived role/permission/entitlement context.

OPTION C

Server-persisted active organization session state only. This is heavier than IOH-1 needs and risks conflating session state with authority.

RECOMMENDED OPTION

Option B: a hybrid selector model. Frontend stores only a preferred selector; server validates on every request and returns canonical active context.

WHY

This matches IOH-0 evidence and preserves all authority laws. It avoids unnecessary migration for IOH-1 while leaving room for later server-side preference.

WHAT THIS UNLOCKS

IOH-1 can define `authorizedOrganizations`, `activeOrganization`, membership status, role/permission projection, and entitlement summary contracts.

WHAT THIS DOES NOT CHANGE

It does not create membership, permissions, entitlements, relationships, workflow authority, or tenant authority.

Canonical behavior:

- Selected by explicit user choice when multiple organizations exist; single-org users may be auto-selected by server.
- Validated by active membership or platform authority.
- Persists across refresh only as a non-authoritative preferred selector.
- Removed membership causes next request/context refresh to fail closed and move user to org-selection/no-access recovery.
- Suspended org causes fail-closed authority with a suspended-organization explanation.
- Multi-org users must explicitly select.
- Active org never implies membership or entitlement.

## 5. Multi-Org Switching Decision

Classification: `OWNER_APPROVAL_REQUIRED`.

CURRENT STATE

Backend supports multi-org users and prevents role leakage. No product-ready switcher exists.

PROBLEM

Users need explicit switching, and switching must clear stale domain state without granting authority.

OPTION A

Allow silent switching by route or localStorage default.

OPTION B

Require explicit switch through an authenticated organization picker backed by `authorizedOrganizations`; after switch, reload context and clear org-scoped state.

OPTION C

Force logout/login for organization changes.

RECOMMENDED OPTION

Option B.

WHY

It preserves backend authority, matches multi-org semantics, and provides a humane product experience.

WHAT THIS UNLOCKS

IOH-2 can build switching UX and stale-state clearing against IOH-1 contracts.

WHAT THIS DOES NOT CHANGE

It does not let the switcher assign membership, roles, permissions, relationships, or entitlements.

Canonical behavior:

- Multi-org users explicitly switch.
- Switching belongs in a global account/org context control or account menu; EXR later chooses shell placement.
- Role and permissions change immediately with active org.
- Entitlements change immediately with active org.
- Org switch clears org-scoped caches, queues, forms, selected records, and workflow state.
- Default behavior redirects to a safe organization landing when the current route is invalid for the selected org.
- Preserving route is allowed only when IOH context says the route remains authorized and entitled.

## 6. Organization / Role Display

Classification: `OWNER_APPROVAL_REQUIRED` for product display requirements; `ARCHITECTURE_DETERMINED` for data meaning.

Users in authenticated organization-scoped experiences should always be able to understand:

- account identity
- active organization
- active membership status
- active role label for the current organization
- meaningful permission/entitlement-derived service context where relevant

Conceptual placement:

- Global shell: active organization and account identity summary.
- Account area: authorized organizations, memberships, sessions/security, provider link, preferences.
- Contextual page header: service/workflow-specific organization and entitlement context.

IOH should define the data contract. EXR owns shell information architecture and composition.

## 7. Membership Administration

Classification: `OWNER_APPROVAL_REQUIRED`.

CURRENT STATE

Backend supports listing, assigning, and revoking memberships. Production invitation and product-ready member admin UX are absent.

PROBLEM

Organization admins need ordinary member operations, but direct self-service must not create escalation or cross-org leakage.

OPTION A

Platform-only membership administration.

OPTION B

Organization admins can view members, invite eligible members, inspect status, view role assignment, and revoke/deactivate memberships within their active organization, subject to target-role policy and last-admin protection.

OPTION C

Full self-service member/role management by every org admin with no additional role-target restrictions.

RECOMMENDED OPTION

Option B.

WHY

It is the minimum useful org-admin capability and preserves backend authority boundaries.

WHAT THIS UNLOCKS

IOH-3 can implement a production org-admin member workflow.

WHAT THIS DOES NOT CHANGE

It does not grant org admins platform roles, cross-org membership authority, or entitlement authority.

Minimum canonical admin capability:

- View members in active organization.
- Inspect membership status and role assignment.
- Invite a member through canonical invitation lifecycle.
- Revoke/deactivate membership with audit evidence.
- Re-enable only through controlled policy, likely platform or eligible org-admin action.
- Remove should mean non-destructive revoke/end membership, not hard delete.

## 8. Role Administration

Classification: `ARCHITECTURE_DETERMINED` for boundaries; `OWNER_APPROVAL_REQUIRED` for exact target-role policy.

Security-determined boundaries:

- Roles can differ by organization.
- Role changes must be backend-only and audited.
- Client role labels cannot grant permission.
- Self-role changes must not be permitted as an authority mechanism.
- Last-admin protection must exist before broad org-admin role management is product-ready.
- Platform/global roles require platform authority.

Owner/product policy still needed:

- Which organization roles an org admin may assign.
- Whether org admins can assign `org_admin` or only non-admin roles.
- Whether role assignment requires invitation acceptance, two-person review, or immediate activation.

Recommendation:

- Platform actors assign platform roles.
- Organization admins may assign only owner-approved organization roles within the active organization.
- `super_admin`, `shs_admin`, `shf_admin`, and other platform/provider authority roles require platform-level authority.
- A user can have different roles across organizations.
- Last active admin cannot be revoked or demoted without replacement or platform override.

## 9. Invitations

Classification: `OWNER_APPROVAL_REQUIRED`.

CURRENT STATE

Production invitations are absent. Demo `/invites` routes are development-only and not canonical.

PROBLEM

Membership creation needs a safe human onboarding path that binds invitation, organization, intended role, identity provider/account creation, expiration, acceptance, revocation, and audit.

OPTION A

Organization admin sends invitation.

OPTION B

Platform operator provisions all memberships.

OPTION C

Organization onboarding creates the initial admin/member through an approved handoff, then organization admins invite later members.

RECOMMENDED OPTION

Option C.

WHY

It matches existing onboarding authority while giving activated organizations a scalable post-activation path.

WHAT THIS UNLOCKS

IOH-3 can design canonical invite persistence and acceptance.

WHAT THIS DOES NOT CHANGE

Invitation does not grant authority until accepted and activated by backend membership rules.

Canonical invitation model:

- One-time token.
- Expiration required.
- Bound to organization and intended role.
- Acceptance revalidates inviter authority, organization status, role target policy, and recipient identity.
- Existing account: link accepted invite to existing canonical user/provider identity after authentication.
- New account: provider creates/authenticates identity, then SHS creates/activates membership after acceptance.
- Revocation invalidates token before acceptance.
- Accepted/expired/revoked states are auditable.

## 10. Initial Organization Admin

Classification: `OWNER_APPROVAL_REQUIRED`.

CURRENT STATE

Onboarding activation creates/reuses organization, relationship, and approved entitlements. IOH-0 did not find a canonical production handoff that creates the first organization admin membership.

PROBLEM

The activated organization needs an initial administrator, but email/contact fields alone are not sufficient identity authority.

OPTION A

Applicant contact automatically becomes org admin from email.

OPTION B

Reviewer selects/approves a representative identity during activation; membership becomes active only after provider-backed authentication/invite acceptance.

OPTION C

Platform operator manually provisions first admin after activation.

RECOMMENDED OPTION

Option B, with platform override fallback.

WHY

It ties first-admin authority to onboarding governance and provider identity, without trusting raw email as identity.

WHAT THIS UNLOCKS

IOH-3/4 can connect onboarding handoff to membership administration.

WHAT THIS DOES NOT CHANGE

Approval alone does not grant membership. Activation alone does not authenticate a person.

## 11. Organization Admin Experience

Classification: `OWNER_APPROVAL_REQUIRED` for scope.

Initial IOH organization-admin scope should include:

| Section | Initial IOH Scope | Notes |
|---|---|---|
| Organization | Yes | Profile, status, basic identity, onboarding/activation state. |
| Members | Yes | View/invite/revoke/status. |
| Roles | Yes, bounded | Role assignment display and allowed target roles. |
| Services | Yes | Entitlement states and safe discovery. |
| Relationships | View-only initially | Display relevant institutional relationships. |
| Security | Partial | Sessions/account security through identity/account area. |
| Settings | Minimal | Non-authority display/edit fields only if canonical owner exists. |
| Audit / Activity | View summary | Domain audit evidence, not authority. |

Source-domain-specific workflows should remain in their domains. Do not create a generic super-admin console.

## 12. Entitlement Experience

Classification: `ARCHITECTURE_DETERMINED` for authority; `OWNER_APPROVAL_REQUIRED` for visibility/edit scope.

Repository vocabulary: `ACTIVE`, `SUSPENDED`, `REVOKED`, `EXPIRED`. Product may add non-authority display states such as `AVAILABLE` and `PENDING`, but they must map to canonical records or request states.

Recommendation:

- Organization admins should see active, suspended, revoked, expired, and available requestable services where policy permits.
- Requested/pending services should be visible only when backed by onboarding/service request workflow.
- Entitlements should not be directly editable by ordinary organization admins.
- Entitlement changes remain owned by provider/platform authority or onboarding lifecycle.
- Service activation status should be visible in org admin, service landing, and contextual page headers.

## 13. Relationship Visibility

Classification: `OWNER_APPROVAL_REQUIRED` for visibility/edit scope.

Recommendation:

- Organization users/admins may see relationships that explain their own organization's status and service eligibility: `NETWORK_MEMBER_OF`, `INCUBATES`, `SHARED_SERVICES_PROVIDER_FOR`, and relevant `OPERATES_FOR`.
- Sensitive/internal relationship metadata should remain administrative.
- Organization admins should not directly edit canonical relationships in initial IOH unless they hold explicit relationship-management permission.
- Relationship display belongs in organization profile/admin as context, not as authority.

Preserved distinction: relationship does not imply membership or entitlement.

## 14. Owner / Operator / Accountable Org

Classification: `LATER_PHASE_DECISION`.

Recommendation:

- Ordinary users should not see all three labels by default.
- Operators/admins should see them where workflow responsibility, reporting, or legal accountability depends on the distinction.
- They are necessary in program administration, reports, legal/governance surfaces, and cross-organization operations.
- They should remain backend/reporting semantics on learner/basic user surfaces unless needed for clarity.

This does not block IOH-1, but IOH-1 should reserve fields for future program/workflow context.

## 15. No-Org / No-Role / No-Service Experience

Classification: `OWNER_APPROVAL_REQUIRED` for product destinations; `ARCHITECTURE_DETERMINED` for fail-closed authority.

Canonical behavior:

| State | Safe Destination | Explanation |
|---|---|---|
| Authenticated user with no organization | Account/no-access state | "No active organization membership is available." |
| Organization but no role/permissions | Account/org access problem | "Your membership has no role or permissions for this organization." |
| Organization with no active service entitlement | Organization services landing | "This organization is not enabled for this service." |
| Revoked membership | Account/org selection recovery | "Your membership is no longer active." |
| Suspended organization | Suspended organization state | "This organization is suspended; authorized work is unavailable." |

Users should not be stranded on forbidden pages. Backend still returns `401`/`403`; frontend maps those to safe recovery destinations.

## 16. Session / Authority Refresh

Classification: `ARCHITECTURE_DETERMINED`.

Required behavior:

- Immediate server-side enforcement on every protected request.
- Next-request re-resolution of user, membership, role, permission, org status, and entitlement state.
- Frontend context refresh after org switch, 401/403, session event, or explicit account change.
- Role/membership/entitlement changes do not rely on stale browser projection.

Recommended handling:

| Change | Enforcement | UX |
|---|---|---|
| Role changes | Next-request backend re-resolution | Refresh context and update controls. |
| Membership removed/revoked | Backend fail-closed | Clear active org if affected. |
| Membership suspended | Backend fail-closed once modeled | Show suspended membership state. |
| Entitlement revoked | Entitlement guard fail-closed | Remove service access and redirect safely. |
| Organization suspended | Identity/org context fail-closed | Suspended org state. |
| User account revoked | Authentication fails | Logout/session revoked state. |

Token/session invalidation is required for user account/session revocation; ordinary role/entitlement changes can be enforced by request-time re-resolution.

## 17. Session Management / Revocation

Classification:

| Capability | Classification |
|---|---|
| View active own sessions | `LATER_PHASE_DECISION` |
| Sign out other own sessions | `LATER_PHASE_DECISION` |
| Admin revoke user session | `LATER_PHASE_DECISION` with strong audit/re-auth |
| Force reauthentication | `EXTERNAL_DEPENDENCY` plus repository session policy |

Recommendation: do not block IOH-1 on full session-management UX. IOH-1 should define session status and revocation signals in the context contract.

## 18. MFA

Classification: `EXTERNAL_DEPENDENCY`.

Actual repository capability: MFA is not implemented locally. IOH-0 classifies MFA as provider-owned/external.

Architecture/security recommendation:

- Required for platform admins.
- Required for SHF/SHS admin roles before production.
- Strongly recommended or policy-gated for organization admins.
- Optional or provider-policy-based for ordinary users.
- Owned by external IdP/Auth0 policy, with SHS consuming assurance signals where needed.

This decision does not authorize repository-local MFA implementation in IOH-1.

## 19. Enterprise Federation / SSO

Classification: `EXTERNAL_DEPENDENCY`.

Recommendation:

- OIDC/Auth0 remains the approved immediate provider path.
- Enterprise SSO/federation belongs later, not initial IOH contracts.
- SAML/enterprise federation/SCIM are future provider integrations.
- IOH-1 should preserve provider-neutral fields and avoid hardcoding enterprise assumptions.

## 20. Identity Gateway Scope

Classification: `ARCHITECTURE_DETERMINED`.

Identity Gateway responsibility:

- authentication integration
- provider credential verification
- stable identity link resolution
- session/provider context
- account status/revocation hooks
- future MFA/federation integration signals

Identity Gateway must not become:

- role authority
- entitlement authority
- organization relationship authority
- workflow authority
- organization membership authority beyond resolving current SHS-owned membership state

## 21. SHF / SHS Administration

Classification: `OWNER_APPROVAL_REQUIRED` for product composition.

Options:

- A. One universal admin.
- B. Shared shell with separate authority projections.
- C. Fully separate admin destinations.

Recommendation: Option B.

Reason: SHF and SHS share identity/org infrastructure but hold different responsibilities. A shared shell may consume the same IOH context contract, while permissions/entitlements determine visible capabilities. Avoid generic super-admin behavior.

## 22. Applicant -> Organization Member Handoff

Classification: `OWNER_APPROVAL_REQUIRED`.

Canonical handoff:

`Applicant -> Approved Representative -> Provider-authenticated identity -> Organization Membership -> Initial Role -> Activated Organization Experience`

Rules:

- Membership is created only after activation authority and identity acceptance/provisioning.
- Role becomes active only when canonical membership is active.
- Approval alone does not grant membership.
- Activation establishes organization infrastructure, not personal access by itself.
- Separate invitation/acceptance or explicit platform provisioning is needed unless a provider-authenticated representative already exists.

## 23. Auditability

Classification: `ARCHITECTURE_DETERMINED`.

Identity/org changes that must emit durable audit/domain evidence:

| Event | Required |
|---|---|
| Membership invited | Yes, once invitation model exists. |
| Membership accepted | Yes. |
| Membership revoked/deactivated | Yes. |
| Role assigned | Yes. |
| Role removed/changed | Yes. |
| Organization switched | Audit only when security-relevant or persisted; ordinary local selector changes can be telemetry/context events. |
| Entitlement changed | Yes. |
| Relationship changed | Yes. |
| Organization suspended | Yes. |
| Organization reactivated | Yes. |
| Session revoked | Yes. |

Audit logs remain evidence, not authority.

## 24. EXR Interface Contract

Classification: `ARCHITECTURE_DETERMINED`.

Boundary:

- IOH provides canonical identity/organization context data.
- EXR determines shell placement, IA, navigation composition, and experience presentation.
- IOH does not redesign shared shells in this decision-lock or IOH-1.

Safe IOH outputs for EXR:

- current user
- authorized organizations
- active organization
- active membership status
- active organization role(s)
- permission projection
- entitlement projection
- organization status
- relationship/lifecycle summary where safe
- stale-context/invalidation state

EXR must not infer authority from UI placement.

## 25. NCA Interface Contract

Classification: `ARCHITECTURE_DETERMINED`.

Safe NCA inputs:

- recipient user identity
- authorized organization IDs
- organization membership and membership status
- role for relevant organization context
- permissions where required by notification policy
- active org only as contextual preference, not authority
- organization status
- opt-in/preference data once owned by the notification/account domain

NCA must not create memberships, identity authority, role authority, entitlement authority, or organization authority.

## 26. Architecture-Determined Decisions

| Decision | Locked Rule |
|---|---|
| Authority source | Backend membership, roles, permissions, entitlements, relationships, and org status are source of authority. |
| Active org authority | Client selector never grants authority. |
| Multi-org permissions | Role/permission projection changes by active organization. |
| Entitlement authority | Provider/platform/onboarding lifecycle owns entitlement changes. |
| Relationship authority | Relationships do not imply membership or entitlement. |
| Session enforcement | Protected requests re-resolve authority server-side. |
| Identity Gateway | Authenticates/resolves identity; does not own roles/permissions/entitlements. |
| Audit | Authority-changing events must emit evidence but audit is not authority. |

## 27. Owner-Approval Decisions

Blocking before IOH-1:

| ID | Question | Recommended Choice |
|---|---|---|
| IOH-D001 | Should IOH-1 contract use the hybrid active organization selector model? | Yes: client preference selector plus server validation. |
| IOH-D002 | Should IOH-1 expose authorized organizations and active organization context as canonical contract fields? | Yes. |
| IOH-D003 | Should IOH-1 include entitlement and relationship summaries in the context contract, or split into sibling endpoints? | Include entitlement summary; relationship summary may be minimal/sibling if sensitive. |
| IOH-D004 | Should switching preserve route or redirect? | Preserve only when valid; otherwise safe landing. |

Required before IOH-3/4:

| ID | Question | Recommended Choice |
|---|---|---|
| IOH-D005 | Minimum org-admin membership capability? | View, invite, inspect status, bounded role assignment, revoke/deactivate. |
| IOH-D006 | Role target policy? | Org admins assign only approved org roles; platform roles require platform authority; last-admin protection required. |
| IOH-D007 | Invitation model? | Onboarding creates first-admin handoff; org admins invite later members through canonical expiring invite. |
| IOH-D008 | First organization admin handoff? | Reviewer-approved representative identity, accepted through provider-backed flow. |

## 28. Later-Phase Decisions

| Topic | Why Later |
|---|---|
| Full member lifecycle beyond invited/pending/active/revoked | Needed for IOH-3, not IOH-1. |
| Session management UI | Contract can expose session state first. |
| Role definition management | Current need is role assignment bounds, not role taxonomy editing. |
| Owner/operator/accountable display depth | Program/workflow surfaces can decide later. |
| Relationship editing by org admins | Visibility can precede mutation. |
| Organization settings editability | Needs canonical field ownership. |
| SCIM/enterprise provisioning | Provider and enterprise policy dependent. |

## 29. External Dependencies

| Dependency | Classification | Notes |
|---|---|---|
| Auth0 tenant/callback/audience/JWKS configuration | `EXTERNAL_DEPENDENCY` | Required for production Identity Gateway proof. |
| MFA policy/enforcement | `EXTERNAL_DEPENDENCY` | Provider-owned; SHS consumes assurance/context. |
| Enterprise SSO/federation/SAML | `EXTERNAL_DEPENDENCY` | Later provider integration. |
| SCIM / enterprise lifecycle provisioning | `EXTERNAL_DEPENDENCY` | Not defined in repository baseline. |

## 30. Owner Decision Register

| Decision ID | Topic | Current State | Options | Recommendation | Owner Approval Needed? | Blocks Which IOH Phase |
|---|---|---|---|---|---|---|
| IOH-D001 | Active org model | Header selector validated by backend; localStorage clients exist. | Client-only; hybrid selector; server-session-only. | Hybrid selector with server validation. | Yes | IOH-1 |
| IOH-D002 | Multi-org context contract | Multi-org backend exists; no switcher. | No authorized-org list; expose authorized orgs; defer. | Expose authorized orgs and active org in IOH-1. | Yes | IOH-1 |
| IOH-D003 | Entitlement/relationship projection | Entitlements backend strong; relationship model exists. | Include in `/auth/me`; sibling context endpoint; defer. | Entitlements in context; relationship summary minimal or sibling endpoint. | Yes | IOH-1 |
| IOH-D004 | Switch route behavior | No product switcher. | Preserve always; redirect always; preserve if valid else safe landing. | Preserve if still authorized/entitled, else safe landing. | Yes | IOH-1/2 |
| IOH-D005 | Org admin membership scope | Backend partial, UI absent. | Platform-only; bounded org-admin; broad org-admin. | Bounded org-admin. | Yes | IOH-3 |
| IOH-D006 | Role admin boundaries | Membership assignment exists; target-role policy absent. | Broad; target-role policy; platform-only. | Target-role policy + last-admin guard. | Yes | IOH-3 |
| IOH-D007 | Invitation model | Production absent. | Org admin invites; platform provisions; onboarding first-admin plus later org invites. | Onboarding first-admin plus later org invites. | Yes | IOH-3 |
| IOH-D008 | Initial org admin | No canonical handoff found. | Email auto-admin; reviewer-approved representative; platform manual. | Reviewer-approved representative with provider-backed acceptance. | Yes | IOH-3/4 |
| IOH-D009 | Org admin product scope | Fragmented. | Minimal; full generic admin; bounded org admin. | Bounded org admin sections. | Yes | IOH-4 |
| IOH-D010 | Entitlement visibility/editing | Backend authoritative; UI partial. | Hide unavailable; show statuses; allow direct edits. | Show statuses, no direct ordinary admin edits. | Yes | IOH-4 |
| IOH-D011 | Relationship visibility/editing | Backend exists; UX limited. | Hide; view relevant; allow edits. | View relevant, edit only with explicit permission. | Yes | IOH-4 |
| IOH-D012 | No-org/no-role/no-service UX | Backend fail-closed; UX incomplete. | Forbidden only; safe recovery destinations. | Safe recovery destinations. | Yes | IOH-2 |
| IOH-D013 | Session refresh semantics | Request-time backend checks; UX incomplete. | Token-only; next-request re-resolution; force logout always. | Next-request re-resolution plus targeted session revocation for account/session revokes. | No: architecture-determined | IOH-1 |
| IOH-D014 | Session management UI | Partial. | Initial IOH; later; provider-only. | Later identity phase; expose contract signals now. | No | IOH-5 |
| IOH-D015 | MFA | Absent/external. | Local build; provider policy; defer entirely. | Provider policy; required for admins before production. | No: external/security | IOH-5 |
| IOH-D016 | Enterprise SSO | Absent/external. | Core IOH; later provider integration; not needed. | Later provider integration. | No | IOH-5+ |
| IOH-D017 | Identity Gateway scope | Foundational. | Auth only; auth + resolution/session; universal authority. | Auth + resolution/session/revocation hooks only. | No: architecture-determined | IOH-1 |
| IOH-D018 | SHF/SHS administration | Fragmented. | Universal admin; shared shell separate projections; separate destinations. | Shared shell with separate authority projections. | Yes | IOH-4 |
| IOH-D019 | Applicant/member handoff | Onboarding infra exists; member handoff absent. | Approval grants; activation grants; separate accepted membership. | Separate accepted membership after activation authority. | Yes | IOH-3/4 |
| IOH-D020 | Auditability | Many authority events audited. | Best-effort; required for authority changes. | Required durable evidence for identity/org authority changes. | No: architecture-determined | IOH-1+ |
| IOH-D021 | EXR contract | EXR independent. | IOH controls shell; IOH data contract only. | IOH data contract only; EXR places/composes. | No: boundary-determined | IOH-1 |
| IOH-D022 | NCA contract | NCA independent. | NCA creates authority; NCA consumes context. | NCA consumes context only. | No: boundary-determined | IOH-1 |

## 31. Final IOH Roadmap

| Phase | Scope | Notes |
|---|---|---|
| IOH-0 | Audit | Complete. |
| Decision Lock | Owner decision package | This document. |
| IOH-1 | Canonical Identity / Organization Context Contracts | No source implementation until owner approves blocking decisions. |
| IOH-2 | Multi-Org & Active Organization UX Hardening | Switcher behavior, stale-state clearing, no-access states. |
| IOH-3 | Membership / Role / Invitation Administration | Likely migration for invitations and possibly target-role/last-admin policy. |
| IOH-4 | Organization Admin / Entitlement / Relationship Experience | Bounded org admin, service visibility, onboarding handoff. |
| IOH-5 | Session / Revocation / Identity Gateway Hardening | Auth0 proof, session/revocation UX, provider lifecycle; MFA/federation remain external/provider work. |
| IOH-6 | System-Wide Acceptance | Cross-org negative tests, stale authority tests, EXR/NCA contract acceptance. |

This roadmap preserves the IOH-0 shape because it matches actual repository evidence. MFA and enterprise federation are not presented as repository-local deliverables.

## 32. IOH-1 Entry Conditions

Before IOH-1 begins, owner should approve:

1. `IOH-D001`: Hybrid active organization selector model.
2. `IOH-D002`: Authorized organizations and active organization fields are part of the canonical context contract.
3. `IOH-D003`: Entitlement summary is included in context; relationship summary is minimal or sibling endpoint.
4. `IOH-D004`: Route preservation only when selected organization remains authorized/entitled; otherwise safe landing.

IOH-1 should formalize contracts for:

- User
- Organization
- Membership
- Role
- Permission
- Entitlement
- Relationship summary
- Active organization
- Organization status
- Session authority
- Stale/invalid context states

IOH-1 must not duplicate the source domains or implement org-admin/member/role workflows.

## 33. Files Created

| File | Purpose |
|---|---|
| `docs/architecture/IOH_OWNER_DECISION_LOCK.md` | Pre-IOH-1 decision package and owner approval register. |

## 34. Files Modified

No production source files were modified.

No authentication, authorization, organization, membership, role, permission, entitlement, relationship, onboarding, shell, migration, or runtime behavior was changed.

## 35. Git State

Expected final state after this decision-lock phase:

- Branch: `codex/identity-org-hardening`.
- HEAD remains `95e6833f053da5f9cc501f256f4b8a0a14995dae`.
- Uncommitted report artifacts only:
  - `docs/architecture/IOH-0_IDENTITY_ORGANIZATION_EXPERIENCE_HARDENING_AUDIT.md`
  - `docs/architecture/IOH_OWNER_DECISION_LOCK.md`
- No commit.
- No push.
- Other worktrees untouched.

Validation to run:

- `git diff --check`
- `git status --short`

## 36. Exact Next Step

Owner reviews and approves or revises the blocking IOH-1 decisions:

- `IOH-D001`
- `IOH-D002`
- `IOH-D003`
- `IOH-D004`

After those are approved, begin IOH-1: Canonical Identity / Organization Context Contracts.

Do not begin IOH-1 in this run.
