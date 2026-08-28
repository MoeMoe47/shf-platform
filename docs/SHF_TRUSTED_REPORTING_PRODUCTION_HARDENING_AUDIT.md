# SHF Trusted Reporting Production Hardening Audit

## Scope and conclusion

This review covers the authenticated ingestion, Agent Fabric Truth/metric/reporting
services, public curriculum projection, governance APIs, PostgreSQL-backed
governance stores, and the SHS trusted-reporting outbox/worker. The completed
reporting and public-governance architecture is preserved.

Overall classification: `NOT_PRODUCTION_READY`.

The repository is suitable for controlled local and isolated development proofs,
but not for a trustworthy production-equivalent E2E run until the security and
deployment blockers below are closed. Hub is `PUBLIC INFRASTRUCTURE READY` /
`REAL PUBLIC DATA NOT YET AVAILABLE`; its absence is data-dependent, not an
architecture failure.

## Route and security review

| Area | Finding | Severity | Production consequence | Evidence | Required remediation | Owner | Blocks final E2E |
|---|---|---:|---|---|---|---|---|
| Authentication | SHS identity is a development repository with hard-coded users and no production credential/session adapter. The API now refuses production startup, rejects production login through the fixture path, and ignores `dev-token:*` in production. | CRITICAL | Production cannot start with an untrusted identity source; legitimate production users still cannot authenticate until the approved provider is integrated. | `apps/shs-api/src/auth/production-identity.ts`; `apps/shs-api/src/auth/auth-middleware.ts`; `apps/shs-api/src/domain/identity/repo/identity-repo.ts`; `apps/shs-api/src/domain/identity/service/identity-service.ts` | Integrate the approved production identity/session provider and password/token verification; add a production auth integration proof. | SHS identity/auth | Yes |
| Authentication | `/auth/me` previously returned a hard-coded super-admin identity; this audit now returns `401` without authenticated middleware state. Unknown dev-token IDs now resolve to no user. | HIGH | Prevents unauthenticated or unknown-token elevation at this boundary. | `apps/shs-api/src/api/router.ts`; `apps/shs-api/src/domain/identity/repo/identity-repo.ts` | Retain regression coverage in the production auth suite. | SHS API | Yes until deployed proof |
| Authentication | Local demo identity is now restricted to explicit development environment; production still requires real identity configuration. | HIGH | Prevents staging/non-production environments from silently inheriting demo admin access. | `apps/shs-api/src/auth/auth-middleware.ts` | Verify environment variables in deployment manifests and run a no-demo production startup check. | SHS API/deployment | Yes |
| Authorization | Trusted reporting governance routes use distinct server-side permissions and scope checks; no frontend authority was found in the reviewed chain. | LOW | No current defect found; deployment identity mapping remains unproven. | `apps/shs-api/src/auth/permission-guard.ts`; reporting routes; Agent Fabric auth/permissions | Prove role/permission mappings against the production identity provider, including cross-tenant/org denial. | SHS API/Agent Fabric | Yes until proof |
| Secrets | Agent Fabric requires an internal key provider reference in production and fails closed for missing key material. The SHS API worker signs requests from environment JSON and has no startup secret-provider validation. An ignored local `.env` contains development-only secret material. | HIGH | Misconfiguration can prevent delivery; secret handling/rotation is not deployment-proven. | `services/shf-agent-fabric/services/internal_service_identity.py`; `apps/shs-api/src/domain/trusted-reporting/outbox.ts`; `apps/shs-api/.env.example` | Use the approved secret manager for both services, prohibit local secret material in deployed images, validate provider references at startup, and prove rotation. | Platform/SHS deployment | Yes |
| Network exposure | SHS API binds through Node's default host behavior and no container, ingress, or network policy is present in this repository. Agent Fabric deployment exposure is likewise unverified. | HIGH | Internal ingestion and governance surfaces may be externally reachable without a reviewed perimeter. | `apps/shs-api/src/server.ts`; no Docker/Kubernetes/ingress manifests found | Provide reviewed ingress/network policy, bind/route internal services privately, and verify database isolation. | Platform | Yes |
| CORS | SHS API previously used unrestricted `cors()`. It now requires `AUTH_ALLOWED_ORIGINS` in production and rejects origins outside the explicit list; development remains local-tool permissive. Agent Fabric already had an environment-aware allowlist. | HIGH | The fix prevents arbitrary-origin credentialed browser access, but deployment configuration is not yet proven. | `apps/shs-api/src/server.ts`; `services/shf-agent-fabric/auth/config.py` | Set and verify exact production origins; add deployed preflight checks. | SHS API/deployment | Yes until proof |
| Rate limiting | Failed-login throttling exists in Agent Fabric only. No application or deployment evidence establishes limits for public reporting, governance mutations, report generation, or ingestion. | HIGH | Abuse can exhaust expensive/reporting or governance endpoints. | `services/shf-agent-fabric/auth/rate_limit.py`; `docs/TRUTH_SPINE_SECURITY.md` | Set reviewed gateway/WAF limits and monitoring for public/reporting/ingestion surfaces. | Platform/security | Yes for public E2E; launch blocker |
| Public endpoints | Curriculum public read is intentionally unauthenticated and returns only published public projection fields. Internal reporting/governance routes are permission guarded. | LOW | Boundary is structurally correct; deployed route inventory is unverified. | `apps/shs-api/src/domain/reporting/routes.ts`; publication repo public mapper | Run an external route inventory and response-schema/privacy check. | SHS API/security | Yes until proof |

## Persistence and delivery review

| Area | Classification | Evidence and consequence | Required remediation | Blocks final E2E |
|---|---|---|---|---:|
| PostgreSQL migrations | `MIGRATION_ORCHESTRATION_REQUIRED` | Migrations `001` through `027` are ordered SQL files with `IF NOT EXISTS` patterns, but no migration bookkeeping table or repository-native runner was found. The local database has selective history, so “rerun” is not equivalent to proving ordered deployment. | Adopt the approved transactional migration runner/bookkeeping and prove fresh bootstrap plus upgrade from an existing database. | Yes |
| Outbox/worker | `CODE_READY_DEPLOYMENT_MISSING` | Referral creation and outbox enqueue share a transaction; claiming uses `FOR UPDATE SKIP LOCKED`, and transient/permanent failures are classified. The worker is a one-pass CLI entrypoint with no managed scheduler, liveness, lease recovery, or evidence of process ownership. A crash after `DELIVERING` can strand work. | Deploy a managed worker with lease/recovery semantics, monitoring, bounded backoff, and restart/poison-event drills. | Yes |
| Failure behavior | `PARTIAL` | Reporting and governance services fail closed for unavailable authoritative data; public projection returns `503`; no browser fallback is used in the completed curriculum path. Outbox delivery records retryable/final states. | Add deployed dependency-failure tests and ensure every authoritative caller maps missing data to unavailable, never zero or stale client data. | Yes |
| Monitoring/alerting | `PARTIAL` | Health and Watchtower/self-audit primitives exist, but no production alert ownership or dashboards for ingestion failures, backlog, governance rejection, report errors, publication failure, or public endpoint failure were found. | Define alert rules, owners, escalation, and a production smoke/health check. | Yes |
| Backup/restore | `MISSING` | No repository evidence proves backup ownership, restore procedure, RPO/RTO, or a restore drill for SHS PostgreSQL, governance PostgreSQL, Truth files, or audit/history stores. | Establish backup/restore ownership and complete a documented restore drill before production launch. | Yes |
| Retention | `MISSING` | Compliance profiles reference retention policy IDs, but enforcement and reviewed retention schedules for operational events, Evidence, Truth history, governance audit, snapshots, and publications are not established. | Approve retention/deletion schedules and implement or verify enforcement without deleting data in this audit. | No for local E2E; yes for launch |
| Environment isolation | `PARTIAL` | Agent Fabric production mode requires PostgreSQL governance storage and blocks missing internal key-provider configuration. SHS API now blocks production missing `DATABASE_URL`/CORS origins, but identity, secret provisioning, ingress, and migration execution remain deployment obligations. | Produce environment manifests and a production startup checklist proving no JSONL, fixture, demo-auth, localhost, or permissive-CORS fallback. | Yes |

## Legacy and E2E review

| Area | Classification | Finding | Required remediation | Blocks final E2E |
|---|---|---|---|---:|
| Browser/localStorage reporting | `SAFE_LEGACY_PRESENTATION_ONLY` / `REPLACED_BUT_NOT_REMOVED` | Completed curriculum public field uses the canonical projection; static/demo records remain explicitly noncanonical. Other surfaces retain browser history and placeholders. | Keep outside canonical paths; remove only through separate consumer/migration/deletion proof. | No |
| Static Impact data | `SAFE_LEGACY_PRESENTATION_ONLY` | Sample/static records are not the curriculum canonical projection source. | Keep sample labels and exclude from canonical public reads. | No |
| `reports.publish` | `REPLACED_BUT_NOT_REMOVED` | Legacy permission remains distinct from publication authorization/execution. | Retain until a separate permission retirement review. | No |
| Browser export/history | `SAFE_LEGACY_PRESENTATION_ONLY` | Export history and draft/history UI are not Trusted Reporting authority. | Preserve explicit noncanonical status. | No |
| Production E2E | `BLOCKED_BY_SECURITY + BLOCKED_BY_MIGRATION + BLOCKED_BY_DEPLOYMENT` | Local isolated curriculum proofs exist, but production identity, secret management, ingress, migration orchestration, worker recovery, monitoring, and backup/restore are not proven. | Close the blocking items and run a real-environment E2E with synthetic/non-sensitive controlled data. | Yes |

## Blocking before production E2E

1. Production identity/password/session integration and role mapping.
2. Reviewed private network/ingress exposure for SHS API, Agent Fabric, worker, and database.
3. Secret-manager provisioning and rotation proof for database and internal HMAC credentials.
4. Ordered migration runner/bookkeeping and fresh/upgrade database proof.
5. Managed outbox worker with recovery for stranded `DELIVERING` work.
6. Production rate limits and dependency-failure behavior.
7. Deployment-level authorization/scope and public response privacy verification.

## Required before production launch

1. Backup/restore ownership and tested recovery drill.
2. Retention schedules and enforcement for all canonical and governance stores.
3. Monitoring, alerting, escalation, and operational ownership.
4. Production E2E evidence for the curriculum chain; Hub remains data-dependent.

## Post-launch / non-blocking

- Remove or migrate legacy presentation-only paths after consumer and rollback proof.
- Retire legacy `reports.publish` only through a separate authority review.
- Extend public reporting to Hub only after genuine canonical activity exists and its claim population is independently governed.

## Small fixes made in this audit

- Restricted SHS local demo identity to explicit development environment.
- Made `/auth/me` return the authenticated middleware user and reject unauthenticated requests.
- Removed unknown-user fallback to the admin identity.
- Replaced unrestricted SHS Express CORS with an explicit production allowlist and fail-closed startup requirement.
- Made production SHS API database configuration fail closed when `DATABASE_URL` is absent.
- Made SHS API production startup fail closed while no production identity-provider adapter exists; production no longer accepts fixture login or `dev-token:*` credentials.

No reporting metric, policy, Truth `public_approved` state, Hub governance record, snapshot, publication, or public surface was changed.

## Production identity boundary remediation

The critical unsafe fallback is now explicitly closed. In production, the SHS
API does not consult the hard-coded `IdentityRepo`, does not accept
`dev-token:<user_id>`, and does not treat `/auth/login` as password
authentication. Startup requires the documented provider configuration and
then fails closed because no provider adapter is present. Development fixture
identity remains explicitly development-only.

This is a security boundary correction, not production identity integration.
Classification remains `NOT_PRODUCTION_READY` with
`PRODUCTION_IDENTITY_EXTERNAL_PROVIDER_REQUIRED`. A future identity adapter
must establish canonical users, credentials/tokens, sessions, account status,
memberships, and revocation before production HTTP proof can be claimed.

## Provider requirements review

The approved provider is Auth0. The implementation defines an
`OIDC_GENERIC`-compatible Auth0 adapter in
`apps/shs-api/src/auth/production-identity.ts`: provider authentication returns
only verified external identity facts, while SHS resolves identity links,
memberships, roles, permissions, scope, and governance authority. The
production fail-closed guard remains active. Auth0 tenant/callback
configuration, identity-link provisioning, durable session deployment, and
synthetic provider-backed HTTP proof remain blocking dependencies.

## Verification record

Passed: SHS API `npm run typecheck` and `npm run build`; the focused SHS API
trusted-reporting/governance suite (`81` tests); focused Agent Fabric
security/governance suite (`36 passed, 1 skipped`); reporting census and
trusted-reporting rebuild validators; JSON validation; and `git diff --check`.
The skipped Python test is the opt-in PostgreSQL runtime fixture. The full
root JavaScript suite has one unrelated pre-existing registry expectation
failure in `tests/reportsBriefingsSurfaceReview.test.mjs`; it expects an older
`reporting_service` string and is outside this audit's changed surfaces. A
separate live-learning HTTP suite was not used as a hardening signal because
it requires a running SHS API process.
## Auth0 live integration proof update (2026-08-26)

The Auth0 production identity implementation is code-complete for the approved vendor-neutral boundary, but the requested live proof is not complete. Required Auth0 test-tenant and local runtime configuration was absent; all checked identity/session variables were unset and PostgreSQL was unavailable on `localhost:5432`. No live Auth0 request, production credential, real user, database migration, identity link, session, or reporting governance mutation was attempted.

Classification remains `NOT_PRODUCTION_READY`. The remaining identity evidence gap is authorized test-tenant configuration plus local PostgreSQL migration/runtime proof. This does not reopen reporting architecture and does not change Hub or curriculum governance state.
## Trusted deployment/network boundary audit (2026-08-26)

Classification: `CANONICAL_DEPLOYMENT_MODEL_REQUIRED`. The repository contains
partial local/development process configuration, but no canonical production
SHS/Agent Fabric deployment, ingress, TLS, network-policy, proxy-trust,
worker-supervision, or database-isolation artifacts. Localhost/default bind
settings are not production evidence.

Runtime boundary required by the companion contract:

- SHS API: authenticated edge, with only the published curriculum Impact GET
  intentionally public.
- Agent Fabric ingestion and Truth/Evidence mutation: internal service only,
  with HMAC/service authentication retained.
- Trusted-reporting worker: worker-only, no public inbound HTTP.
- PostgreSQL and governance stores: database-internal-only.
- Frontend assets and the canonical public projection read: public edge.
- Health/readiness: private or sanitized deployment probes.
- Fixture identity routes and demo identity surfaces: development-only.

One bounded defect was corrected: SHS fixture routes for demo users,
organizations, roles, invites, and audit logs are no longer mounted when the
runtime is production. The canonical public Impact read and governed route
guards remain unchanged. No Auth0 tenant was configured, no ingress was
created, and no production data or reporting state changed.

### Blocking before production E2E

1. Select and document an authorized production deployment model.
2. Provide reviewed public/API ingress, HTTPS/TLS termination, private
   service networking, database isolation, and explicit proxy trust behavior.
3. Provide managed worker ownership/recovery and deployment-level route
   exposure verification.

### Required before production launch

Secret provisioning/rotation, migration orchestration, rate limiting,
monitoring/alerting, backup/restore, retention, and external Auth0 tenant
configuration remain separately required.
## Approved Azure deployment model (2026-08-26)

The approved production platform is now Azure: Container Apps, PostgreSQL
Flexible Server, Container Registry, custom VNet, Key Vault, Azure Monitor /
Log Analytics, Auth0, and Terraform. The repository model is implemented under
`infra/azure/` and classified
`AZURE_PRODUCTION_MODEL_CODE_COMPLETE_DEPLOYMENT_PENDING`.

The Terraform topology establishes one ACA environment with external SHS API
ingress, internal Agent Fabric ingress, no worker ingress, private PostgreSQL
subnet/DNS, ACR managed-identity pulls, Key Vault secret references, and Log
Analytics/Application Insights wiring. The frontend app is optional because
the repository has no canonical frontend container build context. No Azure
resources were created and no `terraform apply` was run.

Terraform validation is `UNAVAILABLE`: Terraform is not installed in this
environment. Azure subscription authentication, secret bootstrap, image
publishing, Auth0 tenant configuration, HTTPS/custom-domain setup, NSG/private
routing, migration orchestration, worker recovery, and staging synthetic E2E
remain deployment dependencies. The bounded fixture-route production exclusion
and all reporting/authentication semantics remain unchanged.
## Azure Terraform validation update (2026-08-26)

Terraform `v1.15.8` and AzureRM `v4.81.0` were installed/resolved through the
approved package path. `terraform fmt -check -recursive`,
`terraform init -backend=false`, and `terraform validate` passed for
`infra/azure/`. The initial format pass found invalid semicolon-separated HCL
blocks; those syntax-only corrections and one AzureRM Key Vault deprecation
rename were fixed and revalidated.

No Azure subscription credentials were used and no resources were deployed.
Static assertions confirmed external SHS API/frontend ingress, internal-only
Agent Fabric ingress, disabled worker ingress, private PostgreSQL, explicit
CORS, Key Vault references, managed identity use, and production fixture-route
exclusion. Remote Terraform state, authenticated staging plan/deployment,
secret bootstrap, ingress/TLS/network policy, worker recovery, and operational
proof remain outstanding.

## Staging deployment verification (2026-08-26)

The bounded staging attempt is classified
`AZURE_STAGING_DEPLOYMENT_BLOCKED_BY_CREDENTIALS`. Terraform `v1.15.8` and
AzureRM `v4.81.0` passed formatting, backendless initialization, and
validation for both the application stack and the separate remote-state
bootstrap stack. `az account show` returned no authenticated Azure context,
so no subscription could be verified as authorized staging and no Azure write,
remote-state creation, plan, apply, image publish, or runtime proof was made.

The secure state bootstrap and external backend initialization contract are
implemented under `infra/azure/bootstrap/` and `infra/azure/`. Staging remains
blocked on authorized Azure credentials, Key Vault secret bootstrap, runnable
immutable staging images, and an approved staging target. The full evidence
record is `docs/SHF_TRUSTED_REPORTING_STAGING_DEPLOYMENT_PROOF.md`.

## Azure staging bootstrap and plan attempt (2026-08-26)

The staging operation remains blocked at environment verification because the
Azure CLI is unavailable (`az: command not found`). No subscription, tenant,
or non-production target could be established. No provider registration,
remote-state resource creation, backend reconfiguration, Terraform plan, or
apply was performed. This is an external deployment-tooling/authorization
blocker, not a Terraform configuration failure.

## PostgreSQL migration orchestration (2026-08-26)

The prior `MIGRATION_ORCHESTRATION_REQUIRED` gap is addressed in code by the
canonical runner at `apps/shs-api/src/db/migration-runner.ts` and the SHS API
database commands. It provides deterministic discovery of migrations 001-028,
durable checksums/bookkeeping, bounded advisory locking, per-migration
transactions, drift and unknown-history rejection, explicit baseline handling,
and fail-closed production database configuration.

Focused tests passed 5/5 and SHS API typecheck/build passed. PostgreSQL was not
available at `localhost:5432`, so fresh/upgrade/failure/concurrency persistence
proof is pending. This remains a deployment verification item rather than a
new reporting architecture change.

## PostgreSQL migration runtime proof (2026-08-26)

The canonical runner is now runtime-proven on local PostgreSQL `16.12` using
disposable databases. Fresh and upgrade paths completed through migration 028;
second-run no-op, persisted bookkeeping, migration-028 structures, rollback,
drift, unknown-history, explicit baseline, readiness, lock contention, and lock
release were verified. Disposable databases were removed after proof.

The migration orchestration classification is now
`MIGRATION_ORCHESTRATION_COMPLETE_RUNTIME_PROVEN`. Azure/Auth0 remain deferred,
and worker runtime hardening remains the next Trusted Reporting hardening slice.

Readiness checks also returned `READY` for the fully migrated database and
fail-closed not-ready reasons for pending, drifted, and unknown migration
history states. No Azure or Auth0 operation was performed.

## Azure CLI setup attempt (2026-08-26)

Azure CLI `2.89.1` was installed through Homebrew. Interactive login was
started but no authenticated account was established during this run. Tenant,
subscription, provider-registration, and staging-authorization checks remain
pending. No Azure write or Terraform resource operation was performed.

## Outbox worker runtime hardening (2026-08-26)

Worker review found the prior implementation partial: `DELIVERING` rows had no
durable lease, retries used a fixed one-minute delay, and there was no bounded
quarantine state. The bounded correction is complete in the SHS outbox path.
Migration 029 adds lease ownership/expiry, reclaim tracking, failure
classification, quarantine timestamp, and justified polling indexes. The
worker now applies persisted exponential backoff, a configurable maximum
attempt count, ownership-scoped transitions, request timeouts, and graceful
continuous polling shutdown. No public route or reporting semantic changed.

Disposable local PostgreSQL 16.12 proof established migration 001-029,
concurrent claim exclusion, lease reclamation, durable delivery/retry state
after repository recreation, and backlog aggregation. Existing isolated Agent
Fabric tests establish stable idempotent replay for the same canonical event
identity. No real data, Azure resource, Auth0 tenant, or Hub claim was used.

Classification: `OUTBOX_WORKER_RUNTIME_HARDENING_COMPLETE`. Remaining
operational work is production supervision/observability and later rate
limiting; these are deployment concerns, not a worker correctness gap.

## Rate limiting and abuse protection (2026-08-26)

SHS API route-aware protection is implemented with shared PostgreSQL fixed
windows, server-derived actor/scope keys, explicit production configuration,
429/Retry-After responses, and production fail-closed backend behavior.
Public Impact reads remain unauthenticated and health routes remain exempt.
Migration 030 is operational only and does not affect Truth or governance
state.

Real local PostgreSQL concurrency proof showed atomic shared-counter behavior.
Focused tests, SHS typecheck/build, reporting regressions, validators, and
diff checks passed. Agent Fabric internal ingestion remains HMAC/network
protected but is not yet backed by a shared limiter adapter; this is a route
coverage gap before full rate-limiting completion. No Azure/Auth0 operation or
real Hub data was touched.

Classification: `RATE_LIMITING_ROUTE_COVERAGE_GAP_REMAINS`.

## Agent Fabric internal ingestion shared rate limiting (2026-08-26)

The Agent Fabric HMAC ingestion route now uses a native Python adapter over the
shared PostgreSQL `rate_limit_windows` table from migration 030. The security
order is HMAC authentication, trusted producer resolution, existing
producer/event binding and payload validation, shared service-aware rate limit,
then Operational Event persistence. Over-limit responses are 429 with
`Retry-After`; limiter backend failure is 503 in production. Neither path
creates an Operational Event, Evidence, or Truth state.

The implementation is shared-state compatible with multiple Agent Fabric
instances and uses the collision-safe
`INTERNAL_INGESTION_LIMIT:service:<trusted-service-id>` namespace. Development
memory state is explicit only; production requires PostgreSQL and the internal
ingestion limit configuration. Safe hashed producer references are used in
operational logs, and aggregate limiter telemetry is operational-only.

Focused Agent Fabric tests passed 17/17. A disposable local PostgreSQL 16.12
concurrency proof passed with four concurrent calls, exactly two admissions
under a max-two window, and one persisted shared counter; the test database was
removed. No Azure/Auth0 operation, real Hub data, or reporting semantic change
occurred.

The route coverage gap is closed at the code/runtime mechanism level. Exact
production numeric values remain policy/configuration inputs and are not claimed
as institutionally approved. Classification:
`RATE_LIMITING_CODE_COMPLETE_PRODUCTION_POLICY_VALUES_PENDING`. The next
authorized slice is operational monitoring and alerting hook hardening.

## Operational monitoring and alerting hooks (2026-08-26)

The bounded monitoring implementation adds vendor-neutral TypeScript and Python
telemetry adapters. Events use an allowlisted schema and scalar metadata only;
sink failure is isolated from canonical work. Severity distinguishes normal
success, expected rejection/degradation, infrastructure error, and critical
unsafe persistence/schema conditions. Operational telemetry is not Truth,
Evidence, a reporting metric, or governance audit.

Hooks now cover SHS rate-limit and internal-error signals, Agent Fabric
ingestion/authentication/limiter signals, and trusted-reporting worker claim,
delivery, retry, and quarantine signals. Existing migration readiness, worker
backlog, typed reporting/publication errors, and health/readiness primitives
remain their source mechanisms. Backlog alert predicates cover pending count,
oldest pending age, quarantine growth, and delivery stalls. Production
thresholds require explicit configuration and remain policy values pending.

The public Agent Fabric health response no longer exposes subprocess stdout or
stderr tails. Focused monitoring and boundary tests, SHS typecheck/build,
frontend build, Python compilation, validators, and diff checks passed. The
broader Agent Fabric suite has six unrelated pre-existing SQLite payout/pool/
treasury failures. No Azure/Auth0 operation, Hub data, or reporting semantics
changed. Classification:
`OPERATIONAL_MONITORING_CODE_COMPLETE_ALERT_THRESHOLDS_PENDING`.

## Retention and lifecycle enforcement (2026-08-26)

The code-side retention slice is classified
`RETENTION_CODE_COMPLETE_PRODUCTION_POLICY_VALUES_PENDING`. The new
allowlisted lifecycle manager and CLI provide status, dry-run plan, and
explicitly confirmed bounded cleanup for expired shared rate-limit windows,
aged expired/revoked SHS sessions, and aged delivered outbox rows. Cleanup uses
database time, indexed predicates, `FOR UPDATE SKIP LOCKED`, transactions, and
safe operational telemetry. It is not run during API startup.

Canonical Truth, Evidence, Sources, Truth history, reporting and governance
history, audit, snapshots, publications, public projections, identity links,
memberships, and migration history have no automatic deletion path. Pending,
retryable, leased, failed-final, and quarantined outbox rows are preserved.
Missing production duration configuration is a no-delete condition; legal and
institutional retention durations remain policy decisions. Local PostgreSQL
16.12 disposable proof covered active preservation, eligible cleanup,
idempotent retry, and session referential integrity. Azure, Auth0, Hub data,
and reporting semantics were unchanged.

## Local E2E acceptance review (2026-08-26)

The local acceptance phase did not force a full production-equivalent PASS.
Disposable PostgreSQL 16.12 migrations through 030, Agent Fabric lesson
projection runtime tests, SHS worker/governance/publication tests, frontend
tests, builds, and validators passed. The exact assembled lesson chain remains
unavailable because the browser `lesson.completed` transport posts directly to
Agent Fabric, while the SHS transactional outbox has no canonical lesson
producer route. A direct outbox insert was correctly not used. The sandbox also
prevented cross-command HTTP reachability to a temporary local Agent Fabric
listener. Classification is `LOCAL_E2E_RUNTIME_COMPONENT_UNAVAILABLE`, not a
claim of production readiness. Evidence is recorded in
`docs/SHF_TRUSTED_REPORTING_LOCAL_E2E_ACCEPTANCE.md`.

Azure infrastructure and Auth0 live tenant configuration remain deferred, Hub
real data remains pending, and the next authorized task is the final code-side
assurance audit after this acceptance limitation is reviewed.
## Canonical curriculum producer/outbox assembly (2026-08-26)

The SHS API now owns the authenticated lesson completion write at
`POST /curriculum/lessons/:lessonId/complete`. Migration 031 adds
`curriculum_lesson_completions`; the service persists the completion and the
existing `lesson.completed` `integration_outbox` envelope in one PostgreSQL
transaction. Deterministic completion and idempotency identities prevent a
duplicate client retry from creating a second completion or outbox event.

The browser client remains a UI/transport queue and does not establish Truth or
reporting authority. Agent Fabric's service binding now permits only the exact
`curriculum.lesson` / `lesson.completed` pair required by this producer, while
HMAC authentication, scope validation, shared ingestion limiting, and downstream
idempotency remain unchanged. Disposable PostgreSQL tests and live local SHS
HTTP producer requests passed. Worker-to-Agent-Fabric post-fix capture remains
pending due local process-harness collisions; no production or staging runtime
was used.

Current classification: `CURRICULUM_PRODUCER_CODE_COMPLETE_CROSS_PROCESS_PROOF_PENDING`.

## Final code-side assurance audit (2026-08-26)

The final assurance reconciliation found no new code defect or SHF/SHS
institutional authority crossover. The canonical producer, ingestion,
transactional outbox, migration chain through 031, worker, rate limiting,
monitoring hooks, retention guards, governance/publication chain, and legacy
boundaries remain intact. SHF and SHS share technical infrastructure only;
this audit does not claim completion of a separate SHS commercial-reporting
domain audit.

Current classification:
`SHF_TRUSTED_REPORTING_CODE_SIDE_COMPLETE_EXTERNAL_RUNTIME_AND_POLICY_PENDING`.
Rate-limit values, monitoring thresholds, retention durations, and
backup/restore policy remain pending production decisions. Azure is
`DEFERRED_EXTERNAL_INFRASTRUCTURE`, Auth0 is
`DEFERRED_EXTERNAL_CONFIGURATION`, and Hub is
`WAITING_FOR_REAL_CANONICAL_DATA`. Code-side hardening stops after this audit;
the next work queue is external runtime/policy activation or a separate SHS
reporting-domain audit.
