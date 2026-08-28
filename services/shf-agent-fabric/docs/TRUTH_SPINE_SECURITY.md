# Truth Spine Security Boundary

This document describes the canonical Agent Fabric Truth Spine's security
model as implemented (not aspirational) following the Truth Spine security
remediation. It supplements, and does not replace,
`docs/TRUTH_SPINE_FREEZE_V1.md` and `docs/TRUTH_SPINE_GUARDRAILS.md`, which
describe Truth Spine's data/verification model.

Canonical implementation: `services/truth_spine_service.py`,
`routers/truth_routes.py`, `services/truth_history_service.py`,
`services/truth_migration.py`, plus the shared `auth/*` package.

## What CORS is not

CORS (`auth/config.py`'s `get_allowed_origins()`, applied via
`CORSMiddleware` in `main.py`) restricts which **browser** origins may read
a cross-origin JSON response. It does not authenticate the caller, does not
apply to non-browser HTTP clients (curl, server-to-server calls, Postman),
and is not evaluated by any Truth Spine route dependency. Every `/truth/*`
endpoint that requires protection enforces it via a real FastAPI
dependency (`auth.dependencies.require_permission(...)` or
`require_authenticated_user`), independent of CORS.

## What a frontend permission gate is not

`src/router/AdminRoutes.jsx`'s `SHS_SECURITY_PERMISSIONS.TRUTH_VIEW` gate on
`admin.html#/truth-spine` (`src/pages/admin/truth-spine/TruthSpinePage.jsx`)
controls whether that React route renders in the browser. It has no effect
on the backend. A caller that skips the frontend entirely and calls
`/truth/*` directly is subject only to the server-side checks described
below.

**Compatibility note:** `TruthSpinePage.jsx` calls a relative
`/api/truth/*` path. The dev-mode Vite proxy (`vite.config.js`) rewrites
`/api/*` to `http://127.0.0.1:8091`, which is `apps/shs-api`'s port, not
this Agent Fabric process's port (8090 by default) - so in local dev this
page's calls do not reach this router at all today. This predates the
remediation and was not fixed here (`src/pages/admin/*` and the Vite proxy
config are outside this remediation's scope); if/when that wiring is
corrected, the page's POST/PATCH calls will need to send the
`x-csrf-token` header and be made from a session-authenticated browser
context for the new checks below to succeed.

## Authentication

Every non-public endpoint requires a valid session, established via the
existing `POST /auth/login` (cookie-based, PBKDF2-hashed passwords,
`auth/sessions.py`). No new authentication mechanism was introduced -
Truth Spine now reuses exactly the same `auth.dependencies.*` FastAPI
dependency functions already used elsewhere in this service (e.g.
`routers/admin_agents_routes.py`'s `require_admin_key` is a *different*,
narrower mechanism reserved for the `/admin/agents/*` surface and was
intentionally NOT adopted here - see "why not X-Admin-Key" below).

Missing or invalid credentials on a protected endpoint return `401`.

### Why not `X-Admin-Key`

`ADMIN_API_KEY`/`X-Admin-Key` (`fabric/security.py`) is a single shared
secret with no per-user identity, no permission granularity, and no
tenant/organization concept - it cannot express "this specific user, with
these specific permissions, in this specific organization," which the
required security outcome depends on. It remains appropriate for its
existing narrow uses (`/admin/agents/*`, alignment admin) but was not
reused as Truth Spine's primary authentication mechanism.

## Authorization: permissions

Defined in `auth/permissions.py`:

| Permission | Grants |
|---|---|
| `truth.public.read` | Read the public-approved view (informational only - public routes require no auth at all) |
| `truth.internal.read` | Read internal claims/sources/coverage/drift/federation/envelope/readiness/replay, scoped to the caller's organization unless global |
| `truth.source.create` | Create a new source (always starts `unverified`) |
| `truth.source.update` | Reserved for future source metadata-only edits |
| `truth.source.verify` | Move a source's `verification_status` (the ONLY path that can do so) |
| `truth.claim.create` | Create a new claim (version 1) |
| `truth.claim.update` | Edit an existing claim (`create_claim_version`) |
| `truth.claim.approve_public` | Public-approval transition |
| `truth.claim.revoke_public` | Public-approval-revocation transition |
| `truth.audit.read` | Read structured history / legacy audit feed |
| `truth.admin` | Manage federation systems |

Role grants (`auth/permissions.py`'s `ROLE_PERMISSION_MAP`):

- `shs_admin`: all Truth permissions, global (cross-organization) scope.
- `client_admin`: read/create/update sources and claims within their own
  organization; **cannot** verify sources or approve/revoke public
  approval.
- `client`: read/create/update within their own organization; same
  verification/approval restriction as `client_admin`.

This is what closes the self-verification-to-publication attack chain
confirmed by the prior audit: creating a source or claim never implies the
ability to verify or publicly approve it.

## Tenant/organization isolation

`AuthUser`/`AuthSession` (`auth/store.py`, `auth/sessions.py`) now carry an
`organization_id` (`None` = global authority, currently only `shs_admin`).
Every claim/source carries a server-derived `organization_id` and an
`ownership_status` of `scoped`, `global`, or `legacy_unscoped`.
`services.truth_spine_service.check_organization_access()` is the single
scope-check function used by every read and write path that targets a
specific existing record. A cross-organization access attempt against an
existing record returns `404` (not `403`), so a caller cannot distinguish
"doesn't exist" from "exists but isn't yours." Creating a record with no
organization at all (only possible for global-authority actors) is a
distinct `403` case, since there is no record to conceal.

## Source verification

`create_source()` always starts a new source as `verification_status:
"unverified"`, ignoring any caller-supplied value. The only function that
can change it is `verify_source()`, gated by `truth.source.verify` and
requiring a non-empty `reason`. This function records `verified_by`
(server-derived from the session, never the request body),
`verified_at`, and `verification_reason`, and appends a structured history
event.

## Claim creation and versioning

`create_claim()` creates version 1 of a new claim; it rejects an existing
`claim_id` (`409 claim_already_exists`) - use `PATCH
/truth/claims/{claim_id}` (`create_claim_version()`) to edit. Any
substantive change (`claim_type`, `claim_text`, `metric_name`,
`metric_value`, `source_ids` - see `SUBSTANTIVE_CLAIM_FIELDS`) always
creates a **new version**: the prior version is preserved, marked
`superseded_by` the new version, and remains queryable by privileged
readers via `GET /truth/claims/{claim_id}/versions`. `public_approved`
always resets to `False` on a new version - approval is a decision about a
specific version's content, not a property that survives a content change.
Non-substantive (metadata-only) edits apply in place without a new
version. No request body can ever set `public_approved`,
`verification_status`, `trust_level`, `report_ready`, `approved_by`,
`approved_at`, `approval_reason`, `organization_id`, `ownership_status`,
`version`, or `created_by` directly - see `CALLER_CANNOT_SET_CLAIM_FIELDS`.

## Public approval and revocation

`POST /truth/claims/{claim_id}/approve-public` and `.../revoke-public`
(plus the legacy `PATCH /truth/public-approval/{claim_id}` shape, kept for
compatibility and now routed to the same functions) both require:

- authentication,
- the specific permission (`truth.claim.approve_public` /
  `truth.claim.revoke_public` - never implied by any other permission),
- organization authority over the claim,
- a non-empty `reason`,
- (approval only) the claim's current `verification_status == "verified"`,
  and that it is not `legacy_unscoped`.

Both record the server-derived actor, a timestamp, and the reason, and
append an entry to the structured history log. Approval is idempotent
(re-approving an already-approved claim succeeds and re-records history
rather than erroring). Revocation is a distinct permission and a distinct
recorded event - it is never a side effect of approval.

## Immutable history

`services/truth_history_service.py` appends one JSON line per
security-relevant event (`source.created`, `source.verified`,
`source.verification_revoked`, `claim.created`, `claim.version_created`,
`claim.public_approved`, `claim.public_approval_revoked`,
`transition.rejected`) to `db/truth/history.jsonl`. Every write function in
that module opens the file in append (`"a"`) mode only; no function in the
module opens it for rewrite or deletion, so ordinary application code has
no path to alter or remove a prior entry. **This is immutability by
construction, not cryptographic immutability** - there is no signing or
hash-chaining of history entries in this pass, and this document makes no
claim otherwise. The pre-existing flat `logs/truth.audit.log` (written by
`_audit()` in `truth_spine_service.py`) is preserved unchanged for
whatever else may depend on it, but it was never sufficient on its own
(no actor field) and `truth_history_service` is now the source of record
for security-relevant transitions.

## Safe public-read filtering

`services.truth_spine_service.is_publicly_visible(claim)` is the single
canonical predicate. It requires `public_approved is True`,
`verification_status == "verified"`, no `superseded_by` (only the current
version of a claim can be public), and `ownership_status` in `{scoped,
global}` (never `legacy_unscoped`). It fails closed on any missing or
malformed input (`is_publicly_visible(None)` and `is_publicly_visible({})`
both return `False`). Every public route (`GET /truth/public/claims`,
`/truth/public/claims/{id}`, `/truth/public/packages`,
`/truth/public/package/{id}`) uses this predicate, or a function that
itself uses it (`list_public_claims`, `get_public_claim`,
`build_public_truth_package`). `build_public_truth_package()` additionally
strips internal-only source fields (`uri`, `verified_by`, etc.) before
returning source references in a public package.

## Legacy data and migration

`services/truth_migration.py` classifies every pre-existing claim/source
record as `ownership_status: "legacy_unscoped"`, forces `public_approved:
False` regardless of what the legacy field said (preserving the original
value under `legacy_public_approved_flag` for reference, not trust), and
marks each record `truth_migration_v1_applied: true` (idempotency guard -
already-migrated records are returned unchanged). The transform
(`migrate()`) is pure and deterministic; file I/O
(`apply_migration_to_files()`) refuses to write its output to the same
path as its input, and defaults to `dry_run=True`.

**As of this remediation pass, this migration has been implemented and
tested against fixtures only (`tests/test_truth_migration.py`) - it has
NOT been executed against the real `db/truth/claims.json` /
`db/truth/sources.json` files.** Those files currently hold 2 claims and 2
sources (`claim_smoke_truth`, `claim_test_oracle_supportable`,
`src_smoke_truth`, `src_test_oracle_verified`) that predate this
remediation and have not been migrated. Running the migration for real
against them - and then reviewing/re-approving any resulting
`legacy_unscoped` claim that needs public visibility restored under a real
organization - is an explicit follow-up step requiring someone with
authority over that data to run it deliberately, not something this pass
performs automatically on import or on next server start.

## Error responses

- `401` - authentication missing or invalid.
- `403` - authenticated but missing the required permission, or (only for
  brand-new records with no target to conceal) missing organization scope.
- `404` - record absent, OR present but outside the caller's organization
  scope (deliberately indistinguishable, to prevent cross-tenant
  existence enumeration).
- `409` - invalid state transition (`claim_already_exists`,
  `claim_not_verified`, `legacy_unscoped_records_cannot_be_approved`,
  `invalid_verification_status`, etc.).
- `422` - a required `reason` was missing/empty, or another input
  validation failure.

## Rate limiting

`auth/rate_limit.py` exists and is applied to `/auth/login` (failed-login
throttling by email+IP). It is not a general-purpose per-endpoint rate
limiter and was not extended to `/truth/*` write endpoints in this pass -
introducing a new general rate-limiting subsystem was judged out of scope
per the remediation's own instruction not to add large unrelated
dependencies without justification. **Deployment-level rate limiting
(reverse proxy, API gateway, or WAF) in front of `/truth/*` write
endpoints remains a deployment requirement**, not something the
application code claims to provide.

## Deployment verification still required

This document describes source-code behavior only. It does not verify:

- the real network exposure of the Agent Fabric process in any actual
  deployment (no Dockerfile/k8s manifest/reverse-proxy config exists in
  this repository to inspect),
- whether `AUTH_ALLOWED_ORIGINS` is populated in any real environment,
- whether `VITE_SHF_AGENT_ADMIN_KEY` (unrelated to Truth Spine, out of
  scope for this remediation) is ever set to the same value as
  `ADMIN_API_KEY` in a real build.

These require infrastructure/deployment-configuration verification outside
this repository.
