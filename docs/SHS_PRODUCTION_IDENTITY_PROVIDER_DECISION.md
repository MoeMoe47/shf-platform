# SHS Production Identity Provider Decision

## Status and boundary

`APPROVED_PROVIDER = AUTH0`.

The approved protocol is standards-based OIDC/OAuth 2.x. This packet preserves
the vendor-neutral adapter boundary; tenant setup and deployment configuration
remain external prerequisites.

## Existing architecture

The development path remains fixture-only: `IdentityRepo` contains hard-coded
users, `/auth/login` returns `dev-token`, and middleware resolves that format
only outside production. The production path verifies Auth0 RS256 credentials,
resolves a pre-existing SHS identity link and active membership, and creates a
SHS-owned server session. Agent Fabric has a separate human-session system and
HMAC service identity.

SHS owns role/permission mapping and scoped resource access. The frontend
hydrates from `/auth/me`; it cannot establish identity, role, tenant, or
organization through localStorage or request fields.

## Required identity classes

Repository evidence supports students, instructors, SHF/SHS administrators,
organization administrators, program workers, reviewers/verifiers, viewers,
auditors, and internal service principals. One human may have multiple scoped
memberships/roles; context is selected and checked server-side. No new role
taxonomy is justified.

## Ownership matrix

| Concern | Owner |
|---|---|
| Provider subject and credential verification | `PROVIDER_OWNED` |
| Email and provider email verification | `PROVIDER_OWNED`, informational to SHS |
| Credentials, MFA, recovery, federation, provider sessions | `PROVIDER_OWNED` |
| Stable SHS identity link | `SHS_OWNED` |
| Tenant, organization, membership | `SHS_OWNED` |
| SHS role and permission | `SHS_OWNED` |
| Effective request scope | `DERIVED` from current membership |
| Governance authority and sign-off | `SHS_OWNED` |
| Audit actor | `DERIVED` from authenticated identity |
| Account state | `DERIVED` from provider plus SHS membership |
| SCIM provisioning | `NOT_YET_DEFINED` |

Provider claims such as `role=admin`, `tenant`, or `organization` are not SHS
authority without an explicit server-owned allowlist mapping.

## Canonical mapping

Use `provider + provider_subject -> internal_identity_id`. Email is mutable
and cannot be the sole identity key. A future persistence slice may add an
identity-link table if no existing SHS store can hold this mapping; this review
does not add one.

## Adapter and token contract

`apps/shs-api/src/auth/production-identity.ts` implements the Auth0 adapter:
`verifyCredential()` returns provider, stable subject, verified attributes, and
account status only. It does not return SHS permissions, roles, tenant,
organization, or governance authority. `ShsIdentityResolver` maps that result
to current SHS memberships and role context.

An OIDC/JWT implementation must validate issuer, audience, signature, JWKS
rotation, expiration, not-before, subject, token type, and account status.
Decoded-but-unverified JWT claims are never sufficient. Browser authorization
code flows must validate state and nonce where applicable.

## Session recommendation

Recommend provider authentication followed by an SHS server session for the
browser, with a separately validated bearer path only for explicitly supported
non-browser clients. This supports request-time membership revalidation,
logout/revocation, CSRF protection, and server-derived governance actors. The
final choice requires provider/deployment review; no session architecture is
changed here.

## Membership, lifecycle, and revocation

Provider disable/suspension denies new authentication and invalidates or
revalidates active sessions. SHS membership removal or role revocation takes
effect at request time for governance actions. Organization switching is
limited to current server-resolved memberships. Deleted identities remain
auditable but cannot authenticate. Invitation/pending states cannot mutate
governance.

## Capability scorecard

Use this weighted requirements rubric later; it is not a vendor ranking and
contains no current pricing claim.

| Category | Weight |
|---|---:|
| Security and token/session controls | 16 |
| OIDC standards compliance | 10 |
| MFA and recovery | 8 |
| Lifecycle and account status | 8 |
| Organization/B2B support | 8 |
| Multi-tenant compatibility | 7 |
| Enterprise federation/provisioning | 6 |
| Session/revocation behavior | 8 |
| Server SDK maturity | 6 |
| React/browser integration | 4 |
| Auditability | 6 |
| Availability/reliability | 6 |
| Vendor lock-in risk | 3 |
| Implementation complexity | 3 |
| Operating cost, verified at selection time | 1 |
| Preservation of SHS-owned authorization | 6 |
| **Total** | **100** |

Security, token validation, lifecycle, scope separation, and SHS-owned
authorization are mandatory gates; a weighted total cannot compensate for
failure of any of them. Required now are standards-compliant OIDC, stable
subjects, key rotation, expiry/revocation, account lifecycle, MFA capability,
auditability, server SDK support, and reliable availability. Enterprise OIDC or
SAML and SCIM remain conditional deployment requirements.

## Compatibility classifications

- `OIDC_GENERIC`: **IMPLEMENTED ADAPTER CONTRACT**
- `AUTH0_COMPATIBLE`: **APPROVED; ADAPTER IMPLEMENTED**
- `ENTRA_EXTERNAL_ID_COMPATIBLE`: **POSSIBLE ONLY THROUGH OIDC-GENERIC ADAPTER**
- `CLERK_COMPATIBLE`: **UNVERIFIED; PROVIDER REVIEW REQUIRED**
- `COGNITO_COMPATIBLE`: **POSSIBLE ONLY THROUGH OIDC-GENERIC ADAPTER**

These are architectural classifications, not vendor approval.

## Human decisions and next slice

Human approval is still required for tenant configuration, browser callback
deployment, identity-link provisioning, account lifecycle SLA, MFA/recovery
policy, federation scope, and operating cost. Reporting permissions and
public-governance semantics remain unchanged.
## Live integration proof status (2026-08-26)

`APPROVED_PROVIDER = AUTH0` remains unchanged. The Auth0 adapter and SHS session code pass focused verification, including signed-token, issuer, audience, expiry, not-before, JWKS refresh, identity-boundary, and production fail-closed tests. Live test-tenant proof is `UNAVAILABLE`: no authorized Auth0 issuer/audience or session/database configuration was present, and no live credential was fabricated.

Migration 028 was not applied because the approved local PostgreSQL service was unavailable at `localhost:5432`. Consequently identity-link persistence, session persistence, HTTP `/auth/me`, logout, membership revocation, and scope proof remain unverified at runtime. The next authorized task is to provide the explicitly authorized test-tenant configuration and local PostgreSQL runtime, then execute the live synthetic HTTP proof.
