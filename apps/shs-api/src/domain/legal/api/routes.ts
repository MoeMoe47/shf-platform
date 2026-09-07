import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/legal-authority-service.js";

export function registerLegalRoutes(app: any) {
  app.get("/legal/artifacts", requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW), async (req: any, res: any) => res.json({ ok: true, data: { items: await service.listArtifacts(req.user) } }));
  app.get("/legal/artifacts/:artifactId", requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW), async (req: any, res: any) => {
    const item = await service.getArtifact(req.user, req.params.artifactId);
    return item ? res.json({ ok: true, data: item }) : res.status(404).json({ ok: false, error: { code: "LEGAL_ARTIFACT_NOT_FOUND" } });
  });
  app.post("/legal/artifacts", requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_MANAGE), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.createArtifact(req.user, req.body || {}) }); } catch (error: any) { return res.status(400).json({ ok: false, error: { code: error.message, message: "Legal artifact rejected." } }); }
  });
  app.post("/legal/artifacts/:artifactId/activate", requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_MANAGE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.activateArtifact(req.user, req.params.artifactId) }); } catch (error: any) { return res.status(400).json({ ok: false, error: { code: error.message, message: "Legal artifact activation rejected." } }); }
  });
  app.post("/legal/decisions", requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_MANAGE), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.createDecision(req.user, req.body || {}) }); } catch (error: any) { return res.status(400).json({ ok: false, error: { code: error.message, message: "Legal decision rejected." } }); }
  });
  app.post("/legal/obligations", requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_MANAGE), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.createObligation(req.user, req.body || {}) }); } catch (error: any) { return res.status(400).json({ ok: false, error: { code: error.message, message: "Legal obligation rejected." } }); }
  });
  app.post("/legal/holds", requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_MANAGE), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.placeHold(req.user, req.body || {}) }); } catch (error: any) { return res.status(400).json({ ok: false, error: { code: error.message, message: "Legal hold rejected." } }); }
  });
}
