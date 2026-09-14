# IOH-5 — Session, Revocation & Identity Gateway Hardening

## 1. Executive Result

IOH-5 hardens the repository-local session boundary without introducing a new identity authority. Auth0 credentials authenticate external identity; current SHS user, membership, role, permission, organization, and entitlement state remains authoritative on each authenticated request. Invalid production session resolution now fails closed as unauthenticated state, logout clears the browser session cookie in every environment, and client organization-scoped state is cleared when authentication is lost.

P0 findings: 0. Repository-local P1 findings: 0.

## 2. Repository Baseline

Worktree: `/Users/mikeslate/Projects/shrv1-codex-next`
Branch: `codex/identity-org-hardening`
Baseline HEAD: `95e6833f053da5f9cc501f256f4b8a0a14995dae`

IOH-1 through IOH-4 artifacts and implementations were consumed. No migration was added.

## 3. Prior IOH Inputs

IOH-1 supplies canonical identity and organization projections. IOH-2 supplies server-authoritative organization resolution and invalidation. IOH-3 supplies membership and role lifecycle authority. IOH-4 supplies bounded organization administration and entitlement display boundaries.

## 4. Identity Gateway Boundary

The Identity Gateway consists of the provider adapter, external identity normalization, application session issuance/lookup/revocation, and session/provider context projection. It does not own memberships, roles, permissions, entitlements, relationships, or workflow authority.

## 5. Session Authority

Production requests resolve the hashed SHS session against unrevoked, unexpired session state, active user state, and current active memberships/organizations. The external token is not consulted as an application authorization source after session establishment.

## 6. Session Expiration

Expired sessions return no authenticated user. The middleware does not preserve stale identity or organization context, and the client converts the resulting unauthenticated response into empty auth state.

## 7. Logout

Production logout revokes the server session when present. All environments clear the `shs_session` cookie. Provider logout is not claimed; Auth0 tenant logout remains an external integration concern.

## 8. User Revocation / Disablement

The canonical `users.status` check is enforced in the production session lookup. Disabled users cannot continue application operations through a still-valid external credential. Account disablement is repository-supported; provider-side disablement remains an external provider concern.

## 9. Membership Revocation

Membership state is re-read through `getActiveIdentity` on every valid session request. Revoked memberships disappear from the authorized context or cause the requested organization context to fail closed. The external token does not need to expire first.

## 10. Role Change

Role and permission projections are re-read from membership and role tables on each request. A changed role therefore replaces the old role for the next authoritative request.

## 11. Organization Suspension

The production identity query includes only active organizations. Organization-context resolution separately returns suspension-safe failure signals. A suspended organization cannot remain an active operational context through an old session projection.

## 12. Entitlement Revocation

Service entitlement authority remains in the service catalog/entitlement domain. Runtime entitlement checks and IOH context projections re-resolve current service state; the identity token does not grant service access.

## 13. Stale Token Claims

Provider claims are external identity facts only: provider, subject, optional contact/display fields, and provider account status. Roles, organization IDs, permissions, groups, memberships, and entitlements in a provider token are not application authority.

## 14. Development Authentication Safety

`dev-token:` parsing is explicitly disabled when `SHS_AUTH_ENV`/`NODE_ENV` is production. Production startup requires Auth0 configuration and does not mount legacy fixture routes. Development identity remains bounded to development/test configuration.

## 15. Auth0 Contract

The Auth0 adapter validates RS256 algorithm, JWT type, issuer, audience, expiry, not-before, subject, critical-header absence, JWKS availability, signing key, and signature. Unknown keys trigger one JWKS refresh and then fail closed. Real issuer, audience, callback, JWKS, tenant, and redirect configuration remain external deployment dependencies.

## 16. Revocation Strategy

| Authority Change | Source of Truth | Enforcement Point | Effective By | Token Must Expire? | Result |
|---|---|---|---|---|---|
| User disabled | `users.status` | Production session lookup | Next request | No | Session resolves unauthenticated |
| Membership revoked | `memberships.status` | Identity resolution/context resolver | Next request | No | Org removed or context denied |
| Role removed | Membership role assignment | Identity/permission projection | Next request | No | Old permissions disappear |
| Organization suspended | `organizations.status` | Identity resolution/context resolver | Next request | No | Operational org context constrained |
| Entitlement revoked | Service entitlement authority | Service authorization/domain checks | Next request | No | Service access denied |
| Provider identity revoked | External IdP/session provider | Provider validation/tenant controls | Provider-dependent | Usually external | Auth0/session exchange fails when provider says so |

## 17. Reauthentication

Repository-local force reauthentication is foundational only. Session invalidation and provider credential revalidation exist, but no fake step-up flow is created. Strong reauthentication remains an external provider capability.

## 18. Session Management

Current repository support includes current-session logout and server-side session revocation. Session listing, sign-out-other-sessions, and per-session administration UI are not implemented and remain later identity work.

## 19. MFA

MFA is an external provider dependency. The repository preserves hooks and security boundaries but does not implement or claim MFA enforcement.

## 20. Enterprise SSO / Federation

OIDC provider abstraction is foundational. Configured enterprise federation and SAML are external/provider-dependent and are not implemented in IOH-5.

## 21. SCIM

SCIM is absent from the repository-local lifecycle implementation and remains an external enterprise provisioning dependency.

## 22. Provider Neutrality

`ProductionIdentityProvider` remains the provider-neutral authentication seam. Auth0 is the current production adapter; authorization remains SHS-owned.

## 23. Multi-Org Session Safety

Active organization selection continues through IOH-2 server validation. Switching or requesting an organization cannot create membership, preserve another organization's role/permissions, or preserve another organization's entitlement authority.

## 24. Revocation Latency

Repository-local authority changes take effect no later than the next authoritative backend request. Existing in-memory/client projections are not treated as authority.

## 25. Cache Invalidation

The browser does not store session tokens. Auth failure/logout clears legacy identity state and organization-scoped route, service, filter, and workflow state. Preferred organization remains a non-authoritative convenience value and is revalidated by the backend.

## 26. Failure Modes

| Failure | Expected Behavior | Test Evidence |
|---|---|---|
| Expired session | Unauthenticated, no stale context | IOH-5 focused test |
| Invalid issuer/audience | Auth0 verification fails closed | Auth0 provider tests |
| Malformed/signature-invalid token | Auth0 verification fails closed | Auth0 provider tests |
| Disabled user | Session lookup returns no identity | Production repo query and IOH-5 tests |
| Revoked membership | Org context denied/removed | IOH-2/3 regression tests |
| Removed role | Permission projection recomputed | IOH-5 focused test |
| Suspended organization | Active org cannot remain operational | IOH-2 regression tests |
| Revoked entitlement | Service authorization denies | Entitlement isolation tests |
| Unknown provider/JWKS key | Key refresh then denial | Auth0 provider tests |
| Dev token in production | No authenticated user | IOH-5 focused test |

## 27. Auditability

Existing membership, role, entitlement, and lifecycle audit/domain events remain the historical record. IOH-5 does not create a duplicate session event stream or treat audit logs as authority.

## 28. Privacy

Provider identity normalization and auth responses expose minimum necessary identity/context fields. Provider tokens do not become a channel for cross-organization data or hidden role metadata.

## 29. EXR Boundary

IOH exposes identity, session validity, active organization, role/permission/entitlement context, expiry metadata, and invalidation reasons. EXR owns session-expired presentation, login/error experience, route composition, and shell behavior.

## 30. NCA Boundary

NCA may consume authorized identity and organization projections for notification authorization. It does not own sessions, revocation, identity, or membership authority. NCA was not modified.

## 31. Security Tests

IOH-5 focused coverage verifies expired sessions, inactive external identity rejection, stale organization claims, production-safe dev authentication, explicit provider configuration, logout clearing, and production session failure fail-closed behavior. Existing Auth0 tests cover issuer, audience, algorithm, expiry, not-before, JWKS, signing key, and signature failures.

## 32. Positive Tests

Valid provider contracts, valid session context, current role recomputation, and production configuration boundaries are covered by the focused and existing provider suites.

## 33. Regression Tests

The IOH-1 through IOH-4 suites, provider contract suites, organization/membership isolation, and entitlement isolation suites are run as the final regression gate.

## 34. Validator

`npm run ioh:identity-gateway:validate` checks the Identity Gateway boundary, provider abstraction, Auth0 validation, development safety, expiration/revocation, stale authority handling, logout, external capability classification, and EXR/NCA boundaries.

## 35. Revocation Matrix

The revocation matrix is in section 16. Its governing rule is next-request backend enforcement without waiting for external token expiry.

## 36. Provider Matrix

| Capability | Repository State | External Provider Dependency | Production Status |
|---|---|---|---|
| Authentication | Auth0 adapter and session exchange | Auth0 tenant | Repository contract ready; tenant external |
| Logout | Local session revoke and cookie clear | Provider logout optional | Local logout implemented |
| Token validation | RS256/JWKS/claim validation | Auth0 JWKS availability | Implemented contract |
| Revocation | SHS session/user/membership authority | Provider revocation for external identity | Local authority implemented |
| MFA | Hook/boundary only | Auth0/provider policy | External dependency |
| OIDC | Provider-neutral seam | Provider configuration | Foundational |
| SAML | No local implementation | Enterprise IdP/provider | External dependency |
| Federation | No configured enterprise federation | Enterprise IdP/provider | External dependency |
| SCIM | No lifecycle provisioning | Enterprise IdP/provider | External dependency |
| Session listing | No supported projection/UI | N/A | Later phase |
| Force reauth | Invalidation hook only | Provider step-up | Foundational/external |

## 37. Failure Matrix

The failure matrix is in section 26 and is backed by focused Auth0, session, IOH context, membership, and entitlement tests.

## 38. External Dependencies

Auth0 tenant configuration, issuer, audience, JWKS, callback/redirect configuration, provider logout semantics, MFA policy/enforcement, enterprise OIDC/SAML federation, and SCIM provisioning are external dependencies. No provider configuration was created.

## 39. Migration State

`NO_MIGRATION_EXPECTED` for IOH-5. Existing `shs_identity_sessions`, `identity_provider_links`, users, memberships, organizations, roles, permissions, and entitlement authorities represent the required state. No migration was added.

## 40. P0 / P1 Findings

P0: 0. Repository-local P1: 0. Remaining external/provider capabilities are explicitly classified rather than represented as incomplete local authority.

## 41. Files Created

- `apps/shs-api/tests/ioh5-session-identity-gateway.test.ts`
- `scripts/validate-ioh-session-identity-gateway.mjs`
- `docs/architecture/IOH-5_SESSION_REVOCATION_IDENTITY_GATEWAY_HARDENING.md`

## 42. Files Modified

- `apps/shs-api/src/auth/auth-middleware.ts`
- `apps/shs-api/src/api/router.ts`
- `apps/shs-api/src/domain/identity/service/auth0-session-service.ts`
- `src/auth/auth-context.jsx`
- `package.json`

## 43. Git State

No commit or push was performed. No migration was added. Main, EXR, and Claude worktrees were not modified.

## 44. IOH-5 Decision

COMPLETE. Repository-local session and Identity Gateway boundaries are hardened and validated. MFA, SSO, SAML, SCIM, session-management UI, and provider tenant configuration remain honestly external or later scope.

## 45. Exact Next Phase

IOH-6 — System-Wide Acceptance. IOH-6 was not started in this phase.
