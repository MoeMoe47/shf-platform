# Route Integrity and Spine Coverage Plan V1

Generated: 2026-06-14T19:52:38

## Executive Summary

- Target set confirmed from `docs/FULL_PAGE_SPINE_CONNECTION_AUDIT_V1.json`: 44 partially connected + 80 not connected = 124 pages.
- This is a closure plan plus a narrow route integrity pass, not a broad spine wiring pass.
- Low-risk shrv1 fixes applied: exact `/lord-outcomes`, `/analytics`, and `/dev/docs` routes plus matching access-control entries for the newly mounted routes.
- Remaining sidebar gaps require owner/page decisions and were not guessed.
- Command Center shows Reports/trust surfaces but no explicit Watchtower/LOO card by static scan; Dashboard has no explicit Watchtower/LOO/Reports/trust/Agent Fabric card by static scan.

## Count Confirmation

| Metric | Count |
| --- | --- |
| Partially connected pages | 44 |
| Not connected pages | 80 |
| Target total | 124 |
| Assigned to action groups | 124 |

## Classification Counts

| Action Group | Count |
| --- | --- |
| should_connect_to_spine | 67 |
| route_only_fix | 2 |
| keep_visual_only | 8 |
| archive_candidate | 1 |
| duplicate_or_merge_required | 9 |
| security_review_required | 0 |
| shf_next_sync_required | 5 |
| unknown_review_required | 32 |

## 124-Page Target Set Summary

Each target page is assigned to exactly one primary action group in the JSON report. The table below is the concise planning view; see JSON for full evidence fields.
| action_group | folder | file_path | route | page_type | risk | phase | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| should_connect_to_spine | shrv1 | src/pages/CreditReport.jsx | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/GrantBinder.jsx | admin.html#/grant-binder | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/MasterNarrativeViewer.jsx | admin.html#/master-narrative | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/aggregation/BridgeDemoPanel.jsx | None | admin | medium | phase_2 | Active admin/governance surface should display relevant spine status and existing backend metadata. |
| should_connect_to_spine | shrv1 | src/pages/admin/aggregation/QualityCommandPanel.jsx | None | admin | medium | phase_2 | Active admin/governance surface should display relevant spine status and existing backend metadata. |
| should_connect_to_spine | shrv1 | src/pages/admin/reporting/VerificationAuditSurface.jsx | admin.html#/verification-audit | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/reporting/analyst/analyst-context-builder.js | None | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/reporting/bridge-record-links.ts | None | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/reporting/bridge-workflow-store.ts | None | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/reporting/export-history-adapter.ts | None | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/reporting/reporting-backend-adapter.ts | None | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/reporting/verification-audit-actions.ts | None | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/arcade/ArcadeDashboardNorthstar.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/arcade/History.jsx | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/credit/Portfolio.jsx | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/debt/Education.jsx | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/exchange/useCommandCenterReportActions.js | None | command center | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/hub/HubLeadershipDashboard.jsx | admin.html#/hub/network; admin.html#/hub/leadership | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/hub/HubSignalSenderPanel.jsx | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/hub/shared/hubBusinessNetworkNav.js | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/iep-command-v2/FloatingFranklinNode.jsx | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/iep-command-v2/IEPCommandCenterV2.jsx | None | command center | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/shf-command/sections/ReportsBriefingsPanel.jsx | None | command center | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/treasury/Ledger.jsx | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/Dashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/admin/AlignmentSwitchboard.jsx | admin.html#/alignment | admin | medium | phase_2 | Active admin/governance surface should display relevant spine status and existing backend metadata. |
| should_connect_to_spine | shrv1 | src/pages/admin/growth/HubSignalIntelligencePanel.jsx | None | admin | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsAssetGovernance.jsx | admin.html#/ops/assets | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsBrandProfile.jsx | admin.html#/ops/brand-profile | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsBuildPacket.jsx | admin.html#/ops/build-packet | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsDataBinding.jsx | admin.html#/ops/data-binding | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsLayoutBlueprint.jsx | admin.html#/ops/layout-blueprint | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsLearningDashboard.jsx | admin.html#/ops/learning | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsMockReview.jsx | admin.html#/ops/mock-review | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsPageIntent.jsx | admin.html#/ops/page-intent | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsProjectSetup.jsx | admin.html#/ops/projects | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsScreenshotQA.jsx | admin.html#/ops/screenshot-qa | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/admin/ops/OpsVisualTreatment.jsx | admin.html#/ops/visual-treatment | admin | medium | phase_3 | Active Production Ops admin surface should show route/readiness/truth metadata where relevant. |
| should_connect_to_spine | shrv1 | src/pages/arcade/ArcadeDashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/arcade/games/index.jsx | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/career/CareerDashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/civic/CivicDashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/curriculum/CurriculumDashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/curriculum/CurriculumDashboardNorthstar.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/debt/Dashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/debt/DebtDashboardNorthstar.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/employer/Dashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/employer/EmployerDashboardNorthstar.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/CommandCenterReportActions.jsx | None | command center | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/CommandCenterShell.jsx | None | command center | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/OperatorDashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/ProviderDashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/WorkspaceDashboard.jsx | admin.html#/dashboard | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/aggregation/AggregationCommandCenter.jsx | None | command center | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/command-center/CommandCenterShell.jsx | None | command center | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/command-center/StatusRail.jsx | None | command center | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/workspace-dashboard/SHSWorkspaceDashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/workspace-dashboard/components/DashboardHeader.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/workspace-dashboard/components/DashboardRail.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/exchange/workspace-dashboard/components/KpiStrip.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/hub/HubInteractionLayer.jsx | None | report | high | phase_3 | Report/narrative/export adjacent surface should consume Truth Spine, Reports, Oracle/trust, and readiness metadata before publication workflows. |
| should_connect_to_spine | shrv1 | src/pages/iep/IEPDashboardPage.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/sales/Dashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/sales/DashboardNorthstar.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/sales/SalesDashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/shf-command/sections/ProgramHealthPanel.jsx | None | command center | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| should_connect_to_spine | shrv1 | src/pages/treasury/Dashboard.jsx | None | dashboard | medium | phase_2 | Active command/dashboard surface should expose existing Watchtower, Reports/trust, LOO, Agent Fabric, or SHF Impact Data Spine summaries. |
| route_only_fix | shrv1 | src/pages/AdminAnalytics.jsx | None | admin | low | phase_1 | Existing sidebar target had an obvious existing page; route/access fix applied in this pass. |
| route_only_fix | shrv1 | src/pages/dev/Docs.jsx | None | foundation | low | phase_1 | Existing sidebar target had an obvious existing page; route/access fix applied in this pass. |
| keep_visual_only | shrv1 | src/pages/LessonPage.jsx | None | foundation | low | phase_4 | Foundation/public/program page can remain visual/static until public claims require Truth Spine or Data Approval metadata. |
| keep_visual_only | shrv1 | src/pages/Marketplace.jsx | None | foundation | low | phase_4 | Foundation/public/program page can remain visual/static until public claims require Truth Spine or Data Approval metadata. |
| keep_visual_only | shrv1 | src/pages/foundation/About.jsx | None | foundation | low | phase_4 | Foundation/public/program page can remain visual/static until public claims require Truth Spine or Data Approval metadata. |
| keep_visual_only | shrv1 | src/pages/foundation/AdminAppsGallery.jsx | None | admin | low | phase_4 | Foundation/public/program page can remain visual/static until public claims require Truth Spine or Data Approval metadata. |
| keep_visual_only | shrv1 | src/pages/foundation/FoundationAppsPage.jsx | None | foundation | low | phase_4 | Foundation/public/program page can remain visual/static until public claims require Truth Spine or Data Approval metadata. |
| keep_visual_only | shrv1 | src/pages/foundation/Top.jsx | None | foundation | low | phase_4 | Foundation/public/program page can remain visual/static until public claims require Truth Spine or Data Approval metadata. |
| keep_visual_only | shrv1 | src/pages/foundation/Transparency.jsx | None | foundation | low | phase_4 | Foundation/public/program page can remain visual/static until public claims require Truth Spine or Data Approval metadata. |
| keep_visual_only | shrv1 | src/pages/treasury/Help.jsx | None | foundation | low | phase_4 | Foundation/public/program page can remain visual/static until public claims require Truth Spine or Data Approval metadata. |
| archive_candidate | shrv1 | src/pages/exchange/.!20307!CommandCenter.jsx | None | command center | medium | phase_4 | Checkpoint/recovery-style command center artifact appears inactive and should be reviewed for archive rather than wired. |
| duplicate_or_merge_required | shrv1 | src/pages/hub/HubOpportunitiesPage.jsx | admin.html#/hub/opportunities | internal | medium | phase_4 | Active status is unclear or overlaps existing app/dashboard surfaces; owner decision required before route/spine changes. |
| duplicate_or_merge_required | shrv1 | src/pages/hub/HubSalesPipelinePage.jsx | admin.html#/hub/sales-pipeline | internal | medium | phase_4 | Active status is unclear or overlaps existing app/dashboard surfaces; owner decision required before route/spine changes. |
| duplicate_or_merge_required | shrv1 | src/pages/hub/ReferralLifecycleView.jsx | admin.html#/hub/lifecycle; admin.html#/hub/referrals | internal | medium | phase_4 | Active status is unclear or overlaps existing app/dashboard surfaces; owner decision required before route/spine changes. |
| duplicate_or_merge_required | shrv1 | src/pages/AdminCohorts.jsx | None | admin | medium | phase_4 | Active status is unclear or overlaps existing app/dashboard surfaces; owner decision required before route/spine changes. |
| duplicate_or_merge_required | shrv1 | src/pages/CareerLearningBridge.jsx | None | admin | medium | phase_4 | Active status is unclear or overlaps existing app/dashboard surfaces; owner decision required before route/spine changes. |
| duplicate_or_merge_required | shrv1 | src/pages/admin/Attribution.jsx | None | admin | medium | phase_4 | Admin page exists without current route evidence; likely legacy or needs owner decision before mounting. |
| duplicate_or_merge_required | shrv1 | src/pages/admin/PartnerJobs.jsx | None | admin | medium | phase_4 | Admin page exists without current route evidence; likely legacy or needs owner decision before mounting. |
| duplicate_or_merge_required | shrv1 | src/pages/admin/PlacementKPIs.jsx | None | admin | medium | phase_4 | Admin page exists without current route evidence; likely legacy or needs owner decision before mounting. |
| duplicate_or_merge_required | shrv1 | src/pages/admin/TalentSources.jsx | None | admin | medium | phase_4 | Admin page exists without current route evidence; likely legacy or needs owner decision before mounting. |
| shf_next_sync_required | shf-next | src/pages/ops/DevelopmentLibrary.tsx | None | ops | medium | phase_3 | Companion shf-next ops/foundation surface should stay aligned with shrv1 spine decisions without changing shf-next in this pass. |
| shf_next_sync_required | shf-next | src/pages/ops/OpsCommandOverview.tsx | None | clientops | medium | phase_3 | Companion shf-next ops/foundation surface should stay aligned with shrv1 spine decisions without changing shf-next in this pass. |
| shf_next_sync_required | shf-next | src/pages/ops/ProductionProjects.tsx | None | ops | medium | phase_3 | Companion shf-next ops/foundation surface should stay aligned with shrv1 spine decisions without changing shf-next in this pass. |
| shf_next_sync_required | shf-next | src/pages/ops/QADeliveryDashboard.tsx | None | dashboard | medium | phase_3 | Companion shf-next ops/foundation surface should stay aligned with shrv1 spine decisions without changing shf-next in this pass. |
| shf_next_sync_required | shf-next | src/pages/ops/SalesCommandCenter.tsx | None | command center | medium | phase_3 | Companion shf-next ops/foundation surface should stay aligned with shrv1 spine decisions without changing shf-next in this pass. |
| unknown_review_required | shrv1 | src/pages/AllPages.jsx | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/Arcade.jsx | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/arcade/ArcadeHistory.jsx | None | unknown | medium | phase_4 | Static scan found insufficient route/page evidence; requires owner/Codex follow-up. |
| unknown_review_required | shrv1 | src/pages/auth/SHSLoginPage.jsx | admin.html#/login | unknown | medium | phase_4 | Static scan found insufficient route/page evidence; requires owner/Codex follow-up. |
| unknown_review_required | shrv1 | src/pages/civic/ConstitutionJournal.jsx | None | unknown | medium | phase_4 | Static scan found insufficient route/page evidence; requires owner/Codex follow-up. |
| unknown_review_required | shrv1 | src/pages/civic/Leaderboard.jsx | None | unknown | medium | phase_4 | Static scan found insufficient route/page evidence; requires owner/Codex follow-up. |
| unknown_review_required | shrv1 | src/pages/exchange/workspace-dashboard/components/ConferencePanel.jsx | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/workspace-dashboard/components/FilesPanel.jsx | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/workspace-dashboard/components/ProfileUploadCard.jsx | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/workspace-dashboard/dashboardUtils.js | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/shf-command/sections/ImpactGuidancePanel.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/shf-command/sections/ImpactOverviewWheelPanel.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/Curriculum.jsx | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/civic/CivicHome.jsx | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/ModeContext.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/command-center/BackgroundSystem.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/command-center/DecisionActionBar.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/command-center/ExecutiveOverlay.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/command-center/RecommendationStrip.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/command-surface/CountyOverlay.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/command-surface/IEPSystemCard.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/command-surface/countyStatusDemo.js | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/commandCenter.constants.js | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/commandCenter.features.js | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/commandCenter.helpers.js | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/workspace-dashboard/components/JournalPanel.jsx | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/exchange/workspace-dashboard/components/WorkspaceLauncher.jsx | None | dashboard | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/shf-command/SHFOhioMapEngine.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/shf-command/SHFOhioMapEngineTest.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/shf-command/components/SHFRegionalCountyCluster.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/shf-command/components/map/OhioImpactTacticalMap.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |
| unknown_review_required | shrv1 | src/pages/shf-command/sections/ImpactKpiBand.jsx | None | command center | medium | phase_4 | Dashboard-like file lacks route evidence; verify active ownership before wiring. |

## Route / Sidebar / Permission Findings

### Sidebar Links Without Routes
| folder | route_pattern | label | source_file |
| --- | --- | --- | --- |
| shrv1 | /admin | Admin Home | src/components/admin/AdminSidebar.jsx |
| shrv1 | /admin/users | Users | src/components/admin/AdminSidebar.jsx |
| shrv1 | /admin/settings | Settings | src/components/admin/AdminSidebar.jsx |
| shrv1 | /health | Health | src/components/admin/AdminSidebar.jsx |

### Routes Without Pages
| folder | route | component | source_file | notes |
| --- | --- | --- | --- | --- |
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

### Fallback / Redirect Routes
| route | type |
| --- | --- |
| admin.html#/ | redirect/fallback |
| admin.html#/loo | redirect/fallback |
| admin.html#/watchtower | redirect/fallback |
| admin.html#* | redirect/fallback |

### Permission Gaps
| route | issue | risk |
| --- | --- | --- |
| /admin | sidebar link has no mounted route; route would fall through to Hub | medium |
| /admin/users | sidebar link has no mounted route; route would fall through to Hub | medium |
| /admin/settings | sidebar link has no mounted route; route would fall through to Hub | medium |
| /health | sidebar link has no mounted route; route would fall through to Hub | medium |

## Low-Risk Fixes Applied

| file | change | risk |
| --- | --- | --- |
| src/router/AdminRoutes.jsx | Added exact /lord-outcomes route using existing LordOutcomesRoutes and AUDIT_VIEW permission. | low |
| src/router/AdminRoutes.jsx | Mounted existing AdminAnalytics at /analytics with AUDIT_VIEW. | low |
| src/router/AdminRoutes.jsx | Mounted existing DevDocsViewer at /dev/docs with AUDIT_VIEW. | low |
| src/system/identity/hubAccessControl.js | Added shs_admin access entries for /analytics and /dev/docs. | low |

## Watchtower / LOO Card Verification

| surface | route | watchtower | loo | reports_trust | agent_fabric_governance | connection_type |
| --- | --- | --- | --- | --- | --- | --- |
| shrv1_command_center | admin.html#/command and admin.html#/command-center | False | False | True | False | local/static SHF impact data plus UI state; ReportsBriefingsPanel and Trust Verification Panel present; no explicit Watchtower/LOO backend card found |
| shrv1_dashboard | admin.html#/dashboard | False | False | False | False | workspace dashboard/static-local state by static scan; no explicit spine card found |
| agent_fabric_governance_surface | admin.html#/agent-fabric | True | True | True | True | backend-connected Agent Fabric/admin layer summaries when service is available |
| reports_surface | admin.html#/reports and admin.html#/reporting | False | False | True | False | frontend/backend reporting model with trust envelope terms and export gates |

## Spine Coverage Plan

| folder | file_path | route | recommended_spine_connections | required_data_source | frontend_card_or_data_needed | route_permission_needed | risk_level | suggested_phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| shrv1 | src/pages/CreditReport.jsx | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/GrantBinder.jsx | admin.html#/grant-binder | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/MasterNarrativeViewer.jsx | admin.html#/master-narrative | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/aggregation/BridgeDemoPanel.jsx | None | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/admin/aggregation/QualityCommandPanel.jsx | None | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/admin/reporting/VerificationAuditSurface.jsx | admin.html#/verification-audit | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/reporting/analyst/analyst-context-builder.js | None | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/reporting/bridge-record-links.ts | None | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/reporting/bridge-workflow-store.ts | None | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/reporting/export-history-adapter.ts | None | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/reporting/reporting-backend-adapter.ts | None | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/reporting/verification-audit-actions.ts | None | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/arcade/ArcadeDashboardNorthstar.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/arcade/History.jsx | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/credit/Portfolio.jsx | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/debt/Education.jsx | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/exchange/useCommandCenterReportActions.js | None | Watchtower, Reports, LOO, Agent Fabric, SHF Impact Data Spine, Truth Spine | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/hub/HubLeadershipDashboard.jsx | admin.html#/hub/network; admin.html#/hub/leadership | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/hub/HubSignalSenderPanel.jsx | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/hub/shared/hubBusinessNetworkNav.js | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/iep-command-v2/FloatingFranklinNode.jsx | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/iep-command-v2/IEPCommandCenterV2.jsx | None | Watchtower, Reports, LOO, Agent Fabric, SHF Impact Data Spine, Truth Spine | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/shf-command/sections/ReportsBriefingsPanel.jsx | None | Watchtower, Reports, LOO, Agent Fabric, SHF Impact Data Spine, Truth Spine | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/treasury/Ledger.jsx | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/Dashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/admin/AlignmentSwitchboard.jsx | admin.html#/alignment | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/admin/growth/HubSignalIntelligencePanel.jsx | None | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/admin/ops/OpsAssetGovernance.jsx | admin.html#/ops/assets | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsBrandProfile.jsx | admin.html#/ops/brand-profile | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsBuildPacket.jsx | admin.html#/ops/build-packet | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsDataBinding.jsx | admin.html#/ops/data-binding | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsLayoutBlueprint.jsx | admin.html#/ops/layout-blueprint | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsLearningDashboard.jsx | admin.html#/ops/learning | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsMockReview.jsx | admin.html#/ops/mock-review | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsPageIntent.jsx | admin.html#/ops/page-intent | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsProjectSetup.jsx | admin.html#/ops/projects | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsScreenshotQA.jsx | admin.html#/ops/screenshot-qa | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/admin/ops/OpsVisualTreatment.jsx | admin.html#/ops/visual-treatment | Truth Spine, Master Layer Registry, Layer Gate, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_3 |
| shrv1 | src/pages/arcade/ArcadeDashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/arcade/games/index.jsx | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/career/CareerDashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/civic/CivicDashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/curriculum/CurriculumDashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/curriculum/CurriculumDashboardNorthstar.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/debt/Dashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/debt/DebtDashboardNorthstar.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/employer/Dashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/employer/EmployerDashboardNorthstar.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/CommandCenterReportActions.jsx | None | Watchtower, Reports, LOO, Agent Fabric, SHF Impact Data Spine, Truth Spine | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/CommandCenterShell.jsx | None | Watchtower, Reports, LOO, Agent Fabric, SHF Impact Data Spine, Truth Spine | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/OperatorDashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/ProviderDashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/WorkspaceDashboard.jsx | admin.html#/dashboard | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/aggregation/AggregationCommandCenter.jsx | None | Watchtower, Reports, LOO, Agent Fabric, SHF Impact Data Spine, Truth Spine | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/command-center/CommandCenterShell.jsx | None | Watchtower, Reports, LOO, Agent Fabric, SHF Impact Data Spine, Truth Spine | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/command-center/StatusRail.jsx | None | Watchtower, Reports, LOO, Agent Fabric, SHF Impact Data Spine, Truth Spine | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/workspace-dashboard/SHSWorkspaceDashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/workspace-dashboard/components/DashboardHeader.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/workspace-dashboard/components/DashboardRail.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/exchange/workspace-dashboard/components/KpiStrip.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/hub/HubInteractionLayer.jsx | None | Truth Spine, Oracle, Reports, Public Approval, Data Approval Gateway | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | high | phase_3 |
| shrv1 | src/pages/iep/IEPDashboardPage.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/sales/Dashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/sales/DashboardNorthstar.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/sales/SalesDashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/shf-command/sections/ProgramHealthPanel.jsx | None | Watchtower, Reports, LOO, Agent Fabric, SHF Impact Data Spine, Truth Spine | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |
| shrv1 | src/pages/treasury/Dashboard.jsx | None | Watchtower, Reports, LOO, Identity / Access Control | existing backend summary endpoints or local app state promoted through registered adapter; no fake data | small status/readiness/trust card only where page is active and owner-approved | ensure AdminRoutes + hubAccessControl for admin/internal routes; public pages must not import admin-only logic | medium | phase_2 |

## Phase 1-4 Implementation Plan

### phase_1_route_sidebar_permission_fixes
- Keep applied /analytics, /dev/docs, and exact /lord-outcomes route fixes if validation passes.
- Owner decision for /admin, /admin/users, /admin/settings, and /health sidebar targets.
- Regenerate route/sidebar inventory after staging/commit to retire stale audit gaps.
### phase_2_internal_command_dashboard_spine_connections
- Add existing summary cards only to active command/dashboard/admin surfaces: Watchtower summary, LOO trust metadata, Reports/trust, Agent Fabric/layer gate.
- Prioritize SHFImpactCommandCenter, WorkspaceDashboard, AgentFabricPage, AggregationDashboard, VerificationAuditSurface.
- Do not add new backend contracts; use existing endpoints and Truth Spine metadata.
### phase_3_report_ops_clientops_studio_connections
- Wire report/ops/clientops pages to Truth Spine readiness, Reports snapshot, SHF Impact Data Spine, Data Approval Gateway, Production Ops/ClientOps metadata.
- Keep WebMaker/BuilderHub boundary intact; public WebMaker only gets public-safe approved metadata.
- Coordinate shf-next sync without modifying its manual router unless separately approved.
### phase_4_archive_merge_owner_decisions
- Review checkpoint/legacy/duplicate command center artifacts and old dashboards for archive or merge.
- Decide ownership for unmounted admin pages and helper files before route exposure.
- Move inactive artifacts only through the external archive process; do not delete.

## shrv1 Route Test List

- `admin.html`
- `admin.html#/hub`
- `admin.html#/agent-fabric`
- `admin.html#/registry`
- `admin.html#/truth-spine`
- `admin.html#/oracle`
- `admin.html#/ai-guardrails`
- `admin.html#/game-theory`
- `admin.html#/command`
- `admin.html#/dashboard`
- `admin.html#/reports`
- `admin.html#/reporting`
- `admin.html#/lord-outcomes`
- `admin.html#/analytics`
- `admin.html#/dev/docs`
- `admin.html#/ops/production`
- `admin.html#/ops/projects`
- `admin.html#/builder`
- `admin.html#/web-maker`

## shf-next Route Test List

- `/ops/command`
- `/ops/sales`
- `/ops/projects`
- `/ops/library`
- `/ops/qa`
- `/ops/clientops`
- `/studio/templates`
- `/studio/templates/browse`
- `/studio/templates/floral-boutique`
- `/foundation/data-approval`
- `/foundation/impact-report`
- `/foundation/impact-report/print?style=premium&period=annual`

## Browser Smoke Results

Representative browser smoke passed on `http://127.0.0.1:5174` with no blank screens and no browser console errors. Routes checked: `#/hub`, `#/agent-fabric`, `#/registry`, `#/truth-spine`, `#/oracle`, `#/ai-guardrails`, `#/game-theory`, `#/command`, `#/dashboard`, `#/lord-outcomes`, `#/analytics`, and `#/dev/docs`. The fixed `/lord-outcomes` route rendered Lord Outcomes content; a broad text heuristic saw Hub-related copy in the page, but the URL did not fall through to `#/hub`.

## Backend Smoke Results

All requested backend smoke checks passed via FastAPI TestClient: `GET /watchtower/summary`, `GET /reports/snapshot`, `POST /loo/score`, `GET /admin/agents/summary/health`, `GET /admin/layers/gate/status`, `GET /truth/health`, `GET /oracle/health`, `GET /ai-guardrails/health`, and `GET /game-theory/health`. `POST /loo/score` returned `score=100` and `decision=GREEN` for the smoke payload.

## Validation Results

| Command | Result |
| --- | --- |
| `npm run check:governance` | PASS |
| `python3 scripts/check_master_layer_registry.py` | PASS |
| `python3 scripts/check_truth_spine_freeze.py` | PASS |
| `python3 scripts/check_oracle_layer.py` | PASS |
| `python3 scripts/check_ai_guardrails_layer.py` | PASS |
| `python3 scripts/check_game_theory_layer.py` | PASS |
| focused Agent Fabric pytest | PASS: 25 passed |
| `npm run build` in shrv1 | PASS with existing large chunk warnings |
| `npm run build` in shf-next | PASS with chunk warning; sandbox escalation required for tsbuildinfo writes |
| `npm run lint` in shf-next | PASS |
| shf-next git status | Not a git repository in this environment |

## Files Changed

- `src/router/AdminRoutes.jsx`
- `src/system/identity/hubAccessControl.js`
- `docs/ROUTE_INTEGRITY_SPINE_COVERAGE_PLAN_V1.md`
- `docs/ROUTE_INTEGRITY_SPINE_COVERAGE_PLAN_V1.json`

## Remaining Risks

- Do not connect the 124 target pages blindly; many are helpers, historical dashboards, or owner-decision surfaces.
- shf-next is a related folder with manual pathname routing and no git repository in this environment; sync changes should be separately scoped.
- Command Center has Reports/trust visibility but no explicit Watchtower or LOO card by static scan.
- Dashboard route exists but does not show explicit Watchtower, LOO, Reports/trust, or Agent Fabric/governance cards by static scan.
- Sidebar gaps remain for /admin, /admin/users, /admin/settings, and /health pending owner/page decisions.

## V1 Complete

Yes. V1 is complete as a route integrity and spine coverage planning pass with only low-risk shrv1 route/access fixes applied.
