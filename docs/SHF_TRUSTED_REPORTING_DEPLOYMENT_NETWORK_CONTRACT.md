# SHF Trusted Reporting Deployment and Network Contract

## Status

This is a bounded deployment-boundary contract for the existing Trusted
Reporting architecture. The repository has a partial deployment model, not a
complete production deployment specification. Classification:
`AZURE_PRODUCTION_MODEL_CODE_COMPLETE_DEPLOYMENT_PENDING`. The approved
implementation is recorded in
`docs/SHF_TRUSTED_REPORTING_AZURE_DEPLOYMENT_MODEL.md`.

The contract defines required exposure and trust boundaries without selecting
a cloud provider, ingress product, or infrastructure-as-code implementation.

## Runtime inventory and exposure matrix

| Component | Entry point / port | Intended class | Callers and dependencies | Authentication |
|---|---|---|---|---|
| SHS API | `apps/shs-api/src/server.ts`, configured `PORT` (development default 8091) | `AUTHENTICATED_EDGE` plus narrowly allowlisted `PUBLIC_INTERNET` reads | Browser; PostgreSQL; Auth0-backed identity; internal reporting paths | SHS server session for human/governance routes; public projection GET is unauthenticated by design |
| SHF Agent Fabric | `services/shf-agent-fabric/main.py`, configured `PORT` (development default 8090) | `INTERNAL_SERVICE_ONLY` | SHS/outbox worker; local Truth/Evidence stores; internal operators | Internal HMAC/service identity for ingestion; route-specific authorization |
| Public frontend/static assets | Repository frontend build output; deployment-defined origin | `PUBLIC_INTERNET` | Browser | Public assets; browser API calls use SHS API |
| Public Impact read path | SHS API `/public/impact/curriculum-lesson-completions` | `PUBLIC_INTERNET` | Public browser | Public-by-design read; published canonical projection only |
| Trusted-reporting outbox worker | `apps/shs-api/src/domain/trusted-reporting/worker.ts` | `WORKER_ONLY` | Process supervisor; SHS PostgreSQL; Agent Fabric internal ingestion | Service HMAC; no public inbound HTTP |
| SHS PostgreSQL | Repository migrations and `DATABASE_URL` | `DATABASE_INTERNAL_ONLY` | SHS API and worker | Database credentials/TLS as deployment requires; never browser-accessible |
| Agent Fabric Truth/Evidence persistence | Agent Fabric local stores and configured durable stores | `INTERNAL_SERVICE_ONLY` | Agent Fabric only | Service/process boundary plus application authorization |
| Health/readiness surfaces | SHS `/health`; Agent Fabric `/health/live`, `/health/ready`, `/health/degraded` | `INTERNAL_SERVICE_ONLY` unless a deployment explicitly exposes a sanitized liveness check | Process supervisor/orchestrator | No sensitive detail; readiness should be edge-controlled |
| Legacy fixture routes | SHS `/users`, `/organizations`, `/roles`, `/invites`, `/audit-logs` and fixture mutations | `DEVELOPMENT_ONLY` | Local frontend/tests only | Not production routes; now not mounted in production |
| Legacy publication/reporting services | Repository legacy routes and presentation helpers | `LEGACY_NOT_FOR_PRODUCTION` unless separately reviewed | Internal development consumers | Must not be exposed as canonical public reporting authority |

## Boundary rules

Only the frontend assets and the published curriculum Impact read may be
publicly reachable. Auth0 callback traffic, if added by the approved identity
deployment, belongs at the public web edge and must return only through the
configured SHS identity flow. Human-authenticated API traffic may reach SHS
through an authenticated edge, but route-level permissions and scope checks
remain mandatory.

Agent Fabric internal ingestion and Truth/Evidence mutation are not public
routes. They require the existing cryptographic internal service
authentication even when traffic originates inside the private network. The
worker has no public ingress and only calls PostgreSQL and internal service
endpoints required by its job.

PostgreSQL and durable governance stores are internal-only. There is no
frontend database connection. Browser state, localStorage, static/demo data,
Oracle output, and development identities are not network authorities.

## Ingress and TLS contract

The eventual deployment must provide separate `PUBLIC_WEB_INGRESS` and
`AUTHENTICATED_API_INGRESS` paths. Internal Agent Fabric, worker, and database
traffic must use private service networking. Internet-facing traffic must use
HTTPS with TLS termination at a reviewed edge or reverse proxy. The repository
does not currently contain that edge configuration, certificate ownership, or
network policy, so TLS and perimeter enforcement are unverified.

No application code may treat arbitrary `X-Forwarded-*`, `Forwarded`, or `Host`
headers as trusted client facts. An eventual proxy trust setting must be
explicit, environment-specific, and restricted to the reviewed proxy path.

## CORS and service authentication

Production SHS API startup requires an explicit `AUTH_ALLOWED_ORIGINS` list;
credentialed requests from unlisted origins are rejected. Agent Fabric also
requires an explicit production origin configuration. Wildcard authenticated
CORS is prohibited. Deployment origins must be verified against the actual
frontend and API origins rather than broadened to make tests pass.

Network isolation does not replace HMAC/service authentication. The
`/shf/internal/ingestion/events` route remains service-authenticated and
scope-validating. Auth0 human credentials cannot authenticate it, and HMAC
service credentials cannot create a human SHS session.

## Health, readiness, and failure isolation

Liveness may report only process availability. Readiness may include required
database and durable-store checks and should be private or sanitized at the
edge. Health responses must not contain secrets, credentials, participant
data, or governance payloads.

Unavailable PostgreSQL, Agent Fabric, Auth0, policy resolution, or public
projection dependencies must fail closed or return unavailable according to
the existing service contract. No deployment may add a fallback to fixture
identity, JSONL governance state, localStorage, mock data, Oracle output,
zero, or stale client data. A stopped worker must leave work retryable and
observable; worker recovery is not established by this repository contract.

## Development and production separation

Development may use localhost, explicit fixture identity, dev-token, and
development-only file-backed stores where existing tests require them.
Production requires external Auth0 configuration, server-owned SHS identity
mapping and session state, explicit CORS origins, durable stores, private
internal services, and deployment-managed secrets. Production must not boot
with development identity, fixture routes, permissive origin behavior, or
implicit localhost assumptions.

## Deployment gaps

The Terraform model now provides the approved Azure resource topology and
explicit ACA ingress classes. Azure subscription deployment, ingress/TLS
configuration, firewall/network policy, proxy trust, migration runner,
worker supervision, backup/restore, and production route inventory remain
external deployment dependencies. The next deployment slice must validate
the Terraform model and deploy a synthetic staging environment under explicit
authorization.
