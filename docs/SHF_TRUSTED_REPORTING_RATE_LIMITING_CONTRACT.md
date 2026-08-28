# SHF Trusted Reporting Rate Limiting Contract

## Purpose and route classes

Rate limiting is transport/availability protection. It never substitutes for
authentication, authorization, CORS, HMAC, scope checks, or reporting
governance. The SHS application classifies canonical public Impact reads as
`PUBLIC_READ`, login/session establishment as `AUTHENTICATION`, reporting
reads as `AUTHENTICATED_USER`, reporting mutations as
`EXPENSIVE_REPORT_OPERATION` or `GOVERNANCE_MUTATION`, and `/health/*` as
`HEALTH_READINESS` and exempt from ordinary user limits. Agent Fabric remains
an internal HMAC boundary and now uses the same shared PostgreSQL state and
fixed-window contract for its service-aware application limit.

## Limiter classes and identities

The six classes are `PUBLIC_READ_LIMIT`, `AUTH_LOGIN_LIMIT`,
`AUTHENTICATED_USER_LIMIT`, `GOVERNANCE_MUTATION_LIMIT`,
`EXPENSIVE_OPERATION_LIMIT`, and `INTERNAL_INGESTION_LIMIT`. Public and login
requests use Express's `req.ip`; with no configured proxy trust, spoofed
forwarded headers are not authority. Authenticated and governance requests use
server-resolved internal identity plus tenant and organization. Provider
claims, request bodies, email strings, and client scope do not establish the
key. Internal ingestion is keyed by authenticated service identity when the
service adapter supplies it.

## Algorithm and persistence

Production uses a fixed-window counter in shared PostgreSQL. The counter uses
database time and an atomic `INSERT ... ON CONFLICT DO UPDATE`, so ACA replicas
share decisions without process-local locks. Migration
`030_rate_limit_windows.sql` stores only operational counters with expiry and
an expiry index; it is not Truth, Evidence, or governance history. Development
and test use an explicitly non-production in-memory store. Production startup
requires every class's max/window configuration and `DATABASE_URL`; it never
falls back to memory.

## Responses and failures

Over-limit requests return HTTP 429, `Retry-After`, and a minimal
`rate_limited` error. The middleware executes before route handlers, so no
Truth, Evidence, approval, publication, report result, or ingestion event is
created by a rejected request. Production counter failure returns 503 rather
than bypassing sensitive controls. Health/readiness is not user-rate-limited;
network exposure remains its deployment boundary.

## Policy values and cleanup

The mechanism has development defaults only. Production values are
configuration/policy inputs, not institutionally approved values, and must be
set per class: `SHS_RATE_LIMIT_<CLASS>_MAX` and
`SHS_RATE_LIMIT_<CLASS>_WINDOW_SECONDS`. Counter windows expire naturally and
the indexed table is eligible for bounded operational cleanup; a later
monitoring slice should schedule deletion of expired rows without an
unbounded request-path scan.

## Security and boundaries

The limiter logs no credentials, tokens, payloads, or counter contents. It
does not alter `public_approved`, population eligibility, report governance,
outbox delivery, or public report semantics. Agent Fabric HMAC remains
mandatory and Azure ACA/WAF limits may supplement, but never replace, these
application controls. Public Impact reads remain unauthenticated by design.

| Route family | Exposure/auth | Limiter | Key | Status |
|---|---|---|---|---|
| `GET /public/impact/curriculum-lesson-completions` | Public read | `PUBLIC_READ_LIMIT` | `req.ip` | Implemented |
| `POST /auth/login`, `/auth/session/exchange` | Authentication | `AUTH_LOGIN_LIMIT` | `req.ip` | Implemented |
| `GET /reporting/*` | Authenticated user | `AUTHENTICATED_USER_LIMIT` | server identity + scope | Implemented |
| Reporting governance mutations | Authenticated/governance | `GOVERNANCE_MUTATION_LIMIT` | server identity + tenant/org | Implemented |
| Expensive reporting mutations | Authenticated/governance | `EXPENSIVE_OPERATION_LIMIT` | server identity + scope | Implemented |
| `POST /shf/internal/ingestion/events` | Internal HMAC service | `INTERNAL_INGESTION_LIMIT` | authenticated service identity | Implemented shared PostgreSQL adapter |
| `/health*` | Health/readiness | None | Network boundary | Intentionally exempt |

## Route coverage and remaining work

SHS API route families are covered by the classifier before registration:
public Impact read, auth login/exchange, authenticated reporting reads,
governance/reporting mutations, and expensive reporting operations. Existing
non-reporting authenticated mutations receive the authenticated-user class.
Agent Fabric validates HMAC authentication, trusted producer resolution,
producer/event binding, and event payloads before consuming the shared limiter.
A rejected decision occurs before `ingest_operational_event`, so no Operational
Event is created. The Python adapter uses migration 030's
`rate_limit_windows` table, database time, atomic upsert, and the
`INTERNAL_INGESTION_LIMIT:service:<trusted-service-id>` namespace. It returns
429/`Retry-After` for over-limit requests and 503 in production when the
backend is unavailable. Its development memory path is explicit and unavailable
in production. The exact production numeric values remain configuration/policy
inputs rather than institutionally approved values.
