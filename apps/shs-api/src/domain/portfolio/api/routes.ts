import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { PortfolioService } from "../service/portfolio-service.js";

const service = new PortfolioService();

function statusFor(error: any) {
  const code = String(error?.message || "");
  if (["PORTFOLIO_ARTIFACT_NOT_FOUND"].includes(code)) return 404;
  if (["PORTFOLIO_SOURCE_NOT_ELIGIBLE", "PORTFOLIO_ARTIFACT_UPDATE_FORBIDDEN", "PORTFOLIO_STATUS_TRANSITION_INVALID"].includes(code)) return 403;
  if (code.endsWith("_required") || code.startsWith("PORTFOLIO_") || code.startsWith("invalid_")) return 400;
  return 400;
}

function reject(res: any, error: any) {
  const code = String(error?.message || "PORTFOLIO_REQUEST_REJECTED");
  return res.status(statusFor(error)).json(fail(code, code));
}

export function registerPortfolioRoutes(app: any) {
  app.get("/portfolio", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getPortfolio(req.user))); } catch (error) { return reject(res, error); }
  });
  app.get("/portfolio/artifacts", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.listArtifacts(req.user) })); } catch (error) { return reject(res, error); }
  });
  app.get("/portfolio/artifacts/:artifactId", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getArtifact(req.user, req.params.artifactId))); } catch (error) { return reject(res, error); }
  });
  app.post("/portfolio/artifacts/from-evidence", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.createFromEvidence(req.user, req.body || {}))); } catch (error) { return reject(res, error); }
  });
  app.patch("/portfolio/artifacts/:artifactId", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE), async (req: any, res: any) => {
    try { return res.json(ok(await service.updateArtifact(req.user, req.params.artifactId, req.body || {}))); } catch (error) { return reject(res, error); }
  });
}
