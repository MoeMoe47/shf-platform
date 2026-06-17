# Identity Layer Spine Integration Audit V1

Generated: 2026-06-15T00:54:33.684095+00:00

## Executive Summary

- Identity & Access is present in the Master Layer Registry as an official Security layer with ownership, boundaries, Truth Spine requirement, and Required enforcement status.
- shrv1 admin surfaces are protected by AuthGuard plus route-level role gates; sensitive governance/admin surfaces also use named PermissionGuard permissions.
- Agent Fabric admin APIs, layer controls, layer gates, and admin registry APIs require ADMIN_API_KEY; admin registry additionally requires X-Admin-Role and X-Org-Id.
- shf-next has public/foundation/studio routes plus internal-looking ops routes, but App.tsx has no visible shared identity/auth bridge. This should remain a documented gap until an owner-approved bridge is designed.
- No source-code fixes were applied in this pass; this audit is report-only.

## Identity Inventory

| repo | file | role |
| --- | --- | --- |
| shrv1 | `src/entries/admin.main.jsx` | Mounts AuthProvider, HashRouter, AdminLayout, and AdminRoutes for admin.html. |
| shrv1 | `src/auth/auth-context.jsx` | Front-end auth context; fetches /api/auth/me and creates localhost dev session only in Vite dev. |
| shrv1 | `src/auth/AuthGuard.jsx` | Blocks unauthenticated AdminRoutes children. |
| shrv1 | `src/auth/PermissionGuard.jsx` | Blocks routes missing named SHS_SECURITY_PERMISSIONS. |
| shrv1 | `src/system/identity/hubAccessControl.js` | Canonical shrv1 role-to-route gate for hub/admin surfaces. |
| shrv1 | `src/system/identity/identityRouting.js` | Local identity session helpers, demo users, and dev-only admin seeding. |
| shrv1 | `src/system/security/security-permissions.js` | Named role and permission grants used by PermissionGuard. |
| shrv1 | `src/router/AdminRoutes.jsx` | Admin route protection wrapper using AuthGuard, ProtectedHubRoute, and PermissionGuard. |
| shrv1 | `src/components/admin/AdminSidebar.jsx` | Admin navigation discovery surface; rendered inside AdminLayout. |
| shrv1 | `src/pages/admin/identity/IdentityManagement.jsx` | Identity admin surface mounted at admin.html#/identity. |
| shrv1 | `services/shf-agent-fabric/fabric/admin_auth.py` | Backend ADMIN_API_KEY dependency for protected /admin control plane routers. |
| shrv1 | `services/shf-agent-fabric/routers/admin_agents_routes.py` | Protected Agent Fabric admin API. |
| shrv1 | `services/shf-agent-fabric/routers/admin_layers_routes.py` | Protected layer registry/admin API. |
| shrv1 | `services/shf-agent-fabric/routers/admin_gate_routes.py` | Protected layer gate status/history API. |
| shrv1 | `services/shf-agent-fabric/routers/admin_registry_routes.py` | Protected registry API with X-Admin-Role and X-Org-Id read/write isolation. |
| shf-next | `src/App.tsx` | Manual path router; currently has no visible shared identity/auth bridge. |

## Master Layer Registry Status

- Official layer present: True
- Layer: Identity & Access
- Type: Security
- Owns: Authentication, roles, organizations, route access, and permission gates.
- Must not own: Claim verification, Truth Spine state, report readiness, public approval, outcome ranking, or data ownership decisions.
- Truth Spine requirement: Must not mark claims verified, public-approved, or report-ready.
- Enforcement status: Required
- Registry patch applied: false

## shrv1 Route Protection Findings

- Protected routes found: 62
- Role-gated-only routes found: 41
- Permission/access entries without mounted route: 6
- Sidebar links needing owner decision: 4

### Protected Routes

| route | component | protection |
| --- | --- | --- |
| `admin.html#/hub` | HubWorkspaceDashboard | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/network` | HubLeadershipDashboard | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/leadership` | HubLeadershipDashboard | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/intake` | IntakeNavigatorConsole | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/queue` | PartnerActionQueue | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/action-queue` | PartnerActionQueue | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/lifecycle` | ReferralLifecycleView | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/referrals` | ReferralLifecycleView | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/unmet-needs` | UnmetNeedsQueue | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/imports` | HubFilesImports | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/reports` | HubReports | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/growth-network` | HubGrowthNetwork | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/sales-pipeline` | HubSalesPipelinePage | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/opportunities` | HubOpportunitiesPage | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/bundles` | HubBundleBuilderPage | role_gate_only + canAccessHubRoute |
| `admin.html#/hub/intelligence` | HubIntelligencePage | role_gate_only + canAccessHubRoute |
| `admin.html#/uploads` | UploadManager | UPLOADS_INTERNAL + canAccessHubRoute |
| `admin.html#/imports` | HubFilesImports | UPLOADS_INTERNAL + canAccessHubRoute |
| `admin.html#/aggregation` | AggregationDashboard | AGGREGATION_VIEW + canAccessHubRoute |
| `admin.html#/reporting` | ReportingCommandSurface | REPORTS_VIEW + canAccessHubRoute |
| `admin.html#/reports` | ReportingCommandSurface | REPORTS_VIEW + canAccessHubRoute |
| `admin.html#/command` | SHFImpactCommandCenter | AUDIT_VIEW + canAccessHubRoute |
| `admin.html#/command-center` | SHFImpactCommandCenter | AUDIT_VIEW + canAccessHubRoute |
| `admin.html#/dashboard` | WorkspaceDashboard | AUDIT_VIEW + canAccessHubRoute |
| `admin.html#/lord-outcomes` | LordOutcomesRoutes | AUDIT_VIEW + canAccessHubRoute |
| `admin.html#/lord-outcomes` | LordOutcomesRoutes | AUDIT_VIEW + canAccessHubRoute |
| `admin.html#/verification-audit` | VerificationAuditSurface | VERIFICATION_VIEW + canAccessHubRoute |
| `admin.html#/truth-spine` | TruthSpinePage | TRUTH_VIEW + canAccessHubRoute |
| `admin.html#/oracle` | OraclePage | TRUTH_VIEW + canAccessHubRoute |
| `admin.html#/ai-guardrails` | AIGuardrailsPage | TRUTH_VIEW + canAccessHubRoute |
| `admin.html#/game-theory` | GameTheoryPage | TRUTH_VIEW + canAccessHubRoute |
| `admin.html#/agent-fabric` | AgentFabricPage | AUDIT_VIEW + canAccessHubRoute |
| `admin.html#/audit` | AuditLogViewer | AUDIT_VIEW + canAccessHubRoute |
| `admin.html#/identity` | IdentityManagement | IDENTITY_VIEW + canAccessHubRoute |
| `admin.html#/app-registry` | AppRegistry | role_gate_only + canAccessHubRoute |
| `admin.html#/registry` | Registry | role_gate_only + canAccessHubRoute |
| `admin.html#/builder` | BuilderHub | role_gate_only + canAccessHubRoute |
| `admin.html#/web-maker` | BuilderHub | role_gate_only + canAccessHubRoute |
| `admin.html#/studio/templates` | BuilderHub | role_gate_only + canAccessHubRoute |
| `admin.html#/builder/tools` | ToolDashboard | role_gate_only + canAccessHubRoute |
| `admin.html#/tools` | ToolDashboard | role_gate_only + canAccessHubRoute |
| `admin.html#/tool-dashboard` | ToolDashboard | role_gate_only + canAccessHubRoute |
| `admin.html#/master-narrative` | MasterNarrativeViewer | role_gate_only + canAccessHubRoute |
| `admin.html#/grant-binder` | GrantBinder | role_gate_only + canAccessHubRoute |
| `admin.html#/alignment` | AlignmentSwitchboard | role_gate_only + canAccessHubRoute |
| `admin.html#/analytics` | AdminAnalytics | AUDIT_VIEW + canAccessHubRoute |
| `admin.html#/dev/docs` | DevDocsViewer | AUDIT_VIEW + canAccessHubRoute |
| `admin.html#/growth` | SHSPartnerGrowthEngine | GROWTH_VIEW + canAccessHubRoute |
| `admin.html#/ops/production` | OpsProductionDashboard | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/projects` | OpsProjectSetup | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/brand-profile` | OpsBrandProfile | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/page-intent` | OpsPageIntent | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/layout-blueprint` | OpsLayoutBlueprint | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/visual-treatment` | OpsVisualTreatment | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/assets` | OpsAssetGovernance | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/data-binding` | OpsDataBinding | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/mock-review` | OpsMockReview | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/build-packet` | OpsBuildPacket | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/screenshot-qa` | OpsScreenshotQA | role_gate_only + canAccessHubRoute |
| `admin.html#/ops/learning` | OpsLearningDashboard | role_gate_only + canAccessHubRoute |
| `admin.html#/solutions` | SolutionsInfrastructurePage | role_gate_only + canAccessHubRoute |
| `admin.html#/solutions/infrastructure` | SolutionsInfrastructurePage | role_gate_only + canAccessHubRoute |

### Owner Decisions

- `admin.html#/admin`: sidebar link has no mounted route and falls through to /hub
- `admin.html#/admin/users`: sidebar link has no mounted route and falls through to /hub
- `admin.html#/admin/settings`: sidebar link has no mounted route and falls through to /hub; hubAccessControl has /settings but not /admin/settings
- `admin.html#/health`: sidebar link has no mounted route and falls through to /hub
- `/settings`: hubAccessControl permission exists without mounted AdminRoutes route
- `/adaptive-experience`: hubAccessControl permission exists without mounted AdminRoutes route

## shf-next Route Protection Findings

- shf-next uses manual pathname routing in `src/App.tsx`, not React Router.
- Public/foundation/studio routes currently render directly.
- Ops and ClientOps routes render inside OpsShell with no visible auth guard in App.tsx.

| route | component | category | current identity posture |
| --- | --- | --- | --- |
| `/studio/templates/floral-boutique` | WebsiteStudioTemplatePreview | studio | public/manual route |
| `/studio/templates/browse` | WebsiteStudioTemplateBrowse | studio | public/manual route |
| `/studio/templates` | WebsiteStudioTemplates | studio | public/manual route |
| `/foundation/impact-report/print` | ShfImpactReportPrintPage | foundation/report | public/manual route |
| `/foundation/data-approval` | ShfDataApprovalGateway | foundation/data approval | manual route; no visible auth guard |
| `/foundation/impact-report` | ShfImpactReportGenerator | foundation/report | public/manual route |
| `/foundation/report` | ShfImpactReportGenerator | foundation/report alias | public/manual route |
| `/ops/command` | OpsCommandOverview | ops | manual route inside OpsShell; no visible auth guard |
| `/ops/projects` | ProductionProjects | ops | manual route inside OpsShell; no visible auth guard |
| `/ops/qa` | QADeliveryDashboard | ops | manual route inside OpsShell; no visible auth guard |
| `/ops/clientops` | ClientOpsCenter | clientops | manual route inside OpsShell; no visible auth guard |
| `/ops/sales` | SalesCommandCenter | ops/sales | manual route inside OpsShell; no visible auth guard |
| `/ops/library` | DevelopmentLibrary | ops/dev library | manual route inside OpsShell; no visible auth guard |
| `*` | DevelopmentLibrary | fallback | unknown paths default to internal-looking library |

## Cross-App Identity Bridge Recommendation

Keep shrv1 as governance/admin identity authority; expose a minimal signed/session-based identity bridge for shf-next internal ops and approval surfaces. Public shf-next studio/report pages stay public-read, while approvals, ClientOps, Ops, and admin/governance actions require identity context. Do not pass ADMIN_API_KEY or backend secrets through browser URLs.

Required links:
- shrv1 admin.html#/truth-spine -> shf-next /foundation/data-approval
- shrv1 admin.html#/reports -> shf-next /foundation/impact-report
- shrv1 admin.html#/command -> shf-next /foundation/impact-report
- shf-next /ops/clientops -> shrv1 admin.html#/reports
- shf-next /ops/clientops -> shrv1 admin.html#/agent-fabric

Risks:
- shf-next internal ops pages can be reached directly today if hosted publicly.
- Approval actions without identity could weaken audit attribution.
- A bridge implemented with localStorage-only state would be insufficient for production security.
- Backend admin keys must remain server-side and never be exposed to public pages.

## Spine Connection Matrix

| spine surface | identity connection status |
| --- | --- |
| truth_spine | connected in shrv1 admin via protected /truth-spine route and frozen registry; identity must not verify claims. |
| oracle | connected in shrv1 admin via protected /oracle route; Oracle remains decision-support over Truth Packages. |
| ai_guardrails | connected in shrv1 admin via protected /ai-guardrails route; publication still needs future Truth Envelope gate. |
| game_theory | connected in shrv1 admin via protected /game-theory route; strategy outputs do not become verified facts. |
| agent_fabric | connected through protected /agent-fabric UI and /admin/agents ADMIN_API_KEY backend API. |
| watchtower | partially connected: /watchtower redirects to /agent-fabric; /watchtower/summary includes truth_coverage; quarantine mutations need owner decision for backend auth. |
| reports | connected in shrv1 admin via REPORTS_VIEW routes and /reports/snapshot truth metadata; backend snapshot is internal-open V1. |
| loo | connected in shrv1 admin via /lord-outcomes and LOO score trust metadata; backend /loo/score is internal-open V1. |
| master_layer_registry | connected; Identity & Access is official and required in MASTER_LAYER_REGISTRY.md. |
| layer_gate | connected through /admin/layers and /admin/gate protected APIs plus governance checks. |
| shf_impact_data_spine | partially connected: shrv1 Command Center and shf-next impact pages use SHF data surfaces; identity bridge not implemented across repos. |
| data_approval_gateway | needs identity bridge if approval actions are used beyond public review; current route lives in shf-next manual router. |
| registry | connected: shrv1 Registry UI sends admin key plus X-Admin-Role/X-Org-Id to protected admin registry API. |
| admin_sidebar | connected inside AdminLayout/AuthGuard; unresolved legacy links remain owner-decision items. |
| route_bridge | documented but not implemented; route bridge should preserve shrv1 governance authority and shf-next presentation ownership. |

## Agent Fabric Permission Findings

- agent_contract_source: services/shf-agent-fabric/contracts/agents/agents.json
- admin_ui_route: admin.html#/agent-fabric protected by shs_admin role and AUDIT_VIEW permission
- admin_api: /admin/agents requires ADMIN_API_KEY
- agent_registry: admin agents expose lifecycle, enabled state, capabilities, visibility, policy, and approval fields
- finding: Agent Fabric admin actions are protected; public/user-visible agent behavior still depends on future bridge/policy when exposed outside admin.

## Backend Admin API Protection Findings

Protected by ADMIN_API_KEY:
- `/admin/agents`
- `/admin/layers`
- `/admin/gate`
- `/admin/registry`
- `/admin/force/status`
- `/admin/align/*`
- `/admin/align/plans/*`
- `/runs/* mutating/execute paths`

Protected by role/org headers after admin key:
- /admin/registry with X-Admin-Role and X-Org-Id

Internal-open V1 endpoints:
- `/truth/*`
- `/oracle/*`
- `/ai-guardrails/*`
- `/game-theory/*`
- `/reports/snapshot`
- `/watchtower/summary`
- `/loo/score`

Owner decisions:
- Decide whether Watchtower quarantine mutation endpoints should require ADMIN_API_KEY before production exposure.
- Decide whether LOO scoring POST endpoints remain internal-open or move behind an API gateway/admin/session policy.
- Decide whether Truth/Oracle/AI/Game mutating V1 endpoints need backend identity protection before non-local deployment.

## Browser Smoke Results

- Result: PASS.
- Login flow: `admin.html#/login` -> selected SHS Admin demo identity -> continued to `admin.html#/hub` with no access denial.
- `admin.html#/identity`: rendered protected identity admin surface; no blank screen; no access denial.
- `admin.html#/command`: rendered protected command surface; no blank screen; no access denial.
- `admin.html#/dashboard`: rendered protected dashboard surface; no blank screen; no access denial.
- `admin.html#/truth-spine`: rendered protected Truth Spine surface; no blank screen; no access denial.
- `admin.html#/agent-fabric`: rendered protected Agent Fabric surface; no blank screen; no access denial.
- `/studio/templates`: rendered public WebMaker/website studio route; no blank screen; no access denial.
- Browser console errors: none observed.
- Note: dev server logged `/auth/me` proxy refusal because the backend auth service was not running; localhost dev auth fallback handled the admin session.

## Backend Smoke Results

- Result: PASS.
- `GET /admin/agents` without admin key returned 401.
- `GET /admin/agents` with admin key returned 200.
- `GET /admin/layers/gate/status` without admin key returned 401.
- `GET /admin/layers/gate/status` with admin key returned 200.
- `GET /admin/registry` without admin key returned 401.
- `GET /admin/registry` with admin key plus `X-Admin-Role`/`X-Org-Id` returned 200.
- `GET /truth/health` returned 200.
- `GET /watchtower/summary` returned 200.
- `GET /reports/snapshot` returned 200.
- `POST /loo/score` returned 200.

## Safe Fixes Applied

None. Report-only audit pass.

## Files Changed

- `docs/IDENTITY_LAYER_SPINE_INTEGRATION_AUDIT_V1.md`
- `docs/IDENTITY_LAYER_SPINE_INTEGRATION_AUDIT_V1.json`

## Validation Results

shrv1:
- `python3 scripts/check_master_layer_registry.py`: PASS.
- `python3 scripts/check_truth_spine_freeze.py`: PASS.
- `python3 scripts/check_oracle_layer.py`: PASS.
- `python3 scripts/check_ai_guardrails_layer.py`: PASS.
- `python3 scripts/check_game_theory_layer.py`: PASS.
- `npm run check:governance`: PASS.
- `python3 -m pytest services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py services/shf-agent-fabric/tests/test_agent_canon_basics.py`: PASS, 25 passed.
- `npm run build`: PASS, existing large chunk warning only.

shf-next:
- `npm run build`: PASS, existing large chunk warning only.
- `npm run lint`: PASS.

Git/test hygiene:
- Pytest-generated diffs in `services/shf-agent-fabric/contracts/agents/agents.json` and `services/shf-agent-fabric/var/watchtower_audit.jsonl` were returned to tracked content using `git show` content replacement. No `git restore`, `git reset`, staging, commit, delete, or move commands were used.

## Remaining Risks

- shf-next has no visible auth guard or shared identity bridge for /ops/* and /foundation/data-approval.
- Several shrv1 admin routes are role-gated only and do not yet use named PermissionGuard permissions; this appears to be existing pattern, not a current break.
- AdminSidebar still includes unresolved legacy links /admin, /admin/users, /admin/settings, and /health that fall back to /hub.
- Backend V1 spine endpoints are internal-open except protected /admin control planes; production exposure should sit behind API gateway/session policy.
- Watchtower quarantine mutation endpoints are not protected by ADMIN_API_KEY in the current router.

## V1 Completion Decision

V1 complete: true.

Identity Layer is registered and connected enough for V1 audit purposes. Remaining risks are documented as owner decisions and bridge requirements, not patched in this pass.
