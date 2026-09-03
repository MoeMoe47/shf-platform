import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { StudioProjectService } from "../service/studio-project-service.js";
import { getStudioInstitutionalStatus, projectStudioEvidence } from "../service/studio-institutional-service.js";

const service = new StudioProjectService();

function statusFor(error: any) {
  const code = String(error?.message || "");
  if (["PROJECT_NOT_FOUND", "ASSIGNMENT_NOT_FOUND", "LEARNER_NOT_FOUND", "REVIEW_SUBMISSION_NOT_FOUND", "REVISION_NOT_FOUND", "TEAM_NOT_FOUND", "TEAM_MEMBER_NOT_FOUND"].includes(code)) return 404;
  if (["FORBIDDEN", "COMMERCIAL_DESTINATION_FORBIDDEN", "STUDENT_DESTINATION_REQUIRED", "STUDENT_IDEA_STUDENT_REQUIRED", "LEARNER_SCOPE_FORBIDDEN", "PROJECT_UPDATE_FORBIDDEN", "STUDENT_STATUS_UPDATE_FORBIDDEN", "STUDIO_PROJECT_CREATE_FORBIDDEN", "REVIEW_SUBMISSION_FORBIDDEN", "CURRENT_QA_REQUIRED", "WORKSPACE_REQUIRED_FOR_REVIEW", "REVIEW_SELF_APPROVAL_FORBIDDEN", "REVIEW_ASSIGNMENT_REQUIRED", "REVIEW_FEEDBACK_TOO_LONG", "DELIVERY_FINALIZE_FORBIDDEN", "WORKSPACE_REQUIRED_FOR_DELIVERY", "DELIVERY_NOT_ELIGIBLE", "TEAM_MEMBERSHIP_REQUIRED", "TEAM_MEMBER_NOT_ELIGIBLE", "project_submission_review_required", "studio_project_finalize_required"].includes(code)) return 403;
  if (["HANDOFF_IN_PROGRESS", "WORKSPACE_REVISION_CONFLICT", "REVIEW_ALREADY_DECIDED", "REVIEW_SUBMISSION_CONFLICT"].includes(code)) return 409;
  if (["WORKSPACE_REVISION_REQUIRED"].includes(code)) return 400;
  return 400;
}

function reject(res: any, error: any) {
  const code = String(error?.message || "STUDIO_REQUEST_REJECTED");
  return res.status(statusFor(error)).json(fail(code, code));
}

function actor(req: any) {
  return req.user;
}

export function registerStudioProjectRoutes(app: any) {
  app.post("/studio/handoffs/assignment", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.createFromAssignment(actor(req), req.body || {}))); }
    catch (error) { return reject(res, error); }
  });
  app.post("/studio/projects", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.createStudentIdea(actor(req), req.body || {}))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.list(actor(req)) })); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/assignments/:assignmentId/progress", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getAssignmentProgress(actor(req), req.params.assignmentId))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.get(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/resources", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getResources(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/build-packet", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getBuildPacket(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/learning-context", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getLearningContext(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/workspace", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getWorkspace(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/revisions", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.listRevisions(actor(req), req.params.projectId) })); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/revisions/:revisionId", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getRevision(actor(req), req.params.projectId, req.params.revisionId))); }
    catch (error) { return reject(res, error); }
  });
  app.patch("/studio/projects/:projectId/workspace", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE), async (req: any, res: any) => {
    try { return res.json(ok(await service.updateWorkspace(actor(req), req.params.projectId, req.body || {}))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/qa/current", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getCurrentQa(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.post("/studio/projects/:projectId/qa", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.runQa(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/review/current", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getCurrentReview(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.post("/studio/projects/:projectId/review-submissions", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.submitForReview(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/review-submissions/:submissionId", requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getReviewSubmission(actor(req), req.params.projectId, req.params.submissionId))); }
    catch (error) { return reject(res, error); }
  });
  app.post("/studio/projects/:projectId/review-submissions/:submissionId/decision", requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.decideReview(actor(req), req.params.projectId, req.params.submissionId, req.body || {}))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/delivery/current", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.getDelivery(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.post("/studio/projects/:projectId/finalize", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_FINALIZE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.finalizeProject(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.get("/studio/projects/:projectId/institutional-status", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await getStudioInstitutionalStatus(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.post("/studio/projects/:projectId/evidence", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await projectStudioEvidence(actor(req), req.params.projectId))); }
    catch (error) { return reject(res, error); }
  });
  app.patch("/studio/projects/:projectId/status", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE), async (req: any, res: any) => {
    try { return res.json(ok(await service.updateStatus(actor(req), req.params.projectId, req.body?.status))); }
    catch (error) { return reject(res, error); }
  });
}
