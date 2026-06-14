# Agent Governance & Agent Fabric Integration Audit V1

Date: 2026-06-14

## Summary

Agent Governance & Agent Fabric Integration Audit V1 is complete. The official active agent system is the existing Agent Fabric backend under `services/shf-agent-fabric`, with canonical agent definitions in `contracts/agents/agents.json`, admin control routes under `/admin/agents`, layer-control routes under `/admin/layers`, and hash-chained agent events in `db/agent_events.jsonl`.

No duplicate Agent Fabric or Agent Governance layer was created. No Truth Spine, Oracle, AI Guardrails, Game Theory, Watchtower, LOO, or Reports behavior was rebuilt.

Small integration fixes applied:

- Added a `Registry` sidebar link to the already-mounted `admin.html#/registry` admin surface.
- Updated the Registry page to pass `X-Admin-Role` and `X-Org-Id` from local storage when present, preserving backend RBAC instead of bypassing it.
- Added Master Layer Registry boundary wording that Agent Fabric/Governance is an AI/Swarm operating capability governed by AI/Swarm, Governance, and Layer Control, not a separate unregistered layer.

## Official Agent/Fabric System Identified

Official backend system:

- `services/shf-agent-fabric/main.py`
- `services/shf-agent-fabric/routers/admin_agents_routes.py`
- `services/shf-agent-fabric/routers/admin_layers_routes.py`
- `services/shf-agent-fabric/fabric/agent_canon.py`
- `services/shf-agent-fabric/fabric/agent_store.py`
- `services/shf-agent-fabric/fabric/agent_event_ledger.py`
- `services/shf-agent-fabric/contracts/agents/agents.json`
- `services/shf-agent-fabric/contracts/agents/agent_entity.schema.v1.json`

Official frontend/admin visibility:

- `admin.html#/registry`
- `src/pages/admin/Registry.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/router/AdminRoutes.jsx`

The Registry page is the current admin-facing agent visibility surface through its `Agents` tab. There is not currently a dedicated `admin.html#/admin/agents`, `admin.html#/agents`, or `admin.html#/agent-fabric` page.

## Files Inspected

- `services/shf-agent-fabric/main.py`
- `services/shf-agent-fabric/routers/admin_agents_routes.py`
- `services/shf-agent-fabric/routers/admin_layers_routes.py`
- `services/shf-agent-fabric/routers/watchtower_routes.py`
- `services/shf-agent-fabric/routers/reports_routes.py`
- `services/shf-agent-fabric/routers/loo_routes.py`
- `services/shf-agent-fabric/routers/truth_routes.py`
- `services/shf-agent-fabric/routers/oracle_routes.py`
- `services/shf-agent-fabric/routers/ai_guardrails_routes.py`
- `services/shf-agent-fabric/routers/game_theory_routes.py`
- `services/shf-agent-fabric/fabric/agent_canon.py`
- `services/shf-agent-fabric/fabric/agent_event_ledger.py`
- `services/shf-agent-fabric/fabric/admin_auth.py`
- `services/shf-agent-fabric/contracts/agents/agents.json`
- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/pages/admin/Registry.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/identity/identityRouting.js`
- `docs/MASTER_LAYER_REGISTRY.md`
- `docs/TRUTH_SPINE_GUARDRAILS.md`
- `docs/AI_SWARM_GUARDRAILS_V1.md`
- `docs/GAME_THEORY_LAYER_V1.md`
- `docs/ORACLE_LAYER_V1.md`

## Routes Found

Primary agent/fabric routes:

- `/admin/agents`
- `/admin/agents/verify`
- `/admin/agents/events`
- `/admin/agents/summary/health`
- `/admin/agents/summary/execution-readiness`
- `/admin/agents/{agent_id}`
- `/admin/agents/{agent_id}/dry-run`
- `/admin/agents/{agent_id}/page-context-dry-run`
- `/admin/agents/{agent_id}/enabled`
- `/admin/agents/{agent_id}/lifecycle`
- `/admin/agents/{agent_id}/attest`
- `/admin/layers`
- `/admin/layers/coverage`
- `/admin/layers/gate/status`
- `/admin/layers/registry`
- `/admin/layers/{layer}/enabled`

Connected governance-layer routes:

- `/truth/*`
- `/oracle/*`
- `/ai-guardrails/*`
- `/game-theory/*`
- `/watchtower/*`
- `/reports/*`
- `/loo/*`
- `/runs/*`
- `/arena/*`

## Routes Mounted

`services/shf-agent-fabric/main.py` mounts:

- `admin_agents_router`
- `admin_layers_router`
- `truth_router`
- `oracle_router`
- `ai_guardrails_router`
- `game_theory_router`
- `watchtower_router`
- `reports_router`
- `loo_router`
- `runs_router`
- `arena_router`

OpenAPI confirmed `/admin/agents` and `/admin/layers` route families are present with no duplicate mounted path entries.

## Sidebar/Admin UI Status

Admin route:

- `admin.html#/registry` is mounted to `Registry`.
- Registry includes `Apps`, `Agents`, and `Businesses` tabs.
- Registry now has a visible sidebar link under System.

Browser smoke confirmed:

- `admin.html#/registry` loads.
- Heading `Registry` is visible.
- `Agents` tab is visible and clickable.
- Sidebar `Registry` link is visible.
- No blank screen occurred.

No dedicated Agent Fabric admin page exists yet. The audit did not create one.

## Permission Status

Backend:

- `/admin/agents/*` is protected by `require_admin_key`.
- `/admin/layers/*` is protected by `require_admin_key`.
- Missing/invalid admin key returns `401`.
- `/admin/registry/*` requires `X-Admin-Key`, `X-Admin-Role`, and `X-Org-Id`.

Frontend:

- `admin.html#/registry` is protected by `ProtectedHubRoute`.
- `hubAccessControl.js` restricts `/registry` to `shs_admin`.
- `identityRouting.js` dev identity override is limited to Vite dev mode and localhost-style hosts.
- Registry now forwards role/org headers only when local storage contains them. It does not hardcode role, org, or key values.

## Registry Status

`docs/MASTER_LAYER_REGISTRY.md` includes the governing registered layers:

- Truth Spine
- Oracle Layer
- AI/Swarm Layer
- Game Theory Layer
- LOO
- Watchtower
- Governance Layer
- Reports
- Layer Control System

Patch applied:

- Added explicit Agent Fabric/Governance boundary wording under `AI/Swarm Layer`.

Boundary:

- Agents may propose, analyze, draft, summarize, simulate, and report.
- Agents may not verify claims.
- Agents may not public-approve data.
- Agents may not override Oracle rulings.
- Agents may not bypass AI Guardrails.
- Agents may not bypass permissions.
- Agents may not create new architecture layers without registry/proposal governance.

## Governance Layer Connections

Truth Spine:

- Agent records include policy notes that agents cannot approve, verify, publish, or modify official records.
- Some agents consume truth packages or trust envelopes as inputs.
- Agent outputs do not become verified claims without Truth Spine.

Oracle:

- `oracle_truth_agent` reads and explains Oracle truth packages.
- Agent recommendations remain separate from Oracle rulings.
- Agents do not replace `/oracle/*` route authority.

AI Guardrails:

- AI/Swarm Guardrails docs state agents may draft, summarize, inspect, and recommend but cannot publish verified/public/ruling/report/execution decisions.
- `ai_guardrails_service.py` records `agent_id` and enforces review requirements for sensitive output/action categories.

Game Theory:

- Game Theory remains a separate route/service family.
- Agents may consume strategy/scenario context but cannot approve facts or rulings.

Watchtower:

- `watchtower_agent` is registered in `contracts/agents/agents.json`.
- Watchtower route family is mounted and smoke-tested.
- Watchtower can observe risk and health signals, but agent health is currently exposed primarily through `/admin/agents/summary/*`.

Reports:

- `report_narrator_agent` is registered and uses verified outcomes, trust envelopes, audit traces, and readiness state as inputs.
- Reports route family is mounted and smoke-tested.
- Agents may draft report language, but human approval is required before export, publication, or funder submission.

LOO:

- LOO route family is mounted and smoke-tested.
- Agent decision/outcome scoring is not directly wired as a dedicated LOO agent endpoint in this audit; this remains a future integration candidate.

Master Layer Registry:

- Agent Fabric/Governance is now explicitly bounded as an AI/Swarm operating capability governed by AI/Swarm, Governance, and Layer Control.

## Audit/Trace Status

Agent trace/audit assets:

- `fabric/agent_event_ledger.py` writes hash-chained events to `db/agent_events.jsonl`.
- `fabric/agent_canon.py` appends events for upsert, delete, lifecycle, and attestation actions.
- `/admin/agents/verify` verifies the agent ledger.
- Backend smoke returned `ledger.pass=true` with 138 events.

Agent records include:

- `agent_id`
- `agentId`
- `name`
- `layer`
- `role`
- `visibility`
- `lifecycle`
- `version`
- `policy`
- `inputs`
- `outputs`
- `memoryScope`
- `eventLogging`
- `healthCheck`

## Duplicate/Legacy Findings

Reported only; no files were moved or deleted.

- `services/shf-agent-fabric/_LOCKED_AGENT_FABRIC_V1_20260514_183731/`
- `services/shf-agent-fabric/_backup_agents_registry_v1_20260514_180419/`
- `services/shf-agent-fabric/_backup_agent_dry_run_v1_20260514_183022/`
- `services/shf-agent-fabric/_backup_agent_execution_readiness_20260514_182334/`
- `services/shf-agent-fabric/_backup_page_context_dry_run_20260514_183431/`
- `services/shf-agent-fabric/_backup_force_agent_health_route_20260514_182019/`
- `services/shf-agent-fabric/_backup_admin_agents_health_summary_20260514_181031/`
- `services/shf-agent-fabric/_backup_admin_agents_routes_clean_20260514_175018/`
- Several `fabric/agent_store.py.bak.*` files.

These look historical/backup/locked rather than mounted active routers. Active mounted router is `services/shf-agent-fabric/routers/admin_agents_routes.py`.

## Browser Smoke Results

`127.0.0.1:5173` was occupied by another Node process, so this repo was smoke-tested on `127.0.0.1:5174`.

| Route | Result |
| --- | --- |
| `admin.html#/registry` | Pass: heading `Registry`, Agents tab visible, sidebar Registry link visible |
| `admin.html#/admin/agents` | Falls back to Hub; no dedicated page exposed |
| `admin.html#/agents` | Falls back to Hub; no dedicated page exposed |
| `admin.html#/agent-fabric` | Falls back to Hub; no dedicated page exposed |

Non-blocking local dev note: `/api/auth/me` returns `404` before local dev identity fallback.

## Backend Smoke Results

Agent Fabric was started with `ADMIN_API_KEY=codex-audit-key`.

| Endpoint | Status | Result |
| --- | --- | --- |
| `/admin/agents` without key | 401 | Pass |
| `/admin/agents` with key | 200 | Pass, 11 agents |
| `/admin/agents/verify` | 200 | Pass, ledger verified |
| `/admin/agents/summary/health` | 200 | Pass, 11 ready / 0 warning |
| `/admin/agents/summary/execution-readiness` | 200 | Pass, 7 auto-ready / 4 approval-required / 0 blocked |
| `/admin/layers` | 200 | Pass, 32 layers |
| `/admin/layers/gate/status` | 200 | Responds, gate currently reports not-enforced-ready blockers |
| `/admin/registry` with key/role/org | 200 | Pass |
| `/truth/health` | 200 | Pass |
| `/oracle/health` | 200 | Pass |
| `/ai-guardrails/health` | 200 | Pass |
| `/game-theory/health` | 200 | Pass |
| `/watchtower/summary` | 200 | Pass |
| `/reports/snapshot` | 200 | Pass |
| `/loo/health` | 200 | Pass |

## Fixes Applied

- `docs/MASTER_LAYER_REGISTRY.md`: added Agent Fabric/Governance boundary wording under AI/Swarm Layer.
- `src/components/admin/AdminSidebar.jsx`: added sidebar link to existing `/registry` admin route.
- `src/pages/admin/Registry.jsx`: added optional local-storage based forwarding for `X-Admin-Role` and `X-Org-Id`.

## Files Changed

- `docs/MASTER_LAYER_REGISTRY.md`
- `docs/AGENT_GOVERNANCE_FABRIC_AUDIT_V1.md`
- `docs/AGENT_GOVERNANCE_FABRIC_AUDIT_V1.json`
- `src/components/admin/AdminSidebar.jsx`
- `src/pages/admin/Registry.jsx`

## Validation Results

| Command | Result |
| --- | --- |
| `python3 -m json.tool docs/AGENT_GOVERNANCE_FABRIC_AUDIT_V1.json` | Pass |
| `python3 scripts/check_master_layer_registry.py` | Pass |
| `python3 scripts/check_truth_spine_freeze.py` | Pass |
| `python3 scripts/check_oracle_layer.py` | Pass |
| `python3 scripts/check_ai_guardrails_layer.py` | Pass |
| `python3 scripts/check_game_theory_layer.py` | Pass |
| `npm run check:governance` | Pass |
| `python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py services/shf-agent-fabric/tests/test_agent_canon_basics.py` | Pass, 25 passed |
| `npm run build` | Pass, with existing large-chunk warning |

## Remaining Risks

- There is no dedicated Agent Fabric admin page; current admin visibility is through the general Registry page and backend `/admin/agents` APIs.
- `/admin/layers/gate/status` responds but reports not-enforced-ready blockers for later layers. This was not changed because it is an operational readiness signal, not a route integration failure.
- Backup/locked agent files remain in the repo. They are reported as legacy/duplicate candidates but were not moved or deleted.
- Local dev `/api/auth/me` still emits a non-blocking `404` before seeded identity fallback.

## V1 Completion Decision

Agent Governance & Agent Fabric Integration Audit V1 is complete. The official agent system is identified, protected backend routes are mounted and smoke-tested, frontend visibility is restored through the existing Registry surface, registry boundaries are documented, duplicate/legacy files are reported, and governance connections are documented.
