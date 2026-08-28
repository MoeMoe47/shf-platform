import { registerProgramRoutes } from "../domain/programs/api/routes";
import { registerCaseRoutes } from "../domain/cases/api/routes";
import { registerAuditRoutes } from "../domain/audit/api/routes";
import { registerIdentityRoutes } from "../domain/identity/api/routes";
import { registerReportingRoutes } from "../domain/reporting/routes";
import { registerGrantBinderRoutes } from "../domain/grant-binder/api/routes";
import { registerExchangeFundingCommitmentRoutes } from "../domain/exchange-funding-commitment/api/routes";
import { registerLiveLearningRoutes } from "../domain/live-learning/api/routes";
import { registerWorkforceOutcomeRoutes } from "../domain/workforce-outcome/api/routes";
import { registerOracleRoutes } from "../oracle/routes/oracle.routes";
import aggregationRoutes from "../aggregation/routes/aggregation.routes";
import { IdentityService } from "../domain/identity/service/identity-service";
import { ok, fail } from "./response-envelope";
import { writeSecurityAuditEvent } from "../auth/security-audit";
import { isProductionEnvironment } from "../auth/production-identity";
import { Auth0SessionService } from "../domain/identity/service/auth0-session-service";
import { registerCurriculumCompletionRoutes } from "../domain/curriculum/api/routes";
import { registerOrganizationRelationshipRoutes } from "../domain/organization-relationships/api/routes";
import { authResponsePayload } from "../auth/auth-response";


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
  registerCaseRoutes(app);
  registerAuditRoutes(app);
  registerReportingRoutes(app);
  registerGrantBinderRoutes(app);
  registerExchangeFundingCommitmentRoutes(app);
  registerLiveLearningRoutes(app);
  registerCurriculumCompletionRoutes(app);
  registerWorkforceOutcomeRoutes(app);
  app.use("/aggregation", aggregationRoutes);
  registerOracleRoutes(app);

  app.get("/health", (_req: any, res: any) => {
    res.json({ ok: true, service: "shs-api" });
  });

  return app;
}
