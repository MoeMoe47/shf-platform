# Full Page Spine Connection Audit V1

Generated: 2026-06-14T19:37:48

## Executive Summary

- Audited `/Users/mikeslate/Desktop/shrv1` and `/Users/mikeslate/shf-next` without changing route/source/runtime behavior.
- Inventory found 479 active `src/pages` source files: 468 in shrv1 and 11 in shf-next.
- Route inventory found 64 shrv1 admin hash routes and 18 shf-next manual path/nav entries.
- Spine classification: 154 connected, 44 partially connected, 1 visual-only, 80 not connected, 200 unknown/helper-like.
- Navigation gap: 7 shrv1 sidebar links do not have a matching AdminRoutes route and likely fall back to Hub.
- V1 is an audit report only. It does not assert that disconnected pages are broken; it identifies where future connection or owner decisions may be needed.

## Inventory Counts

| Folder | Pages | Routes |
| --- | --- | --- |
| shrv1 | 468 | 64 |
| shf-next | 11 | 18 |

## Route Inventory

| folder | route | component | page_path | protected | permissions | notes |
| --- | --- | --- | --- | --- | --- | --- |
| shrv1 | admin.html#/login | SHSLoginPage | src/pages/auth/SHSLoginPage.jsx | False |  |  |
| shrv1 | admin.html#/ | Navigate | None | False |  | redirect/fallback |
| shrv1 | admin.html#/hub | HubWorkspaceDashboard | src/pages/hub/HubWorkspaceDashboard.jsx | True |  |  |
| shrv1 | admin.html#/hub/network | HubLeadershipDashboard | src/pages/hub/HubLeadershipDashboard.jsx | True |  |  |
| shrv1 | admin.html#/hub/leadership | HubLeadershipDashboard | src/pages/hub/HubLeadershipDashboard.jsx | True |  |  |
| shrv1 | admin.html#/hub/intake | IntakeNavigatorConsole | src/pages/hub/IntakeNavigatorConsole.jsx | True |  |  |
| shrv1 | admin.html#/hub/queue | PartnerActionQueue | src/pages/hub/PartnerActionQueue.jsx | True |  |  |
| shrv1 | admin.html#/hub/action-queue | PartnerActionQueue | src/pages/hub/PartnerActionQueue.jsx | True |  |  |
| shrv1 | admin.html#/hub/lifecycle | ReferralLifecycleView | src/pages/hub/ReferralLifecycleView.jsx | True |  |  |
| shrv1 | admin.html#/hub/referrals | ReferralLifecycleView | src/pages/hub/ReferralLifecycleView.jsx | True |  |  |
| shrv1 | admin.html#/hub/unmet-needs | UnmetNeedsQueue | src/pages/hub/UnmetNeedsQueue.jsx | True |  |  |
| shrv1 | admin.html#/hub/imports | HubFilesImports | src/pages/hub/HubFilesImports.jsx | True |  |  |
| shrv1 | admin.html#/hub/reports | HubReports | src/pages/hub/HubReports.jsx | True |  |  |
| shrv1 | admin.html#/hub/growth-network | HubGrowthNetwork | src/pages/hub/HubGrowthNetwork.jsx | True |  |  |
| shrv1 | admin.html#/hub/sales-pipeline | HubSalesPipelinePage | src/pages/hub/HubSalesPipelinePage.jsx | True |  |  |
| shrv1 | admin.html#/hub/opportunities | HubOpportunitiesPage | src/pages/hub/HubOpportunitiesPage.jsx | True |  |  |
| shrv1 | admin.html#/hub/bundles | HubBundleBuilderPage | src/pages/hub/HubBundleBuilderPage.jsx | True |  |  |
| shrv1 | admin.html#/hub/intelligence | HubIntelligencePage | src/pages/hub/HubIntelligencePage.jsx | True |  |  |
| shrv1 | admin.html#/uploads | UploadManager | None | True | UPLOADS_INTERNAL |  |
| shrv1 | admin.html#/imports | HubFilesImports | src/pages/hub/HubFilesImports.jsx | True | UPLOADS_INTERNAL |  |
| shrv1 | admin.html#/aggregation | AggregationDashboard | src/pages/admin/aggregation/AggregationDashboard.jsx | True | AGGREGATION_VIEW |  |
| shrv1 | admin.html#/reporting | ReportingCommandSurface | src/pages/admin/reporting/ReportingCommandSurface.jsx | True | REPORTS_VIEW |  |
| shrv1 | admin.html#/reports | ReportingCommandSurface | src/pages/admin/reporting/ReportingCommandSurface.jsx | True | REPORTS_VIEW |  |
| shrv1 | admin.html#/command | SHFImpactCommandCenter | src/pages/shf-command/SHFImpactCommandCenter.jsx | True | AUDIT_VIEW |  |
| shrv1 | admin.html#/command-center | SHFImpactCommandCenter | src/pages/shf-command/SHFImpactCommandCenter.jsx | True | AUDIT_VIEW |  |
| shrv1 | admin.html#/dashboard | WorkspaceDashboard | src/pages/exchange/WorkspaceDashboard.jsx | True | AUDIT_VIEW |  |
| shrv1 | admin.html#/loo | Navigate | None | False |  | redirect/fallback |
| shrv1 | admin.html#/watchtower | Navigate | None | False |  | redirect/fallback |
| shrv1 | admin.html#/lord-outcomes/* | LordOutcomesRoutes | src/router/LordOutcomesRoutes.jsx | True | AUDIT_VIEW |  |
| shrv1 | admin.html#/verification-audit | VerificationAuditSurface | src/pages/admin/reporting/VerificationAuditSurface.jsx | True | VERIFICATION_VIEW |  |
| shrv1 | admin.html#/truth-spine | TruthSpinePage | src/pages/admin/truth-spine/TruthSpinePage.jsx | True | TRUTH_VIEW |  |
| shrv1 | admin.html#/oracle | OraclePage | src/pages/admin/oracle/OraclePage.jsx | True | TRUTH_VIEW |  |
| shrv1 | admin.html#/ai-guardrails | AIGuardrailsPage | src/pages/admin/ai-guardrails/AIGuardrailsPage.jsx | True | TRUTH_VIEW |  |
| shrv1 | admin.html#/game-theory | GameTheoryPage | src/pages/admin/game-theory/GameTheoryPage.jsx | True | TRUTH_VIEW |  |
| shrv1 | admin.html#/agent-fabric | AgentFabricPage | src/pages/admin/agent-fabric/AgentFabricPage.jsx | True | AUDIT_VIEW |  |
| shrv1 | admin.html#/audit | AuditLogViewer | None | True | AUDIT_VIEW |  |
| shrv1 | admin.html#/identity | IdentityManagement | None | True | IDENTITY_VIEW |  |
| shrv1 | admin.html#/app-registry | AppRegistry | src/pages/admin/AppRegistry.jsx | True |  |  |
| shrv1 | admin.html#/registry | Registry | src/pages/admin/Registry.jsx | True |  |  |
| shrv1 | admin.html#/builder | BuilderHub | src/pages/admin/BuilderHub.jsx | True |  |  |
| shrv1 | admin.html#/web-maker | BuilderHub | src/pages/admin/BuilderHub.jsx | True |  |  |
| shrv1 | admin.html#/studio/templates | BuilderHub | src/pages/admin/BuilderHub.jsx | True |  |  |
| shrv1 | admin.html#/builder/tools | ToolDashboard | src/pages/admin/ToolDashboard.jsx | True |  |  |
| shrv1 | admin.html#/tools | ToolDashboard | src/pages/admin/ToolDashboard.jsx | True |  |  |
| shrv1 | admin.html#/tool-dashboard | ToolDashboard | src/pages/admin/ToolDashboard.jsx | True |  |  |
| shrv1 | admin.html#/master-narrative | MasterNarrativeViewer | src/pages/admin/MasterNarrativeViewer.jsx | True |  |  |
| shrv1 | admin.html#/grant-binder | GrantBinder | src/pages/admin/GrantBinder.jsx | True |  |  |
| shrv1 | admin.html#/alignment | AlignmentSwitchboard | src/pages/admin/AlignmentSwitchboard.jsx | True |  |  |
| shrv1 | admin.html#/growth | SHSPartnerGrowthEngine | src/pages/admin/growth/SHSPartnerGrowthEngine.jsx | True | GROWTH_VIEW |  |
| shrv1 | admin.html#/ops/production | OpsProductionDashboard | src/pages/admin/ops/OpsProductionDashboard.jsx | True |  |  |
| shrv1 | admin.html#/ops/projects | OpsProjectSetup | src/pages/admin/ops/OpsProjectSetup.jsx | True |  |  |
| shrv1 | admin.html#/ops/brand-profile | OpsBrandProfile | src/pages/admin/ops/OpsBrandProfile.jsx | True |  |  |
| shrv1 | admin.html#/ops/page-intent | OpsPageIntent | src/pages/admin/ops/OpsPageIntent.jsx | True |  |  |
| shrv1 | admin.html#/ops/layout-blueprint | OpsLayoutBlueprint | src/pages/admin/ops/OpsLayoutBlueprint.jsx | True |  |  |
| shrv1 | admin.html#/ops/visual-treatment | OpsVisualTreatment | src/pages/admin/ops/OpsVisualTreatment.jsx | True |  |  |
| shrv1 | admin.html#/ops/assets | OpsAssetGovernance | src/pages/admin/ops/OpsAssetGovernance.jsx | True |  |  |
| shrv1 | admin.html#/ops/data-binding | OpsDataBinding | src/pages/admin/ops/OpsDataBinding.jsx | True |  |  |
| shrv1 | admin.html#/ops/mock-review | OpsMockReview | src/pages/admin/ops/OpsMockReview.jsx | True |  |  |
| shrv1 | admin.html#/ops/build-packet | OpsBuildPacket | src/pages/admin/ops/OpsBuildPacket.jsx | True |  |  |
| shrv1 | admin.html#/ops/screenshot-qa | OpsScreenshotQA | src/pages/admin/ops/OpsScreenshotQA.jsx | True |  |  |
| shrv1 | admin.html#/ops/learning | OpsLearningDashboard | src/pages/admin/ops/OpsLearningDashboard.jsx | True |  |  |
| shrv1 | admin.html#/solutions | SolutionsInfrastructurePage | src/pages/solutions/SolutionsInfrastructurePage.jsx | True |  |  |
| shrv1 | admin.html#/solutions/infrastructure | SolutionsInfrastructurePage | src/pages/solutions/SolutionsInfrastructurePage.jsx | True |  |  |
| shrv1 | admin.html#* | Navigate | None | False |  | redirect/fallback |
| shf-next | /studio/templates/floral-boutique | WebsiteStudioTemplatePreview | None | False |  | manual pathname branch |
| shf-next | /studio/templates/browse | WebsiteStudioTemplateBrowse | None | False |  | manual pathname branch |
| shf-next | /studio/templates | WebsiteStudioTemplates | None | False |  | manual pathname branch |
| shf-next | /foundation/impact-report/print | ShfImpactReportPrintPage | None | False |  | manual pathname branch |
| shf-next | /foundation/data-approval | ShfDataApprovalGateway | None | False |  | manual pathname branch |
| shf-next | /foundation/impact-report | ShfImpactReportGenerator | None | False |  | manual pathname branch |
| shf-next | /ops/command | OpsCommandOverview | None | False |  | manual pathname branch inside OpsShell |
| shf-next | /ops/projects | ProductionProjects | None | False |  | manual pathname branch inside OpsShell |
| shf-next | /ops/qa | QADeliveryDashboard | None | False |  | manual pathname branch inside OpsShell |
| shf-next | /ops/clientops | ClientOpsCenter | None | False |  | manual pathname branch inside OpsShell |
| shf-next | /ops/sales | SalesCommandCenter | None | False |  | manual pathname branch inside OpsShell |
| shf-next | /ops/library | DevelopmentLibrary | None | False |  | manual pathname branch inside OpsShell |
| shf-next | /ops/command | None | None | False |  | ops nav link: Command Overview |
| shf-next | /ops/sales | None | None | False |  | ops nav link: Sales Command Center |
| shf-next | /ops/projects | None | None | False |  | ops nav link: Production Projects |
| shf-next | /ops/library | None | None | False |  | ops nav link: Development Library |
| shf-next | /ops/qa | None | None | False |  | ops nav link: QA + Delivery |
| shf-next | /ops/clientops | None | None | False |  | ops nav link: ClientOps Center |

## Sidebar / Nav Inventory

| folder | to | label | source_file |
| --- | --- | --- | --- |
| shrv1 | admin.html#/ops/production | Production | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/projects | Projects | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/brand-profile | Brand Profile | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/page-intent | Page Intent | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/layout-blueprint | Layout Blueprint | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/visual-treatment | Visual Treatment | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/assets | Assets | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/data-binding | Data Binding | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/mock-review | Mock Review | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/build-packet | Build Packet | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/screenshot-qa | Screenshot QA | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ops/learning | Learning | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/command | Command Center | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/dashboard | Dashboard | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/reports | Reports | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/builder | Website Studio | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/builder/tools | Tool Dashboard | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/admin | Admin Home | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/admin/users | Users | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/admin/settings | Settings | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/analytics | App Analytics | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/lord-outcomes | Lord of Outcomes | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/registry | Registry | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/truth-spine | Truth Spine | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/oracle | Oracle | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/ai-guardrails | AI Guardrails | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/game-theory | Game Theory | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/agent-fabric | Agent Fabric | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/dev/docs | Docs | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/health | Health | src/components/admin/AdminSidebar.jsx |

## Connected Pages

| folder | file_path | likely_route | page_type | connected_systems | evidence |
| --- | --- | --- | --- | --- | --- |
| shrv1 | src/pages/AdminCompare.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/AdminCreditDebug.jsx | None | unknown | LOO | LOO: matched `loo`, localStorage keys: shf.credit.ledger.v1, shf.credit.state.v1 |
| shrv1 | src/pages/AdminDashboard.jsx | None | admin | LOO | LOO: matched `loo`, API/path refs: /admin/alerts, /admin/analytics, /admin/cohorts, /admin/relayer |
| shrv1 | src/pages/AdminLearningHeatmap.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/AdminRelayer.jsx | None | unknown | LOO | LOO: matched `loo`, localStorage keys: relayer:stats, API/path refs: /admin, /admin/analytics |
| shrv1 | src/pages/Coach.jsx | None | dashboard | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/MasterUnit.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/PathwaysExplore.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/admin/AppRegistry.jsx | admin.html#/app-registry | admin | LOO, Registry | LOO: matched `\bLOO\b`, Registry: matched `registry`, API/path refs: /admin.html#/registry |
| shrv1 | src/pages/admin/BuilderHub.jsx | admin.html#/builder; admin.html#/web-maker; admin.html#/studio/templates | admin | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `loo`, API/path refs: /admin.html#/builder |
| shrv1 | src/pages/admin/InvestorNorthstar.jsx | None | admin | LOO, Identity | LOO: matched `outcomes`, Identity: matched `identity`, API/path refs: /admin.html#/binder |
| shrv1 | src/pages/admin/Registry.jsx | admin.html#/registry | admin | Registry | Registry: matched `registry`, API/path refs: /admin/registry, /admin/registry/upsert |
| shrv1 | src/pages/admin/ReportsDashboard.jsx | None | admin | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `outcomes`, API/path refs: /reports/export/containment.csv, /reports/export/outcomes.csv, /reports/export/system-health.csv, /reports/export/usage.csv, /reports/snapshot |
| shrv1 | src/pages/admin/ToolDashboard.jsx | admin.html#/builder/tools; admin.html#/tools; admin.html#/tool-dashboard | admin | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `loo`, API/path refs: /admin.html#/binder, /admin.html#/master-narrative, /admin.html#/partner-jobs, /admin.html#/placement-kpis, /admin.html#/tool-dashboard |
| shrv1 | src/pages/admin/agent-fabric/AgentFabricPage.jsx | admin.html#/agent-fabric | admin | Truth Spine, Oracle, AI Guardrails, Game Theory, Agent Fabric | Truth Spine: matched `truth[-_ ]?spine`, Oracle: matched `\boracle\b`, AI Guardrails: matched `ai[-_ ]?guardrails`, Game Theory: matched `game[-_ ]?theory`, Agent Fabric: matched `agent[-_ ]?fabric` |
| shrv1 | src/pages/admin/aggregation/AggregationCommandBar.jsx | None | admin | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/admin/aggregation/AggregationDashboard.jsx | admin.html#/aggregation | admin | Truth Spine, Oracle, Reports, LOO, Registry | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `outcomes`, Registry: matched `registry` |
| shrv1 | src/pages/admin/aggregation/AggregationOverview.jsx | None | admin | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `outcomes` |
| shrv1 | src/pages/admin/aggregation/EntityResolutionQueue.jsx | None | admin | Oracle | Oracle: matched `\boracle\b` |
| shrv1 | src/pages/admin/aggregation/LineageExplorer.jsx | None | admin | Oracle | Oracle: matched `\boracle\b` |
| shrv1 | src/pages/admin/aggregation/LiveBridgePanel.jsx | None | admin | Truth Spine, Reports, Identity | Truth Spine: matched `trustEnvelope`, Reports: matched `\breports?\b`, Identity: matched `identity` |
| shrv1 | src/pages/admin/aggregation/MappingRegistry.jsx | None | admin | Truth Spine, Oracle, Reports, LOO, Registry | Truth Spine: matched `trust envelope`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `outcomes`, Registry: matched `registry` |
| shrv1 | src/pages/admin/aggregation/ReconciliationWorkbench.jsx | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/aggregation/VerificationWorkbench.jsx | None | admin | Oracle | Oracle: matched `\boracle\b` |
| shrv1 | src/pages/admin/aggregation/adapters.ts | None | admin | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `outcomes` |
| shrv1 | src/pages/admin/aggregation/aggregation-readiness-model.js | None | admin | Truth Spine, Oracle, Reports, LOO | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `Reporting`, LOO: matched `outcomes` |
| shrv1 | src/pages/admin/aggregation/bridge-demo.ts | None | admin | Truth Spine, Reports | Truth Spine: matched `trustEnvelope`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/aggregation/mockData.ts | None | admin | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `outcomes` |
| shrv1 | src/pages/admin/aggregation/oracle-row-readiness.js | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/ai-guardrails/AIGuardrailsPage.jsx | admin.html#/ai-guardrails | admin | Truth Spine, Oracle, AI Guardrails, Reports | Truth Spine: matched `truth[-_ ]?spine`, Oracle: matched `\boracle\b`, AI Guardrails: matched `ai[-_ ]?guardrails`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/audit/AuditLogViewer.jsx | None | admin | Registry, Identity | Registry: matched `registry`, Identity: matched `identity` |
| shrv1 | src/pages/admin/game-theory/GameTheoryPage.jsx | admin.html#/game-theory | admin | Truth Spine, Oracle, Game Theory | Truth Spine: matched `truth[-_ ]?spine`, Oracle: matched `\boracle\b`, Game Theory: matched `game[-_ ]?theory` |
| shrv1 | src/pages/admin/growth/SHSPartnerGrowthEngine.jsx | admin.html#/growth | admin | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `loo`, localStorage keys: shs_growth_adaptive_events_v1, shs_growth_converted_opportunity_actions_v1, shs_growth_converted_signals_v1, shs_growth_feedback_events_v1 |
| shrv1 | src/pages/admin/growth/partnerGrowthTourSteps.js | None | admin | Reports, LOO, Identity | Reports: matched `\breports?\b`, LOO: matched `loo`, Identity: matched `identity` |
| shrv1 | src/pages/admin/identity/IdentityManagement.jsx | None | admin | Registry, Identity | Registry: matched `registry`, Identity: matched `identity` |
| shrv1 | src/pages/admin/ops/OpsProductionDashboard.jsx | admin.html#/ops/production | admin | LOO, Production Ops | LOO: matched `loo`, Production Ops: matched `Production Ops` |
| shrv1 | src/pages/admin/ops/opsData.js | None | admin | Reports, LOO, Identity, Production Ops | Reports: matched `\breports?\b`, LOO: matched `loo`, Identity: matched `identity`, Production Ops: matched `Production Ops`, API/path refs: /admin.html#/growth, /hub/intake, /ops/assets, /ops/brand-profile, /ops/build-packet, /ops/data-bind |
| shrv1 | src/pages/admin/ops/opsStorage.js | None | admin | LOO, Production Ops | LOO: matched `loo`, Production Ops: matched `production project` |
| shrv1 | src/pages/admin/oracle/OraclePage.jsx | admin.html#/oracle | admin | Truth Spine, Oracle | Truth Spine: matched `truth[-_ ]?spine`, Oracle: matched `\boracle\b` |
| shrv1 | src/pages/admin/reporting/ActionLogExportPanel.jsx | None | admin | Truth Spine, Reports | Truth Spine: matched `trust envelope`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/AnalystMemoExportPanel.jsx | None | admin | Truth Spine, Oracle, Reports, LOO | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `outcomes` |
| shrv1 | src/pages/admin/reporting/AuditPackPanel.jsx | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `trust envelope`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/BriefingExportPanel.jsx | None | admin | Truth Spine, Reports, LOO | Truth Spine: matched `trustEnvelope`, Reports: matched `\breports?\b`, LOO: matched `loo` |
| shrv1 | src/pages/admin/reporting/ExportReadinessCard.jsx | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/ReportingCommandSurface.jsx | admin.html#/reporting; admin.html#/reports | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/analyst/oracle-memo-adapter.js | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/export-audit-trail.js | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `trustEnvelope`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/oracle-action-adapter.ts | None | admin | Oracle, Reports | Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/oracle-backend-adapter.ts | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/oracle-compare-adapter.ts | None | admin | Oracle, Reports | Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/oracle-priority-adapter.ts | None | admin | Oracle, Reports | Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/oracle-reporting-guard.ts | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `trustEnvelope`, Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/reporting-actions.ts | None | admin | Truth Spine, Reports | Truth Spine: matched `trust envelope`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/reporting-command-model.js | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/reporting-readiness.ts | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `trustEnvelope`, Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/reporting-trace-actions.ts | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `trust envelope`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/reporting-trace-query.ts | None | admin | Truth Spine, Reports | Truth Spine: matched `trustEnvelope`, Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/reporting-trace-routes.ts | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `trust envelope`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/reporting-trace.ts | None | admin | Truth Spine, Oracle, Reports | Truth Spine: matched `trust envelope`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/truth-spine/TruthSpinePage.jsx | admin.html#/truth-spine | admin | Truth Spine, Reports, Registry | Truth Spine: matched `truth[-_ ]?spine`, Reports: matched `\breports?\b`, Registry: matched `registry` |
| shrv1 | src/pages/admin/uploads/UploadManager.jsx | None | admin | Registry | Registry: matched `registry` |
| shrv1 | src/pages/capital/OperatorControlPanel.base.jsx | None | internal | LOO | LOO: matched `loo` |
| shrv1 | src/pages/career/CareerDashboardNorthstar.jsx | None | dashboard | Truth Spine, LOO | Truth Spine: matched `\btruth\b`, LOO: matched `outcomes` |
| shrv1 | src/pages/civic/CommunityImpact.jsx | None | dashboard | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/civic/DashboardNorthstar.jsx | None | dashboard | LOO | LOO: matched `loo` |
| shrv1 | src/pages/civic/Profile.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/debt/DebtClock.jsx | None | unknown | LOO | LOO: matched `loo` |
| shrv1 | src/pages/employer/Verifier.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/exchange/AnalystPredictionCard.LOOP_STOP_CHECKPOINT.jsx | None | internal | LOO | LOO: matched `loo` |
| shrv1 | src/pages/exchange/CommandCenter.EVENT_CONFIRMED.jsx | None | command center | Watchtower, LOO, Registry | Watchtower: matched `watchtower`, LOO: matched `loo`, Registry: matched `registry` |
| shrv1 | src/pages/exchange/CommandCenter.LOOP_STOP_CHECKPOINT.jsx | None | command center | Watchtower, LOO, Registry | Watchtower: matched `watchtower`, LOO: matched `loo`, Registry: matched `registry` |
| shrv1 | src/pages/exchange/CommandCenter.STABLE_AFTER_RECOVERY.jsx | None | command center | Watchtower, LOO, Registry | Watchtower: matched `watchtower`, LOO: matched `loo`, Registry: matched `registry` |
| shrv1 | src/pages/exchange/CommandCenter.STABLE_WITH_CARD.jsx | None | command center | Watchtower, LOO, Registry | Watchtower: matched `watchtower`, LOO: matched `loo`, Registry: matched `registry` |
| shrv1 | src/pages/exchange/CommandCenter.jsx | None | command center | Truth Spine | Truth Spine: matched `\btruth\b` |
| shrv1 | src/pages/exchange/CommandCenterStats.jsx | None | command center | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/exchange/ExchangeLayout.jsx | None | command center | Truth Spine | Truth Spine: matched `\btruth\b` |
| shrv1 | src/pages/exchange/GlobeScene.LOOP_STOP_CHECKPOINT.jsx | None | internal | LOO | LOO: matched `loo` |
| shrv1 | src/pages/exchange/InvestorDashboard.jsx | None | dashboard | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/exchange/SHSCommandSurface.jsx | None | command center | Truth Spine, Oracle, Reports, LOO | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `Reporting`, LOO: matched `outcomes` |
| shrv1 | src/pages/exchange/command-surface/commandSurfaceTourSteps.js | None | command center | Truth Spine, Oracle, Reports, LOO | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `outcomes` |
| shrv1 | src/pages/exchange/commandCenterAdapter.js | None | command center | Watchtower, LOO | Watchtower: matched `watchtower`, LOO: matched `outcomes` |
| shrv1 | src/pages/exchange/components/SHSCommandHeader.jsx | None | report | Truth Spine, Oracle, Reports | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `Reporting` |
| shrv1 | src/pages/exchange/unified-truth/SHSUnifiedTruthShell.jsx | None | report | Truth Spine, Oracle, Reports, LOO, Identity | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `outcomes`, Identity: matched `identity` |
| shrv1 | src/pages/exchange/unified-truth/UnifiedTruthMapRoute.jsx | None | internal | Truth Spine | Truth Spine: matched `\btruth\b` |
| shrv1 | src/pages/exchange/unified-truth/components/OperatorIdentityBadge.jsx | None | internal | Truth Spine, Identity | Truth Spine: matched `\btruth\b`, Identity: matched `identity` |
| shrv1 | src/pages/exchange/unified-truth/components/SHSOperationalMapboxMap.jsx | None | internal | Truth Spine, Oracle, Reports, LOO | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `Reporting`, LOO: matched `loo`, localStorage keys: shs_operational_map_context |
| shrv1 | src/pages/exchange/unified-truth/unifiedTruthCommandTourSteps.js | None | report | Truth Spine, Oracle, Reports, LOO | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `loo` |
| shrv1 | src/pages/exchange/unified-truth/useOperatorIdentity.js | None | internal | Truth Spine, Identity | Truth Spine: matched `\btruth\b`, Identity: matched `identity` |
| shrv1 | src/pages/exchange/useCommandCenterData.js | None | command center | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/exchange/workspace-dashboard/components/BottomDock.jsx | None | dashboard | Truth Spine, Oracle | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b` |
| shrv1 | src/pages/exchange/workspace-dashboard/components/CalendarPanel.jsx | None | dashboard | Oracle, Reports | Oracle: matched `\boracle\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/exchange/workspace-dashboard/components/PanelView.jsx | None | dashboard | Truth Spine, Oracle, Reports, LOO, Identity | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `loo`, Identity: matched `identity` |
| shrv1 | src/pages/exchange/workspace-dashboard/components/ReportsPanel.jsx | None | dashboard | Truth Spine, Reports | Truth Spine: matched `\btruth\b`, Reports: matched `\breports?\b` |
| shrv1 | src/pages/exchange/workspace-dashboard/components/RightStack.jsx | None | dashboard | Truth Spine, Oracle, Reports | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, localStorage keys: shs.commandContext |
| shrv1 | src/pages/exchange/workspace-dashboard/data/dashboardData.js | None | command center | Truth Spine, Oracle, Reports, Identity | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, Identity: matched `identity` |
| shrv1 | src/pages/foundation/PublicApps.jsx | None | foundation | LOO, Registry | LOO: matched `loo`, Registry: matched `registry` |
| shrv1 | src/pages/hub/HubBundleBuilderPage.jsx | admin.html#/hub/bundles | internal | Reports, LOO | Reports: matched `Reporting`, LOO: matched `outcomes` |
| shrv1 | src/pages/hub/HubFilesImports.jsx | admin.html#/hub/imports; admin.html#/imports | internal | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `outcomes`, API/path refs: /hub/intake, /hub/lifecycle, /hub/network, /hub/queue, /hub/reports |
| shrv1 | src/pages/hub/HubGrowthNetwork.jsx | admin.html#/hub/growth-network | internal | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `outcomes`, localStorage keys: shs_hub_intelligence_feedback_v1 |
| shrv1 | src/pages/hub/HubIntelligencePage.jsx | admin.html#/hub/intelligence | internal | Reports, LOO | Reports: matched `Reporting`, LOO: matched `loo` |
| shrv1 | src/pages/hub/HubReports.jsx | admin.html#/hub/reports | report | Truth Spine, Oracle, Reports, LOO | Truth Spine: matched `truth[-_ ]?spine`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `loo`, API/path refs: /hub/imports, /hub/intake, /hub/lifecycle, /hub/network, /hub/queue, /hub/reports |
| shrv1 | src/pages/hub/HubWorkspaceDashboard.jsx | admin.html#/hub | dashboard | Truth Spine, Oracle, Reports, LOO, Registry | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `outcomes`, Registry: matched `registry` |
| shrv1 | src/pages/hub/IntakeNavigatorConsole.jsx | admin.html#/hub/intake | internal | Truth Spine, Reports | Truth Spine: matched `truth[-_ ]?spine`, Reports: matched `\breports?\b`, API/path refs: /admin.html#/hub, /hub/lifecycle, /hub/network, /hub/queue, /hub/reports |
| shrv1 | src/pages/hub/PartnerActionQueueV2.jsx | None | report | Truth Spine, Oracle, Reports, Identity | Truth Spine: matched `truth[-_ ]?spine`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, Identity: matched `identity`, API/path refs: /hub, /hub/intake, /hub/lifecycle, /hub/network, /hub/queue, /hub/reports |
| shrv1 | src/pages/hub/UnmetNeedsQueue.jsx | admin.html#/hub/unmet-needs | internal | Registry | Registry: matched `registry` |
| shrv1 | src/pages/hub/shared/hubBusinessNetworkData.js | None | report | Reports, LOO | Reports: matched `Reporting`, LOO: matched `outcomes` |
| shrv1 | src/pages/hub/shared/hubBusinessNetworkScoring.js | None | internal | Reports, LOO | Reports: matched `Reporting`, LOO: matched `outcomes` |
| shrv1 | src/pages/hub/shared/hubLifecycleSignals.js | None | internal | Reports, LOO | Reports: matched `Reporting`, LOO: matched `loo` |
| shrv1 | src/pages/hub/shared/hubQueueWorkflowSignals.js | None | internal | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `loo` |
| shrv1 | src/pages/hub/shared/hubTourSteps.js | None | report | Truth Spine, Oracle, Reports, LOO, Registry | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `loo`, Registry: matched `registry` |
| shrv1 | src/pages/hub/shared/hubWorkflowReadiness.js | None | report | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `loo` |
| shrv1 | src/pages/iep-command/IEPCommandCenter.jsx | None | command center | Reports, LOO, Identity | Reports: matched `\breports?\b`, LOO: matched `outcomes`, Identity: matched `identity` |
| shrv1 | src/pages/iep-command-v2/countyProfiles.js | None | report | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `loo` |
| shrv1 | src/pages/lordOutcomes/EmployerImpactPage.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/lordOutcomes/FundingImpactPage.jsx | None | unknown | LOO | LOO: matched `loo` |
| shrv1 | src/pages/lordOutcomes/LordOutcomesHome.jsx | None | unknown | Truth Spine, Reports, LOO, Registry | Truth Spine: matched `\btruth\b`, Reports: matched `Reporting`, LOO: matched `Lord of Outcomes`, Registry: matched `registry` |
| shrv1 | src/pages/lordOutcomes/PilotLauncher.jsx | None | report | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `\bLOO\b` |
| shrv1 | src/pages/lordOutcomes/ProgramOutcomesPage.jsx | None | unknown | LOO | LOO: matched `lord-outcomes` |
| shrv1 | src/pages/lordOutcomes/StateOutcomesPage.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/lordOutcomes/pilots/ActivePilots.jsx | None | report | Reports, LOO | Reports: matched `Reporting`, LOO: matched `\bLOO\b` |
| shrv1 | src/pages/lordOutcomes/pilots/PilotTemplates.jsx | None | unknown | LOO | LOO: matched `\bLOO\b` |
| shrv1 | src/pages/metaverse/BFETestPage.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/metaverse/GrowthObservationTower.jsx | None | unknown | Truth Spine, Watchtower | Truth Spine: matched `\btruth\b`, Watchtower: matched `watchtower` |
| shrv1 | src/pages/metaverse/InterplanetaryMission.jsx | None | unknown | Watchtower, LOO | Watchtower: matched `watchtower`, LOO: matched `\bLOO\b` |
| shrv1 | src/pages/metaverse/components/BFEStatusCard.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/public/WebMakerPage.jsx | None | admin | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `loo` |
| shrv1 | src/pages/sales/Profile.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/shf-command/SHFImpactCommandCenter.jsx | admin.html#/command; admin.html#/command-center | command center | Truth Spine, Oracle, Game Theory, Reports, LOO | Truth Spine: matched `truth[-_ ]?spine`, Oracle: matched `\boracle\b`, Game Theory: matched `game[-_ ]?theory`, Reports: matched `\breports?\b`, LOO: matched `outcomes` |
| shrv1 | src/pages/shf-command/SHFOhioMap.jsx | None | command center | LOO, Identity | LOO: matched `loo`, Identity: matched `identity` |
| shrv1 | src/pages/shf-command/agents/aiAnalystContextAdapter.js | None | command center | Truth Spine, Agent Fabric | Truth Spine: matched `\btruth\b`, Agent Fabric: matched `agent[-_ ]?fabric` |
| shrv1 | src/pages/shf-command/components/SHFImpactOhioMap.jsx | None | command center | SHF Impact Data Spine | SHF Impact Data Spine: matched `shfImpactData` |
| shrv1 | src/pages/shf-command/hooks/useSHFOracle.js | None | command center | Truth Spine, Oracle | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b` |
| shrv1 | src/pages/shf-command/sections/AIAnalystPanel.jsx | None | command center | Truth Spine, Oracle, Agent Fabric, Reports | Truth Spine: matched `truth[-_ ]?spine`, Oracle: matched `\boracle\b`, Agent Fabric: matched `/agent`, Reports: matched `Reporting` |
| shrv1 | src/pages/shf-command/sections/AgentSyncStatus.jsx | None | command center | Truth Spine, Oracle, Agent Fabric, Reports | Truth Spine: matched `truth[-_ ]?spine`, Oracle: matched `\boracle\b`, Agent Fabric: matched `agent[-_ ]?fabric`, Reports: matched `Reporting` |
| shrv1 | src/pages/shf-command/sections/TrustVerificationPanel.jsx | None | command center | Truth Spine, Oracle | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b` |
| shrv1 | src/pages/shf-command/sections/shf-oracle-analyst-adapter.js | None | command center | Truth Spine, Oracle | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b` |
| shrv1 | src/pages/shf-command/sections/shf-oracle-trust-adapter.js | None | command center | Oracle | Oracle: matched `\boracle\b` |
| shrv1 | src/pages/solutions/Home.jsx | None | command center | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `outcomes` |
| shrv1 | src/pages/solutions/SHSBlockchainTransparencyPage.jsx | None | unknown | Truth Spine, LOO | Truth Spine: matched `trust envelope`, LOO: matched `loo` |
| shrv1 | src/pages/solutions/SHSLayersPage.jsx | None | dashboard | Truth Spine, Oracle, Reports, LOO, Identity | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `outcomes`, Identity: matched `identity` |
| shrv1 | src/pages/solutions/SHSMeetTheTeamPage.jsx | None | unknown | LOO | LOO: matched `outcomes` |
| shrv1 | src/pages/solutions/SHSRequestDemoPage.jsx | None | report | Reports, LOO | Reports: matched `Reporting`, LOO: matched `loo` |
| shrv1 | src/pages/solutions/SolutionsHome.jsx | None | command center | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `outcomes` |
| shrv1 | src/pages/solutions/SolutionsInfrastructureLogicPanel.jsx | None | unknown | Oracle, Reports, LOO | Oracle: matched `\boracle\b`, Reports: matched `Reporting`, LOO: matched `outcomes` |
| shrv1 | src/pages/solutions/SolutionsInfrastructurePage.jsx | admin.html#/solutions; admin.html#/solutions/infrastructure | unknown | Truth Spine, Oracle, Reports, LOO, Identity | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, LOO: matched `loo`, Identity: matched `identity` |
| shrv1 | src/pages/solutions/SolutionsMarketplace.jsx | None | unknown | LOO | LOO: matched `loo` |
| shrv1 | src/pages/solutions/solutionsInfrastructureData.js | None | report | Truth Spine, Oracle, Reports, Identity | Truth Spine: matched `\btruth\b`, Oracle: matched `\boracle\b`, Reports: matched `\breports?\b`, Identity: matched `identity` |
| shrv1 | src/pages/treasury/Lesson.jsx | None | unknown | LOO | LOO: matched `loo` |
| shf-next | src/pages/foundation/ShfDataApprovalGateway.tsx | None | foundation | Reports, LOO, SHF Impact Data Spine | Reports: matched `\breports?\b`, LOO: matched `outcomes`, SHF Impact Data Spine: matched `shfImpactData`, API/path refs: /foundation/impact-report |
| shf-next | src/pages/foundation/ShfImpactReportGenerator.tsx | None | foundation | Truth Spine, Reports, LOO, Identity, SHF Impact Data Spine | Truth Spine: matched `\btruth\b`, Reports: matched `\breports?\b`, LOO: matched `outcomes`, Identity: matched `identity`, SHF Impact Data Spine: matched `shfImpactData` |
| shf-next | src/pages/ops/ClientOpsCenter.tsx | None | clientops | AI Guardrails, Reports, LOO, ClientOps, Production Ops | AI Guardrails: matched `OpsAIAssistPanel`, Reports: matched `\breports?\b`, LOO: matched `loo`, ClientOps: matched `clientops`, Production Ops: matched `production project` |
| shf-next | src/pages/studio/WebsiteStudioTemplateBrowse.tsx | None | studio | Reports, LOO | Reports: matched `\breports?\b`, LOO: matched `loo` |
| shf-next | src/pages/studio/WebsiteStudioTemplatePreview.tsx | None | studio | LOO | LOO: matched `loo` |
| shf-next | src/pages/studio/WebsiteStudioTemplates.tsx | None | studio | LOO | LOO: matched `loo` |

## Partially Connected Pages

| folder | file_path | likely_route | page_type | connected_systems | evidence |
| --- | --- | --- | --- | --- | --- |
| shrv1 | src/pages/AllPages.jsx | None | dashboard | Reports | Reports: matched `\breports?\b`, API/path refs: /reports |
| shrv1 | src/pages/Arcade.jsx | None | dashboard | Reports | Reports: matched `\breports?\b`, API/path refs: /admin, /admin/alerts, /admin/analytics, /admin/cohorts, /admin/compare, /admin/credit, /admin/learning-heatmap, /admin/relayer, /admin/zoom |
| shrv1 | src/pages/CreditReport.jsx | None | report | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/GrantBinder.jsx | admin.html#/grant-binder | admin | Reports, Identity | Reports: matched `Reporting`, Identity: matched `identity` |
| shrv1 | src/pages/admin/MasterNarrativeViewer.jsx | admin.html#/master-narrative | admin | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/aggregation/BridgeDemoPanel.jsx | None | admin | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/admin/aggregation/QualityCommandPanel.jsx | None | admin | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/VerificationAuditSurface.jsx | admin.html#/verification-audit | admin | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/analyst/analyst-context-builder.js | None | admin | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/bridge-record-links.ts | None | admin | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/bridge-workflow-store.ts | None | admin | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/export-history-adapter.ts | None | admin | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/admin/reporting/reporting-backend-adapter.ts | None | admin | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/admin/reporting/verification-audit-actions.ts | None | admin | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/arcade/ArcadeDashboardNorthstar.jsx | None | dashboard | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/arcade/ArcadeHistory.jsx | None | unknown | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/arcade/History.jsx | None | report | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/auth/SHSLoginPage.jsx | admin.html#/login | unknown | Identity | Identity: matched `identity`, localStorage keys: shsHubDemoRole, shsUserRole |
| shrv1 | src/pages/civic/ConstitutionJournal.jsx | None | unknown | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/civic/Leaderboard.jsx | None | unknown | Identity | Identity: matched `identity` |
| shrv1 | src/pages/credit/Portfolio.jsx | None | report | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/debt/Education.jsx | None | report | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/exchange/useCommandCenterReportActions.js | None | command center | Reports | Reports: matched `\breports?\b`, localStorage keys: shf.commandCenter.latestBrief, shf.commandCenter.latestBriefUrl |
| shrv1 | src/pages/exchange/workspace-dashboard/components/ConferencePanel.jsx | None | dashboard | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/exchange/workspace-dashboard/components/FilesPanel.jsx | None | dashboard | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/exchange/workspace-dashboard/components/ProfileUploadCard.jsx | None | dashboard | Identity | Identity: matched `identity` |
| shrv1 | src/pages/exchange/workspace-dashboard/dashboardUtils.js | None | dashboard | Reports | Reports: matched `\breports?\b`, localStorage keys: shs.agendaItems, shs.commandActionEvents, shs.dashboard.activePanel, shs.journalEntries, shs.operatorProfile, shs.workspaceFiles, shs.workspaceProfile, shs.workspaceReports |
| shrv1 | src/pages/hub/HubLeadershipDashboard.jsx | admin.html#/hub/network; admin.html#/hub/leadership | dashboard | Reports | Reports: matched `\breports?\b`, API/path refs: /admin.html#/hub, /hub/intake, /hub/lifecycle, /hub/queue, /hub/reports |
| shrv1 | src/pages/hub/HubOpportunitiesPage.jsx | admin.html#/hub/opportunities | internal | Reports | Reports: matched `Reporting`, localStorage keys: shs_hub_opportunity_events_v1 |
| shrv1 | src/pages/hub/HubSalesPipelinePage.jsx | admin.html#/hub/sales-pipeline | internal | Reports | Reports: matched `Reporting`, localStorage keys: shs_hub_sales_pipeline_events_v1 |
| shrv1 | src/pages/hub/HubSignalSenderPanel.jsx | None | report | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/hub/ReferralLifecycleView.jsx | admin.html#/hub/lifecycle; admin.html#/hub/referrals | internal | Reports | Reports: matched `\breports?\b`, API/path refs: /admin.html#/hub, /hub/intake, /hub/network, /hub/queue, /hub/reports |
| shrv1 | src/pages/hub/shared/hubBusinessNetworkNav.js | None | report | Reports, Identity | Reports: matched `\breports?\b`, Identity: matched `identity`, localStorage keys: shsHubDemoRole, shsUserRole |
| shrv1 | src/pages/iep-command-v2/FloatingFranklinNode.jsx | None | report | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/iep-command-v2/IEPCommandCenterV2.jsx | None | command center | Reports, Identity | Reports: matched `\breports?\b`, Identity: matched `identity` |
| shrv1 | src/pages/shf-command/sections/ImpactGuidancePanel.jsx | None | command center | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/shf-command/sections/ImpactOverviewWheelPanel.jsx | None | command center | Reports | Reports: matched `Reporting` |
| shrv1 | src/pages/shf-command/sections/ReportsBriefingsPanel.jsx | None | command center | Reports | Reports: matched `\breports?\b` |
| shrv1 | src/pages/treasury/Ledger.jsx | None | report | Reports | Reports: matched `\breports?\b` |
| shf-next | src/pages/ops/DevelopmentLibrary.tsx | None | ops | AI Guardrails, Reports, Production Ops | AI Guardrails: matched `OpsAIAssistPanel`, Reports: matched `\breports?\b`, Production Ops: matched `production project`, API/path refs: /ops/library, /ops/library/blueprint-selector, /ops/library/brand-engine, /ops/library/build-packets, / |
| shf-next | src/pages/ops/OpsCommandOverview.tsx | None | clientops | AI Guardrails, ClientOps, Production Ops | AI Guardrails: matched `OpsAIAssistPanel`, ClientOps: matched `clientops`, Production Ops: matched `production project`, API/path refs: /ops/clientops, /ops/command, /ops/library, /ops/projects, /ops/qa, /ops/sales |
| shf-next | src/pages/ops/ProductionProjects.tsx | None | ops | AI Guardrails, Reports, Production Ops | AI Guardrails: matched `OpsAIAssistPanel`, Reports: matched `\breports?\b`, Production Ops: matched `Production Ops`, API/path refs: /ops/library, /ops/projects, /ops/qa |
| shf-next | src/pages/ops/QADeliveryDashboard.tsx | None | dashboard | AI Guardrails, ClientOps, Production Ops | AI Guardrails: matched `OpsAIAssistPanel`, ClientOps: matched `clientops`, Production Ops: matched `production project`, API/path refs: /ops/clientops, /ops/library, /ops/projects, /ops/qa |
| shf-next | src/pages/ops/SalesCommandCenter.tsx | None | command center | AI Guardrails, Reports, Production Ops | AI Guardrails: matched `OpsAIAssistPanel`, Reports: matched `\breports?\b`, Production Ops: matched `production project`, API/path refs: /ops/library, /ops/projects, /ops/sales |

## Visual-Only Pages

| folder | file_path | likely_route | page_type | note |
| --- | --- | --- | --- | --- |
| shrv1 | src/pages/public/PublicView.jsx | None | public | No direct spine evidence found; may be appropriate for purely visual/public/studio surface until publication claims are added. |

## Not Connected Pages

| folder | file_path | likely_route | page_type | note |
| --- | --- | --- | --- | --- |
| shrv1 | src/pages/AdminAnalytics.jsx | None | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/AdminCohorts.jsx | None | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/CareerLearningBridge.jsx | None | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/Curriculum.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/Dashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/LessonPage.jsx | None | foundation | No direct spine signal found by static scan. |
| shrv1 | src/pages/Marketplace.jsx | None | foundation | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/AlignmentSwitchboard.jsx | admin.html#/alignment | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/Attribution.jsx | None | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/PartnerJobs.jsx | None | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/PlacementKPIs.jsx | None | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/TalentSources.jsx | None | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/growth/HubSignalIntelligencePanel.jsx | None | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsAssetGovernance.jsx | admin.html#/ops/assets | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsBrandProfile.jsx | admin.html#/ops/brand-profile | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsBuildPacket.jsx | admin.html#/ops/build-packet | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsDataBinding.jsx | admin.html#/ops/data-binding | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsLayoutBlueprint.jsx | admin.html#/ops/layout-blueprint | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsLearningDashboard.jsx | admin.html#/ops/learning | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsMockReview.jsx | admin.html#/ops/mock-review | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsPageIntent.jsx | admin.html#/ops/page-intent | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsProjectSetup.jsx | admin.html#/ops/projects | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsScreenshotQA.jsx | admin.html#/ops/screenshot-qa | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/admin/ops/OpsVisualTreatment.jsx | admin.html#/ops/visual-treatment | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/arcade/ArcadeDashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/arcade/games/index.jsx | None | report | No direct spine signal found by static scan. |
| shrv1 | src/pages/career/CareerDashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/civic/CivicDashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/civic/CivicHome.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/curriculum/CurriculumDashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/curriculum/CurriculumDashboardNorthstar.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/debt/Dashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/debt/DebtDashboardNorthstar.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/dev/Docs.jsx | None | foundation | No direct spine signal found by static scan. |
| shrv1 | src/pages/employer/Dashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/employer/EmployerDashboardNorthstar.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/.!20307!CommandCenter.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/CommandCenterReportActions.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/CommandCenterShell.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/ModeContext.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/OperatorDashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/ProviderDashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/WorkspaceDashboard.jsx | admin.html#/dashboard | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/aggregation/AggregationCommandCenter.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/command-center/BackgroundSystem.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/command-center/CommandCenterShell.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/command-center/DecisionActionBar.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/command-center/ExecutiveOverlay.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/command-center/RecommendationStrip.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/command-center/StatusRail.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/command-surface/CountyOverlay.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/command-surface/IEPSystemCard.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/command-surface/countyStatusDemo.js | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/commandCenter.constants.js | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/commandCenter.features.js | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/commandCenter.helpers.js | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/workspace-dashboard/SHSWorkspaceDashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/workspace-dashboard/components/DashboardHeader.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/workspace-dashboard/components/DashboardRail.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/workspace-dashboard/components/JournalPanel.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/workspace-dashboard/components/KpiStrip.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/exchange/workspace-dashboard/components/WorkspaceLauncher.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/foundation/About.jsx | None | foundation | No direct spine signal found by static scan. |
| shrv1 | src/pages/foundation/AdminAppsGallery.jsx | None | admin | No direct spine signal found by static scan. |
| shrv1 | src/pages/foundation/FoundationAppsPage.jsx | None | foundation | No direct spine signal found by static scan. |
| shrv1 | src/pages/foundation/Top.jsx | None | foundation | No direct spine signal found by static scan. |
| shrv1 | src/pages/foundation/Transparency.jsx | None | foundation | No direct spine signal found by static scan. |
| shrv1 | src/pages/hub/HubInteractionLayer.jsx | None | report | No direct spine signal found by static scan. |
| shrv1 | src/pages/iep/IEPDashboardPage.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/sales/Dashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/sales/DashboardNorthstar.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/sales/SalesDashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/shf-command/SHFOhioMapEngine.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/shf-command/SHFOhioMapEngineTest.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/shf-command/components/SHFRegionalCountyCluster.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/shf-command/components/map/OhioImpactTacticalMap.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/shf-command/sections/ImpactKpiBand.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/shf-command/sections/ProgramHealthPanel.jsx | None | command center | No direct spine signal found by static scan. |
| shrv1 | src/pages/treasury/Dashboard.jsx | None | dashboard | No direct spine signal found by static scan. |
| shrv1 | src/pages/treasury/Help.jsx | None | foundation | No direct spine signal found by static scan. |

## Unknown / Helper-Like Pages

| folder | file_path | likely_route | page_type |
| --- | --- | --- | --- |
| shrv1 | src/pages/AdminAlerts.jsx | None | unknown |
| shrv1 | src/pages/AdminZoom.jsx | None | unknown |
| shrv1 | src/pages/Assignments.jsx | None | unknown |
| shrv1 | src/pages/Calendar.jsx | None | unknown |
| shrv1 | src/pages/CareerPathways.jsx | None | unknown |
| shrv1 | src/pages/CareerPlanner.jsx | None | unknown |
| shrv1 | src/pages/CareerVocabulary.jsx | None | unknown |
| shrv1 | src/pages/DebugContent.jsx | None | unknown |
| shrv1 | src/pages/ErrorBoundary.jsx | None | unknown |
| shrv1 | src/pages/Help.jsx | None | unknown |
| shrv1 | src/pages/Instructor.jsx | None | unknown |
| shrv1 | src/pages/InstructorUnit.jsx | None | unknown |
| shrv1 | src/pages/LessonView.jsx | None | unknown |
| shrv1 | src/pages/Lessons.jsx | None | unknown |
| shrv1 | src/pages/MasterIndex.jsx | None | unknown |
| shrv1 | src/pages/Portfolio copy.jsx | None | unknown |
| shrv1 | src/pages/PortfolioNew.jsx | None | unknown |
| shrv1 | src/pages/ResumeBuilder.jsx | None | unknown |
| shrv1 | src/pages/RewardsWallet.jsx | None | unknown |
| shrv1 | src/pages/Settings.jsx | None | unknown |
| shrv1 | src/pages/Subscribe.jsx | None | unknown |
| shrv1 | src/pages/Verifier.jsx | None | unknown |
| shrv1 | src/pages/Vocabulary.jsx | None | unknown |
| shrv1 | src/pages/ai/JobCompass.jsx | None | unknown |
| shrv1 | src/pages/arcade/Arcade.jsx | None | unknown |
| shrv1 | src/pages/arcade/ArcadeLibrary.jsx | None | unknown |
| shrv1 | src/pages/arcade/Help.jsx | None | unknown |
| shrv1 | src/pages/arcade/Leaderboard.jsx | None | unknown |
| shrv1 | src/pages/arcade/Lesson.jsx | None | unknown |
| shrv1 | src/pages/arcade/Portfolio.jsx | None | unknown |
| shrv1 | src/pages/arcade/Profile.jsx | None | unknown |
| shrv1 | src/pages/arcade/Rewards.jsx | None | unknown |
| shrv1 | src/pages/arcade/Tournament.jsx | None | unknown |
| shrv1 | src/pages/arcade/Tournaments.jsx | None | unknown |
| shrv1 | src/pages/arcade/games/Leaderboard.jsx | None | unknown |
| shrv1 | src/pages/arcade/games/index.js | None | unknown |
| shrv1 | src/pages/capital/OperatorControlPanel.jsx | None | internal |
| shrv1 | src/pages/career/Lesson.jsx | None | unknown |
| shrv1 | src/pages/career/Portfolio.jsx | None | unknown |
| shrv1 | src/pages/career/sections/Benefits.jsx | None | unknown |
| shrv1 | src/pages/career/sections/CoachCopilot.jsx | None | unknown |
| shrv1 | src/pages/career/sections/EvidenceLocker.jsx | None | unknown |
| shrv1 | src/pages/career/sections/IntegrationsStrip.jsx | None | unknown |
| shrv1 | src/pages/career/sections/KpiStrip.jsx | None | unknown |
| shrv1 | src/pages/career/sections/NextActions.jsx | None | unknown |
| shrv1 | src/pages/career/sections/Opportunities.jsx | None | unknown |
| shrv1 | src/pages/career/sections/PipelineBoard.jsx | None | unknown |
| shrv1 | src/pages/career/sections/SkillsChecklist.jsx | None | unknown |
| shrv1 | src/pages/career/sections/index.jsx | None | unknown |
| shrv1 | src/pages/catalog/Catalog.jsx | None | unknown |
| shrv1 | src/pages/catalog/CatalogLanding.jsx | None | unknown |
| shrv1 | src/pages/civic/Assignments.jsx | None | unknown |
| shrv1 | src/pages/civic/Badges.jsx | None | unknown |
| shrv1 | src/pages/civic/CivicLesson.jsx | None | unknown |
| shrv1 | src/pages/civic/CoachDrawer.jsx | None | unknown |
| shrv1 | src/pages/civic/DebtClock.jsx | None | unknown |
| shrv1 | src/pages/civic/Elections.jsx | None | unknown |
| shrv1 | src/pages/civic/GrantStory.jsx | None | unknown |
| shrv1 | src/pages/civic/Help.jsx | None | unknown |
| shrv1 | src/pages/civic/IssueSurvey.jsx | None | unknown |
| shrv1 | src/pages/civic/Lesson.jsx | None | unknown |
| shrv1 | src/pages/civic/MicroLessonDetail.jsx | None | unknown |
| shrv1 | src/pages/civic/MicroLessons.jsx | None | unknown |
| shrv1 | src/pages/civic/Mission.jsx | None | unknown |
| shrv1 | src/pages/civic/Missions.jsx | None | unknown |
| shrv1 | src/pages/civic/Notes.jsx | None | unknown |
| shrv1 | src/pages/civic/Parties.jsx | None | unknown |
| shrv1 | src/pages/civic/Portfolio.jsx | None | unknown |
| shrv1 | src/pages/civic/ProfileResults.jsx | None | unknown |
| shrv1 | src/pages/civic/Proposals.jsx | None | unknown |
| shrv1 | src/pages/civic/Proposals.lord-demo.jsx | None | unknown |
| shrv1 | src/pages/civic/Rewards.jsx | None | unknown |
| shrv1 | src/pages/civic/Settings.jsx | None | unknown |
| shrv1 | src/pages/civic/Surveys.jsx | None | unknown |
| shrv1 | src/pages/civic/TreasurySim.jsx | None | unknown |
| shrv1 | src/pages/civic/TreasurySnapshots.jsx | None | unknown |
| shrv1 | src/pages/credit/Lesson.jsx | None | unknown |
| shrv1 | src/pages/curriculum/Lesson.jsx | None | unknown |
| shrv1 | src/pages/curriculum/MyLessons.jsx | None | unknown |
| shrv1 | src/pages/debt/Accounts.jsx | None | unknown |
| shrv1 | src/pages/debt/Avalanche.jsx | None | unknown |
| shrv1 | src/pages/debt/Help.jsx | None | unknown |
| shrv1 | src/pages/debt/Imports.jsx | None | unknown |
| shrv1 | src/pages/debt/Ledger.jsx | None | unknown |
| shrv1 | src/pages/debt/Lesson.jsx | None | unknown |
| shrv1 | src/pages/debt/PaymentDetails.jsx | None | unknown |
| shrv1 | src/pages/debt/Plan.jsx | None | unknown |
| shrv1 | src/pages/debt/Portfolio.jsx | None | unknown |
| shrv1 | src/pages/debt/Settings.jsx | None | unknown |
| shrv1 | src/pages/debt/Snowball.jsx | None | unknown |
| shrv1 | src/pages/employer/Analytics.jsx | None | unknown |
| shrv1 | src/pages/employer/Candidates.jsx | None | unknown |
| shrv1 | src/pages/employer/Compliance.jsx | None | unknown |
| shrv1 | src/pages/employer/Exports.jsx | None | unknown |
| shrv1 | src/pages/employer/FundingFinder.jsx | None | unknown |
| shrv1 | src/pages/employer/Help.jsx | None | unknown |
| shrv1 | src/pages/employer/Interviews.jsx | None | unknown |
| shrv1 | src/pages/employer/Jobs.jsx | None | unknown |
| shrv1 | src/pages/employer/Lesson.jsx | None | unknown |
| shrv1 | src/pages/employer/Offers.jsx | None | unknown |
| shrv1 | src/pages/employer/Pipeline.jsx | None | unknown |
| shrv1 | src/pages/employer/Portfolio.jsx | None | unknown |
| shrv1 | src/pages/employer/ReimbursementCalculator.jsx | None | unknown |
| shrv1 | src/pages/employer/Settings.jsx | None | unknown |
| shrv1 | src/pages/employer/_Smoke.jsx | None | unknown |
| shrv1 | src/pages/exchange/AnalystPredictionCard.BUTTON_WORKS.jsx | None | internal |
| shrv1 | src/pages/exchange/AnalystPredictionCard.EVENT_CONFIRMED.jsx | None | internal |
| shrv1 | src/pages/exchange/AnalystPredictionCard.STABLE_WITH_CARD.jsx | None | internal |
| shrv1 | src/pages/exchange/AnalystPredictionCard.jsx | None | internal |
| shrv1 | src/pages/exchange/CenterScene.jsx | None | internal |
| shrv1 | src/pages/exchange/DecisionSandbox.jsx | None | internal |
| shrv1 | src/pages/exchange/DecisionSignalCard.jsx | None | internal |
| shrv1 | src/pages/exchange/FeatureGate.jsx | None | internal |
| shrv1 | src/pages/exchange/GlobeScene.EVENT_CONFIRMED.jsx | None | internal |
| shrv1 | src/pages/exchange/GlobeScene.STABLE_AFTER_RECOVERY.jsx | None | internal |
| shrv1 | src/pages/exchange/GlobeScene.STABLE_PREDICTIVE.jsx | None | internal |
| shrv1 | src/pages/exchange/GlobeScene.STABLE_V1_PREDICTIVE.jsx | None | internal |
| shrv1 | src/pages/exchange/GlobeScene.STABLE_WITH_CARD.jsx | None | internal |
| shrv1 | src/pages/exchange/GlobeScene.jsx | None | internal |
| shrv1 | src/pages/exchange/HeaderBar.jsx | None | internal |

Additional unknown/helper-like files omitted from Markdown table: 80. See JSON for full list.

## Missing Routes

Pages below look like active surfaces but were not matched to a current route by static route parsing.

| folder | file_path | page_type | spine_status |
| --- | --- | --- | --- |
| shrv1 | src/pages/AdminAnalytics.jsx | admin | not connected |
| shrv1 | src/pages/AdminCohorts.jsx | admin | not connected |
| shrv1 | src/pages/AdminDashboard.jsx | admin | connected |
| shrv1 | src/pages/AllPages.jsx | dashboard | partially connected |
| shrv1 | src/pages/Arcade.jsx | dashboard | partially connected |
| shrv1 | src/pages/CareerLearningBridge.jsx | admin | not connected |
| shrv1 | src/pages/Coach.jsx | dashboard | connected |
| shrv1 | src/pages/CreditReport.jsx | report | partially connected |
| shrv1 | src/pages/Curriculum.jsx | dashboard | not connected |
| shrv1 | src/pages/Dashboard.jsx | dashboard | not connected |
| shrv1 | src/pages/LessonPage.jsx | foundation | not connected |
| shrv1 | src/pages/Marketplace.jsx | foundation | not connected |
| shrv1 | src/pages/admin/Attribution.jsx | admin | not connected |
| shrv1 | src/pages/admin/InvestorNorthstar.jsx | admin | connected |
| shrv1 | src/pages/admin/PartnerJobs.jsx | admin | not connected |
| shrv1 | src/pages/admin/PlacementKPIs.jsx | admin | not connected |
| shrv1 | src/pages/admin/ReportsDashboard.jsx | admin | connected |
| shrv1 | src/pages/admin/TalentSources.jsx | admin | not connected |
| shrv1 | src/pages/admin/aggregation/AggregationCommandBar.jsx | admin | connected |
| shrv1 | src/pages/admin/aggregation/AggregationOverview.jsx | admin | connected |
| shrv1 | src/pages/admin/aggregation/BridgeDemoPanel.jsx | admin | partially connected |
| shrv1 | src/pages/admin/aggregation/EntityResolutionQueue.jsx | admin | connected |
| shrv1 | src/pages/admin/aggregation/LineageExplorer.jsx | admin | connected |
| shrv1 | src/pages/admin/aggregation/LiveBridgePanel.jsx | admin | connected |
| shrv1 | src/pages/admin/aggregation/MappingRegistry.jsx | admin | connected |
| shrv1 | src/pages/admin/aggregation/QualityCommandPanel.jsx | admin | partially connected |
| shrv1 | src/pages/admin/aggregation/ReconciliationWorkbench.jsx | admin | connected |
| shrv1 | src/pages/admin/aggregation/VerificationWorkbench.jsx | admin | connected |
| shrv1 | src/pages/admin/aggregation/adapters.ts | admin | connected |
| shrv1 | src/pages/admin/aggregation/aggregation-readiness-model.js | admin | connected |
| shrv1 | src/pages/admin/aggregation/bridge-demo.ts | admin | connected |
| shrv1 | src/pages/admin/aggregation/mockData.ts | admin | connected |
| shrv1 | src/pages/admin/aggregation/oracle-row-readiness.js | admin | connected |
| shrv1 | src/pages/admin/audit/AuditLogViewer.jsx | admin | connected |
| shrv1 | src/pages/admin/growth/HubSignalIntelligencePanel.jsx | admin | not connected |
| shrv1 | src/pages/admin/growth/partnerGrowthTourSteps.js | admin | connected |
| shrv1 | src/pages/admin/identity/IdentityManagement.jsx | admin | connected |
| shrv1 | src/pages/admin/ops/opsData.js | admin | connected |
| shrv1 | src/pages/admin/ops/opsStorage.js | admin | connected |
| shrv1 | src/pages/admin/reporting/ActionLogExportPanel.jsx | admin | connected |
| shrv1 | src/pages/admin/reporting/AnalystMemoExportPanel.jsx | admin | connected |
| shrv1 | src/pages/admin/reporting/AuditPackPanel.jsx | admin | connected |
| shrv1 | src/pages/admin/reporting/BriefingExportPanel.jsx | admin | connected |
| shrv1 | src/pages/admin/reporting/ExportReadinessCard.jsx | admin | connected |
| shrv1 | src/pages/admin/reporting/analyst/analyst-context-builder.js | admin | partially connected |
| shrv1 | src/pages/admin/reporting/analyst/oracle-memo-adapter.js | admin | connected |
| shrv1 | src/pages/admin/reporting/bridge-record-links.ts | admin | partially connected |
| shrv1 | src/pages/admin/reporting/bridge-workflow-store.ts | admin | partially connected |
| shrv1 | src/pages/admin/reporting/export-audit-trail.js | admin | connected |
| shrv1 | src/pages/admin/reporting/export-history-adapter.ts | admin | partially connected |
| shrv1 | src/pages/admin/reporting/oracle-action-adapter.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/oracle-backend-adapter.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/oracle-compare-adapter.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/oracle-priority-adapter.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/oracle-reporting-guard.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/reporting-actions.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/reporting-backend-adapter.ts | admin | partially connected |
| shrv1 | src/pages/admin/reporting/reporting-command-model.js | admin | connected |
| shrv1 | src/pages/admin/reporting/reporting-readiness.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/reporting-trace-actions.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/reporting-trace-query.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/reporting-trace-routes.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/reporting-trace.ts | admin | connected |
| shrv1 | src/pages/admin/reporting/verification-audit-actions.ts | admin | partially connected |
| shrv1 | src/pages/admin/uploads/UploadManager.jsx | admin | connected |
| shrv1 | src/pages/arcade/ArcadeDashboard.jsx | dashboard | not connected |
| shrv1 | src/pages/arcade/ArcadeDashboardNorthstar.jsx | dashboard | partially connected |
| shrv1 | src/pages/arcade/History.jsx | report | partially connected |
| shrv1 | src/pages/arcade/games/index.jsx | report | not connected |
| shrv1 | src/pages/capital/OperatorControlPanel.base.jsx | internal | connected |
| shrv1 | src/pages/capital/OperatorControlPanel.jsx | internal | unknown |
| shrv1 | src/pages/career/CareerDashboard.jsx | dashboard | not connected |
| shrv1 | src/pages/career/CareerDashboardNorthstar.jsx | dashboard | connected |
| shrv1 | src/pages/civic/CivicDashboard.jsx | dashboard | not connected |
| shrv1 | src/pages/civic/CivicHome.jsx | dashboard | not connected |
| shrv1 | src/pages/civic/CommunityImpact.jsx | dashboard | connected |
| shrv1 | src/pages/civic/DashboardNorthstar.jsx | dashboard | connected |
| shrv1 | src/pages/credit/Portfolio.jsx | report | partially connected |
| shrv1 | src/pages/curriculum/CurriculumDashboard.jsx | dashboard | not connected |
| shrv1 | src/pages/curriculum/CurriculumDashboardNorthstar.jsx | dashboard | not connected |
| shrv1 | src/pages/debt/Dashboard.jsx | dashboard | not connected |
| shrv1 | src/pages/debt/DebtDashboardNorthstar.jsx | dashboard | not connected |
| shrv1 | src/pages/debt/Education.jsx | report | partially connected |
| shrv1 | src/pages/dev/Docs.jsx | foundation | not connected |
| shrv1 | src/pages/employer/Dashboard.jsx | dashboard | not connected |
| shrv1 | src/pages/employer/EmployerDashboardNorthstar.jsx | dashboard | not connected |
| shrv1 | src/pages/exchange/.!20307!CommandCenter.jsx | command center | not connected |
| shrv1 | src/pages/exchange/AnalystPredictionCard.BUTTON_WORKS.jsx | internal | unknown |
| shrv1 | src/pages/exchange/AnalystPredictionCard.EVENT_CONFIRMED.jsx | internal | unknown |
| shrv1 | src/pages/exchange/AnalystPredictionCard.LOOP_STOP_CHECKPOINT.jsx | internal | connected |
| shrv1 | src/pages/exchange/AnalystPredictionCard.STABLE_WITH_CARD.jsx | internal | unknown |
| shrv1 | src/pages/exchange/AnalystPredictionCard.jsx | internal | unknown |
| shrv1 | src/pages/exchange/CenterScene.jsx | internal | unknown |
| shrv1 | src/pages/exchange/CommandCenter.EVENT_CONFIRMED.jsx | command center | connected |
| shrv1 | src/pages/exchange/CommandCenter.LOOP_STOP_CHECKPOINT.jsx | command center | connected |
| shrv1 | src/pages/exchange/CommandCenter.STABLE_AFTER_RECOVERY.jsx | command center | connected |
| shrv1 | src/pages/exchange/CommandCenter.STABLE_WITH_CARD.jsx | command center | connected |
| shrv1 | src/pages/exchange/CommandCenter.jsx | command center | connected |
| shrv1 | src/pages/exchange/CommandCenterReportActions.jsx | command center | not connected |
| shrv1 | src/pages/exchange/CommandCenterShell.jsx | command center | not connected |
| shrv1 | src/pages/exchange/CommandCenterStats.jsx | command center | connected |
| shrv1 | src/pages/exchange/DecisionSandbox.jsx | internal | unknown |
| shrv1 | src/pages/exchange/DecisionSignalCard.jsx | internal | unknown |
| shrv1 | src/pages/exchange/ExchangeLayout.jsx | command center | connected |
| shrv1 | src/pages/exchange/FeatureGate.jsx | internal | unknown |
| shrv1 | src/pages/exchange/GlobeScene.EVENT_CONFIRMED.jsx | internal | unknown |
| shrv1 | src/pages/exchange/GlobeScene.LOOP_STOP_CHECKPOINT.jsx | internal | connected |
| shrv1 | src/pages/exchange/GlobeScene.STABLE_AFTER_RECOVERY.jsx | internal | unknown |
| shrv1 | src/pages/exchange/GlobeScene.STABLE_PREDICTIVE.jsx | internal | unknown |
| shrv1 | src/pages/exchange/GlobeScene.STABLE_V1_PREDICTIVE.jsx | internal | unknown |
| shrv1 | src/pages/exchange/GlobeScene.STABLE_WITH_CARD.jsx | internal | unknown |
| shrv1 | src/pages/exchange/GlobeScene.jsx | internal | unknown |
| shrv1 | src/pages/exchange/HeaderBar.jsx | internal | unknown |
| shrv1 | src/pages/exchange/InvestorDashboard.jsx | dashboard | connected |
| shrv1 | src/pages/exchange/ModeContext.jsx | command center | not connected |
| shrv1 | src/pages/exchange/ModuleBoundary.jsx | internal | unknown |
| shrv1 | src/pages/exchange/OperatorDashboard.jsx | dashboard | not connected |
| shrv1 | src/pages/exchange/PredictionLayerPanel.jsx | internal | unknown |
| shrv1 | src/pages/exchange/ProviderDashboard.jsx | dashboard | not connected |
| shrv1 | src/pages/exchange/PublicTransparency.jsx | internal | unknown |
| shrv1 | src/pages/exchange/SHSCommandSurface.jsx | command center | connected |
| shrv1 | src/pages/exchange/SHSExchangeMissionControl.jsx | internal | unknown |
| shrv1 | src/pages/exchange/aggregation/AggregationCommandCenter.jsx | command center | not connected |
| shrv1 | src/pages/exchange/aggregation/ConnectorHealthPanel.jsx | internal | unknown |
| shrv1 | src/pages/exchange/aggregation/FreshnessBoard.jsx | internal | unknown |
| shrv1 | src/pages/exchange/aggregation/PublicationStatusCard.jsx | internal | unknown |
| shrv1 | src/pages/exchange/aggregation/QualityOverviewCard.jsx | internal | unknown |
| shrv1 | src/pages/exchange/aggregation/ReconciliationQueueCard.jsx | internal | unknown |
| shrv1 | src/pages/exchange/analystActionBridge.js | internal | unknown |
| shrv1 | src/pages/exchange/analystListener.js | internal | unknown |
| shrv1 | src/pages/exchange/buildActiveAgentContext.js | internal | unknown |
| shrv1 | src/pages/exchange/buildAnalystNarrative.js | internal | unknown |
| shrv1 | src/pages/exchange/buildComputedAgentContext.js | internal | unknown |
| shrv1 | src/pages/exchange/buildDecisionSignal.js | internal | unknown |
| shrv1 | src/pages/exchange/buildPredictionLayer.js | internal | unknown |
| shrv1 | src/pages/exchange/command-center/BackgroundSystem.jsx | command center | not connected |
| shrv1 | src/pages/exchange/command-center/CommandCenterShell.jsx | command center | not connected |
| shrv1 | src/pages/exchange/command-center/DecisionActionBar.jsx | command center | not connected |
| shrv1 | src/pages/exchange/command-center/ExecutiveOverlay.jsx | command center | not connected |
| shrv1 | src/pages/exchange/command-center/RecommendationStrip.jsx | command center | not connected |
| shrv1 | src/pages/exchange/command-center/StatusRail.jsx | command center | not connected |
| shrv1 | src/pages/exchange/command-surface/CountyOverlay.jsx | command center | not connected |
| shrv1 | src/pages/exchange/command-surface/IEPSystemCard.jsx | command center | not connected |
| shrv1 | src/pages/exchange/command-surface/commandSurfaceTourSteps.js | command center | connected |
| shrv1 | src/pages/exchange/command-surface/countyStatusDemo.js | command center | not connected |
| shrv1 | src/pages/exchange/commandCenter.constants.js | command center | not connected |
| shrv1 | src/pages/exchange/commandCenter.features.js | command center | not connected |
| shrv1 | src/pages/exchange/commandCenter.helpers.js | command center | not connected |
| shrv1 | src/pages/exchange/commandCenterAdapter.js | command center | connected |
| shrv1 | src/pages/exchange/components/SHSCommandHeader.jsx | report | connected |
| shrv1 | src/pages/exchange/decisionHandler.js | internal | unknown |
| shrv1 | src/pages/exchange/decisionListener.BUTTON_WORKS.js | internal | unknown |
| shrv1 | src/pages/exchange/decisionListener.js | internal | unknown |
| shrv1 | src/pages/exchange/map-stage/MapFrame.jsx | internal | unknown |
| shrv1 | src/pages/exchange/map-stage/MapGrid.jsx | internal | unknown |
| shrv1 | src/pages/exchange/map-stage/MapUsaPlate.jsx | internal | unknown |
| shrv1 | src/pages/exchange/map-stage/TacticalMapStage.jsx | internal | unknown |
| shrv1 | src/pages/exchange/sim/ExchangeSimulationBridge.jsx | internal | unknown |
| shrv1 | src/pages/exchange/sim/SimulationControls.jsx | internal | unknown |
| shrv1 | src/pages/exchange/sim/SimulationPanel.jsx | internal | unknown |

## Routes Without Pages

| folder | route | component | source_file | notes |
| --- | --- | --- | --- | --- |
| shrv1 | admin.html#/uploads | UploadManager | src/router/AdminRoutes.jsx |  |
| shrv1 | admin.html#/audit | AuditLogViewer | src/router/AdminRoutes.jsx |  |
| shrv1 | admin.html#/identity | IdentityManagement | src/router/AdminRoutes.jsx |  |
| shf-next | /studio/templates/floral-boutique | WebsiteStudioTemplatePreview | src/App.tsx | manual pathname branch |
| shf-next | /studio/templates/browse | WebsiteStudioTemplateBrowse | src/App.tsx | manual pathname branch |
| shf-next | /studio/templates | WebsiteStudioTemplates | src/App.tsx | manual pathname branch |
| shf-next | /foundation/impact-report/print | ShfImpactReportPrintPage | src/App.tsx | manual pathname branch |
| shf-next | /foundation/data-approval | ShfDataApprovalGateway | src/App.tsx | manual pathname branch |
| shf-next | /foundation/impact-report | ShfImpactReportGenerator | src/App.tsx | manual pathname branch |
| shf-next | /ops/command | OpsCommandOverview | src/App.tsx | manual pathname branch inside OpsShell |
| shf-next | /ops/projects | ProductionProjects | src/App.tsx | manual pathname branch inside OpsShell |
| shf-next | /ops/qa | QADeliveryDashboard | src/App.tsx | manual pathname branch inside OpsShell |
| shf-next | /ops/clientops | ClientOpsCenter | src/App.tsx | manual pathname branch inside OpsShell |
| shf-next | /ops/sales | SalesCommandCenter | src/App.tsx | manual pathname branch inside OpsShell |
| shf-next | /ops/library | DevelopmentLibrary | src/App.tsx | manual pathname branch inside OpsShell |

## Sidebar Links Without Routes

| folder | to | label | source_file |
| --- | --- | --- | --- |
| shrv1 | admin.html#/admin | Admin Home | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/admin/users | Users | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/admin/settings | Settings | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/analytics | App Analytics | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/lord-outcomes | Lord of Outcomes | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/dev/docs | Docs | src/components/admin/AdminSidebar.jsx |
| shrv1 | admin.html#/health | Health | src/components/admin/AdminSidebar.jsx |

## Duplicate / Overlap Findings

| name_hint | files | notes |
| --- | --- | --- |
| SHF impact data/reporting | shrv1:src/data/shfImpactData.js, shf-next:src/data/shfImpactData.ts, shf-next:src/pages/foundation/ShfImpactReportGenerator.tsx | Functional overlap across repositories; preserve owner boundary and sync intentionally. |
| Website studio/WebMaker | shrv1:src/pages/admin/BuilderHub.jsx, shrv1:src/pages/public/WebMakerPage.jsx, shf-next:src/pages/studio/WebsiteStudioTemplates.tsx, shf-next:src/pages/studio/WebsiteStudioTemplateBrowse.tsx, shf-next:src/pages/studio/WebsiteStudioTemplateP | Functional overlap across repositories; preserve owner boundary and sync intentionally. |
| Ops command/client lifecycle | shrv1:src/pages/admin/ops/*, shf-next:src/pages/ops/* | Functional overlap across repositories; preserve owner boundary and sync intentionally. |

## Security / Permission Findings

| route | issue | risk |
| --- | --- | --- |
| admin.html#/admin | sidebar link has no AdminRoutes mapping and will likely fall through to /hub | medium |
| admin.html#/admin/users | sidebar link has no AdminRoutes mapping and will likely fall through to /hub | medium |
| admin.html#/admin/settings | sidebar link has no AdminRoutes mapping and will likely fall through to /hub | medium |
| admin.html#/analytics | sidebar link has no AdminRoutes mapping and will likely fall through to /hub | medium |
| admin.html#/lord-outcomes | sidebar link has no AdminRoutes mapping and will likely fall through to /hub | medium |
| admin.html#/dev/docs | sidebar link has no AdminRoutes mapping and will likely fall through to /hub | medium |
| admin.html#/health | sidebar link has no AdminRoutes mapping and will likely fall through to /hub | medium |
| src/pages/ops/ClientOpsCenter.tsx | shf-next ops surface is local/manual routed with no visible auth guard in App.tsx | medium |
| src/pages/ops/DevelopmentLibrary.tsx | shf-next ops surface is local/manual routed with no visible auth guard in App.tsx | medium |
| src/pages/ops/OpsCommandOverview.tsx | shf-next ops surface is local/manual routed with no visible auth guard in App.tsx | medium |
| src/pages/ops/ProductionProjects.tsx | shf-next ops surface is local/manual routed with no visible auth guard in App.tsx | medium |

## Backend Spine Endpoint Surfaces

| source_file | prefixes | endpoints |
| --- | --- | --- |
| services/shf-agent-fabric/routers/admin_registry_routes.py |  | GET , GET /events, GET /events/ledger, GET /events/verify, GET /{entity_id} |
| services/shf-agent-fabric/routers/ai_guardrails_routes.py | /ai-guardrails | GET /ai-guardrails/health, GET /ai-guardrails/policies, POST /ai-guardrails/check-output, GET /ai-guardrails/decisions, GET /ai-guardrails/decisions/{decision_id} |
| services/shf-agent-fabric/routers/alignment/__init__.py |  |  |
| services/shf-agent-fabric/routers/alignment/audit.py |  |  |
| services/shf-agent-fabric/routers/alignment/containment.py |  |  |
| services/shf-agent-fabric/routers/alignment/models.py |  |  |
| services/shf-agent-fabric/routers/alignment/policy.py |  |  |
| services/shf-agent-fabric/routers/alignment/routes_admin.py | /admin/align | GET /admin/align/apps, PATCH /admin/align/apps/{app_id}/state, GET /admin/align/containment, PATCH /admin/align/containment, POST /admin/align/containment/apps/{app_id}/{state} |
| services/shf-agent-fabric/routers/alignment/routes_gateway.py | /align | POST /align/run |
| services/shf-agent-fabric/routers/alignment/routes_plans_admin.py | /admin/align/plans | GET /admin/align/plans, POST /admin/align/plans/{plan_id}/validate, POST /admin/align/plans/{plan_id}/dry-run, POST /admin/align/plans/{plan_id}/approve-execute |
| services/shf-agent-fabric/routers/alignment/store.py |  |  |
| services/shf-agent-fabric/routers/funding_partner_registry.py | /api/funding |  |
| services/shf-agent-fabric/routers/game_theory_routes.py | /game-theory | GET /game-theory/health, GET /game-theory/scenarios, POST /game-theory/scenarios, GET /game-theory/scenarios/{scenario_id}, POST /game-theory/scenarios/{scenario_id}/analyze |
| services/shf-agent-fabric/routers/loo_adapters_routes.py | /loo | GET /loo/adapters |
| services/shf-agent-fabric/routers/loo_rankings_routes.py | /loo | GET /loo/rankings |
| services/shf-agent-fabric/routers/loo_routes.py | /loo | GET /loo/health, POST /loo/validate, POST /loo/score, POST /loo/score_run, GET /loo/programs |
| services/shf-agent-fabric/routers/oracle_routes.py | /oracle | GET /oracle/health, GET /oracle/cases, POST /oracle/cases, GET /oracle/cases/{case_id}, POST /oracle/cases/{case_id}/rule |
| services/shf-agent-fabric/routers/registry_routes.py | /registry | GET /registry/ping |
| services/shf-agent-fabric/routers/reports_routes.py | /reports | GET /reports/snapshot, GET /reports/usage.csv, GET /reports/containment.csv, GET /reports/outcomes.csv, GET /reports/system.csv |
| services/shf-agent-fabric/routers/runs_loo_payload_routes.py | /runs | GET /runs/{run_id}/loo_payload, POST /runs/{run_id}/loo_payload |
| services/shf-agent-fabric/routers/runs_registry_routes.py | /runs/registry | GET /runs/registry/ping |
| services/shf-agent-fabric/routers/truth_routes.py | /truth | GET /truth/health, GET /truth/coverage, GET /truth/drift, GET /truth/federation, POST /truth/federation/systems |
| services/shf-agent-fabric/routers/watchtower_attestation_routes.py | /watchtower/attest | GET /watchtower/attest/root, POST /watchtower/attest/verify |
| services/shf-agent-fabric/routers/watchtower_routes.py | /watchtower | GET /watchtower/summary, GET /watchtower/programs, GET /watchtower/quarantine, POST /watchtower/quarantine/{program_id}, DELETE /watchtower/quarantine/{program_id} |

## Recommended Fix Order

1. Resolve shrv1 sidebar links without routes: /admin, /admin/users, /admin/settings, /analytics, /dev/docs, /health or remove them from discoverable nav. Reason: They currently appear in navigation but are not mounted in AdminRoutes.
2. Decide whether shrv1 command/dashboard should surface explicit Watchtower and LOO cards or keep those cards centralized in Agent Fabric/Lord Outcomes. Reason: Command Center and Workspace Dashboard are routed, but Watchtower/LOO cards are not directly present there.
3. Connect visual-only public/studio surfaces to approved Truth Spine or SHF Impact Data Spine metadata before publication claims. Reason: Public/reporting pages need explicit trust/readiness metadata for anti-drift.
4. Document cross-repo ownership for SHF Impact Data Spine and WebMaker/Website Studio to avoid duplicate behavior drift. Reason: Both repos contain related public/ops surfaces and shared concepts.
5. Add route inventory checks for shf-next manual routing if it remains a long-lived app. Reason: Manual pathname branches are easy to drift from nav items.

## Validation

| Command | Result |
| --- | --- |
| `python3 scripts/check_duplicate_layer_cleanup.py` | PASS |
| `python3 scripts/check_master_layer_registry.py` | PASS |
| `python3 scripts/check_truth_spine_freeze.py` | PASS |
| `python3 scripts/check_oracle_layer.py` | PASS |
| `python3 scripts/check_ai_guardrails_layer.py` | PASS |
| `python3 scripts/check_game_theory_layer.py` | PASS |
| `npm run check:governance` | PASS |
| focused Agent Fabric pytest | PASS: 25 passed |
| `npm run build` in shrv1 | PASS with existing large chunk warnings |
| `npm run build` in shf-next | PASS after sandbox escalation; initial sandbox attempt failed on `.tsbuildinfo` EPERM |
| `npm run lint` in shf-next | PASS |
| shf-next git status/diff | Not applicable: folder is not a git repository in this environment |

## V1 Completion Status

V1 complete: yes. No source, route, backend, or runtime behavior was intentionally changed by this audit report generation.
