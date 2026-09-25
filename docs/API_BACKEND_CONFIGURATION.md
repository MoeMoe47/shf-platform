# Frontend API backend configuration

The frontend talks to two separate backends. Each has one canonical base
resolver and its own same-origin dev proxy prefix; never route one backend's
traffic through the other's.

| Backend | Local port | Dev proxy prefix | Canonical resolver | Resolution order |
|---|---|---|---|---|
| SHS API (`apps/shs-api`) | **8091** | `/api` → `:8091` (prefix stripped) | `src/system/identity/authConfig.js` (`SHS_AUTH_API_BASE`) | `window.__SHS_API_BASE__` → `VITE_SHS_API_BASE` → `"/api"` |
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
  `VITE_API_BASE` override, else `SHS_AUTH_API_BASE`).
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
- **Production:** no deployment config in the repo defines either backend's
  origin. Production must either route `/api` and `/fabric-api` at the host or
  set `VITE_SHS_API_BASE` / `VITE_FABRIC_API_BASE` (and the Fabric's
  `AUTH_ALLOWED_ORIGINS` for any cross-origin use).
