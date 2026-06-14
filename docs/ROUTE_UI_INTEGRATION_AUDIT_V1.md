# Route/UI Integration Audit V1

Date: 2026-06-14

## Summary

Route/UI Integration Audit V1 is complete. The four governance admin pages are mounted, protected, reachable, and visible from the admin sidebar after applying one narrow integration fix: `admin.main.jsx` now wraps `AdminRoutes` with the existing `AdminLayout`, which is the shell that renders `AdminSidebar`.

No Truth Spine, Oracle, AI Guardrails, Game Theory, backend service, archive, or governance-layer behavior was rebuilt.

## Files Inspected

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/layouts/AdminLayout.jsx`
- `src/entries/admin.main.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/identity/identityRouting.js`
- `src/entries/index.main.jsx`
- `src/pages/admin/truth-spine/TruthSpinePage.jsx`
- `src/pages/admin/oracle/OraclePage.jsx`
- `src/pages/admin/ai-guardrails/AIGuardrailsPage.jsx`
- `src/pages/admin/game-theory/GameTheoryPage.jsx`
- `src/pages/admin/ops/*`
- `src/pages/admin/BuilderHub.jsx`
- `src/pages/public/WebMakerPage.jsx`
- `services/shf-agent-fabric/main.py`
- `services/shf-agent-fabric/routers/truth_routes.py`
- `services/shf-agent-fabric/routers/oracle_routes.py`
- `services/shf-agent-fabric/routers/ai_guardrails_routes.py`
- `services/shf-agent-fabric/routers/game_theory_routes.py`
- `services/shf-agent-fabric/routers/reports_routes.py`
- `services/shf-agent-fabric/routers/watchtower_routes.py`

## Routes Verified

Required governance routes:

| Route | Component | Permission wrapper | Result |
| --- | --- | --- | --- |
| `admin.html#/truth-spine` | `TruthSpinePage` | `TRUTH_VIEW` + `shs_admin` route access | Pass |
| `admin.html#/oracle` | `OraclePage` | `TRUTH_VIEW` + `shs_admin` route access | Pass |
| `admin.html#/ai-guardrails` | `AIGuardrailsPage` | `TRUTH_VIEW` + `shs_admin` route access | Pass |
| `admin.html#/game-theory` | `GameTheoryPage` | `TRUTH_VIEW` + `shs_admin` route access | Pass |

Ops admin routes are mounted and reachable:

- `/ops/production`
- `/ops/projects`
- `/ops/brand-profile`
- `/ops/page-intent`
- `/ops/layout-blueprint`
- `/ops/visual-treatment`
- `/ops/assets`
- `/ops/data-binding`
- `/ops/mock-review`
- `/ops/build-packet`
- `/ops/screenshot-qa`
- `/ops/learning`

## Sidebar Links Verified

`AdminSidebar` includes exact discoverable links for:

- `Truth Spine` -> `/truth-spine`
- `Oracle` -> `/oracle`
- `AI Guardrails` -> `/ai-guardrails`
- `Game Theory` -> `/game-theory`
- All 12 routed Production Ops pages

Issue found: `AdminSidebar` existed but was not mounted by the active admin entrypoint. Fix applied: wrap `AdminRoutes` in the existing `AdminLayout` from `src/entries/admin.main.jsx`.

## Permissions Verified

`hubAccessControl.js` restricts all required governance routes to `shs_admin`:

- `/truth-spine`
- `/oracle`
- `/ai-guardrails`
- `/game-theory`

All 12 `/ops/*` routes are also `shs_admin` only. `identityRouting.js` keeps local development identity seeding limited to Vite dev mode and localhost-style hosts.

The four governance pages additionally use `PermissionGuard` with `SHS_SECURITY_PERMISSIONS.TRUTH_VIEW`. Oracle, AI Guardrails, and Game Theory intentionally share the truth/governance permission gate in the current implementation.

## Page Boundary Notes

- Truth Spine page states that Truth Spine verifies what is true and Reports communicate verified/readiness-approved information.
- Oracle page states that Oracle decides what verified Truth Spine evidence supports and cannot verify, public-approve, or publish claims.
- AI Guardrails page states that AI may draft/summarize/inspect/recommend, while verified/public/ruling/report/execution decisions require the proper infrastructure layers.
- Game Theory page states that predictions are strategic analysis, not verified facts, and that Game Theory does not verify, public-approve, rank, rule, execute, or publish.

## BuilderHub/WebMaker Boundary

- Public `/studio/templates` in `src/entries/index.main.jsx` renders `WebMakerPage`.
- Admin `admin.html#/builder`, `admin.html#/web-maker`, and `admin.html#/studio/templates` render `BuilderHub` behind admin route protection.
- `BuilderHub` remains the admin/internal control surface.
- `WebMakerPage` remains the public/user-facing builder page.
- `src/pages/admin/web-maker.css` remains the shared current stylesheet for now.

## Browser Smoke Results

`127.0.0.1:5173` was occupied by an existing Node process serving a different/stale app, so this repo's Vite server was started on `127.0.0.1:5174` for accurate smoke testing.

After seeding local SHS admin identity, the following passed:

| URL | Heading found | Blank screen | Sidebar visible | Result |
| --- | --- | --- | --- | --- |
| `http://127.0.0.1:5174/admin.html#/truth-spine` | `SHS Truth Spine V1` | No | Yes | Pass |
| `http://127.0.0.1:5174/admin.html#/oracle` | `Oracle Layer V1` | No | Yes | Pass |
| `http://127.0.0.1:5174/admin.html#/ai-guardrails` | `AI Guardrails V1` | No | Yes | Pass |
| `http://127.0.0.1:5174/admin.html#/game-theory` | `Game Theory Layer V1` | No | Yes | Pass |

All 12 ops routes loaded with a visible heading and no blank screen.

Observed non-blocking console/resource note: local `/api/auth/me` returns `404` during dev smoke and the app falls back to the seeded local SHS admin identity. This is existing auth behavior, not a route/UI integration failure.

## Backend Smoke Results

Agent Fabric was started on `127.0.0.1:8091`.

| Endpoint | Status | Result |
| --- | --- | --- |
| `/truth/health` | 200 | Pass |
| `/oracle/health` | 200 | Pass |
| `/ai-guardrails/health` | 200 | Pass |
| `/game-theory/health` | 200 | Pass |
| `/reports/snapshot` | 200 | Pass |
| `/watchtower/summary` | 200 | Pass |

## Validation Results

| Command | Result |
| --- | --- |
| `npm run check:governance` | Pass |
| `python3 scripts/check_master_layer_registry.py` | Pass |
| `python3 scripts/check_truth_spine_freeze.py` | Pass |
| `python3 scripts/check_oracle_layer.py` | Pass |
| `python3 scripts/check_ai_guardrails_layer.py` | Pass |
| `python3 scripts/check_game_theory_layer.py` | Pass |
| `python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py` | Pass, 23 passed |
| `npm run build` | Pass, with existing large-chunk warning |

## Issues Found

1. `AdminLayout` was not mounted in `src/entries/admin.main.jsx`, so `AdminSidebar` links were not visible even though the sidebar file contained the correct links.
2. Port `5173` was occupied by another Node process serving a different/stale app during the audit.
3. Local dev `/api/auth/me` returned `404`, then the app used the local seeded identity fallback.

## Fixes Applied

- Mounted the existing `AdminLayout` around `AdminRoutes` in `src/entries/admin.main.jsx`.

## Files Changed

- `src/entries/admin.main.jsx`
- `docs/ROUTE_UI_INTEGRATION_AUDIT_V1.md`
- `docs/ROUTE_UI_INTEGRATION_AUDIT_V1.json`

## Remaining Risks

- Sidebar contains legacy/out-of-scope links such as `/admin`, `/admin/users`, `/admin/settings`, `/analytics`, `/lord-outcomes`, `/dev/docs`, and `/health` that were not part of this V1 audit.
- The dev auth fallback still emits a local `/api/auth/me` 404 in browser smoke unless a backend auth route is present.

## Final V1 Status

Route/UI Integration Audit V1 is complete. Required governance admin pages are reachable, sidebar-discoverable, permission-protected, and backed by live Agent Fabric endpoints.
