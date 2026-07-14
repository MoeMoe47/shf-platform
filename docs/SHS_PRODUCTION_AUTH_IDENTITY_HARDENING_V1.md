# SHS Production Authentication & Identity Hardening V1

## Executive summary

SHS BOS now has a local-first production authentication boundary for the V1.1 admin surface. The backend resolves identity from an opaque server-side session stored in an HttpOnly cookie, returns only a sanitized `/auth/me` identity summary, enforces role/permission checks for auth management routes, and records redacted authentication audit events.

## Previous identity posture

The active frontend already attempted `/auth/me`, but it could grant a local development SHS admin session when the request failed. The login page wrote demo identity roles into localStorage, and `AdminRoutes.jsx` used `getCurrentIdentity()` as the route authority. That posture was useful for browser demos but not production-safe.

## Hardened architecture

Browser -> HttpOnly session cookie -> FastAPI `/auth/*` routes -> server-side session store -> canonical role/permission policy -> sanitized identity response -> frontend route and interface checks.

Frontend route guards now use `useAuthContext()` backed by `/auth/me`. Browser localStorage roles, URL fragments, and client-supplied role headers are not authoritative.

## Threat model

The V1 threat model covers localStorage role tampering, client_admin escalation, direct internal route navigation, unauthenticated API access, expired/revoked sessions, session fixation, CSRF, cross-origin credential misuse, brute-force attempts, enumeration, stale role assumptions, sensitive endpoint access, demo identity leakage, route aliases, Agent/Command/Orchestrator privilege boundaries, and SHS private data leakage to SHF/public surfaces.

## Authoritative identity contract

`GET /auth/me` returns `user_id`, `email`, `display_name`, `role`, `permissions`, `session_id` as a hash, `session_status`, issue/expiry timestamps, `reauth_required`, a CSRF token, and compatibility `user`/`memberships` fields. It never returns password hashes, raw session secrets, refresh tokens, cookie values, production secrets, or reset tokens.

## Roles

Canonical V1 roles are `shs_admin`, `client_admin`, and `client`. `shs_admin` can view internal SHS BOS operations. `client_admin` is limited to approved client-facing permissions. Public/no-session users cannot access protected admin surfaces.

## Permissions

The BOS permission namespace includes `bos.executive.read`, `bos.orchestrator.read`, `bos.command.preview`, `bos.scheduler.read`, `bos.notifications.read`, `bos.persistence.read`, `bos.tracking.read`, `bos.registry.read`, `bos.agents.read`, `bos.reports.read`, `bos.direct_connect.read`, `bos.governance.read`, `bos.identity.read`, and `bos.identity.manage`.

## Backend authentication

Backend files live under `services/shf-agent-fabric/auth/`. The backend supports login, logout, current-session lookup, session rotation, current-session revocation, all-session revocation, role and permission resolution, disabled-user denial, audit events, rate limiting, CSRF checks, CORS allowlisting, and configuration validation.

## Session and cookie security

Sessions are opaque server-side records. Cookies are HttpOnly, path-scoped, SameSite=Lax by default, Secure in production, idle-expiring, absolute-expiring, revocable, and rotated by `/auth/session/refresh`. No session or refresh token is stored in localStorage.

## Password safety

The V1 fixture store uses deterministic non-secret test users and PBKDF2-HMAC hashes from the Python standard library. No real credentials are embedded, no plaintext password persistence is introduced, and login failures use generic responses.

## CSRF, CORS, and rate limiting

Cookie-authenticated state-changing routes validate Origin and require the session CSRF token. CORS uses an explicit origin/method/header allowlist. Login failures are tracked locally with bounded rate limiting and redacted audit events.

## Frontend identity client

Frontend files under `src/system/identity/` fetch identity from `/auth/me`, call backend login/logout/refresh, clear legacy localStorage authority keys, expose loading/401/403/network states, and avoid storing tokens.

## Route protection

`AdminRoutes.jsx` no longer imports `getCurrentIdentity()`. `/login` renders without a session. Protected routes wait for auth loading, redirect no-session users to `/login`, and show a forbidden surface when the backend session role is insufficient. `/ops/identity-access` requires `shs_admin` and `bos.identity.read`.

## Demo identity isolation

Demo fixture shortcuts remain for local browser smoke, but they authenticate through `/auth/login`. Production config forbids `AUTH_DEMO_IDENTITY_ENABLED=true`, and the frontend demo warning requires non-production, localhost, and `VITE_SHS_DEMO_IDENTITY_ENABLED=true`.

## Identity & Access Center

`admin.html#/ops/identity-access` shows authentication readiness, current session posture, cookie posture, demo posture, role and permission matrices, route access matrix, redacted audit events, active session summaries, threat controls, safety flags, and local review state.

## Security headers and production configuration

The FastAPI app now installs security headers middleware. Auth responses use `Cache-Control: no-store`. Production startup fails closed when demo identity is enabled, cookie Secure is false, allowed origins are missing, or session timeout bounds are invalid.

## SHS/SHF boundary

This package does not mutate SHF Impact Data, does not mark public_approved, does not publish reports, does not enable agent execution, does not add external identity vendors, and does not add banking, account-linking, OAuth, Plaid, payment, webhook, or external API integration.

## Known limitations

V1 uses an in-memory single-instance user/session/rate-limit store and fixture users. Durable production user storage, password reset, MFA, SSO, and distributed rate limiting are deferred.

## Completion decision

Production Authentication & Identity Hardening V1 is complete for the local-first V1.1 package when validation passes. No files were staged, committed, pushed, or tagged as part of the build task.

