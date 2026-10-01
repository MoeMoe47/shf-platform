import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { requireOrganizationServiceEntitlement } from "../../../auth/service-entitlement-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { MissionPublicationError, MissionPublicationService } from "../service/mission-publication-service.js";

export interface MissionPublicationRouteDependencies { service?: MissionPublicationService; entitlement?: (req: any, res: any, next: any) => unknown }

function actorFromRequest(req: any) {
  return {
    user_id: req.user.user_id, active_organization_id: req.user.active_organization_id,
    organization_id: req.user.organization_id, tenant_id: req.user.tenant_id,
    permissions: req.user.permissions || [], roles: req.user.roles || [],
  };
}
function correlationId(req: any) { return String(req?.id || req?.headers?.["x-request-id"] || "corr_unknown"); }
function sendError(error: any, req: any, res: any, next: any) {
  if (!(error instanceof MissionPublicationError)) return next(error);
  return res.status(error.statusCode).json(fail(error.code, error.message, correlationId(req), error.details));
}
function onlyBodyFields(body: any, fields: string[]) {
  return Boolean(body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).every((field) => fields.includes(field)));
}

export function registerMissionPublicationRoutes(app: any, dependencies: MissionPublicationRouteDependencies = {}) {
  const service = dependencies.service || new MissionPublicationService();
  const entitlement = dependencies.entitlement || requireOrganizationServiceEntitlement("project_studio");
  const submitPermission = requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE);
  const queuePermission = requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_QUEUE_VIEW);
  const reviewerPermission = requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW);
  const publishPermission = requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_PUBLISH);
  const retirePermission = requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_RETIRE);

  app.post("/studio/missions/drafts/:draftId/submit", entitlement, submitPermission, async (req: any, res: any, next: any) => {
    try {
      if (!onlyBodyFields(req.body, ["expectedRevision", "submissionNote"])) throw new MissionPublicationError("MISSION_SUBMISSION_REQUEST_INVALID", "Unsupported submission field.");
      const result = await service.submit(actorFromRequest(req), req.params.draftId, req.body.expectedRevision, req.body.submissionNote);
      return res.status(result.reused ? 200 : 201).json(ok(result, correlationId(req)));
    } catch (error) { return sendError(error, req, res, next); }
  });
  app.get("/studio/missions/drafts/:draftId/submissions", entitlement, requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listAuthorSubmissions(actorFromRequest(req), req.params.draftId) }, correlationId(req))); }
    catch (error) { return sendError(error, req, res, next); }
  });
  app.get("/studio/missions/review/submissions", entitlement, queuePermission, reviewerPermission, async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listSubmissions(actorFromRequest(req), req.query.status) }, correlationId(req))); }
    catch (error) { return sendError(error, req, res, next); }
  });
  app.get("/studio/missions/review/submissions/:submissionId", entitlement, queuePermission, reviewerPermission, async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getSubmission(actorFromRequest(req), req.params.submissionId), correlationId(req))); }
    catch (error) { return sendError(error, req, res, next); }
  });
  for (const decision of ["approve", "reject"] as const) {
    app.post(`/studio/missions/review/submissions/:submissionId/${decision}`, entitlement, reviewerPermission, async (req: any, res: any, next: any) => {
      try {
        if (!onlyBodyFields(req.body, ["decisionNote"])) throw new MissionPublicationError("MISSION_DECISION_REQUEST_INVALID", "Unsupported review decision field.");
        const result = await service.decide(actorFromRequest(req), req.params.submissionId, decision === "approve" ? "APPROVED" : "REJECTED", req.body.decisionNote);
        return res.json(ok(result, correlationId(req)));
      } catch (error) { return sendError(error, req, res, next); }
    });
  }
  app.post("/studio/missions/review/submissions/:submissionId/publish", entitlement, publishPermission, async (req: any, res: any, next: any) => {
    try {
      if (!onlyBodyFields(req.body, [])) throw new MissionPublicationError("MISSION_PUBLICATION_REQUEST_INVALID", "Publish request does not accept content fields.");
      const result = await service.publish(actorFromRequest(req), req.params.submissionId);
      return res.status(result.reused ? 200 : 201).json(ok(result, correlationId(req)));
    } catch (error) { return sendError(error, req, res, next); }
  });
  app.get("/studio/missions/releases", entitlement, publishPermission, async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listReleases(actorFromRequest(req)) }, correlationId(req))); }
    catch (error) { return sendError(error, req, res, next); }
  });
  app.get("/studio/missions/publication/approved", entitlement, publishPermission, async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listApprovedForPublication(actorFromRequest(req)) }, correlationId(req))); }
    catch (error) { return sendError(error, req, res, next); }
  });
  app.post("/studio/missions/releases/:releaseId/retire", entitlement, retirePermission, async (req: any, res: any, next: any) => {
    try {
      if (!onlyBodyFields(req.body, ["retirementNote"])) throw new MissionPublicationError("MISSION_RETIRE_REQUEST_INVALID", "Unsupported retirement field.");
      const result = await service.retire(actorFromRequest(req), req.params.releaseId, req.body.retirementNote);
      return res.json(ok(result, correlationId(req)));
    } catch (error) { return sendError(error, req, res, next); }
  });
}
