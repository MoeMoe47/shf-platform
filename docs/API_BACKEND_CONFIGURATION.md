# Frontend API backend configuration

**Rule: frontend production code must not hard-code localhost origins.** Every
SHS API client takes its base from the canonical SHS configuration and every
Agent Fabric client from the canonical Fabric configuration; `127.0.0.1` /
`localhost` appear only in dev proxy targets, `.env.example` and tests.

The frontend talks to two separate backends. Each has one canonical base
resolver and its own same-origin dev proxy prefix; never route one backend's
traffic through the other's.

| Backend | Local port | Dev proxy prefix | Canonical resolver | Resolution order |
|---|---|---|---|---|
| SHS API (`apps/shs-api`) | **8091** | `/api` → `:8091` (prefix stripped) | `src/lib/apiClient.js` (`API_BASE`), built on `src/system/identity/authConfig.js` (`SHS_AUTH_API_BASE`) | `VITE_API_BASE` (explicit override) → `window.__SHS_API_BASE__` → `VITE_SHS_API_BASE` → `"/api"` |
| Agent Fabric (`services/shf-agent-fabric`) | **8090** | `/fabric-api` → `:8090` (prefix stripped) | `src/system/fabric/fabricConfig.js` (`FABRIC_API_BASE`, `fabricUrl()`) | `VITE_FABRIC_API_BASE` → `VITE_FABRIC_URL` (legacy) → `VITE_FABRIC_BASE_URL` (legacy) → `"/fabric-api"` |

- `vite.config.js` defines both proxies; targets can be overridden with
  `SHS_VITE_API_PROXY_TARGET` / `SHS_VITE_FABRIC_PROXY_TARGET`.
- Fabric clients append the Fabric's own route path to the base, e.g.
  `/fabric-api/truth/claims`, `/fabric-api/admin/agents`,
  `/fabric-api/api/growth/claims`, `/fabric-api/api/v1/operator/summary`
  (growth and operator routes carry `/api` in the Fabric itself).
- Why a Fabric proxy instead of absolute `http://127.0.0.1:8090` URLs: the
  Fabric's CORS allows only `Content-Type`, `X-CSRF-Token` and `X-Admin-Key`
  headers and GET/POST, and its session cookie is `SameSite=Lax`. Admin pages
  send `X-Admin-Role`; Truth Spine and Growth Market rely on cookies. The
  same-origin proxy avoids those cross-origin failures without backend changes.
- The shared client `src/lib/apiClient.js` serves the SHS API only (explicit
  `VITE_API_BASE` override, else `SHS_AUTH_API_BASE`). Its exported `API_BASE`
  is the single SHS base authority: domain clients keep their own thin
  wrappers (auth headers, envelopes) but import the base,
  `import { API_BASE as SHS_API_BASE } from "@/lib/apiClient.js"`, instead of
  resolving their own. `authClient.js` and a few admin pages read
  `SHS_AUTH_API_BASE` directly; both resolve identically unless
  `VITE_API_BASE` is set.
- `VITE_LIVE_LEARNING_API_BASE` is retired (it only ever duplicated the SHS
  base); set `VITE_SHS_API_BASE` or `VITE_API_BASE` instead.
- The standalone SHF Web app (`apps/shf-web`, `npm run dev` there) shares these
  clients through its `@` alias and has the same `/api` → `:8091` proxy in
  `apps/shf-web/vite.config.js`.
- `VITE_API_BASE` is read by several clients for different backends (SHS API,
  Civic); it must not be used to locate the Fabric.
- Port evidence for the Fabric: `main.py` defaults `PORT` to 8090 and
  `bin/restart_8090.sh` (used by `ci.sh` / `preflight.sh`) starts it there.
  Port 8000 is only uvicorn's CLI default and the pre-2026-05-14 proxy target.

## Route ownership

| Surface | Frontend client | Owner | Fabric route file | Frontend target |
|---|---|---|---|---|
| Growth Market | `src/shared/api/growthMarket.js` | Fabric | `app/api/routes/growth.py` (`/api/growth`) | `FABRIC_API_BASE` + `/api/growth/*` |
| Truth Spine admin | `src/pages/admin/truth-spine/TruthSpinePage.jsx` | Fabric | `routers/truth_routes.py` (`/truth`) | `fabricUrl("/truth")` |
| Game Theory | `src/pages/admin/game-theory/GameTheoryPage.jsx` | Fabric | `routers/game_theory_routes.py` (`/game-theory`) | `fabricUrl("/game-theory")` |
| AI Guardrails | `src/pages/admin/ai-guardrails/AIGuardrailsPage.jsx` | Fabric | `routers/ai_guardrails_routes.py` (`/ai-guardrails`) | `fabricUrl("/ai-guardrails")` |
| Oracle cases/rulings | `src/pages/admin/oracle/OraclePage.jsx` | Fabric | `routers/oracle_routes.py` (`/oracle/health`, `/cases`, `/rulings`) | `fabricUrl("/oracle")` |
| Oracle truth | `src/shared/truth-spine/truthSpineApi.js` | SHS API | — (`apps/shs-api/src/oracle/routes/oracle.routes.ts`: `/oracle/truth`, `/compare`, `/priority`, `/action(s)`) | `/api/oracle/truth/:id` |
| Agent Fabric admin | `src/pages/admin/agent-fabric/AgentFabricPage.jsx` | Fabric | `routers/admin_agents_routes.py`, `admin_layers_routes.py` (`/admin/*`) | `FABRIC_API_BASE` + `/admin/*` |
| Registry admin | `src/apps/manifest/registry_admin_api.js` | Fabric | `routers/admin_registry_routes.py` (`/admin/registry`) | `FABRIC_API_BASE` + `/admin/registry/*` |
| Reports / Alignment admin | `ReportsDashboard.jsx`, `AlignmentSwitchboard.jsx` | Fabric | `/admin/align*`, `/admin/apps`, `/runs/*`, `/reports/*` | `FABRIC_API_BASE` + path |
| Capital / exchange operator | `lib/capital/operatorApi.js`, `lib/operatorApi.js`, `lib/operatorDataApi.js`, `IssuancesPanel.jsx`, `commandCenterAdapter.js` | Fabric | `routers/api_v1/*` (`/api/v1/operator`, `/api/v1/aal`) | `FABRIC_API_BASE` + `/api/v1/*` |
| Career Center, Opportunities | `lib/career/api.js`, `lib/opportunities/api.js` via `lib/apiClient.js` | SHS API | — | `/api/*` |

**Oracle is split ownership by endpoint**, not a conflict: the SHS API serves
truth/compare/priority/action(s) (permission-guarded), the Fabric serves case
adjudication (health/cases/rulings). The two sets do not overlap.

The SHS API registers no `/admin/*` routes; every admin endpoint the frontend
calls is Fabric-owned.

## Known follow-ups (outside this cleanup)

- `src/shared/chain/PolygonProvider.jsx` posts `/api/chain/log` (a Fabric route
  family) through the SHS proxy.
- `src/shared/auth/audit/auditClient.js` posts `/api/audit`; `/audit` exists in
  both backends — needs an ownership decision.
- `src/pages/debt/DebtClock.jsx` calls `/api/shf/finance/clock`, which neither
  backend serves.
- `src/hooks/useChapter.js` (`/api/chapters`) has no importers.
- Several relative `/api/*` families (`curricula`, `merged`, `credit`, `vocab`,
  `sales`, `hub`, `analytics`, `mock`) match neither backend and are served by
  dev mock shims or are legacy.
## Production origins (deployment requirement)

`infra/azure` deploys the SHS API as a Container App with **external** ingress
(target port 8091, output `shs_api_fqdn`, CORS `AUTH_ALLOWED_ORIGINS =
frontend_origin,shs_api_origin`) and the Agent Fabric with **internal-only**
ingress (8090). The frontend Container App is optional (`frontend_image`) and
no config in the repo routes `/api` or `/fabric-api` on the frontend origin.
Therefore, for a production frontend build:

- SHS API: set `VITE_SHS_API_BASE` (or inject `window.__SHS_API_BASE__`) to
  the deployed `shs_api_origin`, unless the frontend host reverse-proxies
  same-origin `/api` to the SHS API. No production SHS hostname is committed.
- Agent Fabric: it is not reachable from browsers as deployed. Fabric-backed
  pages need either a same-origin `/fabric-api` route on the frontend host or
  an explicit `VITE_FABRIC_API_BASE` plus an ingress/CORS decision. This is an
  open deployment decision, not a frontend default.

## Remaining SHS localhost references (not live clients)

- `src/dev/mockApi.js` string-matches legacy `127.0.0.1:8091/cases/referrals`
  URLs to shadow them in dev (dev mock policy is a separate decision).
- `src/lib/careerEvents/api.js` (DEAD — KEEP): no importers, but
  `docs/SHF_CALENDAR_CAPABILITY_MATRIX.md` still documents it as the live
  career-events client. Migrate it to `apiClient.js` before reviving it.
- The six files under "Pending dead-file cleanup" below.
- Backups (`*.bak*`, `_patchbak`, `_LOCKED_*` etc.), tests and docs.

## Pending dead-file cleanup (deletion deferred)

Classified DEAD — SAFE TO REMOVE during SHS production-origin normalization:
no static or dynamic importers, no route registrations, no test dependencies
and no planning/coverage references (audit-doc hits point to `.bak` siblings,
not these files). Deletion was deferred; they are intentionally left
unmodified and still hard-code `127.0.0.1:8091` / `localhost:8091`.
`tests/shsProductionOrigin.test.mjs` asserts they stay unimported.

| File | Hard-coded origin |
|---|---|
| `src/foundation/adapters/oracle-case-action-adapter.js` | `127.0.0.1:8091` |
| `src/hooks/useOracle.js` | `localhost:8091` |
| `src/lib/projects/api.js` | `127.0.0.1:8091` |
| `src/foundation/pages/case-detail/day1-checkpoints/CaseDetail.day1_20260423_150532.jsx` | `127.0.0.1:8091` |
| `src/foundation/pages/case-detail/versions/CaseDetail.v2-command-shell.jsx` | `127.0.0.1:8091` |
| `src/foundation/pages/case-detail/versions/CaseDetail.v3-cross-case-strip.jsx` | `127.0.0.1:8091` |
