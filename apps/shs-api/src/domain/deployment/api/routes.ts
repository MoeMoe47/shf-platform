import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { WebsiteDeploymentService } from "../service/website-deployment-service.js";

const service = new WebsiteDeploymentService();
function reject(res: any, error: any) {
  const code = String(error?.message || "DEPLOYMENT_REQUEST_REJECTED");
  const notFound = ["DEPLOYMENT_NOT_FOUND"].includes(code);
  const forbidden = ["DEPLOYMENT_FORBIDDEN", "DEPLOYMENT_NOT_ELIGIBLE"].includes(code);
  return res.status(notFound ? 404 : forbidden ? 403 : 400).json(fail(code, code));
}

export function registerWebsiteDeploymentRoutes(app: any) {
  app.post("/deployments/from-studio-delivery", requirePermission(SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_CREATE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.requestFromStudioDelivery(req.user, req.body || {}))); } catch (error) { return reject(res, error); }
  });
  app.get("/deployments/:deploymentId", requirePermission(SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.get(req.user, req.params.deploymentId))); } catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/deployments", requirePermission(SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.listForProject(req.user, req.params.projectId) })); } catch (error) { return reject(res, error); }
  });
  app.post("/deployments/:deploymentId/retry", requirePermission(SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_CREATE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.retry(req.user, req.params.deploymentId))); } catch (error) { return reject(res, error); }
  });
}
