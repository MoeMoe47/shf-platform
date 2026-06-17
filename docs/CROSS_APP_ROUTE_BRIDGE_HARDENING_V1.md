# Cross-App Route Bridge Hardening V1

## Executive Summary

Cross-App Route Bridge Hardening V1 is complete. SHRV1 remains the governance/admin authority, SHF-Next remains the live ops/studio/foundation presentation app, and the bridge is now expressed through explicit route ownership config, safe base URL helpers, allowlisted link builders, and route smoke lists.

No route systems were merged. No backend auth logic, production auth, permissions, Truth Spine, Oracle, AI Guardrails, Game Theory, Agent Fabric, Watchtower, Reports, or LOO behavior was changed. No UI links were added in this pass; optional visible links are deferred until owner approval for exact placement.

## Route Ownership Map

### SHRV1 Owns

| Surface | Route |
| --- | --- |
| Truth Spine | `admin.html#/truth-spine` |
| Oracle | `admin.html#/oracle` |
| AI Guardrails | `admin.html#/ai-guardrails` |
| Game Theory | `admin.html#/game-theory` |
| Agent Fabric | `admin.html#/agent-fabric` |
| Registry | `admin.html#/registry` |
| Watchtower redirect surface | `admin.html#/watchtower` |
| Lord of Outcomes | `admin.html#/lord-outcomes` |
| Reporting | `admin.html#/reporting` |
| Command Center | `admin.html#/command` |
| Dashboard | `admin.html#/dashboard` |

### SHF-Next Owns

| Surface | Route |
| --- | --- |
| Public home | `/` |
| Foundation public landing | `/foundation` |
| Impact report | `/foundation/impact-report` |
| Data Approval Gateway | `/foundation/data-approval` |
| Solutions | `/solutions` |
| Ops | `/ops`, `/ops/*` |
| ClientOps | `/ops/clientops` |
| Studio | `/studio/*` |
| Studio templates | `/studio/templates` |
| Studio template browse | `/studio/templates/browse` |

## Base URL Strategy

The bridge helpers use environment variables first:

- `VITE_SHRV1_BASE_URL`
- `VITE_SHF_NEXT_BASE_URL`

Local co-running defaults are documented as:

- SHRV1: `http://127.0.0.1:5174`
- SHF-Next: `http://127.0.0.1:5175`

The helpers only accept `http` and `https` base URLs and reject values containing admin key, token, authorization, role, or permission patterns.

## Link Builder Strategy

Helpers created in both apps:

- `getShrv1BaseUrl()`
- `getShfNextBaseUrl()`
- `buildShrv1AdminUrl(hashRoute)`
- `buildShfNextUrl(pathname)`
- `getCrossAppRouteTarget(routeKey)`
- `isExternalCrossAppUrl(url)`

Safety rules:

- Routes are built from known route keys or explicit safe paths.
- URLs reject secret-like query strings and header-style terms.
- No `ADMIN_API_KEY`, admin key, token, role payload, or permission payload is added.
- `returnTo` is only accepted as a non-sensitive path and is encoded.

## Cross-App Route Targets

The config includes the 14 audited target entries:

| Key | Source | Target |
| --- | --- | --- |
| `shrv1CommandToShfImpactReport` | `admin.html#/command` | `/foundation/impact-report` |
| `shrv1ReportsToShfImpactPrint` | `admin.html#/reports` | `/foundation/impact-report/print?style=premium&period=annual` |
| `shrv1TruthToShfDataApproval` | `admin.html#/truth-spine` | `/foundation/data-approval` |
| `shrv1BuilderToShfTemplatesBrowse` | `admin.html#/builder` | `/studio/templates/browse` |
| `shrv1WebMakerToShfTemplatesBrowse` | `/studio/templates` | `/studio/templates/browse` |
| `shrv1OpsProductionToShfOpsCommand` | `admin.html#/ops/production` | `/ops/command` |
| `shrv1OpsProjectsToShfOpsProjects` | `admin.html#/ops/projects` | `/ops/projects` |
| `shrv1BuildPacketToShfBuildPackets` | `admin.html#/ops/build-packet` | `/ops/library/build-packets` |
| `shrv1ScreenshotQaToShfQa` | `admin.html#/ops/screenshot-qa` | `/ops/qa` |
| `shfClientOpsToShrv1AgentFabric` | `/ops/clientops` | `admin.html#/agent-fabric` |
| `shfClientOpsToShrv1Reports` | `/ops/clientops` | `admin.html#/reports` |
| `shfDataApprovalToShrv1Truth` | `/foundation/data-approval` | `admin.html#/truth-spine` |
| `shfImpactReportToShrv1Reports` | `/foundation/impact-report` | `admin.html#/reports` |
| `shfStudioTemplatesToShrv1Builder` | `/studio/templates` | `admin.html#/builder` |

Generated URL smoke confirmed all 14 target URLs are allowlisted and secret-free.

## UI Links Added Or Deferred

Added: none.

Deferred:

- SHRV1 BuilderHub/WebMaker -> SHF-Next Studio Templates Browse.
- SHF-Next internal notice -> SHRV1 governance/admin surfaces.
- SHF-Next ClientOps -> SHRV1 Agent Fabric and Reports.
- SHF-Next Data Approval -> SHRV1 Truth Spine and Registry.

Reason: the config is now safe and available, but visible link placement should be owner-approved per page to avoid adding public/admin assumptions to the wrong surface.

## Public Route Regression Results

| Route | Result |
| --- | --- |
| `/` | PASS: public home content, no bridge notice, no ops shell. |
| `/foundation` | PASS: public foundation content, no bridge notice, no ops shell. |
| `/foundation/impact-report` | PASS: public impact report content, no bridge notice, no ops shell. |
| `/solutions` | PASS: public solutions content, no bridge notice, no ops shell. |
| `/studio/templates` | PASS: public Website Studio content, no bridge notice, no ops shell. |
| `/studio/templates/browse` | PASS: public template browser content, no bridge notice, no ops shell. |

## Internal Route Regression Results

| Route | Result |
| --- | --- |
| `/ops` | PASS: internal bridge notice remains visible. |
| `/ops/clientops` | PASS: internal bridge notice remains visible with ClientOps content. |
| `/foundation/data-approval` | PASS: foundation admin bridge notice remains visible with Data Approval Gateway content. |

## Browser Smoke Results

Active ports used:

- SHRV1: `http://127.0.0.1:5174`
- SHF-Next: `http://127.0.0.1:5175`

SHRV1 routes verified with seeded local admin state:

- `admin.html#/agent-fabric`
- `admin.html#/registry`
- `admin.html#/truth-spine`
- `admin.html#/oracle`
- `admin.html#/ai-guardrails`
- `admin.html#/game-theory`
- `admin.html#/lord-outcomes`
- `admin.html#/analytics`
- `admin.html#/dev/docs`

All loaded without blank screens or critical console errors.

## Validation Results

| Command | Result |
| --- | --- |
| `node --input-type=module` helper import smoke in SHRV1 | PASS |
| `npm run check:governance` in SHRV1 | PASS |
| `npm run build` in SHRV1 | PASS |
| `npm run build` in SHF-Next | PASS |
| `npm run lint` in SHF-Next | PASS |

## Files Changed

- `src/system/routes/crossAppRouteBridge.js`
- `/Users/mikeslate/shf-next/src/data/crossAppRouteBridge.ts`
- `docs/CROSS_APP_ROUTE_BRIDGE_HARDENING_V1.md`
- `docs/CROSS_APP_ROUTE_BRIDGE_HARDENING_V1.json`

## Remaining Risks

- Visible UI links are deferred pending owner approval for exact placement.
- `/Users/mikeslate/shf-next` does not report as a git repository in this environment, so SHF-Next git status cannot be produced.
- Local base URL defaults are development-only and must be overridden for staging/production.
- Existing unresolved SHF-Next footer routes such as `/terms`, `/privacy`, and `/contact` remain outside this V1 scope.
- SHRV1 admin smoke produced Vite proxy `ECONNREFUSED` server logs for backend API calls because the Agent Fabric backend was not running; admin pages still loaded without blank screens.

## V1 Complete Yes/No

Yes. Route ownership config exists in both apps, base URL/link builder helpers exist, 14 cross-app targets are allowlisted, route regressions pass, builds pass in both apps, SHRV1 governance passes, no route systems were merged, no secrets were introduced, and no commit was made.
