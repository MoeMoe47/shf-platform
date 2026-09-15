import { ok, fail } from "../../../../api/response-envelope.js";
import { requirePermission } from "../../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";
import { getMyPassport, getOpportunityEligibilityProjection, getSponsorSafePassport } from "../service/passport-projection-service.js";

function sendError(error: any, res: any) {
  const code = String(error?.message || "PASSPORT_REQUEST_DENIED").toUpperCase();
  const status = code.includes("REQUIRED") ? 400 : 403;
  return res.status(status).json(fail(code, "Work Passport request denied."));
}

export function registerMetaversePassportRoutes(app: any) {
  app.get("/metaverse/passport/me", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try {
      const view = req.query?.view === "public" ? "PUBLIC" : "SELF";
      return res.json(ok(await getMyPassport(req.user, view)));
    } catch (error) {
      return sendError(error, res);
    }
  });

  app.get("/metaverse/passport/sponsor/:learnerUserId", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_VIEW), async (req: any, res: any) => {
    try {
      return res.json(ok(await getSponsorSafePassport(req.user, req.params.learnerUserId)));
    } catch (error) {
      return sendError(error, res);
    }
  });

  app.get("/metaverse/passport/eligibility/:learnerUserId", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_VIEW), async (req: any, res: any) => {
    try {
      return res.json(ok(await getOpportunityEligibilityProjection(req.user, req.params.learnerUserId)));
    } catch (error) {
      return sendError(error, res);
    }
  });
}
