import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ContentVariantService } from "../service/content-variant-service.js";
const service = new ContentVariantService();
export function registerDocumentationVariantRoutes(app: any) {
  const guard = requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_VARIANT_MANAGE);
  app.get("/documentation/variants", guard, async (req: any, res: any) => { try { return res.json(ok(await service.list(req.user))); } catch (e: any) { return res.status(403).json(fail(e.message, e.message)); } });
  app.post("/documentation/variants", guard, async (req: any, res: any) => { try { return res.status(201).json(ok(await service.create(req.user, req.body || {}))); } catch (e: any) { return res.status(400).json(fail(e.message, e.message)); } });
  app.post("/documentation/variants/:id/activate", guard, async (req: any, res: any) => { try { return res.json(ok(await service.activate(req.user, req.params.id))); } catch (e: any) { return res.status(400).json(fail(e.message, e.message)); } });
}
