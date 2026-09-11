import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { StudioReleaseService } from "../service/studio-release-service.js";
const service = new StudioReleaseService();
function reject(res: any, error: any) { const code = String(error?.message || "RELEASE_REJECTED"); const status = ["RELEASE_NOT_FOUND"].includes(code) ? 404 : ["RELEASE_GATE_DENIED","RELEASE_PERMISSION_REQUIRED"].includes(code) ? 403 : 400; return res.status(status).json(fail(code, code)); }
export function registerStudioReleaseRoutes(app: any) {
  app.post("/studio/releases", requirePermission(SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_CREATE), async (req: any, res: any) => { try { const created = await service.create(req.user, req.body || {}); return res.status(created.idempotent ? 200 : 201).json(ok(created)); } catch (e) { return reject(res, e); } });
  app.post("/studio/releases/:releaseId/execute", requirePermission(SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_CREATE), async (req: any, res: any) => { try { return res.status(201).json(ok(await service.execute(req.user, req.params.releaseId))); } catch (e) { return reject(res, e); } });
  app.get("/studio/releases/:releaseId", requirePermission(SHS_SECURITY_PERMISSIONS.WEBSITE_DEPLOYMENT_VIEW), async (req: any, res: any) => { try { return res.json(ok(await service.get(req.user, req.params.releaseId))); } catch (e) { return reject(res, e); } });
}
