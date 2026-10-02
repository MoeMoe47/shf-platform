// Phase 6 — Arcade Integration Fabric routes. Thin transport over ArcadeIntegrationService:
// organization, tenant and identity come from the authenticated actor, never from the body.
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ArcadeRuntimeSessionError } from "../../arcade/service/runtime-session-service.js";
import { MissionRuntimeError } from "../../mission-runtime/service/mission-runtime-service.js";
import { ArcadeIntegrationError } from "../model/arcade-integration.js";
import { ArcadeIntegrationService } from "../service/arcade-integration-service.js";

export interface ArcadeIntegrationRouteDependencies {
  integrationService?: ArcadeIntegrationService;
}

function actorFromRequest(req: any) {
  return {
    user_id: req.user.user_id,
    organization_id: req.user.active_organization_id || req.user.organization_id,
    roles: req.user.roles || [],
    permissions: req.user.permissions || [],
  };
}

export function registerArcadeIntegrationRoutes(app: any, dependencies: ArcadeIntegrationRouteDependencies = {}) {
  const fabric = dependencies.integrationService || new ArcadeIntegrationService();
  const guard = requirePermission(SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT);
  const route = (method: "get" | "post", path: string, status: number, handler: (actor: any, req: any) => Promise<unknown>) => {
    app[method](path, guard, async (req: any, res: any, next: any) => {
      try {
        return res.status(status).json(ok(await handler(actorFromRequest(req), req)));
      } catch (error: any) {
        if (error instanceof ArcadeIntegrationError || error instanceof MissionRuntimeError || error instanceof ArcadeRuntimeSessionError) {
          const correlationId = String(req?.id || req?.headers?.["x-request-id"] || "corr_unknown");
          return res.status(error.statusCode).json(fail(error.code, error.message, correlationId, (error as any).details));
        }
        return next(error);
      }
    });
  };
  route("get", "/arcade/integration/operations", 200, (actor) => fabric.operationalProjection(actor));
  route("get", "/arcade/integration/experiences/:experienceId", 200, (actor, req) => fabric.resolve(actor, req.params.experienceId));
  route("get", "/arcade/integration/experiences/:experienceId/capabilities", 200, async (_actor, req) => fabric.describeCapabilities(req.params.experienceId));
  route("post", "/arcade/integration/experiences/:experienceId/launch", 201, (actor, req) => fabric.launch(actor, req.params.experienceId, req.body || {}));
  route("get", "/arcade/integration/runtimes/:runtimeKind/:runtimeId", 200, (actor, req) => fabric.describeRuntime(actor, req.params.runtimeKind, req.params.runtimeId));
  route("get", "/arcade/integration/results/:runtimeKind/:runtimeId", 200, (actor, req) => fabric.describeResult(actor, req.params.runtimeKind, req.params.runtimeId));
}
