import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { DocumentCenterService } from "../service/document-center-service.js";
const service = new DocumentCenterService();
function routeError(res: any, error: any) {
  const status = Number(error?.statusCode) || (/ORG_CONTEXT|FORBIDDEN|AUTH_REQUIRED/.test(String(error?.message)) ? 403 : 500);
  return res.status(status).json(fail(error?.code || (status === 500 ? "DOCUMENTATION_CENTER_UNAVAILABLE" : "DOCUMENTATION_CENTER_FORBIDDEN"), status === 500 ? "Document Center data is temporarily unavailable." : String(error?.message || "Document Center access denied.")));
}
export function registerDocumentationCenterRoutes(app: any) {
  app.get("/documentation/me", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_CENTER_VIEW), async (req: any, res: any) => { try { return res.json(ok(await service.list(req.user, req.query || {}))); } catch (error: any) { return routeError(res, error); } });
  app.get("/documentation/items/:id", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_CENTER_VIEW), async (req: any, res: any) => { try { const item = await service.get(req.user, req.params.id); return item ? res.json(ok(item)) : res.status(404).json(fail("DOCUMENTATION_ITEM_NOT_FOUND", "Documentation item not found.")); } catch (error: any) { return routeError(res, error); } });
}
