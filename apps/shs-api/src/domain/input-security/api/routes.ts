import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { InputSecurityError, InputSecurityService } from "../service/input-security-service.js";

const service = new InputSecurityService();

function reject(res: any, error: any, next: any) {
  if (error instanceof InputSecurityError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

export function registerInputSecurityRoutes(app: any) {
  app.post("/input-security/scans", requirePermission(SHS_SECURITY_PERMISSIONS.AI_SECURITY_SCAN), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.scanInput(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/input-security/scans/:scanId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_SECURITY_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getScan(req.user, req.params.scanId))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/input-security/findings", requirePermission(SHS_SECURITY_PERMISSIONS.AI_SECURITY_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listFindings(req.user, req.query?.scan_id || req.query?.scanId) })); } catch (error) { return reject(res, error, next); }
  });

  app.post("/input-security/scans/:scanId/reviews", requirePermission(SHS_SECURITY_PERMISSIONS.AI_SECURITY_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.reviewScan(req.user, req.params.scanId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.post("/input-security/context-admissions", requirePermission(SHS_SECURITY_PERMISSIONS.AI_CONTEXT_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.evaluateContextAdmission(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
}
