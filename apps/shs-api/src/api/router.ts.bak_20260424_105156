import { registerProgramRoutes } from "../domain/programs/api/routes";
import { registerCaseRoutes } from "../domain/cases/api/routes";
import { registerAuditRoutes } from "../domain/audit/api/routes";
import { registerIdentityRoutes } from "../domain/identity/api/routes";
import { registerReportingRoutes } from "../domain/reporting/routes";
import { registerOracleRoutes } from "../oracle/routes/oracle.routes";
import aggregationRoutes from "../aggregation/routes/aggregation.routes";
import { IdentityService } from "../domain/identity/service/identity-service";
import { ok, fail } from "./response-envelope";

const identityService = new IdentityService();

export function buildRouter(app: any) {
  

  app.get("/auth/me", async (req: any, res: any) => {
    try {
      // Starter session shape for frontend auth-context.jsx.
      // Replace this with real session/cookie validation + DB-backed memberships.
      const demoUser = {
        id: "demo-user-1",
        email: "admin@shs.local",
        first_name: "SHS",
        last_name: "Admin",
      };

      const memberships = [
        {
          organization_id: "shs-core",
          organization_type: "SHS",
          role: "super_admin",
          role_name: "super_admin",
        },
      ];

      const permissions = [
        "identity.manage",
        "org.manage",
        "aggregation.view",
        "aggregation.resolve",
        "reconciliation.run",
        "verification.review",
        "verification.approve",
        "reports.view",
        "reports.export",
        "reports.publish",
        "uploads.internal",
        "uploads.evidence",
        "uploads.video",
        "uploads.approve_public",
        "settings.manage",
      ];

      return res.json({
        ok: true,
        user: demoUser,
        memberships,
        permissions,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || "Failed to load auth session.",
      });
    }
  });

  app.post("/auth/logout", async (_req: any, res: any) => {
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

  app.get("/me", async (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
    }
    res.json(ok(req.user));
  });

  registerIdentityRoutes(app);
  registerProgramRoutes(app);
  registerCaseRoutes(app);
  registerAuditRoutes(app);
  registerReportingRoutes(app);
  app.use("/aggregation", aggregationRoutes);
  registerOracleRoutes(app);

  app.get("/health", (_req: any, res: any) => {
    res.json({ ok: true, service: "shs-api" });
  });

  return app;
}
