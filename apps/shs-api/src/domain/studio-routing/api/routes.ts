import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ReviewerRoutingService } from "../service/reviewer-routing-service.js";

const service = new ReviewerRoutingService();

function reject(res: any, error: any) {
  const code = String(error?.message || "REVIEW_ROUTING_REQUEST_REJECTED");
  const notFound = ["REVIEW_SUBMISSION_NOT_FOUND", "REVIEW_ASSIGNMENT_NOT_FOUND"].includes(code);
  const forbidden = ["FORBIDDEN", "REVIEW_ASSIGNMENT_REQUIRED", "REVIEWER_NOT_ELIGIBLE", "REASSIGNMENT_REASON_REQUIRED"].includes(code);
  const unavailable = ["REVIEWER_NOT_AVAILABLE"].includes(code);
  return res.status(notFound ? 404 : forbidden ? 403 : unavailable ? 409 : 400).json(fail(code, code));
}

export function registerReviewerRoutingRoutes(app: any) {
  app.get("/studio/reviews/queue", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_QUEUE_VIEW), async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.queue(req.user) })); } catch (error) { return reject(res, error); }
  });
  app.get("/studio/reviews/assignments/:assignmentId", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_QUEUE_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.get(req.user, req.params.assignmentId))); } catch (error) { return reject(res, error); }
  });
  app.post("/studio/review-submissions/:submissionId/route", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_ROUTE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.route(req.user, req.params.submissionId))); } catch (error) { return reject(res, error); }
  });
  app.post("/studio/review-assignments/:assignmentId/reassign", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_REVIEW_REASSIGN), async (req: any, res: any) => {
    try {
      if (req.body && Object.keys(req.body).some((key) => !["reviewerUserId", "reason"].includes(key))) throw new Error("ROUTING_FIELD_NOT_ALLOWED");
      return res.status(201).json(ok(await service.reassign(req.user, req.params.assignmentId, req.body?.reviewerUserId, req.body?.reason)));
    } catch (error) { return reject(res, error); }
  });
}
