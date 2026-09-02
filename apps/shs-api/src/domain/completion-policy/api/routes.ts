// SHF Lesson + Assignment + Curriculum — Phase 4.
//
// Policy authoring routes, reusing the existing Assignment permission
// (ASSIGNMENT_MANAGE) rather than inventing a parallel permission — a
// Completion Policy only ever exists to be bound to an assignment, so
// the same authority that manages assignments manages their completion
// requirements (Step 24/34's explicit preference).
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/completion-policy-service.js";
import {
  PolicyValidationError, PolicyNotFoundError, PolicyNotEditableError, PolicyStaleRevisionError, PolicyActivationError, CurriculumBindingError,
} from "../service/completion-policy-service.js";

function actorFromRequest(req: any): service.PolicyActor {
  return { userId: String(req.user.user_id), organizationId: String(req.user.active_organization_id || req.user.organization_id) };
}

function handleError(error: unknown, res: any, next: any) {
  if (error instanceof PolicyValidationError || error instanceof CurriculumBindingError) return res.status(422).json(fail("INVALID_REQUEST", (error as Error).message));
  if (error instanceof PolicyNotFoundError) return res.status(404).json(fail("NOT_FOUND", "Completion policy not found."));
  if (error instanceof PolicyNotEditableError) return res.status(409).json(fail("NOT_EDITABLE", (error as Error).message));
  if (error instanceof PolicyStaleRevisionError) return res.status(409).json(fail("STALE_REVISION", "This policy was changed elsewhere. Reload and try again."));
  if (error instanceof PolicyActivationError) return res.status(422).json(fail("ACTIVATION_REJECTED", (error as Error).message, "corr_policy_activation", { issues: error.issues }));
  return next(error);
}

export function registerCompletionPolicyRoutes(app: any) {
  const manage = requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_MANAGE);

  app.post("/completion-policies", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.createPolicy(actorFromRequest(req), req.body || {}))); } catch (e) { handleError(e, res, next); }
  });

  app.get("/completion-policies/:id", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.getPolicy(actorFromRequest(req), req.params.id))); } catch (e) { handleError(e, res, next); }
  });

  app.post("/completion-policies/:id/requirements", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.addRequirement(actorFromRequest(req), req.params.id, req.body || {}))); } catch (e) { handleError(e, res, next); }
  });

  app.delete("/completion-policies/:id/requirements/:requirementId", manage, async (req: any, res: any, next: any) => {
    try { await service.removeRequirement(actorFromRequest(req), req.params.id, req.params.requirementId); res.json(ok({ removed: true })); } catch (e) { handleError(e, res, next); }
  });

  app.post("/completion-policies/:id/activate", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.activatePolicy(actorFromRequest(req), req.params.id, Number(req.body?.revision)))); } catch (e) { handleError(e, res, next); }
  });

  app.post("/completion-policies/:id/retire", manage, async (req: any, res: any, next: any) => {
    try { res.json(ok(await service.retirePolicy(actorFromRequest(req), req.params.id, Number(req.body?.revision)))); } catch (e) { handleError(e, res, next); }
  });
}
