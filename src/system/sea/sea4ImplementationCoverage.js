import { DASHBOARD_PROJECTIONS } from "./dashboardArchitecture.js";
import { VISUAL_EXPERIENCE_CONTRACTS } from "./visualExperienceContracts.js";

// SEA-4 keeps implementation coverage explicit without becoming a second
// capability registry. Domain contracts and projections remain authoritative.
export const SEA4_IMPLEMENTATION_COVERAGE = Object.freeze([
  { id: "student", service: "student-learning", role: "learner", route: "/curriculum/asl/dashboard", module: "src/pages/curriculum/CurriculumDashboard.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "instructor", service: "instructor", role: "instructor", route: "/curriculum/instructor/operations", module: "src/pages/curriculum/InstructorOperations.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "career", service: "career", role: "learner", route: "/career.html#/dashboard", module: "src/pages/career/CareerDashboard.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "onboarding-applicant", service: "organization-onboarding", role: "applicant", route: "/operator/onboarding", module: "apps/shf-web/src/pages/operator/OrganizationOnboarding.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "onboarding-reviewer", service: "organization-onboarding", role: "reviewer", route: "/operator/onboarding", module: "apps/shf-web/src/pages/operator/OrganizationOnboarding.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "civicsure-provider", service: "civicsure-provider", role: "provider", route: "/civicsure/provider", module: "src/pages/civicsure/CivicSureApp.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "civicsure-operator", service: "civicsure-operator", role: "operator", route: "/verification-audit", module: "src/pages/admin/reporting/VerificationAuditSurface.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "studio-builder", service: "studio", role: "builder", route: "/studio", module: "src/pages/studio/StudioHome.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "studio-qa", service: "studio", role: "reviewer", route: "/studio/projects/:projectId/build", module: "src/pages/studio/StudioHome.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "studio-reviewer", service: "studio", role: "reviewer", route: "/studio/reviewer-queue", module: "src/pages/studio/StudioHome.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "hub-bos", service: "bos-hub", role: "org_admin", route: "/hub", module: "src/pages/hub/HubWorkspaceDashboard.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "agent-fabric", service: "agent-fabric", role: "agent_operator", route: "/agent-fabric", module: "src/pages/admin/agent-fabric/AgentFabricPage.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "arag-1", service: "arag-1", role: "approver", route: "/release-assurance", module: "src/pages/admin/release-assurance/ReleaseAssurancePage.jsx", status: "COMPLETE", browser: "PASS" },
  { id: "executive-command", service: "executive-command", role: "shs_admin", route: "/ops/executive-command", module: "src/pages/admin/executive-command/ShsBosExecutiveCommandCenterPage.jsx", status: "COMPLETE", browser: "PASS" },
]);

export function findSea4Projection(entry) {
  return DASHBOARD_PROJECTIONS.find((projection) => projection.projectionId === `${entry.service}:${entry.role}` || (entry.service === "studio" && projection.projectionId === "studio:qa" && entry.id === "studio-qa"));
}

export function findSea4VisualContract(entry) {
  return VISUAL_EXPERIENCE_CONTRACTS.find((contract) => contract.projectionId === `${entry.service}:${entry.role}` || (entry.service === "studio" && contract.projectionId === "studio:qa" && entry.id === "studio-qa"));
}
