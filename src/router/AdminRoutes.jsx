import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { canAccessHubRoute } from "@/system/identity/hubAccessControl";
import { getCurrentIdentity } from "@/system/identity/identityRouting";

import AppRegistry from "@/pages/admin/AppRegistry.jsx";
import Registry from "@/pages/admin/Registry.jsx";
import ToolDashboard from "@/pages/admin/ToolDashboard.jsx";
import MasterNarrativeViewer from "@/pages/admin/MasterNarrativeViewer.jsx";
import GrantBinder from "@/pages/admin/GrantBinder.jsx";
import AlignmentSwitchboard from "@/pages/admin/AlignmentSwitchboard.jsx";
import BuilderHub from "@/pages/admin/BuilderHub.jsx";
import AdminAnalytics from "@/pages/AdminAnalytics.jsx";
import DevDocsViewer from "@/pages/dev/Docs.jsx";

import AggregationDashboard from "@/pages/admin/aggregation/AggregationDashboard.jsx";
import ReportingCommandSurface from "@/pages/admin/reporting/ReportingCommandSurface.jsx";
import ShsReportsCommandPage from "@/pages/admin/reports/ShsReportsCommandPage.jsx";
import ShsCreateReportPage from "@/pages/admin/reports/ShsCreateReportPage.jsx";
import ShsPremiumReportPreviewPage from "@/pages/admin/reports/ShsPremiumReportPreviewPage.jsx";
import ShsReportHistoryPage from "@/pages/admin/reports/ShsReportHistoryPage.jsx";
import ShsExportMetadataPage from "@/pages/admin/reports/ShsExportMetadataPage.jsx";
import VerificationAuditSurface from "@/pages/admin/reporting/VerificationAuditSurface.jsx";
import TruthSpinePage from "@/pages/admin/truth-spine/TruthSpinePage.jsx";
import OraclePage from "@/pages/admin/oracle/OraclePage.jsx";
import AIGuardrailsPage from "@/pages/admin/ai-guardrails/AIGuardrailsPage.jsx";
import GameTheoryPage from "@/pages/admin/game-theory/GameTheoryPage.jsx";
import AgentFabricPage from "@/pages/admin/agent-fabric/AgentFabricPage.jsx";
import AgentWorkbenchPage from "@/pages/admin/agents/AgentWorkbenchPage.jsx";
import DirectConnectProofCenterPage from "@/pages/admin/direct-connect/DirectConnectProofCenterPage.jsx";
import ShsSystemOrchestratorPage from "@/pages/admin/orchestrator/ShsSystemOrchestratorPage.jsx";
import ShsPersistenceCenterPage from "@/pages/admin/persistence/ShsPersistenceCenterPage.jsx";
import ShsTrackingIntelligencePage from "@/pages/admin/tracking/ShsTrackingIntelligencePage.jsx";
import ShsSystemRegistryPage from "@/pages/admin/system-registry/ShsSystemRegistryPage.jsx";
import ShsCommandBusPage from "@/pages/admin/command-bus/ShsCommandBusPage.jsx";
import ShsEventBusPage from "@/pages/admin/event-bus/ShsEventBusPage.jsx";
import ShsJobSchedulerPage from "@/pages/admin/scheduler/ShsJobSchedulerPage.jsx";
import ShsNotificationFabricPage from "@/pages/admin/notifications/ShsNotificationFabricPage.jsx";
import ShsBosExecutiveCommandCenterPage from "@/pages/admin/executive-command/ShsBosExecutiveCommandCenterPage.jsx";
import SHFImpactCommandCenter from "@/pages/shf-command/SHFImpactCommandCenter.jsx";
import WorkspaceDashboard from "@/pages/exchange/WorkspaceDashboard.jsx";
import LordOutcomesRoutes from "@/router/LordOutcomesRoutes.jsx";
import OpsProductionDashboard from "@/pages/admin/ops/OpsProductionDashboard.jsx";
import OpsProjectSetup from "@/pages/admin/ops/OpsProjectSetup.jsx";
import OpsBrandProfile from "@/pages/admin/ops/OpsBrandProfile.jsx";
import OpsPageIntent from "@/pages/admin/ops/OpsPageIntent.jsx";
import OpsLayoutBlueprint from "@/pages/admin/ops/OpsLayoutBlueprint.jsx";
import OpsVisualTreatment from "@/pages/admin/ops/OpsVisualTreatment.jsx";
import OpsAssetGovernance from "@/pages/admin/ops/OpsAssetGovernance.jsx";
import OpsDataBinding from "@/pages/admin/ops/OpsDataBinding.jsx";
import OpsMockReview from "@/pages/admin/ops/OpsMockReview.jsx";
import OpsBuildPacket from "@/pages/admin/ops/OpsBuildPacket.jsx";
import OpsScreenshotQA from "@/pages/admin/ops/OpsScreenshotQA.jsx";
import OpsLearningDashboard from "@/pages/admin/ops/OpsLearningDashboard.jsx";
import OpsLaunchWorkflowPage from "@/pages/admin/ops/OpsLaunchWorkflowPage.jsx";

import HubWorkspaceDashboard from "@/pages/hub/HubWorkspaceDashboard.jsx";
import SHSLoginPage from "@/pages/auth/SHSLoginPage.jsx";
import HubLeadershipDashboard from "@/pages/hub/HubLeadershipDashboard.jsx";
import IntakeNavigatorConsole from "@/pages/hub/IntakeNavigatorConsole.jsx";
import PartnerActionQueue from "@/pages/hub/PartnerActionQueue.jsx";
import ReferralLifecycleView from "@/pages/hub/ReferralLifecycleView.jsx";
import UnmetNeedsQueue from "@/pages/hub/UnmetNeedsQueue.jsx";
import HubFilesImports from "@/pages/hub/HubFilesImports.jsx";
import HubReports from "@/pages/hub/HubReports.jsx";
import HubGrowthNetwork from "@/pages/hub/HubGrowthNetwork.jsx";
import HubSalesPipelinePage from "@/pages/hub/HubSalesPipelinePage.jsx";
import HubOpportunitiesPage from "@/pages/hub/HubOpportunitiesPage.jsx";
import HubBundleBuilderPage from "@/pages/hub/HubBundleBuilderPage.jsx";
import HubIntelligencePage from "@/pages/hub/HubIntelligencePage.jsx";

import IdentityManagement from "../pages/admin/identity/IdentityManagement";
import UploadManager from "../pages/admin/uploads/UploadManager";
import AuditLogViewer from "../pages/admin/audit/AuditLogViewer";

import AuthGuard from "../auth/AuthGuard";
import PermissionGuard from "../auth/PermissionGuard";
import SolutionsInfrastructurePage from "@/pages/solutions/SolutionsInfrastructurePage.jsx";
import SHSPartnerGrowthEngine from "@/pages/admin/growth/SHSPartnerGrowthEngine.jsx";
import { installGlobalButtonClickSound } from "../shared/ui/globalButtonClickSound.js";
import { SHS_SECURITY_PERMISSIONS } from "@/system/security/security-permissions";

installGlobalButtonClickSound();

function ProtectedHubRoute({ path, children }) {
  const location = useLocation();
  const identity = getCurrentIdentity();
  const routePath = path || location.pathname || "/hub";
  const isAllowed = identity.isAuthenticated && canAccessHubRoute(identity.role, routePath);

  React.useEffect(() => {
    if (!identity.isAuthenticated) return;

    if (!canAccessHubRoute(identity.role, routePath)) {
      console.warn("[identity] blocked route", {
        route: routePath,
        role: identity.role,
        user: identity.email,
      });

      localStorage.setItem(
        "shsAccessRedirectNotice",
        JSON.stringify({
          blockedRoute: routePath,
          role: identity.role,
          user: identity.email,
          reason: "Your current role does not have access to that page.",
          redirectedTo: "/hub",
          time: new Date().toISOString(),
        })
      );
    }
  }, [identity.isAuthenticated, identity.role, identity.email, routePath]);

  if (!identity.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAllowed) {
    return <Navigate to="/hub" replace />;
  }

  return children;
}

function protect(path, element, permissions = []) {
  const wrapped = permissions.length ? (
    <PermissionGuard permissions={permissions}>{element}</PermissionGuard>
  ) : (
    element
  );

  return (
    <ProtectedHubRoute path={path}>
      {wrapped}
    </ProtectedHubRoute>
  );
}

export default function AdminRoutes() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="/login" element={<SHSLoginPage />} />
        {/* Default */}
        <Route path="/" element={<Navigate to="/hub" replace />} />

        {/* SHS Hub */}
        <Route path="/hub" element={protect("/hub", <HubWorkspaceDashboard />)} />
        <Route path="/hub/network" element={protect("/hub/network", <HubLeadershipDashboard />)} />
        <Route path="/hub/leadership" element={protect("/hub/leadership", <HubLeadershipDashboard />)} />
        <Route path="/hub/intake" element={protect("/hub/intake", <IntakeNavigatorConsole />)} />
        <Route path="/hub/queue" element={protect("/hub/queue", <PartnerActionQueue />)} />
        <Route path="/hub/action-queue" element={protect("/hub/action-queue", <PartnerActionQueue />)} />
        <Route path="/hub/lifecycle" element={protect("/hub/lifecycle", <ReferralLifecycleView />)} />
        <Route path="/hub/referrals" element={protect("/hub/referrals", <ReferralLifecycleView />)} />
        <Route path="/hub/unmet-needs" element={protect("/hub/unmet-needs", <UnmetNeedsQueue />)} />
        <Route path="/hub/imports" element={protect("/hub/imports", <HubFilesImports />)} />
        <Route path="/hub/reports" element={protect("/hub/reports", <HubReports />)} />
        <Route path="/hub/growth-network" element={protect("/hub/growth-network", <HubGrowthNetwork />)} />
        <Route path="/hub/sales-pipeline" element={protect("/hub/sales-pipeline", <HubSalesPipelinePage />)} />
        <Route path="/hub/opportunities" element={protect("/hub/opportunities", <HubOpportunitiesPage />)} />
        <Route path="/hub/bundles" element={protect("/hub/bundles", <HubBundleBuilderPage />)} />
        <Route path="/hub/intelligence" element={protect("/hub/intelligence", <HubIntelligencePage />)} />

        {/* Shared SHS admin/infrastructure surfaces */}
        <Route path="/uploads" element={protect("/uploads", <UploadManager />, [SHS_SECURITY_PERMISSIONS.UPLOADS_INTERNAL])} />
        <Route path="/imports" element={protect("/imports", <HubFilesImports />, [SHS_SECURITY_PERMISSIONS.UPLOADS_INTERNAL])} />
        <Route path="/aggregation" element={protect("/aggregation", <AggregationDashboard />, [SHS_SECURITY_PERMISSIONS.AGGREGATION_VIEW])} />
        <Route path="/reporting" element={protect("/reporting", <ReportingCommandSurface />, [SHS_SECURITY_PERMISSIONS.REPORTS_VIEW])} />
        <Route path="/reports" element={protect("/reports", <ReportingCommandSurface />, [SHS_SECURITY_PERMISSIONS.REPORTS_VIEW])} />
        <Route path="/ops/reports" element={protect("/ops/reports", <ShsReportsCommandPage />, [SHS_SECURITY_PERMISSIONS.REPORTS_VIEW])} />
        <Route path="/ops/reports/create" element={protect("/ops/reports/create", <ShsCreateReportPage />, [SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW])} />
        <Route path="/ops/reports/premium-preview" element={protect("/ops/reports/premium-preview", <ShsPremiumReportPreviewPage />, [SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW])} />
        <Route path="/ops/reports/premium-preview/toc" element={protect("/ops/reports/premium-preview/toc", <ShsPremiumReportPreviewPage />, [SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW])} />
        <Route path="/ops/reports/premium-preview/executive-summary" element={protect("/ops/reports/premium-preview/executive-summary", <ShsPremiumReportPreviewPage />, [SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW])} />
        <Route path="/ops/reports/premium-preview/client-profile" element={protect("/ops/reports/premium-preview/client-profile", <ShsPremiumReportPreviewPage />, [SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW])} />
        <Route path="/ops/reports/history" element={protect("/ops/reports/history", <ShsReportHistoryPage />, [SHS_SECURITY_PERMISSIONS.REPORTS_VIEW])} />
        <Route path="/ops/reports/export-metadata" element={protect("/ops/reports/export-metadata", <ShsExportMetadataPage />, [SHS_SECURITY_PERMISSIONS.REPORTS_VIEW])} />
        <Route path="/command" element={protect("/command", <SHFImpactCommandCenter />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/command-center" element={protect("/command-center", <SHFImpactCommandCenter />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/dashboard" element={protect("/dashboard", <WorkspaceDashboard />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/loo" element={<Navigate to="/lord-outcomes" replace />} />
        <Route path="/watchtower" element={<Navigate to="/agent-fabric" replace />} />
        <Route path="/lord-outcomes" element={protect("/lord-outcomes", <LordOutcomesRoutes />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/lord-outcomes/*" element={protect("/lord-outcomes", <LordOutcomesRoutes />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/verification-audit" element={protect("/verification-audit", <VerificationAuditSurface />, [SHS_SECURITY_PERMISSIONS.VERIFICATION_VIEW])} />
        <Route path="/truth-spine" element={protect("/truth-spine", <TruthSpinePage />, [SHS_SECURITY_PERMISSIONS.TRUTH_VIEW])} />
        <Route path="/oracle" element={protect("/oracle", <OraclePage />, [SHS_SECURITY_PERMISSIONS.TRUTH_VIEW])} />
        <Route path="/ai-guardrails" element={protect("/ai-guardrails", <AIGuardrailsPage />, [SHS_SECURITY_PERMISSIONS.TRUTH_VIEW])} />
        <Route path="/game-theory" element={protect("/game-theory", <GameTheoryPage />, [SHS_SECURITY_PERMISSIONS.TRUTH_VIEW])} />
        <Route path="/agent-fabric" element={protect("/agent-fabric", <AgentFabricPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/audit" element={protect("/audit", <AuditLogViewer />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/identity" element={protect("/identity", <IdentityManagement />, [SHS_SECURITY_PERMISSIONS.IDENTITY_VIEW])} />

        {/* Admin builder / registry */}
        <Route path="/app-registry" element={protect("/app-registry", <AppRegistry />)} />
        <Route path="/registry" element={protect("/registry", <Registry />)} />
        <Route path="/builder" element={protect("/builder", <BuilderHub />)} />
        <Route path="/web-maker" element={protect("/web-maker", <BuilderHub />)} />
        <Route path="/studio/templates" element={protect("/studio/templates", <BuilderHub />)} />
        <Route path="/builder/tools" element={protect("/builder/tools", <ToolDashboard />)} />
        <Route path="/tools" element={protect("/tools", <ToolDashboard />)} />
        <Route path="/tool-dashboard" element={protect("/tool-dashboard", <ToolDashboard />)} />
        <Route path="/master-narrative" element={protect("/master-narrative", <MasterNarrativeViewer />)} />
        <Route path="/grant-binder" element={protect("/grant-binder", <GrantBinder />)} />
        <Route path="/alignment" element={protect("/alignment", <AlignmentSwitchboard />)} />
        <Route path="/analytics" element={protect("/analytics", <AdminAnalytics />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/dev/docs" element={protect("/dev/docs", <DevDocsViewer />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />

        {/* Partner Growth Engine */}
        <Route path="/growth" element={protect("/growth", <SHSPartnerGrowthEngine />, [SHS_SECURITY_PERMISSIONS.GROWTH_VIEW])} />

        {/* Internal SHS Production Ops */}
        <Route path="/ops/production" element={protect("/ops/production", <OpsProductionDashboard />)} />
        <Route path="/ops/orchestrator" element={protect("/ops/orchestrator", <ShsSystemOrchestratorPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/persistence" element={protect("/ops/persistence", <ShsPersistenceCenterPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/tracking" element={protect("/ops/tracking", <ShsTrackingIntelligencePage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/system-registry" element={protect("/ops/system-registry", <ShsSystemRegistryPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/command-bus" element={protect("/ops/command-bus", <ShsCommandBusPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/event-bus" element={protect("/ops/event-bus", <ShsEventBusPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/scheduler" element={protect("/ops/scheduler", <ShsJobSchedulerPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/notifications" element={protect("/ops/notifications", <ShsNotificationFabricPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/executive-command" element={protect("/ops/executive-command", <ShsBosExecutiveCommandCenterPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/agents" element={protect("/ops/agents", <AgentWorkbenchPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/direct-connect" element={protect("/ops/direct-connect", <DirectConnectProofCenterPage />, [SHS_SECURITY_PERMISSIONS.AUDIT_VIEW])} />
        <Route path="/ops/projects" element={protect("/ops/projects", <OpsProjectSetup />)} />
        <Route path="/ops/brand-profile" element={protect("/ops/brand-profile", <OpsBrandProfile />)} />
        <Route path="/ops/page-intent" element={protect("/ops/page-intent", <OpsPageIntent />)} />
        <Route path="/ops/layout-blueprint" element={protect("/ops/layout-blueprint", <OpsLayoutBlueprint />)} />
        <Route path="/ops/visual-treatment" element={protect("/ops/visual-treatment", <OpsVisualTreatment />)} />
        <Route path="/ops/assets" element={protect("/ops/assets", <OpsAssetGovernance />)} />
        <Route path="/ops/data-binding" element={protect("/ops/data-binding", <OpsDataBinding />)} />
        <Route path="/ops/mock-review" element={protect("/ops/mock-review", <OpsMockReview />)} />
        <Route path="/ops/build-packet" element={protect("/ops/build-packet", <OpsBuildPacket />)} />
        <Route path="/ops/screenshot-qa" element={protect("/ops/screenshot-qa", <OpsScreenshotQA />)} />
        <Route path="/ops/launch-workflow" element={protect("/ops/launch-workflow", <OpsLaunchWorkflowPage />)} />
        <Route path="/ops/learning" element={protect("/ops/learning", <OpsLearningDashboard />)} />

        {/* Fallback */}
        <Route path="/solutions" element={protect("/solutions", <SolutionsInfrastructurePage />)} />
        <Route path="/solutions/infrastructure" element={protect("/solutions/infrastructure", <SolutionsInfrastructurePage />)} />
        <Route path="*" element={<Navigate to="/hub" replace />} />

      </Routes>
    </AuthGuard>
  );
}
