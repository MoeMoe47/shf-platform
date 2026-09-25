# Routing authority cleanup V3 — production Fabric origin normalization

Status: 2026-09-25, branch `fix/fabric-production-origin-v3` (from
`project-1-canonical-city-foundation` @ `8a12d72`). Companion to
`docs/API_BACKEND_CONFIGURATION.md`.

Live frontend clients that hard-coded the Agent Fabric's local origin
(`http://127.0.0.1:8090` / `http://localhost:8090`) now resolve through the
canonical Fabric configuration, `src/system/fabric/fabricConfig.js`
(`FABRIC_API_BASE` / `fabricUrl()` → same-origin `/fabric-api` in development,
the configured origin in production). A hard-coded localhost origin in a
deployed build points at the visitor's own machine, bypasses
`VITE_FABRIC_API_BASE` and the `/fabric-api` proxy, and makes cross-origin
calls subject to the Fabric's CORS allow-list.

## Migrated live clients

| Client | Endpoint(s) | Fabric route (verified) | Now |
|---|---|---|---|
| `src/pages/shf-command/SHFImpactCommandCenter.jsx` | `GET /self-audit/latest`, `GET /self-audit/latest/brief`, `POST /self-audit/run` | `app/api/routes/self_audit.py` (`/self-audit`) | `FABRIC_API_BASE` + path |
| same | `POST /simulate-outcome` | `routers/run_routes.py` | `fabricUrl("/simulate-outcome")` |
| same | `POST /events` | **none** (see below) | request disabled |
| `src/pages/shf-command/sections/AgentSyncStatus.jsx` | `POST /admin/agents/ai_analyst_agent/page-context-dry-run` | `routers/admin_agents_routes.py` | `FABRIC_API_BASE` + path |
| `src/pages/admin/reporting/reporting-actions.ts` | `/runs/report/{runId}/pdf` | `routers/run_report_routes.py` | `FABRIC_API_BASE` + path |
| `src/pages/iep-command-v2/CountyInteractionLayer.jsx` | `POST /run` | `routers/run_routes.py` | `fabricUrl("/run")` |
| `src/pages/metaverse/BFETestPage.jsx` | `GET /bfe/summary` | `routers/bfe_routes.py` (`/bfe`) | `fabricUrl("/bfe/summary")` |
| `src/pages/metaverse/components/BFEStatusCard.jsx` | `GET /bfe/summary` | same | `fabricUrl("/bfe/summary")` |

Methods, payloads, headers and response handling are unchanged; only the base
URL moved to the canonical resolver.

### Reachability in the production build

| Request path | Reachable in `vite build` output | Why |
|---|---|---|
| SHF `/self-audit/*` | yes (`foundation.html#/impact`, `admin.html#/command`, `#/command-center`) | rendered on load |
| Reporting `/runs/report/{runId}/pdf` | yes (`admin.html#/reporting`) | opened by briefing / audit-pack exports once workflow readiness passes |
| IEP v2 `POST /run` | yes (`capital.html#/iep-command-v2`) | county drawer → "Run Simulation" |
| BFE test page `/bfe/summary` | yes (`arcade.html#/metaverse/bfe-test`) | polled on load |
| SHF `POST /simulate-outcome` | compiled out | the full dashboard branch sits behind `REPORTING_DATA_AVAILABLE = false` (`SHFImpactCommandCenter.jsx`) |
| `AgentSyncStatus` `POST .../page-context-dry-run` | compiled out | rendered only inside that same gated branch |
| `BFEStatusCard` `/bfe/summary` | not bundled | only importer `InterplanetaryMission.jsx` has no importers |

The gated and orphaned paths were migrated anyway so they are correct if the
gate is lifted or the page is re-routed; they were verified by mounting the
components directly on the dev server (requests go to `/fabric-api/...`).

## `VITE_SHF_AGENT_FABRIC_BASE` — retired (option B)

Its only live consumer (`AgentSyncStatus.jsx`) now uses `FABRIC_API_BASE`, so
there is no fourth independent Fabric configuration path. It was never in
`.env.example`; local `.env` files that still set it are now ignored — use
`VITE_FABRIC_API_BASE`. The dead `aiAnalystContextAdapter.js` still names it
(unused).

## SHF Command Center `POST /events` — OWNERLESS EVENT WRITE — BACKEND CONTRACT REQUIRED

`onAiActionClick` posted `{ event: { entity_id, action, source: "command_center" } }`
to the Fabric's bare `/events`. That endpoint has never existed: since the
Fabric router was added (2026-01-20) `routers/events_routes.py` has served only
`POST /events/ingest` (normalizes and **persists** to the run ledger
`db/runs.jsonl`; strict mode requires `context.run_id`) and `POST
/events/normalize` (side-effect free). The call was added on 2026-05-14 and has
always failed.

Neither endpoint is a confirmed contract for command-center Oracle actions:
`normalize` would silently drop the write, and `ingest` would start persisting
a new event class (no canonical `actor_type`/`context`, non-schema
`entity_id`) into the run ledger — fabricated semantics. The request is
therefore disabled, not re-pointed. The action itself is still recorded by the
preceding SHS API `POST /oracle/action` call. Side benefit: when the Fabric was
unreachable the awaited fetch threw and skipped the Oracle bundle refresh; it no
longer does. A backend owner must define the event contract before this write
is restored.

## Dead files (not modified)

| File | Pattern | Classification |
|---|---|---|
| `src/pages/admin/reporting/reporting-backend-adapter.ts` | `API_BASE = "http://127.0.0.1:8090"` | DEAD — KEEP FOR NOW (no importers; listed in repo audit inventories) |
| `src/pages/iep-command-v2/FloatingFranklinNode.jsx` | `fetch("http://localhost:8090/run")` | DEAD — KEEP FOR NOW |
| `src/pages/shf-command/agents/aiAnalystContextAdapter.js` | `VITE_SHF_AGENT_FABRIC_BASE \|\| "http://127.0.0.1:8090"` | DEAD — KEEP FOR NOW |

A test asserts they stay unimported; migrate them to `fabricConfig.js` before
reviving any of them.

## Backup / non-compiled copies (not modified, never bundled)

`src/pages/iep-command-v2/IEPCommandCenterV2.jsx.fix*` (4) and
`src/pages/shf-command/SHFImpactCommandCenter.jsx.{bak_*,pre_*,rescue_*}` (6).

## Remaining production-origin gaps (updated after SHS normalization)

- The SHS API hard-codes noted here at V3 time (`ORACLE_BASE =
  "http://127.0.0.1:8091"` in `SHFImpactCommandCenter.jsx` and other SHS
  clients) were migrated to the canonical SHS base by the SHS production-origin
  normalization; see `docs/API_BACKEND_CONFIGURATION.md`.
- Deployment config does exist (`infra/azure`): the SHS API has an external
  origin, but the Agent Fabric is **internal-only** and no frontend route for
  `/fabric-api` is defined, so Fabric-backed pages have no production path yet
  (see "Production origins" in `docs/API_BACKEND_CONFIGURATION.md`).
- The Fabric's `routers/run_report_routes.py` returns absolute
  `http://127.0.0.1:8090/...` links in its responses (backend; no frontend
  consumer today).
