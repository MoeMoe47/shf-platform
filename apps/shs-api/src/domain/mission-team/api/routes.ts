// Phase 5 — authenticated team commands. Thin transport: every route passes the authenticated actor
// to MissionTeamService; role, organization, tenant and membership are never read from the body.
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { MissionRuntimeError } from "../../mission-runtime/service/mission-runtime-service.js";
import { MissionTeamService } from "../service/mission-team-service.js";

export interface MissionTeamRouteDependencies {
  teamService?: MissionTeamService;
}

function actorFromRequest(req: any) {
  return { user_id: req.user.user_id, organization_id: req.user.active_organization_id || req.user.organization_id, permissions: req.user.permissions || [] };
}

export function registerMissionTeamRoutes(app: any, dependencies: MissionTeamRouteDependencies = {}) {
  const teams = dependencies.teamService || new MissionTeamService();
  const guard = requirePermission(SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT);
  const base = "/arcade/mission-runtimes/:runtimeId/team";
  const route = (method: "get" | "post", path: string, status: number, handler: (actor: any, req: any) => Promise<unknown>) => {
    app[method](path, guard, async (req: any, res: any, next: any) => {
      try {
        return res.status(status).json(ok(await handler(actorFromRequest(req), req)));
      } catch (error: any) {
        if (error instanceof MissionRuntimeError) {
          const correlationId = String(req?.id || req?.headers?.["x-request-id"] || "corr_unknown");
          return res.status(error.statusCode).json(fail(error.code, error.message, correlationId, error.details));
        }
        return next(error);
      }
    });
  };
  route("get", base, 200, (actor, req) => teams.view(actor, req.params.runtimeId));
  route("get", `${base}/history`, 200, (actor, req) => teams.history(actor, req.params.runtimeId));
  route("post", base, 201, (actor, req) => teams.createTeam(actor, req.params.runtimeId, req.body || {}));
  route("post", `${base}/join`, 200, (actor, req) => teams.join(actor, req.params.runtimeId, req.body || {}));
  route("post", `${base}/leave`, 200, (actor, req) => teams.leave(actor, req.params.runtimeId));
  route("post", `${base}/role`, 200, (actor, req) => teams.setRole(actor, req.params.runtimeId, req.body || {}));
  route("post", `${base}/ready`, 200, (actor, req) => teams.setReady(actor, req.params.runtimeId, req.body || {}));
  route("post", `${base}/activate`, 200, (actor, req) => teams.activate(actor, req.params.runtimeId));
  route("post", `${base}/disband`, 200, (actor, req) => teams.disband(actor, req.params.runtimeId));
  route("post", `${base}/participants/:participantId/remove`, 200, (actor, req) => teams.removeParticipant(actor, req.params.runtimeId, req.params.participantId));
  route("post", `${base}/presence`, 200, (actor, req) => teams.recordPresence(actor, req.params.runtimeId, req.body || {}));
  route("post", `${base}/actions`, 200, (actor, req) => teams.submitAction(actor, req.params.runtimeId, req.body || {}));
}
