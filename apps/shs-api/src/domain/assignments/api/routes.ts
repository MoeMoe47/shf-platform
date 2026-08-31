// SHF Calendar Wave 2A / 2A.1 — Assignment HTTP routes. Mirrors
// src/domain/live-learning/api/routes.ts's shape and auth pattern.
import { ok, fail } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/assignment-service.js";
import { validateCreateInput, InvalidAssignmentTargetsError, InvalidTargetUsersError } from "../service/assignment-service.js";

function actorFromRequest(req: any) {
  return { user_id: req.user.user_id, organization_id: req.user.organization_id, roles: req.user.roles || [] };
}

export function registerAssignmentRoutes(app: any) {
  app.get("/assignments", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const items = await service.listForUser(actorFromRequest(req));
      return res.json(ok({ items }));
    } catch (error) {
      return next(error);
    }
  });

  app.get("/assignments/:id", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      // Wave 2A.1: entitlement-checked, not just organization-checked —
      // see getAssignmentForActor()'s own doc for exactly what it
      // verifies for each role tier. A known/guessed id for an
      // assignment this actor isn't entitled to 404s the same as one
      // that doesn't exist at all — never a distinguishable "exists but
      // forbidden" response, which would itself leak information.
      const assignment = await service.getAssignmentForActor(req.params.id, actorFromRequest(req));
      if (!assignment) return res.status(404).json(fail("NOT_FOUND", "Assignment not found."));
      return res.json(ok(assignment));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/assignments", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const validationError = validateCreateInput(req.body);
      if (validationError) return res.status(400).json(fail("VALIDATION_ERROR", validationError));

      const created = await service.createAssignment(actorFromRequest(req), req.body);
      return res.status(201).json(ok(created));
    } catch (error: any) {
      if (error instanceof InvalidTargetUsersError) {
        return res.status(400).json(fail("INVALID_TARGET_USERS", error.message, "corr_dev", { invalidUserIds: error.invalidUserIds }));
      }
      if (error instanceof InvalidAssignmentTargetsError) {
        return res.status(400).json(fail(error.code, error.message));
      }
      return next(error);
    }
  });
}
