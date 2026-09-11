import { ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/learner-result-service.js";

export function registerLearnerResultRoutes(app: any) {
  app.get("/curriculum/learner-results/me", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const actor = { user_id: req.user.user_id, organization_id: req.user.active_organization_id || req.user.organization_id, tenant_id: req.user.tenant_id };
      return res.json(ok(await service.getLearnerResults(actor, req.query?.courseId || null)));
    } catch (error) { return next(error); }
  });
}
