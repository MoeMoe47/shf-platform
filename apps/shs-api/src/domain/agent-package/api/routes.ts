import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { AgentPackageService } from "../service/agent-package-service.js";

const service = new AgentPackageService();
function reject(res: any, error: any) {
  const code = String(error?.message || "AGENT_PACKAGE_REQUEST_REJECTED");
  const notFound = ["AGENT_PACKAGE_NOT_FOUND"].includes(code);
  const forbidden = ["AGENT_PACKAGE_FORBIDDEN", "AGENT_PACKAGE_NOT_ELIGIBLE"].includes(code);
  return res.status(notFound ? 404 : forbidden ? 403 : 400).json(fail(code, code));
}
export function registerAgentPackageRoutes(app: any) {
  app.post("/studio/projects/:projectId/agent-packages", requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_PACKAGE_CREATE), async (req: any, res: any) => { try { if (req.body && Object.keys(req.body).length) throw new Error("AGENT_PACKAGE_FIELD_NOT_ALLOWED"); return res.status(201).json(ok(await service.generate(req.user, req.params.projectId))); } catch (error) { return reject(res, error); } });
  app.get("/studio/projects/:projectId/agent-packages", requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_PACKAGE_VIEW), async (req: any, res: any) => { try { return res.json(ok({ items: await service.list(req.user, req.params.projectId) })); } catch (error) { return reject(res, error); } });
  app.get("/agent-packages/:packageId", requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_PACKAGE_VIEW), async (req: any, res: any) => { try { return res.json(ok(await service.get(req.user, req.params.packageId))); } catch (error) { return reject(res, error); } });
}
