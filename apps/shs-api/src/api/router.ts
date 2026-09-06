import { registerProgramRoutes } from "../domain/programs/api/routes.js";
import { registerCaseRoutes } from "../domain/cases/api/routes.js";
import { registerAuditRoutes } from "../domain/audit/api/routes.js";
import { registerIdentityRoutes } from "../domain/identity/api/routes.js";
import { registerReportingRoutes } from "../domain/reporting/routes.js";
import { registerGrantBinderRoutes } from "../domain/grant-binder/api/routes.js";
import { registerExchangeFundingCommitmentRoutes } from "../domain/exchange-funding-commitment/api/routes.js";
import { registerLiveLearningRoutes } from "../domain/live-learning/api/routes.js";
import { registerWorkforceOutcomeRoutes } from "../domain/workforce-outcome/api/routes.js";
import { registerOracleRoutes } from "../oracle/routes/oracle.routes.js";
import aggregationRoutes from "../aggregation/routes/aggregation.routes.js";
import { IdentityService } from "../domain/identity/service/identity-service.js";
import { ok, fail } from "./response-envelope.js";
import { writeSecurityAuditEvent } from "../auth/security-audit.js";
import { isProductionEnvironment } from "../auth/production-identity.js";
import { Auth0SessionService } from "../domain/identity/service/auth0-session-service.js";
import { registerCurriculumCompletionRoutes } from "../domain/curriculum/api/routes.js";
import { registerOrganizationRelationshipRoutes } from "../domain/organization-relationships/api/routes.js";
import { registerCareerRoutes } from "../domain/careers/api/routes.js";
import { authResponsePayload } from "../auth/auth-response.js";
import { registerPrepareProveRoutes } from "../domain/prepare-prove/api/routes.js";
import { registerSpecializationAssignmentRoutes } from "../domain/programs/api/specialization-assignment-routes.js";
import { registerSpecializationRequestRoutes } from "../domain/programs/api/specialization-request-routes.js";
import { registerGrade12EligibilityRoutes } from "../domain/programs/api/grade12-eligibility-routes.js";
import { registerCourseAssignmentRoutes } from "../domain/programs/api/course-assignment-routes.js";
import { registerProjectRoutes } from "../domain/projects/project-routes.js";
import { registerCapstoneEntryRoutes } from "../domain/programs/api/capstone-entry-routes.js";
import { registerJourneyRoutes } from "../domain/journey/api/routes.js";
import { registerCredentialRoutes } from "../domain/credentials/api/routes.js";
import { registerArcadeRoutes } from "../domain/arcade/api/routes.js";
import { registerCalendarRoutes } from "../domain/calendar/api/routes.js";
import { registerCompanionRoutes } from "../domain/companion/api/routes.js";
import { registerCalendarFeedRoutes } from "../domain/calendar-feed/api/routes.js";
import { registerExternalAccountRoutes } from "../domain/external-accounts/api/routes.js";
import { registerAccessibilityProfileRoutes } from "../domain/accessibility-profile/api/routes.js";
import { registerAssignmentRoutes } from "../domain/assignments/api/routes.js";
import { registerEnrollmentRoutes } from "../domain/enrollments/api/routes.js";
import { registerCareerEventRoutes } from "../domain/career-events/api/routes.js";
import { registerOpportunityRoutes } from "../domain/opportunities/api/routes.js";
import { registerSourceIngestionRoutes } from "../domain/source-ingestion/api/routes.js";
import { registerCurriculumCatalogRoutes } from "../domain/curriculum-catalog/api/routes.js";
import { registerStudentCatalogRoutes } from "../domain/curriculum-catalog/api/student-routes.js";
import { registerCurriculumImportJobRoutes } from "../domain/curriculum-catalog/api/import-job-routes.js";
import { registerDocumentProcessingRoutes } from "../domain/curriculum-catalog/api/document-processing-routes.js";
import { registerCompletionPolicyRoutes } from "../domain/completion-policy/api/routes.js";
import { registerActivityDomainRoutes } from "../domain/activity-domains/api/routes.js";
import { registerVerifiedEvidenceRoutes } from "../domain/verified-evidence/api/routes.js";
import { registerOperationalRoutes } from "../domain/operations/api/routes.js";
import { registerStudioProjectRoutes } from "../domain/studio/api/studio-project-routes.js";
import { registerPortfolioRoutes } from "../domain/portfolio/api/routes.js";
import { registerWebsiteDeploymentRoutes } from "../domain/deployment/api/routes.js";
import { registerAgentPackageRoutes } from "../domain/agent-package/api/routes.js";
import { registerRegistrySubmissionRoutes } from "../domain/registry-submission/api/routes.js";
import { registerReviewerRoutingRoutes } from "../domain/studio-routing/api/routes.js";
import { registerNotificationRoutes } from "../domain/notifications/api/routes.js";
import { registerStudioTeamRoutes } from "../domain/studio-team/api/routes.js";
import { registerStudioCollaborationRoutes } from "../domain/studio/api/studio-collaboration-routes.js";
import { registerServiceCatalogRoutes } from "../domain/service-catalog/api/routes.js";
import { registerServiceAgreementRoutes } from "../domain/service-agreements/api/routes.js";
import { registerOrganizationOnboardingRoutes } from "../domain/organization-onboarding/api/routes.js";
import { registerFundingGrantRoutes } from "../domain/funding-grants/api/routes.js";
import { registerImpactAttributionRoutes } from "../domain/impact-attribution/api/routes.js";
import { registerAiGovernanceRoutes } from "../domain/ai-governance/api/routes.js";
import { registerInputSecurityRoutes } from "../domain/input-security/api/routes.js";
import { registerAgentSimulationRoutes } from "../domain/agent-simulation/api/routes.js";
import { registerConductorRoutes } from "../domain/conductor/api/routes.js";
import { registerMcpRoutes } from "../domain/mcp/api/routes.js";
import { registerOperationalAwarenessRoutes } from "../domain/operational-awareness/api/routes.js";
import { registerAragRoutes } from "../domain/arag/api/routes.js";


type MutableApiUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  organization_id?: string;
  role_id?: string;
};

const identityService = new IdentityService();
const auth0Sessions = isProductionEnvironment() ? new Auth0SessionService() : null;


const DEMO_USERS = [
  {
    id: "demo-user-1",
    email: "admin@shs.local",
    first_name: "SHS",
    last_name: "Admin",
    status: "active",
  },
  {
    id: "demo-user-2",
    email: "ops@shf.local",
    first_name: "SHF",
    last_name: "Ops",
    status: "active",
  },
  {
    id: "demo-user-3",
    email: "partner@demo.local",
    first_name: "Partner",
    last_name: "Admin",
    status: "invited",
  },
];

const DEMO_ORGS = [
  {
    id: "shs-core",
    name: "Silicon Heartland Solutions",
    org_type: "SHS",
    status: "active",
  },
  {
    id: "shf-core",
    name: "Silicon Heartland Foundation",
    org_type: "SHF",
    status: "active",
  },
  {
    id: "partner-1",
    name: "Demo Partner Organization",
    org_type: "Partner",
    status: "active",
  },
];

const DEMO_ROLES = [
  { id: "super_admin", name: "super_admin" },
  { id: "shs_admin", name: "shs_admin" },
  { id: "shf_admin", name: "shf_admin" },
  { id: "partner_org_admin", name: "partner_org_admin" },
  { id: "program_worker", name: "program_worker" },
  { id: "reviewer_verifier", name: "reviewer_verifier" },
  { id: "leadership_funder_viewer", name: "leadership_funder_viewer" },
];

const DEMO_INVITES: any[] = [];

const DEMO_AUDIT_LOGS: any[] = [
  {
    id: "audit-seed-1",
    actor_user_id: "demo-user-1",
    organization_id: "shs-core",
    action_type: "system.bootstrap",
    target_type: "identity",
    target_id: "seed",
    metadata: { source: "demo-seed" },
    created_at: new Date().toISOString(),
  },
];


export function buildRouter(app: any) {
  

  app.get("/auth/me", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ ok: false, error: "Authentication required." });
      }

      return res.json(authResponsePayload(req.user));
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || "Failed to load auth session.",
      });
    }
  });

  app.post("/auth/logout", async (req: any, res: any) => {
    const sessionCookie = String(req.headers?.cookie || "").split(";").map((item) => item.trim()).find((item) => item.startsWith("shs_session="));
    if (auth0Sessions && sessionCookie) {
      await auth0Sessions.revoke(decodeURIComponent(sessionCookie.slice("shs_session=".length)));
      res.setHeader("Set-Cookie", "shs_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax");
    }
    return res.json({ ok: true });
  });
app.post("/auth/login", async (req: any, res: any) => {
    try {
      const { email, password } = req.body || {};
      const result = await identityService.login(email, password);
      res.json(ok(result));
    } catch (err: any) {
      res.status(401).json(fail("AUTH_FAILED", err.message || "Invalid credentials"));
    }
});

  app.post("/auth/session/exchange", async (req: any, res: any) => {
    if (!auth0Sessions) return res.status(404).json(fail("AUTH_NOT_CONFIGURED", "Production identity exchange is unavailable."));
    try {
      const result = await auth0Sessions.exchange({
        credential: String(req.body?.credential || ""),
        issuer: String(process.env.AUTH0_ISSUER || ""),
        audience: String(process.env.AUTH0_AUDIENCE || ""),
      });
      res.setHeader("Set-Cookie", `shs_session=${encodeURIComponent(result.session.token)}; Max-Age=3600; Path=/; HttpOnly; Secure; SameSite=Lax`);
      return res.json(ok({ user: result.user }));
    } catch {
      return res.status(401).json(fail("AUTH_FAILED", "Authentication failed."));
    }
  });

  app.get("/me", async (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
    }
    res.json(ok(authResponsePayload(req.user).user));
  });

  // These legacy fixture routes are local development surfaces only. They
  // must not expose or mutate demo identity data in production.
  if (!isProductionEnvironment()) {
  app.get("/users", async (_req: any, res: any) => {
    return res.json({ items: DEMO_USERS });
  });

  app.get("/organizations", async (_req: any, res: any) => {
    return res.json({ items: DEMO_ORGS });
  });

  app.get("/roles", async (_req: any, res: any) => {
    return res.json({ items: DEMO_ROLES });
  });

  app.get("/invites", async (_req: any, res: any) => {
    return res.json({ items: DEMO_INVITES });
  });

  app.post("/invites", async (req: any, res: any) => {
    const body = req.body || {};
    const invite = {
      id: `invite-${Date.now()}`,
      email: body.email || "",
      organization_id: body.organization_id || "",
      role_id: body.role_id || "",
      status: "created",
      created_at: new Date().toISOString(),
    };
    DEMO_INVITES.unshift(invite);
    return res.json({ ok: true, invite });
  });

  app.patch("/users/:id/status", async (req: any, res: any) => {
    const { id } = req.params;
    const { status } = req.body || {};
    const user = DEMO_USERS.find((u) => u.id === id) as MutableApiUser | undefined;
    if (!user) return res.status(404).json({ error: "User not found." });
    user.status = status || user.status;
    return res.json({ ok: true, user });
  });

  
  app.post("/uploads", async (req: any, res: any) => {
    try {
      const body = req.body || {};
      const upload = {
        id: `upload-${Date.now()}`,
        file_name: body.file_name || "demo-file",
        visibility: body.visibility || "internal",
        status: "uploaded",
        uploaded_by: req.user?.user_id || req.user?.id || "demo-user-1",
        organization_id: req.user?.organization_id || "shs-core",
        created_at: new Date().toISOString(),
      };

      DEMO_AUDIT_LOGS.unshift({
        id: `audit-${Date.now()}`,
        actor_user_id: upload.uploaded_by,
        organization_id: upload.organization_id,
        action_type: "upload.created",
        target_type: "upload",
        target_id: upload.id,
        metadata: body,
        created_at: new Date().toISOString(),
      });

      await writeSecurityAuditEvent(req, {
        action_type: "upload.created",
        target_object_type: "upload",
        target_object_id: upload.id,
        new_state_json: upload,
        reason_code: "upload_created",
        reason_text: "Upload created.",
      });

      return res.json({
        ok: true,
        upload,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || "Upload failed.",
      });
    }
  });

  
  app.patch("/users/:id/membership", async (req: any, res: any) => {
    const { id } = req.params;
    const { organization_id, role_id } = req.body || {};
    const user = DEMO_USERS.find((u) => u.id === id) as MutableApiUser | undefined;
    if (!user) return res.status(404).json({ error: "User not found." });

    if (organization_id) user.organization_id = organization_id;
    if (role_id) user.role_id = role_id;

    DEMO_AUDIT_LOGS.unshift({
      id: `audit-${Date.now()}`,
      actor_user_id: "demo-user-1",
      organization_id: "shs-core",
      action_type: "user.membership_changed",
      target_type: "user",
      target_id: user.id,
      metadata: {
        organization_id: user.organization_id,
        role_id: user.role_id,
        email: user.email,
      },
      created_at: new Date().toISOString(),
    });

    return res.json({ ok: true, user });
  });

  
  app.get("/audit-logs", async (_req: any, res: any) => {
    return res.json({ items: DEMO_AUDIT_LOGS });
  });
  }

  registerIdentityRoutes(app);
  registerProgramRoutes(app);
  registerOrganizationRelationshipRoutes(app);
  registerServiceCatalogRoutes(app);
  registerAiGovernanceRoutes(app);
  registerInputSecurityRoutes(app);
  registerAgentSimulationRoutes(app);
  registerConductorRoutes(app);
  registerMcpRoutes(app);
  registerOperationalAwarenessRoutes(app);
  registerAragRoutes(app);
  registerServiceAgreementRoutes(app);
  registerOrganizationOnboardingRoutes(app);
  registerFundingGrantRoutes(app);
  registerImpactAttributionRoutes(app);
  registerCareerRoutes(app);
  registerCaseRoutes(app);
  registerAuditRoutes(app);
  registerReportingRoutes(app);
  registerGrantBinderRoutes(app);
  registerExchangeFundingCommitmentRoutes(app);
  registerLiveLearningRoutes(app);
  registerCurriculumCompletionRoutes(app);
  registerWorkforceOutcomeRoutes(app);
  registerPrepareProveRoutes(app);
  registerSpecializationAssignmentRoutes(app);
  registerSpecializationRequestRoutes(app);
  registerGrade12EligibilityRoutes(app);
  registerCourseAssignmentRoutes(app);
  registerProjectRoutes(app);
  registerCapstoneEntryRoutes(app);
  registerJourneyRoutes(app);
  registerCredentialRoutes(app);
  registerArcadeRoutes(app);
  registerCalendarRoutes(app);
  registerCompanionRoutes(app);
  registerCalendarFeedRoutes(app);
  registerExternalAccountRoutes(app);
  registerAccessibilityProfileRoutes(app);
  registerAssignmentRoutes(app);
  registerEnrollmentRoutes(app);
  registerCareerEventRoutes(app);
  registerOpportunityRoutes(app);
  registerSourceIngestionRoutes(app);
  registerCurriculumCatalogRoutes(app);
  registerStudentCatalogRoutes(app);
  registerCurriculumImportJobRoutes(app);
  registerDocumentProcessingRoutes(app);
  registerCompletionPolicyRoutes(app);
  registerActivityDomainRoutes(app);
  registerVerifiedEvidenceRoutes(app);
  registerOperationalRoutes(app);
  registerStudioProjectRoutes(app);
  registerPortfolioRoutes(app);
  registerWebsiteDeploymentRoutes(app);
  registerAgentPackageRoutes(app);
  registerRegistrySubmissionRoutes(app);
  registerReviewerRoutingRoutes(app);
  registerNotificationRoutes(app);
  registerStudioTeamRoutes(app);
  registerStudioCollaborationRoutes(app);
  app.use("/aggregation", aggregationRoutes);
  registerOracleRoutes(app);

  app.get("/health", (_req: any, res: any) => {
    res.json({ ok: true, service: "shs-api" });
  });

  return app;
}
