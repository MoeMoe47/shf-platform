import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/arcade-service.js";
import { ArcadeError } from "../service/arcade-service.js";

function actorFromRequest(req: any) {
  return {
    user_id: req.user.user_id,
    organization_id: req.user.active_organization_id || req.user.organization_id,
    roles: req.user.roles || [],
    permissions: req.user.permissions || [],
  };
}

function sendArcadeError(error: any, res: any, next: any) {
  if (error instanceof ArcadeError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

// GET /arcade/results is legitimately reachable by two disjoint permission
// sets — a learner viewing their own results (arcade.attempt) or an
// admin/program-manager viewing the organization's (arcade.results.view)
// — neither of which the other role holds (mirrors the existing
// PROJECT_SUBMISSION_WRITE/VIEW split). requirePermission() only checks a
// single permission, so this route needs its own narrow OR-gate rather
// than a shared change to the permission guard.
function requireAnyPermission(...permissions: string[]) {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
    if (!user.active_organization_id || !user.tenant_id) return res.status(403).json(fail("ORG_CONTEXT_REQUIRED", "Valid active organization context is required."));
    const userPermissions: string[] = user.permissions || [];
    if (!permissions.some((p) => userPermissions.includes(p))) {
      return res.status(403).json(fail("FORBIDDEN", `Missing permission: one of [${permissions.join(", ")}]`));
    }
    return next();
  };
}

export function registerArcadeRoutes(app: any) {
  // Global reference data — no permission gate, mirrors GET /careers.
  app.get("/arcade/activities", async (_req: any, res: any, next: any) => {
    try {
      return res.json(ok({ items: await service.listActivities() }));
    } catch (error) {
      return sendArcadeError(error, res, next);
    }
  });

  app.post("/arcade/activities", requirePermission(SHS_SECURITY_PERMISSIONS.ARCADE_ACTIVITY_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const created = await service.createActivity(actorFromRequest(req), req.body || {});
      return res.status(201).json(ok(created));
    } catch (error) {
      return sendArcadeError(error, res, next);
    }
  });

  app.post("/arcade/attempts", requirePermission(SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT), async (req: any, res: any, next: any) => {
    try {
      const attempt = await service.startAttempt(actorFromRequest(req), String(req.body?.activityId || ""));
      return res.status(201).json(ok(attempt));
    } catch (error) {
      return sendArcadeError(error, res, next);
    }
  });

  app.get("/arcade/attempts/:id", requirePermission(SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT), async (req: any, res: any, next: any) => {
    try {
      const attempt = await service.getAttemptForActor(actorFromRequest(req), req.params.id);
      if (!attempt) return res.status(404).json(fail("ATTEMPT_NOT_FOUND", "Attempt not found."));
      return res.json(ok(attempt));
    } catch (error) {
      return sendArcadeError(error, res, next);
    }
  });

  app.post("/arcade/attempts/:id/abandon", requirePermission(SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok(await service.abandonAttempt(actorFromRequest(req), req.params.id)));
    } catch (error) {
      return sendArcadeError(error, res, next);
    }
  });

  app.post("/arcade/attempts/:id/result", requirePermission(SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT), async (req: any, res: any, next: any) => {
    try {
      const result = await service.submitResult(actorFromRequest(req), req.params.id, req.body || {});
      return res.status(201).json(ok(result));
    } catch (error) {
      return sendArcadeError(error, res, next);
    }
  });

  app.get("/arcade/results", requireAnyPermission(SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT, SHS_SECURITY_PERMISSIONS.ARCADE_RESULTS_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok({ items: await service.listResultsForActor(actorFromRequest(req)) }));
    } catch (error) {
      return sendArcadeError(error, res, next);
    }
  });
}
