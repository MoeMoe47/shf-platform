import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { getCompanionContextForActor, CompanionContextHardFailureError } from "../service/companion-context-service.js";

function actorFromRequest(req: any) {
  const organizationId = req.user.active_organization_id || req.user.organization_id;
  return {
    user_id: req.user.user_id,
    organization_id: organizationId,
    active_organization_id: organizationId,
    tenant_id: req.user.tenant_id,
    roles: req.user.roles || [],
    permissions: req.user.permissions || [],
  };
}

export function registerCompanionRoutes(app: any) {
  // Self-service only — no client-suppliable learnerId, mirroring
  // /calendar/events/me, /journey/milestones/me, and /careers/pathway/me.
  // Gated by the same broadly-held "enrollment.view" permission those
  // self-service reads already use — the Companion is a read/
  // interpretation layer over data the learner is already entitled to see
  // through those very endpoints, never a new entitlement surface.
  app.get("/companion/context/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const context = await getCompanionContextForActor(actorFromRequest(req));
      return res.json(ok(context));
    } catch (error) {
      if (error instanceof CompanionContextHardFailureError) {
        return res.status(503).json(fail("COMPANION_CONTEXT_UNAVAILABLE", "Companion context is temporarily unavailable."));
      }
      return next(error);
    }
  });
}
