# Command Center / Dashboard Route Establishment V1

Date: 2026-06-14

Status: V1 route establishment complete with documented visibility gaps. No Watchtower or LOO cards were rebuilt or duplicated.

## Purpose

This pass audits existing Command Center, Dashboard, Watchtower, LOO / Lord of Outcomes, Reports, and governance visibility surfaces, then establishes missing admin routes/navigation by pointing to existing pages only.

## Cards Found

| Card / Signal | Existing Location | Visibility Finding |
| --- | --- | --- |
| Watchtower card in Command Center | Not found in active Command Center pages | Missing as a literal card. The existing SHF Impact Command Center shows risk/report/proof signals, but not a card labeled Watchtower. |
| LOO card in Command Center | Not found in active Command Center pages | Missing as a literal card. Lord of Outcomes exists as a separate app/surface. |
| Watchtower card in Dashboard | Not found in active Dashboard pages | Missing as a literal card. |
| LOO card in Dashboard | Not found in active Dashboard pages | Missing as a literal card. |
| Reports / trust card in Command Center | `src/pages/shf-command/sections/ReportsBriefingsPanel.jsx`, `src/pages/shf-command/sections/TrustVerificationPanel.jsx` | Present. Command Center already has Reports & Briefings and Trust / Verification surfaces. |
| Reports card in Dashboard | `src/pages/exchange/workspace-dashboard/components/ReportsPanel.jsx`, dashboard KPI/right-stack report surfaces | Present. Dashboard already has Reports-ready and workspace report surfaces. |
| Governance / layer gate card | `src/pages/admin/agent-fabric/AgentFabricPage.jsx` | Present in Agent Fabric, including Watchtower, Reports, LOO required-layer labels and Layer Gate status. |

## Routes Found

| Surface | Existing Route Before Patch | Notes |
| --- | --- | --- |
| SHF Impact Command Center | `foundation.html#/impact`, `index.html#/shf-command` | Existing page: `src/pages/shf-command/SHFImpactCommandCenter.jsx`. |
| Exchange Command Center | exchange nested route `exchange/command` | Existing route renders `SHSUnifiedTruthShell`; not mounted in `admin.html`. |
| Workspace Dashboard | exchange nested route `exchange/dashboard` | Existing route renders `WorkspaceDashboard` / `SHSWorkspaceDashboard`; not mounted in `admin.html`. |
| Reports | `admin.html#/reporting`, `admin.html#/hub/reports` | Existing admin reporting surfaces were mounted. |
| Lord of Outcomes | `lord-of-outcomes.html#/` and child routes | Existing app route was not mounted in `admin.html`. |
| Watchtower | Backend `/watchtower/*`; admin visibility through Agent Fabric | No dedicated admin Watchtower page found. |
| Agent Fabric / governance | `admin.html#/agent-fabric` | Existing admin governance surface with Watchtower/Reports/LOO required-layer visibility. |

## Routes Added

| Route | Maps To | Permission Posture |
| --- | --- | --- |
| `admin.html#/command` | Existing `SHFImpactCommandCenter` | SHS admin only, plus `audit.view`. |
| `admin.html#/command-center` | Existing `SHFImpactCommandCenter` | SHS admin only, plus `audit.view`. |
| `admin.html#/dashboard` | Existing `WorkspaceDashboard` | SHS admin only, plus `audit.view`. |
| `admin.html#/reports` | Existing `ReportingCommandSurface` | Client admin / SHS admin route gate, plus `reports.view`. |
| `admin.html#/loo` | Redirects to `admin.html#/lord-outcomes` | Auth-gated; final surface is SHS admin only, plus `audit.view`. |
| `admin.html#/lord-outcomes/*` | Existing `LordOutcomesRoutes` | SHS admin only, plus `audit.view`. |
| `admin.html#/watchtower` | Redirects to `admin.html#/agent-fabric` | Auth-gated; final surface is SHS admin only, plus `audit.view`. |

## Sidebar Links Added

Added under Admin sidebar Operations:

- Command Center -> `#/command`
- Dashboard -> `#/dashboard`
- Reports -> `#/reports`

The existing Lord of Outcomes sidebar link now resolves because `#/lord-outcomes/*` is mounted. A Watchtower sidebar link was not added because no dedicated Watchtower page exists; `#/watchtower` redirects to Agent Fabric governance visibility instead.

## Permission Status

- Command Center and Dashboard admin routes are SHS-admin only through `hubAccessControl.js` and protected by `audit.view`.
- Reports alias uses the same reporting permission posture as `#/reporting`.
- Lord of Outcomes is SHS-admin only in the admin shell.
- Watchtower is not exposed as a public page; the admin alias redirects to Agent Fabric.
- Existing public/non-admin Lord of Outcomes app remains separate at `lord-of-outcomes.html`.

## Browser Smoke Results

| Route | Result | Heading | Notes |
| --- | --- | --- | --- |
| `admin.html#/command` | PASS | SHF Impact Command Center | Nonblank; Reports/risk/governance text visible; no literal Watchtower card. |
| `admin.html#/command-center` | PASS | SHF Impact Command Center | Alias works. |
| `admin.html#/dashboard` | PASS | Silicon Heartland Solutions | Nonblank Workspace Dashboard; Reports sidebar/link visible. |
| `admin.html#/reports` | PASS with existing API console noise | Reporting Command Surface | Alias works; trust/report/risk text visible. |
| `admin.html#/reporting` | PASS with existing API console noise | Reporting Command Surface | Existing route still works. |
| `admin.html#/loo` | PASS | Lord of Outcomes | Redirects to `#/lord-outcomes`. |
| `admin.html#/lord-outcomes` | PASS | Lord of Outcomes | Existing LOO surface renders in admin shell. |
| `admin.html#/watchtower` | PASS | Agent Fabric | Redirects to `#/agent-fabric`; Watchtower text visible through existing governance surface. |

Browser console note: isolated route smoke still reports pre-existing local-dev API errors, including missing `/auth/me`, reporting/Oracle 404s, and Command Center Agent Fabric calls targeting `127.0.0.1:8090` when this smoke backend was on `8091`. These were not introduced by the route patch and were not broadened into this route-only pass.

## Backend Smoke Results

| Endpoint | Result |
| --- | --- |
| `GET /watchtower/summary` | PASS, 200. Payload includes Watchtower coverage/risk plus Truth, Oracle, AI Guardrails, and Game Theory summaries. |
| `POST /loo/score` | PASS, 200. Payload includes score, decision, metrics, derived data, and Truth Spine trust metadata. |
| `GET /reports/snapshot` | PASS, 200. Payload includes Truth, Oracle, AI Guardrails, and Game Theory report metadata. |

## Validation

| Command | Result |
| --- | --- |
| `python3 -m json.tool docs/COMMAND_DASHBOARD_ROUTE_ESTABLISHMENT_V1.json` | PASS |
| `npm run check:governance` | PASS |
| `python3 scripts/check_master_layer_registry.py` | PASS |
| `python3 scripts/check_truth_spine_freeze.py` | PASS |
| `python3 scripts/check_oracle_layer.py` | PASS |
| `python3 scripts/check_ai_guardrails_layer.py` | PASS |
| `python3 scripts/check_game_theory_layer.py` | PASS |
| `python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py services/shf-agent-fabric/tests/test_agent_canon_basics.py` | PASS, 25 passed |
| `npm run build` | PASS with existing large chunk warning |

## Files Changed

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `docs/COMMAND_DASHBOARD_ROUTE_ESTABLISHMENT_V1.md`
- `docs/COMMAND_DASHBOARD_ROUTE_ESTABLISHMENT_V1.json`

## Remaining Gaps

- No literal Watchtower card exists in the audited Command Center or Dashboard.
- No literal LOO card exists in the audited Command Center or Dashboard.
- No dedicated Watchtower admin page exists; `#/watchtower` intentionally redirects to Agent Fabric.
- Existing local-dev console errors remain for unrelated API/backend expectations.

## V1 Complete

Yes for route establishment: existing command/dashboard/report/LOO surfaces are reachable from `admin.html`, broken fallback routes are repaired, and no duplicate cards were created.

Not complete for new card visibility: Watchtower and LOO cards remain missing in Command Center/Dashboard because the mission explicitly prohibited rebuilding or duplicating cards in this pass.
