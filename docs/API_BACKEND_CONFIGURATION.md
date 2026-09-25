# Frontend API backend configuration

The frontend talks to two separate backends. Each has one canonical base
resolver; do not route one backend's traffic through the other's config.

| Backend | Local port | Canonical resolver | Resolution order |
|---|---|---|---|
| SHS API (`apps/shs-api`) | **8091** | `src/system/identity/authConfig.js` (`SHS_AUTH_API_BASE`) | `window.__SHS_API_BASE__` → `VITE_SHS_API_BASE` → `"/api"` |
| Agent Fabric (`services/shf-agent-fabric`) | **8090** | `src/system/fabric/fabricConfig.js` (`FABRIC_API_BASE`) | `VITE_FABRIC_API_BASE` → `VITE_FABRIC_URL` (legacy) → `VITE_FABRIC_BASE_URL` (legacy) → `http://127.0.0.1:8090` |

- In local development `"/api"` is the same-origin Vite proxy to
  `http://127.0.0.1:8091` (`vite.config.js`; `/api` prefix stripped).
- The shared client `src/lib/apiClient.js` serves the SHS API: an explicit
  `VITE_API_BASE` override, else `SHS_AUTH_API_BASE`.
- Port evidence for the Fabric: `main.py` defaults `PORT` to 8090 and
  `bin/restart_8090.sh` (used by `ci.sh` / `preflight.sh`) starts it there; all
  Fabric CLIs, smoke scripts and `docs/TRUTH_SPINE_SECURITY.md` use 8090. Port
  8000 is only uvicorn's CLI default and the pre-2026-05-14 Vite proxy target.
- `VITE_API_BASE` is read by several clients for different backends (SHS API,
  Civic); it must not be used to locate the Fabric.

## Fabric clients on the canonical resolver

`src/lib/capital/operatorApi.js`, `src/lib/operatorApi.js`,
`src/lib/operatorDataApi.js`, `src/components/operator/IssuancesPanel.jsx`,
`src/pages/exchange/commandCenterAdapter.js`,
`src/pages/admin/ReportsDashboard.jsx`, `src/pages/admin/AlignmentSwitchboard.jsx`,
and `src/apps/manifest/registry_admin_api.js` (which uses only the explicit
override, `FABRIC_API_BASE_OVERRIDE`, to keep its same-origin relative default).

## Known follow-ups (not addressed here)

- **Growth Market routing** — `src/shared/api/growthMarket.js` defaults to
  relative `/api/growth/*`, which the Vite proxy sends to the SHS API; the
  routes live in the Fabric (`app/api/routes/growth.py`). It keeps its own
  resolver until this is decided.
- **Relative `/api` admin pages** — Truth Spine (`/api/truth`), Game Theory
  (`/api/game-theory`) and AI Guardrails (`/api/ai-guardrails`) are Fabric-only
  routes but are called through the SHS proxy; see
  `services/shf-agent-fabric/docs/TRUTH_SPINE_SECURITY.md`.
- **Oracle ambiguity** — `/oracle` routes exist in both the SHS API and the
  Fabric; the admin Oracle page's intended backend needs a decision.
- **Registry admin `/admin/*`** — `registry_admin_api.js` expects a same-origin
  proxy to the Fabric that `vite.config.js` does not define.
- **Fabric proxy design** — a dedicated Vite proxy prefix for the Fabric (vs
  absolute URLs + CORS) would resolve the items above consistently.
- **Production** — no deployment config in the repo defines either backend's
  production origin; set `VITE_SHS_API_BASE` / `VITE_FABRIC_API_BASE` (and the
  Fabric's `AUTH_ALLOWED_ORIGINS`) per environment.
