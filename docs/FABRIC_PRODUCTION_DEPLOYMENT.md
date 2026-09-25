# Production Fabric Deployment Path

Status: **PRODUCTION BLOCKER - FABRIC SERVICE BROWSER ROUTE NOT ESTABLISHED**

No production hostname is invented in this document. No deployment was performed.

## Production Fabric Deployment Audit

| Component | Current Production Host/Model | Config Source | Fabric Reachable? | Notes |
|---|---|---|---|---|
| Root Vite frontend | Static/multi-page Vite build; no production proxy in Vite | `vite.config.js` | No, by itself | Dev server proxies `/fabric-api` to `127.0.0.1:8090`; Vite production build does not provide routing. |
| Frontend hosting, Azure | Optional Container App only when `frontend_image` is supplied | `infra/azure/frontend.tf` | No evidence | Target port 80 public ingress exists for an image, but no reverse proxy, path rewrite, or `/fabric-api` route is configured. |
| Frontend hosting, Vercel | Static route rewrites only | `src/vercel.json` | No | Rewrites app paths like `/career`; no `/api` or `/fabric-api` backend routing. |
| SHS API | Public Azure Container App | `infra/azure/shs-api.tf`, `infra/azure/outputs.tf` | Separate backend | External ingress `true`, target port 8091, output `shs_api_fqdn`. |
| Agent Fabric | Internal-only Azure Container App | `infra/azure/agent-fabric.tf`, `infra/azure/outputs.tf` | No browser route | Ingress `external_enabled = false`, target port 8090, output documents `internal-only`. |
| Worker to Fabric | Private service-to-service URL | `infra/azure/worker.tf` | Yes, internal | `SHF_AGENT_FABRIC_INTERNAL_URL=http://${azurerm_container_app.agent_fabric.name}.internal:8090`. |
| Frontend Fabric base | Dev proxy by default; production now fail-visible unless configured | `src/system/fabric/fabricConfig.js` | Conditional | Production requires `VITE_FABRIC_API_BASE` or `VITE_FABRIC_ENABLE_SAME_ORIGIN_PROXY=true`. |
| SHS API CORS | Frontend and SHS API origins | `infra/azure/shs-api.tf` | N/A | `AUTH_ALLOWED_ORIGINS=${var.frontend_origin},${var.shs_api_origin}`. |
| Fabric CORS | Currently SHS API origin only | `infra/azure/agent-fabric.tf`, `auth/config.py` | Not browser-ready for frontend | Same-origin proxy would avoid cross-origin Fabric CORS for browser pages; separate public origin would require an explicit allowed-origin decision. |
| CI/CD | Gates only; no deployment workflow found | `.github/workflows/*` | No | Workflows validate Fabric compliance/registry/funding policy; no Azure deployment workflow or frontend gateway deployment found. |
| Deployment docs | Azure stack says internal Agent Fabric and optional frontend image | `infra/azure/README.md` | Documents internal-only | Also states no canonical frontend container build context. |

## Topology Classification

Current repository evidence classifies production as:

**D. NO COMPLETE PRODUCTION MODEL EXISTS**

Evidence:

- SHS API has a public production model: Azure Container Apps external ingress on target port 8091.
- Agent Fabric has a production resource model, but it is internal-only on target port 8090.
- The only configured production consumer of Fabric is the worker through an internal Container Apps hostname.
- No checked-in Azure Front Door, Application Gateway, nginx, Vercel rewrite, Container App sidecar, or frontend reverse proxy routes `/fabric-api/*` to Agent Fabric.

Smallest safe production topology to implement later:

| Browser Path | Owner | Required Infrastructure |
|---|---|---|
| `/api/*` | SHS API | Existing public SHS API route or a frontend/gateway proxy to SHS API target port 8091. |
| `/fabric-api/*` | Agent Fabric | A same-origin frontend/gateway route that strips `/fabric-api` and forwards only approved Fabric route families to Agent Fabric target port 8090. |

## Fabric Production Readiness

| Requirement | Present? | Evidence | Blocker? |
|---|---:|---|---:|
| Azure resource definition | Yes | `infra/azure/agent-fabric.tf` | No |
| Public browser ingress | No | `external_enabled = false` | Yes, for browser pages |
| Internal service ingress | Yes | Container App internal ingress, worker internal URL | No |
| Container image variable | Partial | `var.agent_fabric_image` | Yes: image build/publish path not found |
| Dockerfile/build context | No | No `services/shf-agent-fabric/Dockerfile` found | Yes |
| Startup command | Partial | `main.py` supports uvicorn when run directly; Terraform supplies image only | Yes: image entrypoint unknown |
| Production PORT handling | Yes | Terraform sets `PORT=8090`, `HOST=0.0.0.0`; `main.py` defaults to 8090 | No |
| Liveness endpoint | Yes | `/health/live` in `routers/health_routes.py` | No |
| Readiness endpoint | Yes | `/health/ready` runs core invariant checks | No |
| Persistent database config | No | Terraform supplies `SHF_DATABASE_URL`, but `db/db.py` uses local sqlite `db/fabric.sqlite` | Yes |
| Startup mutation risk | Yes | `main.py` lifespan calls `init_db()` (`Base.metadata.create_all`) | Blocker for unsupervised startup |
| Secret management | Partial | Key Vault refs for internal keys/database URL | No for secrets; blocker remains DB usage |
| Auth config validation | Yes | `validate_auth_configuration()` blocks invalid production auth | No |
| CORS config | Partial | `AUTH_ALLOWED_ORIGINS` required in production | Needs topology decision |
| Logs/observability | Partial | Log Analytics in Azure stack; app uses Python logging | No |
| Deployment workflow | No | No deploy workflow found | Yes |

## Fabric Production Exposure Matrix

| Route Family | Browser Needed? | Authentication | Authorization | Safe for Browser Exposure? | Recommended Production Access |
|---|---|---|---|---|---|
| Truth Spine (`/truth`) | Yes, admin pages | Session cookie | Permission-gated by Truth permissions | Yes, behind authenticated same-origin gateway | browser-accessible through gateway/proxy |
| Game Theory (`/game-theory`) | Yes, admin page | Mixed route-level pattern; needs route review before exposure | Governance/admin expectations | Unresolved | unresolved |
| AI Guardrails (`/ai-guardrails`) | Yes, admin page | Mixed route-level pattern; needs route review before exposure | Governance/admin expectations | Unresolved | unresolved |
| Oracle admin/cases (`/oracle`) | Yes, admin page | Route tests exist; route-level auth should be reviewed before public gateway exposure | Admin/governance expectations | Unresolved | admin-only |
| Agent Fabric admin (`/admin/agents`, `/admin/layers`, `/admin/gate`) | Yes, admin page | `X-Admin-Key` dependencies for critical admin routes | Admin key plus route-specific checks | Not broadly | admin-only |
| Registry admin (`/admin/registry`) | Yes, registry admin page | `X-Admin-Key` dependency | `X-Admin-Role` read/write roles | Admin only | admin-only |
| Capital Operator / operator APIs (`/api/v1/operator`, `/api/v1/aal`) | Yes, operator surfaces | Not consistently protected in the audited files | Unresolved | Unresolved | unresolved |
| SHF Command Center Fabric calls (`/self-audit`, `/simulate-outcome`) | Yes | Self-audit and simulation route exposure requires route review | Operational/admin page context | Unresolved | admin-only or unresolved |
| IEP simulation (`/run`) | Yes, IEP v2 page | Legacy run route with admin-gated execution paths elsewhere | Human approval/admin routes exist for runs | Limited | unresolved |
| BFE (`/bfe`) | Yes, metaverse BFE status/test pages | No route-level auth observed in prefix declaration | Unresolved | Unresolved | unresolved |
| reports/run-report routes (`/runs/report`, `/runs/published`) | Yes, reporting admin | Publish is admin-key protected; read/export routes need route-level review | Admin/reporting authority | Partially | admin-only |
| Health (`/health/live`, `/health/ready`) | Yes for platform health checks | No auth | Non-sensitive status if response remains bounded | Yes, gateway/platform only | service-to-service or gateway health |
| Worker/internal ingestion (`/shf/internal/ingestion`) | No browser need | Internal service key/HMAC pattern in service tests | Service-to-service | No | service-to-service |

Do not expose the entire Agent Fabric service blindly. A same-origin gateway should route only approved families and preserve backend auth; everything else should remain internal-only until route-level authorization is audited.

## Auth, CORS, and Cookie Model

Fabric auth is session-cookie based for human auth (`shs_bos_session` by default), with production config validation requiring secure cookies, allowed origins, and no demo/test user store. CSRF-sensitive routes validate origin and `X-CSRF-Token`.

Same-origin `/fabric-api` is the preferred eventual browser model because:

- cookies with `SameSite=Lax` work without cross-site credential complexity;
- admin headers and CSRF headers avoid cross-origin CORS preflight drift;
- TLS can terminate at the frontend/gateway edge;
- browser code avoids hard-coded hosts.

Current Azure config does not yet provide that same-origin route. A separate public Fabric origin would require an explicit hostname, external ingress, allowed frontend origin, and a route exposure review. None of those are present.

## Frontend Production Behavior

Local development remains:

| Path | Backend |
|---|---|
| `/api` | SHS API on port 8091 |
| `/fabric-api` | Agent Fabric on port 8090 |

Production Fabric base resolution is now:

1. `VITE_FABRIC_API_BASE`
2. `VITE_FABRIC_URL`
3. `VITE_FABRIC_BASE_URL`
4. `/fabric-api` only when `VITE_FABRIC_ENABLE_SAME_ORIGIN_PROXY=true`
5. `/__fabric-production-route-unconfigured__` when production has no explicit Fabric route

This prevents production from falling back to `localhost`, `127.0.0.1`, or an unconfirmed `/fabric-api` gateway.

## Health and Readiness

Existing endpoints:

| Endpoint | Purpose | Notes |
|---|---|---|
| `/health/live` | Liveness | Process up. |
| `/health/ready` | Readiness | Runs compliance, registry contract, and runtime enforcement lock checks; returns 503 if not ready. |
| `/health/degraded` | Soft health | Always returns 200 with warnings. |
| `/auth/readiness` | Auth configuration readiness | Shows production auth blockers without weakening auth. |

No new health endpoint was added.

## Backend Absolute URL Audit

| File | URL | Response-consumed by browser? | Production risk | Fix now? |
|---|---|---|---|---|
| `services/shf-agent-fabric/routers/run_report_routes.py` | `http://127.0.0.1:8090/runs/report/...` and `/runs/published/...` | Yes, report route payload links can be consumed by reporting UI | High once run-report routes are exposed | No; document for backend URL normalization because no production browser route exists yet |
| `services/shf-agent-fabric/registry/runs/*.json` | Published run report/pdf/proof localhost links | Possibly if registry data is surfaced | Medium | No |
| `services/shf-agent-fabric/fabric/reports/proof_pack.py` | Default `base_url="http://127.0.0.1:8090"` | Yes, proof packs can carry links | Medium | No |
| `services/shf-agent-fabric/fabric/funding/*.py` | `http://127.0.0.1:8001` examples/Postman docs | Documentation/example payloads | Low | No |
| Fabric scripts/bin/tools | `http://127.0.0.1:8090` defaults | CLI/dev only | Low | No |

Separate backend URL normalization task: derive public link origins from request/gateway headers or a configured public base after the production topology is approved.

## Required Deployment Work Before Exposure

1. Add or identify a real frontend/gateway layer that can route `/fabric-api/*` to the internal Agent Fabric service.
2. Decide and implement the route-family allowlist instead of exposing all Fabric paths.
3. Provide a production Agent Fabric image build context and deployment workflow.
4. Make Fabric persistence honor production database configuration instead of local sqlite.
5. Normalize browser-facing absolute URLs in run-report/proof-pack responses.
6. Validate with Terraform `fmt`, `init -backend=false`, and `validate`; do not apply without explicit authorization.

