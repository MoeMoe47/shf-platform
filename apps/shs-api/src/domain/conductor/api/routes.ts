import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ConductorError, ConductorService } from "../service/conductor-service.js";
import { OperationalAwarenessError, OperationalAwarenessService } from "../../operational-awareness/service/operational-awareness-service.js";

const service = new ConductorService();
const awareness = new OperationalAwarenessService();

function reject(res: any, error: any, next: any) {
  if (error instanceof ConductorError) return res.status(error.statusCode).json(fail(error.code, error.message));
  if (error instanceof OperationalAwarenessError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

export function registerConductorRoutes(app: any) {
  app.post("/conductor/requests", requirePermission(SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_USE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.createRequest(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/conductor/requests", requirePermission(SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listRequests(req.user) })); } catch (error) { return reject(res, error, next); }
  });

  app.get("/conductor/requests/:requestId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getRequest(req.user, req.params.requestId))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/conductor/requests/:requestId/plan", requirePermission(SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok((await service.getRequest(req.user, req.params.requestId)).interpretation)); } catch (error) { return reject(res, error, next); }
  });

  app.get("/conductor/requests/:requestId/tasks", requirePermission(SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.getTasks(req.user, req.params.requestId) })); } catch (error) { return reject(res, error, next); }
  });

  app.get("/conductor/requests/:requestId/result", requirePermission(SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getResult(req.user, req.params.requestId))); } catch (error) { return reject(res, error, next); }
  });
  app.get("/conductor/operating-brief", requirePermission(SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await awareness.getLatestBriefForConductor(req.user))); } catch (error) { return reject(res, error, next); }
  });
}
