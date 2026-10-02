// Phase 9 — Core MOCC routes. Thin transport: organization and operator come from the authenticated user, never the body.
import { fail, ok } from "../../../../api/response-envelope.js";
import { requirePermission } from "../../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";
import { MoccOperationsError, MoccOperationsService } from "../service/mocc-operations-service.js";

export function registerMoccOperationsRoutes(app: any, dependencies: { service?: MoccOperationsService } = {}) {
  const service = dependencies.service || new MoccOperationsService();
  const actorOf = (req: any) => ({ user_id: req.user?.user_id, organization_id: req.user?.active_organization_id || req.user?.organization_id, permissions: req.user?.permissions || [] });
  const handle = (fn: (req: any) => Promise<unknown>) => async (req: any, res: any, next: any) => {
    try {
      return res.json(ok(await fn(req)));
    } catch (error: any) {
      if (error instanceof MoccOperationsError) return res.status(error.statusCode).json(fail(error.code, error.message, String(req?.id || "corr_unknown")));
      return next(error);
    }
  };
  app.get("/metaverse/operations", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_OPERATIONS_VIEW), handle((req) => service.getView(actorOf(req), req.query || {})));
  app.post("/metaverse/operations/actions/:controlId", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_OPERATIONS_VIEW),
    handle((req) => service.act(actorOf(req), String(req.params.controlId), req.body || {})));
}
