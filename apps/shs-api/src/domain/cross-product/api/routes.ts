import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/composition-authority-service.js";

export function registerCrossProductRoutes(app: any) {
  app.get("/cross-product/compositions", requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW), async (req: any, res: any) => res.json({ ok: true, data: { items: await service.list(req.user) } }));
  app.post("/cross-product/compositions", requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_MANAGE), async (req: any, res: any) => { try { return res.status(201).json({ ok: true, data: await service.createDraft(req.user, req.body || {}) }); } catch (error: any) { return res.status(400).json({ ok: false, error: { code: error.message, message: "Composition definition rejected." } }); } });
  app.post("/cross-product/compositions/:definitionId/activate", requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_MANAGE), async (req: any, res: any) => { try { return res.json({ ok: true, data: await service.activate(req.user, req.params.definitionId) }); } catch (error: any) { return res.status(400).json({ ok: false, error: { code: error.message, message: "Composition activation rejected." } }); } });
  app.post("/cross-product/compositions/:definitionId/retire", requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_MANAGE), async (req: any, res: any) => { try { return res.json({ ok: true, data: await service.retire(req.user, req.params.definitionId) }); } catch (error: any) { return res.status(400).json({ ok: false, error: { code: error.message, message: "Composition retirement rejected." } }); } });
}
