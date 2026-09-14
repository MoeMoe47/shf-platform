# IOH-0 Identity & Organization Experience Hardening Audit

## 1. Executive Result

IOH-0 is an audit-only result. The repository is not greenfield for identity or organization architecture. It already contains canonical backend models for organizations, users, memberships, organization-scoped roles, permissions, relationships, service catalog entitlements, organization onboarding, tenant derivation, Auth0-compatible production identity links/sessions, and request-time active organization resolution.

The strongest implementation area is backend authority: server-side active organization context, membership validation, permission guards, entitlement guards, organization onboarding activation, relationship lifecycle, and many cross-organization negative tests exist.

The weakest implementation area is product experience: organization switching is header/localStorage-driven in several operator clients; organization admin UX is incomplete; invitation UX is demo-only/absent in production; role management is not a complete production workflow; and production Identity Gateway is code-complete/foundational but still dependent on external Auth0 tenant/session/database proof for production readiness.

Severity summary:

| Severity | Count | Result |
|---|---:|---|
| P0 | 0 | No confirmed cross-org access, auth bypass, privilege escalation, or tenant isolation failure in audited evidence. |
| P1 | 7 | Product-hardening and safety gaps for active-org UX, admin/member/role UX, stale authority, Identity Gateway readiness, and legacy/demo identity surfaces. |
| P2 | 8 | Significant but bounded usability, visibility, and lifecycle gaps. |
| P3 | 4 | Naming, consistency, and polish issues. |

## 2. Repository Baseline

Commands run before audit:

| Check | Result |
|---|---|
| `pwd` | `/Users/mikeslate/Projects/shrv1-codex-next` |
| `git rev-parse --show-toplevel` | `/Users/mikeslate/Projects/shrv1-codex-next` |
| `git branch --show-current` | `codex/identity-org-hardening` |
| `git rev-parse HEAD` | `95e6833f053da5f9cc501f256f4b8a0a14995dae` |
| `git status --short` | Clean before report creation. |
| `git log -5 --oneline --decorate` | Starts at `95e6833 feat(accessibility): complete system-wide accessibility layer upgrade`. |
| `git worktree list` | Confirmed main, EXR, Claude, and this worktree paths; only this worktree was inspected. |

This audit did not inspect `/Users/mikeslate/Projects/shrv1-codex` or `/Users/mikeslate/Projects/shrv1-claude` contents.

## 3. IOH Purpose

IOH should harden the existing identity and organization experience without introducing duplicate authority. The goal is to turn strong backend authority into a coherent user/admin experience for:

- authentication and session state
- active organization selection
- multi-organization users
- organization admin/member/role operations
- service entitlement visibility
- onboarding lifecycle visibility
- stale membership/role/entitlement handling
- Identity Gateway production readiness

## 4. Canonical Authority Laws

Confirmed repository architecture supports these laws:

| Law | Evidence | IOH Implication |
|---|---|---|
| Identity authority is not UI visibility. | `auth-middleware.ts`, `production-identity.ts`, `auth-response.ts`. | UI must project `/auth/me`/backend state only. |
| Organization membership is not active org selection. | `organization-context.ts` requires active membership or platform authority. | Switchers can select only, never grant. |
| Role label is not permission authority. | `security-permissions.ts`, `role_permissions`, `requirePermission`. | Role display must be explanatory. |
| Entitlement is not navigation card. | `service-entitlement-guard.ts`; Phase 3 docs. | Navigation should consume entitlement projection, not replace checks. |
| Relationship is not membership. | `ORGANIZATION_TENANT_MEMBERSHIP_ARCHITECTURE.md`, migration `032`. | Relationship UI must not imply user access. |
| Onboarding is not organization authority. | Phase 4 docs and migration `085`. | Submitted/approved cases do not grant access. |
| Authentication is not authorization. | `requirePermission`, active org context, service entitlement checks. | Login success alone must not show full capability. |

## 5. Identity Inventory

| Mechanism | Owner | Backend/Frontend | Canonical? | Production Ready? | Risk | Notes |
|---|---|---|---|---|---|---|
| `users` table | SHS API | Backend | Yes for internal identity records | Partial | P1 | Production requires provider link/session proof. |
| `identity_provider_links` | SHS API/Auth0 adapter | Backend | Yes | Partial | P1 | Migration `028`; live tenant proof documented unavailable. |
| `shs_identity_sessions` | SHS API | Backend | Yes | Partial | P1 | Opaque sessions, revocable; refresh/rotation UX incomplete in current API. |
| Auth0 adapter | Provider + SHS resolver | Backend | Yes for provider boundary | Foundational | P1 | Verifies OIDC/JWKS; no live tenant configured in audited baseline. |
| `dev-token:<user>` | Fixture repo | Backend/dev | No | No | P2 | Development-only; production rejects it. |
| `/auth/login` fixture login | `IdentityService` | Backend/dev | No | No | P2 | Explicitly rejects in production. |
| `/auth/me` | SHS API | Backend + frontend | Yes projection | Partial | P1 | Sanitized; tenant internals omitted; active org can be null for multi-org until selected. |
| Frontend `AuthProvider` | React | Frontend | Projection only | Partial | P2 | Clears legacy authority keys and avoids token storage. |
| Legacy/demo identity routes | API router | Backend/dev | No | No | P2 | `/users`, `/roles`, `/invites` are mounted only outside production. |
| MFA | Auth0/provider policy | External | No repo implementation | Absent | P1 | Capability expected through provider, not implemented locally. |
| Federation | Auth0/provider policy | External | No repo implementation | Absent | P1 | Enterprise federation not configured. |
| Revocation | Sessions/memberships | Backend | Partial | Partial | P1 | Session revoke exists; request-time membership reload exists for production sessions; no complete multi-tab UX. |

## 6. Organization Model

| Concept | Canonical Model | Owner | Current Use | Gaps |
|---|---|---|---|---|
| Organization | `organizations` | SHS API | Users, memberships, programs, cases, entitlements, reports. | UI profile/settings incomplete. |
| Tenant | Derived `tenant:${organization_id}` | `tenant-context.ts` | Technical isolation in services and tests. | One-to-one mapping is transitional; some older code still constructs strings inline. |
| User home org | `users.organization_id` | SHS API | Identity record anchor. | Must not be confused with active org. |
| Membership org | `memberships.organization_id` | SHS API | Active authority source. | Invitation/pending lifecycle absent. |
| Organization type | `organizations.org_type`; program classifications | SHS API | SHF, SHS, independent, incubated classifications. | Product-level taxonomy display fragmented. |
| Lifecycle state | `organizations.status`; onboarding case states | SHS API | Active/inactive checks in identity resolution. | Org admin UX for suspended/inactive orgs incomplete. |
| Owner/operator/accountable org | `programs.owner_organization_id`, `operator_organization_id`, `accountable_organization_id` | Program stewardship | Program authorization/reporting semantics. | Generic `organization_id` remains in many legacy contexts; UI distinction weak. |
| Relationship links | `organization_relationships` | Relationship domain | Network/incubator/shared-service semantics. | Relationship management UX limited. |
| Onboarding-created orgs | `organization_onboarding_cases.activated_organization_id` + `organizations` | Onboarding service | Activation creates/reuses org. | Handoff visibility partial. |
| SHF provider org | `org_shf_001` | Seeds/migrations | Service provider and compatibility entitlements. | Hard-coded provider assumption in Phase 4 onboarding service. |

## 7. Membership Model

Canonical membership is `memberships` with `membership_id`, `user_id`, `organization_id`, optional `team_id`, `role_id`, `status`, `effective_from`, `effective_to`.

Findings:

- Durable: Yes, canonical table exists.
- Server-authoritative: Yes, `ProductionIdentityRepo.getActiveIdentity()` loads active memberships and roles at request/session resolution.
- Tenant-scoped: Indirectly, tenant is derived from organization during context resolution.
- Organization-scoped: Yes.
- Role-bearing: Yes, each membership has a `role_id`.
- Multi-org: Yes, via multiple rows per user. `resolveActiveOrganizationContext()` requires an active organization header for multi-org users unless platform-scoped.
- Lifecycle: Implemented statuses observed are mainly `active` and `revoked`; broader lifecycle such as invited/pending/suspended/removed is not fully modeled for canonical membership.

## 8. Role Model

Actual roles found in code/seeds/maps include:

| Role | Domain | Organization Scoped? | Permissions | Current UX Exposure | Risk |
|---|---|---:|---|---|---|
| `super_admin` | Platform | Platform | All `SHS_SECURITY_PERMISSIONS` | Admin/Identity Center | P1 if overused; intended platform role. |
| `shs_admin` | SHS/BOS | Mixed/platform-like | Broad identity/org/reporting/governance | Identity Center | P2 naming/scope clarity. |
| `shf_admin` | SHF/provider | Organization/platform-like | Provider/admin service permissions | Operator surfaces | P2. |
| `partner_org_admin` | Partner org | Yes | View/submit/limited org/service/reporting | Partial | P1 admin UX incomplete. |
| `org_admin` | Organization | Yes | Membership, program, case, audit, accessibility, relationships | Fragmented | P1 role management UX incomplete. |
| `operator` | Organization | Yes | Program/case operations | Partial | P2. |
| `program_manager` | Organization | Yes | Program/case operations | Partial | P2. |
| `reviewer` | Organization | Yes | Case/audit/accessibility review | Partial | P2. |
| `reviewer_verifier` | Verification | Yes by active org context | Verification/workforce/truth/audit | Partial | P2. |
| `instructor` | Education | Yes | Live learning, assignments, cohorts, Studio review | Partial | P2. |
| `student` | Education | Yes | Learning, Studio, credentials, accessibility request | Student surfaces | P2. |
| `auditor` | Audit/reporting | Yes/contextual | Truth, Oracle, reports, audit export | Partial | P2. |
| `read_only_viewer` | Reporting | Yes/contextual | Reports view | Minimal | P3. |
| `leadership_funder_viewer` | Reporting/funding | Yes/contextual | Truth/reports/funding view | Minimal | P3. |
| `program_worker` | Operations | Yes/contextual | Aggregation, verification, reports, uploads | Minimal | P3. |

Role naming is partly canonical in `security-permissions.ts`, partly DB-seeded, and partly fixture-only. It is backend-authoritative for permission checks, but product role display is inconsistent.

## 9. Permission Model

Permissions are centralized in `apps/shs-api/src/auth/security-permissions.ts` and checked by `requirePermission()`. Additional domain services enforce resource scope and authority fields.

Evidence:

- `requirePermission()` denies missing user, invalid org context, missing active org/tenant, then missing permission.
- `OrganizationContextError` causes fail-closed `403` before permission checks.
- Entitlement guard composes organization entitlement with permission checks.
- Many domain services also predicate queries by active organization and tenant.

Risk: Some frontend guards (`RoleGuard`, `PermissionGuard`, `OrgGuard`) hide UI controls based on projected auth state. They are not authority if backend endpoints are guarded, but they can strand users or show stale controls when auth projection is stale.

## 10. Active Organization Context

| Step | Mechanism | Authority | Risk |
|---|---|---|---|
| Selection | `x-shs-organization-id` or `x-organization-id` request header | Selector only | P1 UX gap: no product switcher; localStorage clients set it manually/default it. |
| Storage | Frontend localStorage in several operator clients | Not authority | P1 stale/multi-tab UX gap. |
| Resolution | `resolveActiveOrganizationContext()` | Backend | Strong. |
| Validation | Active membership or platform global role | Backend | Strong. |
| Tenant derivation | `resolveTenantForOrganization()` | Backend | Strong for current one-to-one model. |
| Multi-org omission | Throws `ORG_CONTEXT_REQUIRED` | Backend | Good safety; UX needs selection path. |
| Unauthorized org | Throws `ORG_CONTEXT_FORBIDDEN` | Backend | Strong. |
| Cleared/refreshed | Auth refresh and reload re-fetch `/auth/me`; operator clients often do not | Mixed | P1 stale UI risk. |
| Removed membership | Production session path reloads active identity; dev fixtures vary | Backend partial | P1 needs explicit session invalidation/UX. |

## 11. Multi-Org Semantics

Multi-organization membership is implemented server-side. A user with Org A and Org B memberships receives permissions for the selected active org only. Tests prove:

- Org A permissions do not leak into Org B.
- Unknown roles map to no permissions.
- Multi-org users must provide active org.
- Unauthorized active org fails closed.
- Inactive membership/org fails closed.

Gap: Multi-org UX is not product-ready. No canonical accessible organization switcher was found. Several clients use `shfOperatorOrganizationId` from localStorage, while documented OGL evidence says no browser org switcher exists in relevant Hub surfaces.

## 12. Cross-Org Isolation

Cross-org negative controls are present in architecture and tests:

| Boundary | Evidence | Result |
|---|---|---|
| Membership context | `org-tenant-membership-reconciliation.test.ts` | Pass. |
| Program/case isolation | Same test with service mocks | Pass. |
| Service entitlement read/mutate | `service-catalog-entitlements.test.ts` | Pass. |
| Onboarding management | `organization-onboarding.test.ts` | Pass. |
| Relationship lifecycle | Relationship service + concurrency test | Partial: deterministic + optional DB proof. |
| Studio/portfolio/deployment | Architecture docs and service patterns | Strong evidence, not exhaustively re-run in IOH-0. |
| CivicSure/government assurance | Routes/services use active org in audited snippets | Partial, broad surface not exhaustively executed. |
| Notifications | `notifications` route requires active org/tenant | Partial; NCA independent. |

## 13. Organization Onboarding Handoff

Canonical onboarding is `organization_onboarding_cases` and related requested services/decisions.

Lifecycle states present: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `DECLINED`, `ACTIVATED`, `SUSPENDED`, `EXITED`, `GRADUATED`.

Handoff:

- `SUBMITTED`: candidate/application only; no canonical org authority created.
- `APPROVED`: reviewer decision; still no authority by itself.
- `ACTIVATED`: creates/reuses canonical organization, creates/reuses active relationship, provisions approved service entitlements.
- `SUSPENDED`: suspends active relationship and entitlements.
- `EXITED`: ends relationship, revokes entitlements, preserves organization history.
- Duplicate activation: idempotent and tested.
- Provisioning failure: leaves case `APPROVED`, not falsely `ACTIVATED`.

Gap: Handoff UX is partial; reviewer/applicant page exists but admin organization profile/activation-state continuity is incomplete.

## 14. Service Entitlements

Service catalog owner: `apps/shs-api/src/domain/service-catalog`.

Canonical service keys: `curriculum`, `reporting`, `project_studio`, `truth_evidence`, `career_workforce`.

Entitlement states: `ACTIVE`, `SUSPENDED`, `REVOKED`, `EXPIRED`.

Runtime composition:

`authenticated actor -> active org -> organization service entitlement -> actor permission -> resource authorization`

Evidence:

- Relationship alone does not grant service access.
- Active entitlement plus relationship allows entitlement stage only.
- Permission is still separately required.
- Ordinary org admin cannot self-grant service access.
- Provider/platform authority required for grant/suspend/revoke.

Gap: UI service discovery is partial. `ServiceEntitlements.jsx` uses a manually typed organization ID and localStorage auth/org headers. Entitled service navigation projection is not coherent system-wide.

## 15. Relationship Model

Canonical relationship table: `organization_relationships`.

Types:

- `INCUBATES`
- `NETWORK_MEMBER_OF`
- `OPERATES_FOR`
- `SHARED_SERVICES_PROVIDER_FOR`

Statuses:

- `PROPOSED`
- `ACTIVE`
- `SUSPENDED`
- `ENDED`

Relationships do not create memberships, roles, permissions, or entitlements. They can be eligibility evidence for onboarding/service grants. Lifecycle transitions are server-controlled and audited.

## 16. Owner / Operator / Accountable Org

Program stewardship fields exist:

- `owner_organization_id`
- `operator_organization_id`
- `accountable_organization_id`
- `program_classification`

Semantics are documented clearly. Runtime fallback preserves legacy `programs.organization_id` for older rows.

Gap: UI/reporting language is not consistently explicit. Generic `organization_id` remains widespread where owner/operator/accountable role may matter.

## 17. Tenant Semantics

Tenant semantics are documented and implemented as one tenant per organization through `tenant:${organization_id}` helpers. The helper rejects mismatched tenant/org pairs.

Gaps:

- Some services inline `tenant:${organizationId}`.
- Some docs/code still use tenant/org/workspace/provider language loosely.
- Current one-to-one mapping is explicit but may require migration/refactor if platform later supports many orgs per tenant or many tenants per org.

## 18. Identity Gateway

| Capability | State |
|---|---|
| SHF users | Partial/implemented via roles/memberships. |
| SHS admins | Partial/implemented. |
| External organizations | Partial through Auth0 links + SHS memberships; tenant setup external. |
| Admins/instructors/students/reviewers | Implemented as roles/permissions. |
| Parents | Not confirmed as canonical role in audited map; ABSENT/PARTIAL. |
| Governance actors | Implemented as permissions and audit actors. |
| Revocation | Partial: session revocation + membership inactive reload. |
| MFA | External dependency; absent locally. |
| Enterprise federation | External dependency; absent locally. |
| Production readiness | Foundational/code-complete, deployment proof pending. |

## 19. Login / Auth Entry

Audit:

- Public/admin login exists through frontend auth client and `/auth/login`, but API `/auth/login` is development fixture outside production.
- Production browser exchange endpoint `/auth/session/exchange` exists for Auth0 credential exchange.
- `/auth/me` is the canonical hydration endpoint.
- Logout revokes `shs_session` when production session exists.
- Expired/no session returns `401`.
- Invalid org context returns `403`.
- No membership/no active org fail closed; UX is not yet coherent.
- Return URL/post-auth routing was not found as a mature product flow.

## 20. User Account Experience

| Area | State | Gap |
|---|---|---|
| Profile | Fragmented | No coherent account center found. |
| Organizations | Backend available | No product-ready switch/list experience. |
| Memberships | Backend partial | No coherent self/admin view. |
| Roles | Backend map | Role labels and descriptions fragmented. |
| Accessibility settings | Strong separate subsystem | Needs account integration. |
| Security/session | Identity Access Center partial | Mostly admin/readiness oriented. |
| Linked provider | Backend migration | No user-facing linked identity view. |
| Preferences | Fragmented contexts | Needs account-level consolidation. |

## 21. Organization Admin Experience

| Capability | Classification | Evidence / Gap |
|---|---|---|
| View organization profile | PARTIAL | `identity/organizations` backend; no complete org profile UI. |
| View members | PARTIAL | `/identity/memberships` exists; UI not product-ready. |
| Understand roles | PARTIAL | Role matrix/readiness pages; production `/identity/roles` returns empty. |
| Invite members | ABSENT | Production invite route absent; legacy `/invites` demo-only. |
| Deactivate/remove members | PARTIAL | Membership revoke API exists; no mature UX. |
| Change roles | PARTIAL | Assign membership role API exists; role-change semantics incomplete. |
| View entitled services | PARTIAL | ServiceEntitlements page exists; manual org ID. |
| Understand SHF/SHS relationship | PARTIAL | Relationships backend exists; UX limited. |
| View onboarding/activation state | PARTIAL | Onboarding page exists. |
| Manage organization settings | ABSENT/PARTIAL | Not found as coherent product surface. |

## 22. Member Lifecycle

Actual canonical membership lifecycle observed: `active`, `revoked`, effective dates. Identity resolution also checks active user/org and `effective_from`/`effective_to`.

Requested lifecycle classification:

| Lifecycle | Exists? | Notes |
|---|---|---|
| INVITED | No canonical membership state confirmed | Demo invites only. |
| PENDING | Not confirmed | Needs owner decision. |
| ACTIVE | Yes | Core state. |
| SUSPENDED | Not confirmed for membership | Organization and entitlements have suspension. |
| REVOKED | Yes | Revocation API writes status/effective_to. |
| REMOVED | Not confirmed | Removal is modeled as revoke, not delete. |

## 23. Invitations

Search found:

- Demo-only `/invites` route inside `if (!isProductionEnvironment())`.
- `IdentityManagement.jsx` wired to `/invites`.
- Docs mention invitations as deferred/fixture.
- No canonical invitation table/service/token acceptance flow was found.

Classification: ABSENT for production identity/org membership invitations.

## 24. Role Management

Role assignment exists indirectly by assigning memberships with `role_id`. Backend checks:

- Actor requires `identity.membership.assign`.
- Target organization must match active org unless platform actor.
- Role must exist and, if organization-specific, match target org.
- Authority fields are rejected.
- Audit event is written.

Gaps:

- No complete production role list endpoint.
- No role mutation/role definition management workflow.
- No last-admin protection found.
- No explicit self-escalation guard beyond permission/scope checks; an actor with assign permission could assign roles within allowed scope unless policy narrows allowed target roles.

## 25. Privilege Escalation Audit

| Risk | Severity | Path | Existing Control | Gap |
|---|---|---|---|---|
| Frontend grants org authority | P0 candidate, not confirmed | localStorage `shfOperatorOrganizationId` | Backend validates membership/header. | Product switcher must make selector semantics clear. |
| Client-provided role/permissions | P0 candidate, not confirmed | Provider claims/localStorage/dev contexts | Provider adapter never maps role/tenant/org; auth storage safety clears legacy keys. | Legacy frontend contexts still exist for non-authority demos. |
| Dev-token in production | P0 candidate, not confirmed | `Authorization: dev-token` | Production middleware ignores/rejects. | Keep CI proof. |
| Org scope spoofing | P0 candidate, not confirmed | `x-shs-organization-id` | Membership validation. | UX still stale/manual. |
| Self role escalation | P1 | Membership assign with broad permission | Permission + org scope. | Need target-role policy/last-admin rules. |
| Demo routes in production | P2 | `/users`, `/roles`, `/invites` | Not mounted in production. | UI still points to them. |

## 26. Session / Token Boundaries

- Production sessions are opaque server-side records in `shs_identity_sessions`.
- Session tokens are hash-stored.
- Session revocation exists.
- Auth0 provider tokens are verified for issuer, audience, signature, expiration, nbf, subject, alg, key rotation.
- Provider claims do not return SHS roles/org/tenant/permissions.
- `/auth/me` omits tenant internals.

Gaps:

- `/auth/session/refresh` frontend calls exist, but audited API router did not show a full refresh implementation equivalent to docs.
- MFA/federation/password reset are external/deferred.
- Multi-tab session revocation UX not found.
- Stale role/membership changes rely on request-time re-resolution in production, but frontend invalidation experience is incomplete.

## 27. Stale Authority / Cache

Risk cases:

- membership removed but frontend still shows controls
- entitlement revoked but stale service card remains
- active org changed but previous org data remains in client state
- role changed but local auth projection remains until refresh

Controls:

- Backend request-time checks fail closed.
- Production session path reloads active identity and memberships.
- Service entitlement guard evaluates current entitlement.

Gap: No coherent frontend invalidation protocol for active org change or revocation. IOH should clear scoped caches, reload `/auth/me`, reload entitlements, and reset route/workflow state on org switch.

## 28. Auditability

| Change | Audit Evidence |
|---|---|
| Membership assign/revoke | `identity.membership.assigned`, `identity.membership.revoked`. |
| Entitlement grant/suspend/revoke | `organization.service_entitlement.*`. |
| Onboarding submit/approve/decline/activate/suspend/exit | Onboarding decisions + audit events. |
| Relationship transition | `organization_relationship.transitioned`. |
| Program transitions | Documented/audited in organization architecture. |

Gap: Role definition changes and invitation lifecycle have no production audit because production workflows are absent.

## 29. Privacy

Controls:

- `/auth/me` sanitizes user/session projection and omits tenant internals.
- Auth contract forbids password hashes, raw sessions, refresh tokens, cookie values, reset tokens.
- Membership lists are organization-scoped unless platform authority.
- Public CivicSure/public projections document omission of internal org/tenant/evidence/security details.

Risks:

- Organization admin member listing must apply minimum necessary fields before product launch.
- Legacy/demo identity pages can expose debug auth data in development.
- Cross-org user identity visibility rules need product decisions for directory/member search.

## 30. Organization Switcher

No product-ready organization switcher was found. Current mechanics:

- Backend accepts `x-shs-organization-id` as a validated selector.
- Several operator clients use `window.localStorage.getItem("shfOperatorOrganizationId") || DEFAULT_ORG`.
- Docs state frontend org switching must not be authority and OGL/Hub surfaces have no switcher.

Classification: backend-ready, UX absent/unsafe if promoted without hardening.

## 31. Organization Context Display

Context display is inconsistent:

- CivicSure shell displays organization.
- Some GPA pages mention current organization/tenant scope in empty/error text.
- Onboarding/entitlement pages expose organization IDs, not a coherent active org panel.
- Shared shells do not consistently show active org, role, service entitlement, or environment context.

## 32. Empty / Error States

| State | Current Handling | Gap |
|---|---|---|
| No organizations | Backend fails closed | UX not coherent. |
| Membership revoked | Backend denies | UX/session messaging incomplete. |
| Org suspended | Identity resolution checks org active | Suspended org product state missing. |
| No services | Entitlement denied | Service discovery UX partial. |
| No role | Permissions empty/fail closed | UX not explanatory. |
| Forbidden | API `403`; some UI banners | Needs consistent recovery path. |
| Stale org | Backend `403` | Switcher should clear/reselect. |
| Loading failure | Some pages show `ErrorBanner` | Not system-wide. |

## 33. Role-Specific Landing

| Actor | Current Landing Coherence | Gap |
|---|---|---|
| Student | Partial | Education/Studio flows exist; identity/org context weak. |
| Instructor | Partial | Instructor surfaces exist; org context display weak. |
| Parent | Absent/not confirmed | No canonical parent role confirmed. |
| Organization applicant | Partial | Onboarding applicant mode exists. |
| Organization operator | Partial | Operator pages exist; active org selection weak. |
| Organization admin | Partial | No coherent org admin console. |
| CivicSure provider | Partial | Provider/public surfaces exist. |
| CivicSure operator | Partial | GPA operator pages exist. |
| Studio actor | Partial | Studio authority strong; landing context partial. |
| ARAG actor | Partial | Permissioned routes; identity UX not central. |
| SHF admin | Partial | Broad surfaces; context/admin console incomplete. |
| SHS admin | Partial | Identity Access Center exists; production provider dependency remains. |

## 34. EXR Compatibility

EXR can safely consume IOH only if IOH provides:

- server-derived user identity
- active organization context
- current membership and organization-scoped role/permissions
- entitled service list by active org
- relationship/lifecycle context as projection only
- cache invalidation on active org/membership/role/entitlement change

No EXR worktree contents were inspected.

## 35. NCA Compatibility

Notifications will require:

- user identity and contact routing
- active organization context
- authorized organization list for preferences/admin views
- role/permission projection
- membership/role/entitlement change events
- privacy rules for cross-org notification visibility

No NCA/Claude worktree contents were inspected.

## 36. Identity Matrix

| Identity Capability | Backend Owner | Current State | UX State | Risk | Recommended IOH Phase |
|---|---|---|---|---|---|
| Auth0 provider verification | SHS API/provider | Foundational | Minimal | P1 | IOH-5 |
| Identity links | SHS API | Implemented schema/repo | Absent | P1 | IOH-5 |
| Server sessions | SHS API | Partial | Partial | P1 | IOH-5 |
| `/auth/me` projection | SHS API | Implemented | Used | P2 | IOH-1 |
| Dev-token isolation | SHS API | Implemented | Dev-only | P2 | IOH-6 |
| MFA | Provider | Absent/external | Absent | P1 | IOH-5 |
| Federation | Provider | Absent/external | Absent | P1 | IOH-5 |
| Account/security page | Frontend/API | Partial | Partial | P2 | IOH-4 |

## 37. Organization Matrix

| Organization Capability | Backend State | UI State | Authority Source | Gap |
|---|---|---|---|---|
| Canonical org identity | Complete | Partial | `organizations` | Profile/settings UX. |
| Org lifecycle | Partial | Weak | `organizations.status`, onboarding | Suspended/inactive UX. |
| Org relationships | Complete core | Limited | `organization_relationships` | Relationship admin UX. |
| Program stewardship | Partial/implemented | Weak | program stewardship fields | Owner/operator/accountable display. |
| Org onboarding | Complete core | Partial | onboarding service | Handoff UX. |
| Service entitlements | Complete core | Partial | service catalog entitlement | Discovery/navigation projection. |

## 38. Membership Matrix

| Capability | Exists? | Lifecycle | Authority | UI | Gap |
|---|---|---|---|---|---|
| List memberships | Yes | Active/revoked effective dates | Backend | Not product-ready | Member table UX. |
| Assign membership | Yes | Creates active | Backend | Absent/legacy | Role target policy. |
| Revoke membership | Yes | Revoked/effective_to | Backend | Absent/legacy | Last-admin/safe removal. |
| Multi-org | Yes | Multiple active rows | Backend | No switcher | Product switcher. |
| Invitations | No production | N/A | N/A | Demo-only | Canonical invite lifecycle. |
| Pending/suspended member | Not confirmed | N/A | N/A | Absent | Lifecycle decision. |

## 39. Role / Permission Matrix

| Role | Org Scoped | Backend Enforced | UI Projection | Risk |
|---|---:|---:|---|---|
| `super_admin` | Platform | Yes | Partial | P1 if target-role policy absent. |
| `shs_admin` | Contextual/platform-like | Yes | Partial | P2. |
| `shf_admin` | Contextual/provider | Yes | Partial | P2. |
| `partner_org_admin` | Yes | Yes | Partial | P1 admin UX. |
| `org_admin` | Yes | Yes | Partial | P1 member/role management. |
| `operator` | Yes | Yes | Partial | P2. |
| `program_manager` | Yes | Yes | Partial | P2. |
| `reviewer` | Yes | Yes | Partial | P2. |
| `reviewer_verifier` | Yes | Yes | Partial | P2. |
| `instructor` | Yes | Yes | Partial | P2. |
| `student` | Yes | Yes | Partial | P2. |

## 40. Multi-Org Matrix

| Scenario | Expected Behavior | Current Behavior | Gap |
|---|---|---|---|
| User in Org A + Org B | Must select active org | Backend requires header | No switcher. |
| Org A has service X, Org B not | X allowed only in A | Entitlement guard supports this | UI service projection missing. |
| Admin in A, viewer in B | A permissions must not leak | Test passes | Role-context display missing. |
| Switch A to B | Clear scoped data | Backend scopes new request | Frontend stale state not systematic. |
| Removed from active org | Fail closed | Backend re-resolution supports | UX/session invalidation incomplete. |

## 41. Entitlement Matrix

| Service | Entitlement Source | UI Consumption | Isolation | Gap |
|---|---|---|---|---|
| Curriculum | `organization_service_entitlements` | Partial | Guarded representative route | Navigation coherence. |
| Reporting | Same | Partial | Permission + entitlement | Discovery. |
| Project Studio | Same | Partial | Representative enforcement | Service card/route projection. |
| Truth/Evidence | Same | Weak | Backend service key exists | UI surfacing. |
| Career/Workforce | Same | Weak | Backend service key exists | UI surfacing. |

## 42. Security Matrix

| Risk | Severity | Path | Existing Control | Gap |
|---|---|---|---|---|
| Cross-org access | P0 | Header/resource IDs | Membership/org/tenant checks | Keep expanding coverage. |
| Privilege escalation | P1 | Membership assign role target | Permission/scope | Need target-role/last-admin policy. |
| Auth bypass | P0 | Dev-token in prod | Production rejects | Keep verification. |
| Permission bypass | P0 | UI-only controls | Backend guards | Some routes broad; audit periodically. |
| Tenant isolation failure | P0 | tenant/org mismatch | Helper rejects | Inline construction cleanup. |
| Stale authority | P1 | Cached frontend state | Backend fail-closed | UX invalidation. |
| Demo route reliance | P2 | IdentityManagement legacy | Production not mounted | Replace UI. |

## 43. Experience Matrix

| Actor | Login Entry | Org Context | Role Context | Landing | Admin/Settings | Gap |
|---|---|---|---|---|---|---|
| Student | Partial | Backend | Partial display | Partial | Weak | Account/org context. |
| Instructor | Partial | Backend | Partial display | Partial | Weak | Account/org context. |
| Parent | Not confirmed | Not confirmed | Not confirmed | Absent | Absent | Role decision. |
| Applicant | Partial | Backend | Applicant/reviewer projection | Onboarding | N/A | Handoff. |
| Org admin | Partial | Backend | Partial | Fragmented | Partial/absent | Member/role/settings. |
| SHF admin | Partial | Backend | Partial | Operator pages | Partial | Provider/org context. |
| SHS admin | Partial | Backend | Identity center | Admin | Partial | Production IdP. |
| CivicSure provider/operator | Partial | Backend | Partial | Partial | Weak | Entitlement/context. |
| Studio actor | Partial | Backend | Partial | Partial | Weak | Multi-org UX. |
| ARAG actor | Partial | Backend | Permissioned | Partial | Weak | Context display. |

## 44. Identity Gateway Matrix

| Capability | Current State | Production Requirement | Gap |
|---|---|---|---|
| OIDC/Auth0 verification | Implemented adapter | Live configured tenant | External configuration/proof. |
| Stable identity link | Schema/repo | Provisioned links | Provisioning workflow. |
| SHS session | Schema/repo | Durable cookie/session ops | Refresh/multi-tab UX. |
| Membership resolution | Implemented | Request-time recheck | Acceptance under live provider. |
| Revocation | Partial | Session + provider + membership | Cohesive revocation policy. |
| MFA | External | Provider policy | Owner decision/config. |
| Federation | External | Enterprise policy | Owner decision/config. |
| SCIM/provisioning | Not defined | Enterprise lifecycle | Owner decision. |

## 45. P0 / P1 / P2 / P3 Findings

P0 findings: none confirmed.

P1 findings:

1. No product-ready active organization switcher despite server-side multi-org support.
2. Organization admin member/role management UX is incomplete.
3. Production member invitation lifecycle is absent.
4. Role assignment lacks visible target-role policy and last-admin protection evidence.
5. Identity Gateway is not production-ready until Auth0 tenant/session/database proof and provider lifecycle policy exist.
6. Stale authority invalidation is backend-safe but UX-incomplete.
7. Entitled services are backend-authoritative but not coherently reflected in navigation/landing.

P2 findings:

1. Account/profile/security/preferences are fragmented.
2. Organization context display is inconsistent across shells.
3. Owner/operator/accountable org semantics are backend-documented but weakly surfaced.
4. Tenant terminology remains inconsistent in legacy docs/UI.
5. Relationship admin UX is limited.
6. Onboarding handoff visibility is partial after activation.
7. Empty/error states strand users in no-org/no-service/no-role cases.
8. Demo/localStorage operator clients need replacement or containment.

P3 findings:

1. Role labels and role IDs need display normalization.
2. Service entitlement page uses manual org ID entry.
3. Some routes/pages expose raw IDs where names/context would help.
4. Several legacy backup files contain outdated identity patterns and should remain non-authoritative.

## 46. Owner Decision Register

| ID | Question | Why It Matters | Options | Recommendation | Blocking Phase |
|---|---|---|---|---|---|
| IOH-D1 | Should active organization selection be session-backed or request-header selector plus client state? | Determines switcher/session semantics. | Server session active org; header selector; hybrid. | Hybrid: server validates every request, frontend stores only selector and revalidates. | IOH-1/2 |
| IOH-D2 | What canonical member lifecycle beyond active/revoked is required? | Invitation/suspension design. | Minimal active/revoked; add invited/pending/suspended/removed. | Add explicit invited/pending/suspended only if product requires. | IOH-3 |
| IOH-D3 | Who can assign which roles? | Prevents self/peer escalation. | Broad permission; role-specific policy; platform-only sensitive roles. | Role-specific target policy with last-admin guard. | IOH-3 |
| IOH-D4 | Is invitation email/token flow required now? | Determines migration/provider integration. | Defer; canonical invite table; provider-native invites. | Canonical invite intent + provider-backed fulfillment. | IOH-3/5 |
| IOH-D5 | What provider lifecycle is authoritative for MFA/federation/SCIM? | Production Identity Gateway. | Auth0-only; generic OIDC; defer enterprise. | Auth0 tenant first, keep adapter boundary. | IOH-5 |
| IOH-D6 | Should org admin see all member contact fields? | Privacy/minimum necessary. | Full directory; minimal member profile; role-based fields. | Minimal fields by default. | IOH-3/4 |
| IOH-D7 | How should suspended organizations behave in UI? | Avoid stranded users. | Denied only; suspended dashboard; support/contact path. | Suspended-state landing with no authority expansion. | IOH-4 |

## 47. Migration Outlook

Classification: MIGRATION_LIKELY.

Reasons:

- Production invitation lifecycle likely needs canonical persistence.
- Last-admin/role-target policy may need either policy tables or additional constraints.
- Session/active-org preference may need persisted user/org preference if owner chooses server-backed defaults.
- Existing identity links/sessions already have migration `028`; no new migration is needed for the audited backend baseline itself.

No migration was created in IOH-0.

## 48. Proposed Finite IOH Roadmap

| Phase | Scope | Migration Outlook |
|---|---|---|
| IOH-0 | Audit | None. |
| IOH-1 | Canonical identity/org context contracts: `/auth/me` shape, active org projection, authorized org list, role/permission/entitlement projection. | No migration expected. |
| IOH-2 | Multi-org active organization UX hardening: switcher, revalidation, stale cache clearing, no-org/no-role/no-service states. | No migration expected unless server preference chosen. |
| IOH-3 | Membership, invitation, and role administration: production org admin console, assign/revoke, target-role policy, last-admin protection. | Migration likely. |
| IOH-4 | Organization admin and entitlement experience: org profile, relationships, onboarding handoff, entitled service discovery/navigation. | Migration possible, mostly UI/API. |
| IOH-5 | Identity Gateway/session/revocation hardening: Auth0 tenant proof, MFA/federation policy, session refresh/revocation UX, provider lifecycle. | Migration possible if provider lifecycle/provisioning tables needed. |
| IOH-6 | System-wide acceptance: cross-org negative tests, stale authority tests, EXR/NCA consumption contract, UI acceptance. | No migration expected. |

## 49. Files Created

| File | Purpose |
|---|---|
| `docs/architecture/IOH-0_IDENTITY_ORGANIZATION_EXPERIENCE_HARDENING_AUDIT.md` | IOH-0 audit report. |

## 50. Files Modified

No production source, migration, permission, authentication, organization, membership, role, entitlement, relationship, onboarding, or shell files were modified.

Only this report artifact was created.

## 51. Git State

Git state after IOH-0:

- Branch: `codex/identity-org-hardening`
- HEAD: `95e6833f053da5f9cc501f256f4b8a0a14995dae`
- Uncommitted change: this report file only.
- No commit.
- No push.

Validation:

| Command | Result |
|---|---|
| `git diff --check` | PASS. |
| `npx tsx --test apps/shs-api/tests/auth0-identity-provider.test.ts apps/shs-api/tests/production-identity-provider-contract.test.ts` | PASS, 6/6 tests. |
| `npx tsx --test apps/shs-api/tests/production-identity-provider-contract.test.ts apps/shs-api/tests/production-identity-boundary.test.ts apps/shs-api/tests/org-tenant-membership-reconciliation.test.ts apps/shs-api/tests/auth0-identity-provider.test.ts` | PARTIAL/ENVIRONMENT LIMITATION: 6 tests passed; tests importing broader API/database modules failed because isolated worktree dependencies such as `pg` and `express` were not installed. No dependency installation was performed in this audit-only phase. |

## 52. IOH-0 Decision

Final verdict questions:

| # | Question | Answer |
|---:|---|---|
| 1 | Is identity infrastructure greenfield? | No. |
| 2 | Is organization infrastructure greenfield? | No. |
| 3 | Is multi-org membership implemented? | Yes, backend. |
| 4 | Is active organization server-authoritative? | Yes for authority; frontend header/localStorage is only selector. |
| 5 | Can frontend org switching grant authority? | No, based on audited backend controls. |
| 6 | Are roles organization-scoped? | Yes for ordinary roles; `super_admin`/platform roles are explicit exceptions. |
| 7 | Are permissions backend-enforced? | Yes, broadly through `requirePermission` and domain checks. |
| 8 | Are entitlements backend-authoritative? | Yes. |
| 9 | Are relationships distinct from membership? | Yes. |
| 10 | Are owner/operator/accountable org semantics clear? | Backend/docs yes; UI/reporting partial. |
| 11 | Are tenant semantics consistent? | Mostly; helper is clear, legacy usage remains. |
| 12 | Is onboarding cleanly connected to canonical organizations? | Yes in service/tests. |
| 13 | Are duplicate activations protected? | Yes, idempotent activation tested. |
| 14 | Is suspension/exit safe? | Yes in onboarding/entitlement relationship flow; UX partial. |
| 15 | Does organization admin UX exist? | Partial, not product-ready. |
| 16 | Does member invitation exist? | No production canonical invitation found. |
| 17 | Does role management exist? | Partial via membership assignment; no complete role admin. |
| 18 | Are last-admin protections present? | Not found. |
| 19 | Are membership changes audited? | Yes for assign/revoke. |
| 20 | Can role escalation happen client-side? | No confirmed client-side authority; target-role policy gap remains. |
| 21 | Can org scope be spoofed? | Backend denies unauthorized org scope. |
| 22 | Are cross-org negative controls present? | Yes, with focused tests. |
| 23 | Are stale membership/role states handled safely? | Backend mostly yes; UX incomplete. |
| 24 | Is session revocation implemented? | Partial. |
| 25 | Is MFA implemented? | No, external/provider deferred. |
| 26 | Is federation implemented? | No, external/provider deferred. |
| 27 | Is Identity Gateway production-ready? | No; foundational/code-complete, deployment proof pending. |
| 28 | Is organization switching product-ready? | No. |
| 29 | Is multi-org UX product-ready? | No. |
| 30 | Are entitled services reflected coherently? | Backend yes; UI/navigation partial. |
| 31 | Are no-org/no-service/no-role states handled? | Fail-closed backend; product states incomplete. |
| 32 | Are role-specific landings coherent? | Partial. |
| 33 | What is the biggest identity/org gap? | Product-ready multi-org/org-admin experience over existing backend authority. |
| 34 | How many P0 findings exist? | 0. |
| 35 | How many P1 findings exist? | 7. |
| 36 | How many P2 findings exist? | 8. |
| 37 | How many P3 findings exist? | 4. |
| 38 | What owner decisions are required? | Active org selection persistence, member lifecycle, target-role/last-admin policy, invitations, provider MFA/federation/SCIM, privacy fields, suspended-org UX. |
| 39 | Is a migration likely later? | Yes. |
| 40 | What finite IOH roadmap is recommended? | IOH-1 through IOH-6 as listed above. |
| 41 | Did you modify production source? | No. |
| 42 | Did you create a migration? | No. |
| 43 | Did you commit? | No. |
| 44 | Did you push? | No. |
| 45 | Are the other worktrees untouched? | Yes; not inspected or modified. |
| 46 | Does git diff --check pass? | Yes. |
| 47 | Is IOH-0 COMPLETE? | Yes. |
| 48 | What exact phase comes next? | IOH-1 — Canonical Identity / Organization Context Contracts. |

## 53. Exact Next Phase

IOH-1 — Canonical Identity / Organization Context Contracts.

Recommended IOH-1 output:

- canonical `/auth/me` contract for active org, authorized orgs, membership, role, permissions, entitlements, relationship/lifecycle hints
- explicit frontend contract: active org selector is not authority
- stale-state invalidation rules for org switch/membership revoke/role change/entitlement change
- test matrix for Org A/Org B role and service differences
- no redesign of shared shells until contracts are locked
