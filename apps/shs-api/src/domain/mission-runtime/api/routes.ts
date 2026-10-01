import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { serverPublishedMissionResolver } from "../../mission-content/catalog/published-mission-catalog.js";
import { MissionRuntimeError } from "../service/mission-runtime-service.js";
import { MissionRuntimeStartService } from "../service/mission-runtime-start-service.js";

export interface MissionRuntimeRouteDependencies {
  startService?: MissionRuntimeStartService;
}

const productionStartService = new MissionRuntimeStartService(serverPublishedMissionResolver);

function actorFromRequest(req: any) {
  return {
    user_id: req.user.user_id,
    organization_id: req.user.active_organization_id || req.user.organization_id,
    permissions: req.user.permissions || [],
  };
}

function sendError(error: any, req: any, res: any, next: any) {
  if (error instanceof MissionRuntimeError) {
    const correlationId = String(req?.id || req?.headers?.["x-request-id"] || "corr_unknown");
    return res.status(error.statusCode).json(fail(error.code, error.message, correlationId, error.details));
  }
  return next(error);
}

export function registerMissionRuntimeRoutes(app: any, dependencies: MissionRuntimeRouteDependencies = {}) {
  const startService = dependencies.startService || productionStartService;
  app.post("/arcade/mission-runtimes", requirePermission(SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT), async (req: any, res: any, next: any) => {
    try {
      const result = await startService.startPublishedMission(actorFromRequest(req), req.body);
      return res.status(result.reused ? 200 : 201).json(ok(result));
    } catch (error) {
      return sendError(error, req, res, next);
    }
  });
}
