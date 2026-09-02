import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/activity-domain-service.js";
import { ActivityDomainError } from "../service/activity-domain-service.js";

function actorFromRequest(req: any) {
  return {
    user_id: req.user.user_id,
    organization_id: req.user.active_organization_id || req.user.organization_id,
    roles: req.user.roles || [],
    permissions: req.user.permissions || [],
  };
}

function sendActivityError(error: any, res: any, next: any) {
  if (error instanceof ActivityDomainError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

export function registerActivityDomainRoutes(app: any) {
  app.get("/activity-domains/assignments/:assignmentId/lessons/:unitStableKey/:lessonStableKey", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok(await service.getLearnerActivityState(actorFromRequest(req), req.params.assignmentId, req.params.unitStableKey, req.params.lessonStableKey)));
    } catch (error) {
      return sendActivityError(error, res, next);
    }
  });

  app.post("/activity-domains/assessments/submissions", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.status(201).json(ok(await service.submitAssessment(actorFromRequest(req), req.body || {})));
    } catch (error) {
      return sendActivityError(error, res, next);
    }
  });

  app.post("/activity-domains/reflections/submissions", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.status(201).json(ok(await service.submitReflection(actorFromRequest(req), req.body || {})));
    } catch (error) {
      return sendActivityError(error, res, next);
    }
  });

  app.post("/activity-domains/practices/submissions", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.status(201).json(ok(await service.submitPractice(actorFromRequest(req), req.body || {})));
    } catch (error) {
      return sendActivityError(error, res, next);
    }
  });
}
