# SHF Production Identity & Authentication Contract

## Status

This contract closes the unsafe SHS API production fallback boundary. Auth0 is
the approved production provider; tenant setup and deployment verification
remain external prerequisites.

## Production identity authority

Production identity comes from the approved Auth0 OIDC provider and its
trusted SHS membership source. The current SHS API
`IdentityRepo` is a hard-coded development fixture and is not a production
identity authority. No competing user or credential database is introduced.

The provider integration must resolve server-side canonical identity, account
status, tenant and organization membership, roles, permissions, and an
expiring/revocable session or validated provider token. Required deployment
references are `SHS_IDENTITY_PROVIDER`, `SHS_IDENTITY_PROVIDER_AUDIENCE`, and
`SHS_SESSION_SECRET_REF`. These are configuration references only; they do not
turn the fixture repository into a provider.

## Authentication modes

| Mode | Classification | Authority |
|---|---|---|
| SHS API `dev-token:<user_id>` | `DEVELOPMENT_ONLY` | hard-coded fixture repository |
| SHS API `/auth/login` | `DEVELOPMENT_ONLY` until an adapter exists | fixture lookup; no production password verification |
| SHS API production identity | `CODE_COMPLETE_TENANT_CONFIGURATION_PENDING` | Auth0 adapter + SHS session |
| Agent Fabric human session | `LOCAL_FIRST` | its server-side session and fixture store |
| Agent Fabric internal HMAC | `INTERNAL_SERVICE_ONLY` | bound service principal, never a human identity |
| Public curriculum impact GET | `PUBLIC_BY_DESIGN` | published public projection only |

Agent Fabric's session implementation is not silently reused as an SHS API
identity database. A future integration must define the shared authority and
trust boundary explicitly.

## Production boundary

When the effective environment is `production`, SHS API startup requires Auth0
configuration and the SHS session reference. Production login rejects rather
than consulting the fixture repository, and a production request carrying
`Bearer dev-token:*` remains anonymous.

Development fixture authentication is available only when the effective
environment is exactly `development`; it is never enabled by frontend state,
localStorage, claimed headers, or unknown credentials.

## Session, password, and account semantics

Auth0 owns credential verification, MFA, recovery, and provider session/token
lifecycle. SHS validates Auth0 tokens, resolves its own identity link and
membership, and issues an opaque HttpOnly server session. Disabled, revoked,
or inactive accounts must fail authentication and active governance requests.

`/auth/me` returns only middleware-resolved identity and returns `401` without
one. It must never return password hashes, raw session secrets, refresh tokens,
or client-supplied role/scope data.

## Authorization and scope

The existing SHS permission map remains the authorization policy. Known roles
map to permissions server-side; unknown or malformed roles map to no
permissions. Trusted Reporting permissions remain distinct, including
`truth.public_population.approve`, `truth.public_population.revoke`,
`reports.public_eligibility.manage`, `reports.public_disclosure.manage`,
`reports.public_snapshot.generate`, `reports.publication.authorize`, and
`reports.publication.execute`.

Governance mutations derive actor, tenant, and organization from authenticated
server state. Client-supplied scope is only a validated resource selector and
cannot establish authority. Cross-tenant and cross-organization access is
denied.

## Human/service and route boundaries

Agent Fabric HMAC requests authenticate a bound service principal and cannot
become a human admin or satisfy human governance permissions. Internal
ingestion remains on that separate service path.

Public projection reads remain unauthenticated by design and return only
public-safe published fields. Truth, population governance, reporting,
disclosure, snapshot, publication, identity-management, and restricted
distribution mutations require authenticated permission-guarded requests.

## Failure and audit behavior

Missing Auth0 configuration causes startup failure. Unknown, malformed,
expired, revoked, or development credentials do not create an identity.
Authentication failure is `401`; missing permission is `403`. Authoritative
reporting failures remain unavailable/fail-closed and never become demo data,
Oracle output, stale client state, or zero.

Governance audit actors come from authenticated server identity. The SHS API
does not accept a client-selected audit actor. Agent Fabric HMAC audit remains
service-identity audit.

## Remaining deployment dependency

Classification is `PRODUCTION_IDENTITY_CODE_COMPLETE_DEPLOYMENT_IDP_PENDING`.
Remaining work is Auth0 tenant/callback configuration, pre-provisioned SHS
identity links and memberships, migration deployment, provider secret
references, and a synthetic local production-like HTTP proof. Until verified,
Trusted Reporting remains `NOT_PRODUCTION_READY`.

## Provider-selection contract

Provider selection is documented in
`docs/SHS_PRODUCTION_IDENTITY_PROVIDER_DECISION.md`. The current adapter
boundary is vendor-neutral: provider claims cannot directly grant SHS roles,
permissions, tenant, organization, or governance authority.
## Live Auth0 proof status (2026-08-26)

The approved provider remains Auth0. The repository contains the Auth0 RS256/JWKS adapter, durable identity-link model, and SHS-owned server-session integration, but no authorized Auth0 test-tenant configuration was available in this environment: `SHS_IDENTITY_PROVIDER`, `SHS_IDENTITY_PROVIDER_AUDIENCE`, `AUTH0_ISSUER`, `AUTH0_AUDIENCE`, `SHS_SESSION_SECRET_REF`, and `DATABASE_URL` were unset. No live tenant request, credential, user, identity link, session, or governance action was attempted.

Local PostgreSQL was not listening on `localhost:5432`, so migration 028 and durable HTTP/session persistence could not be applied or proven. The existing synthetic adapter tests remain code-level evidence only. Required next proof is an explicitly authorized local/test Auth0 tenant plus local PostgreSQL configured through repository-native migration/runtime tooling. No production secret or user was used.
