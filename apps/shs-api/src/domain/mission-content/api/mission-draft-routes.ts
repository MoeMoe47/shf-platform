import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { requireOrganizationServiceEntitlement } from "../../../auth/service-entitlement-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { MissionDraftError, MissionDraftService } from "../service/mission-draft-service.js";

const service = new MissionDraftService();

export interface MissionDraftRouteDependencies {
  service?: MissionDraftService;
  entitlement?: (req: any, res: any, next: any) => unknown;
}

function actorFromRequest(req: any) {
  return {
    user_id: req.user.user_id,
    active_organization_id: req.user.active_organization_id,
    organization_id: req.user.organization_id,
    tenant_id: req.user.tenant_id,
    permissions: req.user.permissions || [],
    roles: req.user.roles || [],
  };
}

function correlationId(req: any) {
  return String(req?.id || req?.headers?.["x-request-id"] || "corr_unknown");
}

function sendError(error: any, req: any, res: any, next: any) {
  if (!(error instanceof MissionDraftError)) return next(error);
  return res.status(error.statusCode).json(fail(error.code, error.message, correlationId(req), error.details));
}

export function registerMissionDraftRoutes(app: any, dependencies: MissionDraftRouteDependencies = {}) {
  const draftService = dependencies.service || service;
  const entitlement = dependencies.entitlement || requireOrganizationServiceEntitlement("project_studio");
  app.get("/studio/missions/drafts", entitlement, requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await draftService.list(actorFromRequest(req)) }, correlationId(req))); }
    catch (error) { return sendError(error, req, res, next); }
  });
  app.post("/studio/missions/drafts", entitlement, requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await draftService.create(actorFromRequest(req), req.body), correlationId(req))); }
    catch (error) { return sendError(error, req, res, next); }
  });
  app.get("/studio/missions/drafts/:draftId", entitlement, requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await draftService.get(actorFromRequest(req), req.params.draftId), correlationId(req))); }
    catch (error) { return sendError(error, req, res, next); }
  });
  app.put("/studio/missions/drafts/:draftId", entitlement, requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await draftService.update(actorFromRequest(req), req.params.draftId, req.body), correlationId(req))); }
    catch (error) { return sendError(error, req, res, next); }
  });
}
