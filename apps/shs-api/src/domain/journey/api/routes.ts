import { ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { listJourneyMilestonesForLearner } from "../service/journey-milestone-service.js";

export function registerJourneyRoutes(app: any) {
  // Self-service only, mirroring GET /careers/pathway/me — no client-
  // suppliable learner id, no organization_id/user_id from the request,
  // both always server-derived from the authenticated session. Gated by
  // the same "enrollment.view" permission every enrolled learner already
  // holds (see security-permissions.ts), rather than inventing a new
  // permission for what is fundamentally an own-record read.
  app.get("/journey/milestones/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const actor = { organization_id: req.user.active_organization_id || req.user.organization_id, user_id: req.user.user_id };
      const items = await listJourneyMilestonesForLearner(actor);
      return res.json(ok({ items }));
    } catch (error) {
      return next(error);
    }
  });
}
