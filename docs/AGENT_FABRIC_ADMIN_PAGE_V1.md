# Agent Fabric Admin Page V1

Date: 2026-06-14

## Summary

Agent Fabric Admin Page V1 adds a dedicated admin-only control surface for the existing SHS Agent Fabric / Agent Governance system.

This does not create a new Agent Fabric layer, does not create a new Agent Governance layer, and does not change backend agent behavior. The page reads existing protected Agent Fabric APIs and keeps the Registry Agents tab intact as secondary visibility.

## Route

- Route: `admin.html#/agent-fabric`
- Page: `src/pages/admin/agent-fabric/AgentFabricPage.jsx`
- Stylesheet: `src/pages/admin/agent-fabric/agent-fabric.css`

## API Dependencies

The page uses existing endpoints only:

- `GET /admin/agents`
- `GET /admin/agents/verify`
- `GET /admin/agents/summary/health`
- `GET /admin/layers/gate/status`

These are reached through the frontend `/api` proxy during local Vite runs.

## Admin-Only Status

Frontend access:

- `src/router/AdminRoutes.jsx` mounts `/agent-fabric`.
- `src/system/identity/hubAccessControl.js` restricts `/agent-fabric` to `shs_admin`.
- `PermissionGuard` uses `SHS_SECURITY_PERMISSIONS.AUDIT_VIEW`.

Backend access:

- `/admin/agents/*` and `/admin/layers/*` require `X-Admin-Key`.
- The page reads `ADMIN_API_KEY` or `shf_admin_key` from local storage.
- The page also forwards `X-Admin-Role` and `X-Org-Id` when present, matching the Registry page pattern.
- No secrets are hardcoded.

## What V1 Does

- Shows Agent Fabric title, admin-only subtitle, and governance status badges.
- Shows summary cards for total, ready, warning, blocked, verification, and ledger status.
- Shows canonical registered agents from `/admin/agents`.
- Shows a selectable agent detail panel.
- Shows allowed tasks, disallowed tasks, required governance layers, and audit metadata.
- Shows governance boundary rules.
- Shows layer gate status from `/admin/layers/gate/status`.
- Shows audit trace storage note for `db/agent_events.jsonl`.
- Shows registry linkage to `contracts/agents/agents.json`, `/admin/agents`, `/admin/layers`, and Registry Agents tab.
- Handles unavailable backend or missing admin key gracefully.

## What V1 Does Not Do

- Does not execute agents.
- Does not add a backend endpoint.
- Does not expose the full audit log stream.
- Does not change agent registry data.
- Does not verify claims.
- Does not public-approve data.
- Does not override Oracle rulings.
- Does not bypass AI Guardrails or permissions.
- Does not create a new architecture layer.

## Governance Boundaries

- Agents can propose, analyze, execute assigned tasks, and report.
- Agents cannot verify claims.
- Agents cannot public-approve data.
- Agents cannot override Oracle rulings.
- Agents cannot bypass AI Guardrails.
- Agents cannot bypass permissions.
- Agents cannot create new architecture layers without Master Layer Registry / proposal governance.

Required layer context shown on the page:

- Truth Spine
- Oracle
- AI Guardrails
- Game Theory
- Watchtower
- Reports
- LOO

## Smoke Results

Backend smoke with `ADMIN_API_KEY=codex-audit-key`:

| Check | Result |
| --- | --- |
| `/admin/agents` without key | 401, expected block |
| `/admin/agents` with key | 200, 11 agents |
| `/admin/agents/verify` | 200, ledger verified |
| `/admin/agents/summary/health` | 200, 11 ready / 0 warning |
| `/admin/layers/gate/status` | 200, `gate_pass=false` with known later-layer readiness blockers |

Frontend smoke on `http://127.0.0.1:5174/admin.html#/agent-fabric`:

| Check | Result |
| --- | --- |
| Heading `Agent Fabric` visible | Pass |
| Sidebar link visible | Pass |
| Agents table visible with admin key | Pass |
| Governance boundary panel visible | Pass |
| Missing admin key warning visible | Pass |
| Blank screen | No |

Non-blocking local dev note: `/api/auth/me` returns `404` before the existing local identity fallback.

## Remaining Risks

- Full agent event log streaming is not exposed in V1; the page documents `db/agent_events.jsonl` instead.
- `gate_pass=false` may remain until later layer readiness blockers are resolved.
- Local smoke requires a valid `ADMIN_API_KEY` in local storage.

## V1 Status

## Validation Results

| Command | Result |
| --- | --- |
| `python3 -m json.tool docs/AGENT_FABRIC_ADMIN_PAGE_V1.json` | Pass |
| `python3 scripts/check_master_layer_registry.py` | Pass |
| `python3 scripts/check_truth_spine_freeze.py` | Pass |
| `python3 scripts/check_oracle_layer.py` | Pass |
| `python3 scripts/check_ai_guardrails_layer.py` | Pass |
| `python3 scripts/check_game_theory_layer.py` | Pass |
| `npm run check:governance` | Pass |
| `python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py services/shf-agent-fabric/tests/test_agent_canon_basics.py` | Pass, 25 passed |
| `npm run build` | Pass, with existing large-chunk warning |

## V1 Status

Agent Fabric Admin Page V1 is complete.
