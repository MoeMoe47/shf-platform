# SHRV1 SHF-Next Route Bridge Audit V1

Generated: 2026-06-14T20:27:43

## Executive Summary

- Audit-only pass. No source code, package file, route, backend, or shf-next files were modified.
- shrv1 is the governance/admin/multi-entry app: admin routes use `admin.html#/…` hash routing and public apps use separate HTML entries.
- shf-next is the live SHS ops/studio/foundation presentation app: routes use normal pathname branches in `src/App.tsx`.
- The main bridge conflicts are `/studio/templates`, Production Ops, Build Packets/Development Library, Brand Profile/Brand Engine, and Reports terminology.
- Recommended bridge posture: keep shrv1 as governance/admin authority, keep shf-next as live ops/presentation owner, and add explicit cross-app links only after owner approval/base URL config.

## shrv1 Route Model

- Admin: `src/entries/admin.main.jsx` mounts `HashRouter`, `AdminLayout`, and `AdminRoutes`. URLs look like `admin.html#/truth-spine`.
- Public/multi-entry: `src/entries/index.main.jsx` launches dedicated HTML entries and renders public `WebMakerPage` at pathname `/studio/templates`.
- Current shrv1 route count in this audit: `82` entries including admin routes and public launcher/path entries.

## shf-next Route Model

- `src/App.tsx` reads `window.location.pathname`, branches with `path.startsWith(...)`, and uses `window.history.pushState` for in-app ops navigation.
- No React Router is present in shf-next. Unknown paths fall into `OpsShell` and default to `DevelopmentLibrary`.
- Current shf-next route/linked branch count in this audit: `24`.

## shrv1 Route Inventory

| route | entry | component | category | protected | permissions | source_file |
| --- | --- | --- | --- | --- | --- | --- |
| admin.html#/login | admin.html | SHSLoginPage | admin | False |  | src/router/AdminRoutes.jsx |
| admin.html#/ | admin.html | Navigate | admin | False |  | src/router/AdminRoutes.jsx |
| admin.html#/hub | admin.html | HubWorkspaceDashboard | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/network | admin.html | HubLeadershipDashboard | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/leadership | admin.html | HubLeadershipDashboard | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/intake | admin.html | IntakeNavigatorConsole | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/queue | admin.html | PartnerActionQueue | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/action-queue | admin.html | PartnerActionQueue | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/lifecycle | admin.html | ReferralLifecycleView | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/referrals | admin.html | ReferralLifecycleView | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/unmet-needs | admin.html | UnmetNeedsQueue | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/imports | admin.html | HubFilesImports | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/reports | admin.html | HubReports | reports/verification | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/growth-network | admin.html | HubGrowthNetwork | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/sales-pipeline | admin.html | HubSalesPipelinePage | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/opportunities | admin.html | HubOpportunitiesPage | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/bundles | admin.html | HubBundleBuilderPage | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/hub/intelligence | admin.html | HubIntelligencePage | hub/clientops | True |  | src/router/AdminRoutes.jsx |
| admin.html#/uploads | admin.html | UploadManager | admin | True | UPLOADS_INTERNAL | src/router/AdminRoutes.jsx |
| admin.html#/imports | admin.html | HubFilesImports | admin | True | UPLOADS_INTERNAL | src/router/AdminRoutes.jsx |
| admin.html#/aggregation | admin.html | AggregationDashboard | governance/admin | True | AGGREGATION_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/reporting | admin.html | ReportingCommandSurface | reports/verification | True | REPORTS_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/reports | admin.html | ReportingCommandSurface | reports/verification | True | REPORTS_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/command | admin.html | SHFImpactCommandCenter | command/dashboard | True | AUDIT_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/command-center | admin.html | SHFImpactCommandCenter | command/dashboard | True | AUDIT_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/dashboard | admin.html | WorkspaceDashboard | command/dashboard | True | AUDIT_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/loo | admin.html | Navigate | admin | False |  | src/router/AdminRoutes.jsx |
| admin.html#/watchtower | admin.html | Navigate | admin | False |  | src/router/AdminRoutes.jsx |
| admin.html#/lord-outcomes | admin.html | LordOutcomesRoutes | admin | True | AUDIT_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/lord-outcomes/* | admin.html | LordOutcomesRoutes | admin | True | AUDIT_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/verification-audit | admin.html | VerificationAuditSurface | reports/verification | True | VERIFICATION_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/truth-spine | admin.html | TruthSpinePage | governance/admin | True | TRUTH_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/oracle | admin.html | OraclePage | governance/admin | True | TRUTH_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/ai-guardrails | admin.html | AIGuardrailsPage | governance/admin | True | TRUTH_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/game-theory | admin.html | GameTheoryPage | governance/admin | True | TRUTH_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/agent-fabric | admin.html | AgentFabricPage | governance/admin | True | AUDIT_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/audit | admin.html | AuditLogViewer | admin | True | AUDIT_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/identity | admin.html | IdentityManagement | admin | True | IDENTITY_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/app-registry | admin.html | AppRegistry | governance/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/registry | admin.html | Registry | governance/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/builder | admin.html | BuilderHub | builder/webmaker | True |  | src/router/AdminRoutes.jsx |
| admin.html#/web-maker | admin.html | BuilderHub | builder/webmaker | True |  | src/router/AdminRoutes.jsx |
| admin.html#/studio/templates | admin.html | BuilderHub | builder/webmaker | True |  | src/router/AdminRoutes.jsx |
| admin.html#/builder/tools | admin.html | ToolDashboard | builder/webmaker | True |  | src/router/AdminRoutes.jsx |
| admin.html#/tools | admin.html | ToolDashboard | builder/webmaker | True |  | src/router/AdminRoutes.jsx |
| admin.html#/tool-dashboard | admin.html | ToolDashboard | builder/webmaker | True |  | src/router/AdminRoutes.jsx |
| admin.html#/master-narrative | admin.html | MasterNarrativeViewer | admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/grant-binder | admin.html | GrantBinder | admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/alignment | admin.html | AlignmentSwitchboard | governance/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/analytics | admin.html | AdminAnalytics | admin | True | AUDIT_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/dev/docs | admin.html | DevDocsViewer | admin | True | AUDIT_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/growth | admin.html | SHSPartnerGrowthEngine | admin | True | GROWTH_VIEW | src/router/AdminRoutes.jsx |
| admin.html#/ops/production | admin.html | OpsProductionDashboard | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/projects | admin.html | OpsProjectSetup | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/brand-profile | admin.html | OpsBrandProfile | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/page-intent | admin.html | OpsPageIntent | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/layout-blueprint | admin.html | OpsLayoutBlueprint | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/visual-treatment | admin.html | OpsVisualTreatment | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/assets | admin.html | OpsAssetGovernance | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/data-binding | admin.html | OpsDataBinding | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/mock-review | admin.html | OpsMockReview | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/build-packet | admin.html | OpsBuildPacket | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/screenshot-qa | admin.html | OpsScreenshotQA | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/ops/learning | admin.html | OpsLearningDashboard | ops/admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/solutions | admin.html | SolutionsInfrastructurePage | admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#/solutions/infrastructure | admin.html | SolutionsInfrastructurePage | admin | True |  | src/router/AdminRoutes.jsx |
| admin.html#* | admin.html | Navigate | admin | False |  | src/router/AdminRoutes.jsx |
| /foundation.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /solutions.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /sales.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /career.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /curriculum.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /civic.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /credit.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /debt.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /treasury.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /arcade.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /fuel.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /store.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /lord-of-outcomes.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /verifier.html#/ | index.html launcher | Launcher link | public/multi-entry | False |  | src/entries/index.main.jsx |
| /studio/templates | index.html | WebMakerPage | public webmaker | False |  | src/entries/index.main.jsx |

## shf-next Route Inventory

| route | component | category | routing_model | protected | source_file |
| --- | --- | --- | --- | --- | --- |
| /studio/templates/floral-boutique | WebsiteStudioTemplatePreview | studio | normal pathname | False | src/App.tsx or linked page |
| /studio/templates/browse | WebsiteStudioTemplateBrowse | studio | normal pathname | False | src/App.tsx or linked page |
| /studio/templates | WebsiteStudioTemplates | studio | normal pathname | False | src/App.tsx or linked page |
| /foundation/impact-report/print | ShfImpactReportPrintPage | foundation | normal pathname | False | src/App.tsx or linked page |
| /foundation/data-approval | ShfDataApprovalGateway | foundation | normal pathname | False | src/App.tsx or linked page |
| /foundation/impact-report | ShfImpactReportGenerator | foundation | normal pathname | False | src/App.tsx or linked page |
| /foundation/report | ShfImpactReportGenerator | foundation | normal pathname | False | src/App.tsx or linked page |
| /ops/command | OpsCommandOverview | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/projects | ProductionProjects | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/qa | QADeliveryDashboard | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/clientops | ClientOpsCenter | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/sales | SalesCommandCenter | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/library | DevelopmentLibrary | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/library/bundles | DevelopmentLibrary tab | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/library/blueprint-selector | DevelopmentLibrary tab | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/library/build-packets | DevelopmentLibrary tab | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/library/qa-checklists | DevelopmentLibrary tab | ops | normal pathname | False | src/App.tsx or linked page |
| /ops/library/brand-engine | DevelopmentLibrary tab | ops | normal pathname | False | src/App.tsx or linked page |
| /studio/templates/compare | unhandled studio subpath; currently captured by /studio/templates branch | studio | normal pathname | False | src/App.tsx or linked page |
| /studio/templates/:slug | partially handled; floral-boutique has dedicated preview, other slugs fall to base templates page | studio | normal pathname | False | src/App.tsx or linked page |
| /terms | unhandled public footer link; falls to OpsShell default | public/unhandled | normal pathname | False | src/App.tsx or linked page |
| /privacy | unhandled public footer link; falls to OpsShell default | public/unhandled | normal pathname | False | src/App.tsx or linked page |
| /contact | unhandled public footer link; falls to OpsShell default | public/unhandled | normal pathname | False | src/App.tsx or linked page |
| * | DevelopmentLibrary default inside OpsShell | public/unhandled | normal pathname | False | src/App.tsx or linked page |

## Route Relationship Matrix

| shf_next_route | shrv1_route | relationship | counterpart | proposed_owner | notes |
| --- | --- | --- | --- | --- | --- |
| /ops/command |  | MIRROR_ROUTE | admin.html#/ops/production plus admin.html#/command | shf-next for live SHS ops; shrv1 for governance/admin command | Both show ops/command views. Keep aligned; do not merge. |
| /ops/sales |  | SHF_NEXT_ONLY | admin.html#/growth and admin.html#/hub/sales-pipeline | shf-next | Live sales command workflow belongs in shf-next; shrv1 keeps partner growth/hub sales governance views. |
| /ops/projects |  | MIRROR_ROUTE | admin.html#/ops/projects | shared with shf-next live owner | Both manage production projects. shf-next appears fuller live lifecycle; shrv1 is admin/governance planning surface. |
| /ops/library |  | MIRROR_ROUTE | admin.html#/ops/learning and admin.html#/ops/build-packet | shf-next | Development Library live workflow is shf-next; shrv1 has production admin components. |
| /ops/library/bundles |  | SHF_NEXT_ONLY | admin.html#/builder/tools | shf-next | Library tab inside shf-next, with possible cross-link to shrv1 tool governance. |
| /ops/library/blueprint-selector |  | SHF_NEXT_ONLY | admin.html#/ops/layout-blueprint | shf-next | Related to shrv1 layout blueprint but shf-next owns interactive library tab. |
| /ops/library/build-packets |  | MIRROR_ROUTE | admin.html#/ops/build-packet | shared with shf-next live owner | Same concept exists in both; keep aligned, owner decision if one becomes canonical. |
| /ops/library/qa-checklists |  | MIRROR_ROUTE | admin.html#/ops/screenshot-qa and admin.html#/ops/mock-review | shf-next | QA templates live in shf-next library; shrv1 admin QA surfaces remain governance/admin. |
| /ops/library/brand-engine |  | MIRROR_ROUTE | admin.html#/ops/brand-profile | shared | Brand profile/engine overlap; likely align data model before links. |
| /ops/qa |  | MIRROR_ROUTE | admin.html#/ops/screenshot-qa and admin.html#/ops/mock-review | shf-next | QA + Delivery live workflow belongs in shf-next; shrv1 has screenshot/mock review admin steps. |
| /ops/clientops |  | SHF_NEXT_ONLY | admin.html#/hub/reports, admin.html#/hub/lifecycle, admin.html#/agent-fabric | shf-next | ClientOps center is shf-next; should link to shrv1 governance/reporting when reviewing trust or agent status. |
| /studio/templates |  | DUPLICATE_CONFLICT | /studio/templates on shrv1 index and admin.html#/studio/templates | owner decision | Both apps expose /studio/templates. shrv1 public WebMaker and admin BuilderHub exist; shf-next has template marketplace. |
| /studio/templates/browse |  | SHF_NEXT_ONLY | admin.html#/builder or /studio/templates | shf-next | Browse marketplace appears shf-next-owned; shrv1 should cross-link rather than duplicate. |
| /studio/templates/floral-boutique |  | SHF_NEXT_ONLY | /studio/templates | shf-next | Dedicated template preview belongs to shf-next template marketplace. |
| /studio/templates/:slug |  | OWNER_DECISION_REQUIRED | /studio/templates | shf-next likely | Most slug paths are linked but not individually branched except floral-boutique; decide preview routing pattern. |
| /studio/templates/compare |  | OWNER_DECISION_REQUIRED | /studio/templates | shf-next likely | Link exists but no dedicated branch; currently captured by base templates branch. |
| /foundation/data-approval |  | SHF_NEXT_ONLY | admin.html#/truth-spine and admin.html#/reports | shf-next for SHF Data Approval Gateway | Gateway is SHF public/foundation-side approval surface; shrv1 owns Truth Spine/governance backend/admin. |
| /foundation/impact-report |  | CROSS_LINK_REQUIRED | admin.html#/command and admin.html#/reports | shf-next | shrv1 command links to 127.0.0.1:5174 in dev for report generator; formal bridge should be configured. |
| /foundation/report |  | CROSS_LINK_REQUIRED | admin.html#/command and admin.html#/reports | shf-next | Alias route in shf-next; shrv1 should use canonical impact-report path. |
| /foundation/impact-report/print |  | SHF_NEXT_ONLY | admin.html#/reports | shf-next | Print report renderer belongs in shf-next; shrv1 should not duplicate print route. |
| /terms |  | OWNER_DECISION_REQUIRED | none | shf-next/public TBD | Footer link exists in studio browse but no route branch. |
| /privacy |  | OWNER_DECISION_REQUIRED | none | shf-next/public TBD | Footer link exists in studio browse but no route branch. |
| /contact |  | OWNER_DECISION_REQUIRED | none | shf-next/public TBD | Footer link exists in studio browse but no route branch. |
| * |  | SHF_NEXT_ONLY | none | shf-next | Unknown shf-next paths fall to DevelopmentLibrary in OpsShell; this is risky for public URLs. |
|  | admin.html#/truth-spine | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/oracle | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/ai-guardrails | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/game-theory | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/agent-fabric | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/registry | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/watchtower | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/loo | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/lord-outcomes | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/aggregation | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/verification-audit | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/hub | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/hub/reports | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/solutions | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |
|  | admin.html#/solutions/infrastructure | SHRV1_ONLY | None | shrv1 | Governance/admin or multi-entry route belongs in shrv1; shf-next should cross-link only when needed. |

## Ownership Map

| surface | owner | routes | reason |
| --- | --- | --- | --- |
| Truth Spine admin | shrv1 | admin.html#/truth-spine | Frozen governance/anti-drift authority. |
| Oracle admin | shrv1 | admin.html#/oracle | Governance decision-support layer admin surface. |
| AI Guardrails admin | shrv1 | admin.html#/ai-guardrails | AI publication/guardrail governance. |
| Game Theory admin | shrv1 | admin.html#/game-theory | Strategy layer admin/governance. |
| Agent Fabric admin | shrv1 | admin.html#/agent-fabric | Agent governance and layer visibility. |
| Admin Registry | shrv1 | admin.html#/registry, admin.html#/app-registry | Master registry/admin control surface. |
| Watchtower | shrv1 | admin.html#/watchtower -> /agent-fabric, backend /watchtower/* | Assurance/risk observation stack in Agent Fabric/governance. |
| Reports | shared | shrv1 admin.html#/reports, shrv1 admin.html#/reporting, shf-next /foundation/impact-report, shf-next /foundation/impact-report/print | shrv1 owns trust/report readiness admin; shf-next owns foundation presentation/print. |
| LOO | shrv1 | admin.html#/lord-outcomes, backend /loo/* | Outcome ranking/trust metadata layer. |
| SHF Impact Command | shrv1 | admin.html#/command, admin.html#/command-center | SHF Impact Command Center is in shrv1 and can link to shf-next reports. |
| SHF Data Approval Gateway | shf-next | /foundation/data-approval | Foundation-side approved data gateway; should reference shrv1 Truth Spine/Reports governance. |
| BuilderHub | shrv1 | admin.html#/builder, admin.html#/web-maker, admin.html#/studio/templates | Admin/internal control surface. |
| WebMaker | split | shrv1 /studio/templates public WebMakerPage, shf-next /studio/templates marketplace | Boundary needs final decision; shrv1 has public WebMaker, shf-next has template marketplace. |
| Website Studio | shared with shf-next marketplace owner | admin.html#/builder, /studio/templates, /studio/templates/browse | Admin governance in shrv1, customer/template browsing in shf-next. |
| Template Browse | shf-next | /studio/templates/browse | Dedicated browse marketplace is shf-next. |
| Brand Kit | shared | admin.html#/ops/brand-profile, /ops/library/brand-engine | shrv1 admin brand profile and shf-next live library brand engine overlap. |
| Production Ops | shared with shf-next live owner | shrv1 admin.html#/ops/*, shf-next /ops/projects, /ops/command | shf-next appears live lifecycle; shrv1 is admin/gov production ops. |
| ClientOps | shf-next | /ops/clientops | Dedicated ClientOps Center exists only in shf-next; shrv1 has hub/client reports. |
| Sales Ops | shf-next | /ops/sales | Dedicated Sales Command Center exists in shf-next. |
| QA + Delivery | shf-next | /ops/qa | Dedicated QA + Delivery dashboard exists in shf-next. |
| Development Library | shf-next | /ops/library, /ops/library/* | Dedicated Development Library exists in shf-next. |
| Public SHF pages | shf-next for impact reports; shrv1 for legacy multi-entry public apps | /foundation/impact-report, /foundation/data-approval, shrv1 foundation.html#/ | Do not merge; bridge by links. |
| Public SHS pages | shrv1 for launcher/WebMaker; shf-next for Studio templates if owner approves | shrv1 index launcher, /studio/templates | Route conflict needs owner boundary. |

## Cross-App Link Recommendations

| source_app | source_route | target_app | target_route | reason |
| --- | --- | --- | --- | --- |
| shrv1 | admin.html#/command | shf-next | /foundation/impact-report | Command Center generates/reviews SHF impact report presentation. |
| shrv1 | admin.html#/reports | shf-next | /foundation/impact-report/print?style=premium&period=annual | Reporting admin should open the current SHF print renderer rather than duplicating it. |
| shrv1 | admin.html#/truth-spine | shf-next | /foundation/data-approval | Truth/readiness review should cross-link to public data approval gate. |
| shrv1 | admin.html#/builder | shf-next | /studio/templates/browse | BuilderHub admin should open live template marketplace if shf-next owns browsing. |
| shrv1 | /studio/templates | shf-next | /studio/templates/browse | Public WebMaker should point to the richer marketplace if owner confirms shf-next as template owner. |
| shrv1 | admin.html#/ops/production | shf-next | /ops/command | Admin production ops should open live ops command overview. |
| shrv1 | admin.html#/ops/projects | shf-next | /ops/projects | Project setup/governance should open live project dashboard. |
| shrv1 | admin.html#/ops/build-packet | shf-next | /ops/library/build-packets | Build packet admin review should open live build packet library tab. |
| shrv1 | admin.html#/ops/screenshot-qa | shf-next | /ops/qa | Screenshot QA/admin review should open live QA + Delivery workflow. |
| shf-next | /ops/clientops | shrv1 | admin.html#/agent-fabric | ClientOps should be able to review governance/Agent Fabric status. |
| shf-next | /ops/clientops | shrv1 | admin.html#/reports | ClientOps monthly/reporting workflow should open trust-aware reports admin. |
| shf-next | /foundation/data-approval | shrv1 | admin.html#/truth-spine | Approval Gateway should link to Truth Spine authority for internal users. |
| shf-next | /foundation/impact-report | shrv1 | admin.html#/reports | Impact report generator should link back to verified/report readiness admin. |
| shf-next | /studio/templates | shrv1 | admin.html#/builder | Template marketplace should link to BuilderHub/admin governance for internal users. |

## Duplicate / Conflict Findings

| surface | shrv1 | shf_next | risk |
| --- | --- | --- | --- |
| /studio/templates | public WebMakerPage and admin BuilderHub route alias | WebsiteStudioTemplates and browse/preview marketplace | Same pathname used in both apps; port/context decides app, but ownership is unclear. |
| Production Ops / projects | admin.html#/ops/projects and production ops steps | /ops/projects live production dashboard | Same operational concept split across apps; data sync/canonical owner not defined. |
| Build Packets / Development Library | admin.html#/ops/build-packet | /ops/library/build-packets | Overlapping workflow names; likely cross-link, not merge. |
| Brand Kit / Brand Profile | admin.html#/ops/brand-profile | /ops/library/brand-engine | Possible duplicate brand source of truth. |
| Reports | admin.html#/reports and /reporting trust surfaces | /foundation/impact-report and print | Shared term but different ownership: trust/admin vs presentation/print. |

## Owner Decisions Required

| decision | options |
| --- | --- |
| Choose canonical public /studio/templates owner | shrv1 WebMaker public page, shf-next WebsiteStudio marketplace, keep split by host/port with explicit cross-links |
| Decide whether shf-next live ops or shrv1 admin ops owns canonical Production Ops data | shf-next live owner, shrv1 admin owner, shared with bridge metadata |
| Define route bridge base URLs for local/dev/prod | environment variables, static docs only, small future route bridge config |
| Determine whether shf-next /terms, /privacy, /contact should be real public pages or external links | add shf-next pages later, link to existing public legal pages, remove footer links later |
| Resolve shf-next template slug routing for all templates | dedicated preview route for all slugs, one dynamic preview component, keep only floral preview |
| Decide whether shrv1 AdminSidebar legacy /admin, /admin/users, /admin/settings, /health should remain | mount pages, remove links, redirect to existing identity/audit/health surfaces |

## Routing Risks

| risk | detail |
| --- | --- |
| Different routing models | shrv1 uses multi-entry HTML plus HashRouter in admin.html; shf-next uses pathname SPA routing. Relative links cannot cross apps reliably without an absolute base URL. |
| Different localhost ports expected | shrv1 Vite commonly runs on 5174 in recent smoke; shf-next can also use Vite defaults/preview. Cross-app links need environment-specific base URLs. |
| shf-next is not a git repository here | git -C /Users/mikeslate/shf-next status fails; validation can run, but repo status cannot be reported from Git. |
| shf-next public footer links fall into app fallback | /terms, /privacy, /contact are linked from studio browse but are not routed branches; likely render OpsShell default DevelopmentLibrary. |
| shf-next studio slug paths are partially handled | /studio/templates/floral-boutique has dedicated preview; other /studio/templates/:slug paths are captured by base templates route. |
| shrv1 has admin sidebar links without routes | /admin, /admin/users, /admin/settings, /health remain unresolved from the route integrity plan. |
| shrv1 command center hardcodes local shf-next report URL in dev | SHFImpactCommandCenter uses 127.0.0.1:5174 for foundation impact report in dev; needs formal bridge config before production. |
| Same route names mean different things on different apps | /ops/projects and /studio/templates can exist in both app contexts; host/port must disambiguate. |

## Implementation Phases

### phase_1_document_ownership
- Approve this route ownership map as the source for future route bridge work.
- Keep shrv1 governance/admin surfaces separate from shf-next live ops/presentation surfaces.
### phase_2_shrv1_links
- Add environment-safe links from shrv1 Command/Reports/Truth/Builder/Ops pages to shf-next routes after owner approval.
- Do not add links until base URL is configured or explicitly accepted.
### phase_3_shf_next_links
- Add internal-only links from shf-next ClientOps/Data Approval/Impact Report/Studio routes back to shrv1 governance pages.
- Keep public template/report pages free of admin-only assumptions.
### phase_4_owner_decisions
- Resolve /studio/templates ownership.
- Resolve Production Ops and Brand Kit canonical data ownership.
- Resolve unhandled shf-next footer and template slug routes.
### phase_5_bridge_config
- Optional future config: SHRV1_ADMIN_BASE, SHF_NEXT_BASE, routeBridge map, public-safe vs admin-only link flags.
- Only create if repeated cross-app links would otherwise hardcode localhost or production URLs.

## Validation Results

| Command | Result |
| --- | --- |
| `npm run check:governance` in shrv1 | PASS |
| `npm run build` in shrv1 | PASS with existing large chunk warnings |
| `npm run build` in shf-next | PASS with existing chunk warning; sandbox escalation used for TypeScript tsbuildinfo writes |
| `npm run lint` in shf-next | PASS |
| `git -C /Users/mikeslate/shf-next status --short` | Not a git repository in this environment |

## V1 Complete

Yes. SHRV1 ↔ SHF-Next Route Bridge Audit V1 is complete as an audit-only route ownership and cross-app link planning artifact.
