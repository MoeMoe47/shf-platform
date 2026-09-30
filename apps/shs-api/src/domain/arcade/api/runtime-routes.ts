import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ArcadeRuntimeSessionError, ArcadeRuntimeSessionService } from "../service/runtime-session-service.js";

const service = new ArcadeRuntimeSessionService();
const actions = ["pause", "resume", "complete", "abandon"] as const;

function actorFromRequest(req: any) {
  return {
    user_id: req.user.user_id,
    organization_id: req.user.active_organization_id || req.user.organization_id,
    roles: req.user.roles || [],
    permissions: req.user.permissions || [],
  };
}

function sendError(error: any, res: any, next: any) {
  if (error instanceof ArcadeRuntimeSessionError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

export function registerArcadeRuntimeRoutes(app: any) {
  const permission = requirePermission(SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT);

  app.post("/arcade/runtime/sessions", permission, async (req: any, res: any, next: any) => {
    try {
      const result = await service.start(actorFromRequest(req), req.body || {});
      return res.status(result.reused ? 200 : 201).json(ok(result));
    } catch (error) { return sendError(error, res, next); }
  });

  app.get("/arcade/runtime/sessions", permission, async (req: any, res: any, next: any) => {
    try {
      return res.json(ok({ items: await service.list(actorFromRequest(req), req.query?.status) }));
    } catch (error) { return sendError(error, res, next); }
  });

  app.get("/arcade/runtime/sessions/:id", permission, async (req: any, res: any, next: any) => {
    try {
      return res.json(ok(await service.get(actorFromRequest(req), req.params.id)));
    } catch (error) { return sendError(error, res, next); }
  });

  for (const action of actions) {
    app.post(`/arcade/runtime/sessions/:id/${action}`, permission, async (req: any, res: any, next: any) => {
      try {
        return res.json(ok(await service.transition(actorFromRequest(req), req.params.id, action.toUpperCase() as any)));
      } catch (error) { return sendError(error, res, next); }
    });
  }
}
