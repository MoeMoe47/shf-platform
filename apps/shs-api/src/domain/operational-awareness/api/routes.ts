import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { OperationalAwarenessError, OperationalAwarenessService } from "../service/operational-awareness-service.js";

const service = new OperationalAwarenessService();

function reject(res: any, error: any, next: any) {
  if (error instanceof OperationalAwarenessError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

export function registerOperationalAwarenessRoutes(app: any) {
  app.get("/operational-awareness/findings", requirePermission(SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listFindings(req.user, req.query?.status) })); } catch (error) { return reject(res, error, next); }
  });
  app.get("/operational-awareness/findings/:findingId", requirePermission(SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getFinding(req.user, req.params.findingId))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/operational-awareness/run", requirePermission(SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.run(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  for (const [path, status] of [["acknowledge", "ACKNOWLEDGED"], ["resolve", "RESOLVED"], ["dismiss", "DISMISSED"]] as const) {
    app.post(`/operational-awareness/findings/:findingId/${path}`, requirePermission(SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_MANAGE), async (req: any, res: any, next: any) => {
      try { return res.json(ok(await service.updateFindingStatus(req.user, req.params.findingId, status))); } catch (error) { return reject(res, error, next); }
    });
  }
  app.post("/daily-briefs", requirePermission(SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_GENERATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.generateBrief(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.get("/daily-briefs", requirePermission(SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listBriefs(req.user) })); } catch (error) { return reject(res, error, next); }
  });
  app.get("/daily-briefs/latest", requirePermission(SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getLatestBrief(req.user))); } catch (error) { return reject(res, error, next); }
  });
  app.get("/daily-briefs/:briefId", requirePermission(SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getBrief(req.user, req.params.briefId))); } catch (error) { return reject(res, error, next); }
  });
}
