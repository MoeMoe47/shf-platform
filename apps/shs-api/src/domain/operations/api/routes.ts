import { ok, fail } from "../../../api/response-envelope.js";
import { getAssignmentDetail, getCourseDetail, getLearnerDetail, getOperationalOverview } from "../operational-service.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";

export function registerOperationalRoutes(app: any) {
  app.get("/operations/overview", requirePermission(SHS_SECURITY_PERMISSIONS.COHORT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const data = await getOperationalOverview(req.user, {
        cohortId: req.query?.cohortId ? String(req.query.cohortId) : undefined,
        limit: req.query?.limit,
      });
      return res.json(ok(data));
    } catch (error: any) {
      if (error?.statusCode === 403) return res.status(403).json(fail(String(error.message || "FORBIDDEN"), "Operational view is not authorized."));
      return next(error);
    }
  });
  app.get("/operations/learners/:learnerId", requirePermission(SHS_SECURITY_PERMISSIONS.COHORT_VIEW), async (req: any, res: any, next: any) => {
    try { const data = await getLearnerDetail(req.user, String(req.params.learnerId)); if (!data) return res.status(404).json(fail("NOT_FOUND", "Learner not found.")); return res.json(ok(data)); }
    catch (error: any) { if (error?.statusCode === 403) return res.status(403).json(fail("FORBIDDEN", "Learner view is not authorized.")); return next(error); }
  });
  app.get("/operations/assignments/:assignmentId", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try { const data = await getAssignmentDetail(req.user, String(req.params.assignmentId)); if (!data) return res.status(404).json(fail("NOT_FOUND", "Assignment not found.")); return res.json(ok(data)); }
    catch (error: any) { if (error?.statusCode === 403) return res.status(403).json(fail("FORBIDDEN", "Assignment view is not authorized.")); return next(error); }
  });
  app.get("/operations/courses/:courseId", requirePermission(SHS_SECURITY_PERMISSIONS.COHORT_VIEW), async (req: any, res: any, next: any) => {
    try { const data = await getCourseDetail(req.user, String(req.params.courseId)); if (!data) return res.status(404).json(fail("NOT_FOUND", "Course not found.")); return res.json(ok(data)); }
    catch (error: any) { if (error?.statusCode === 403) return res.status(403).json(fail("FORBIDDEN", "Course view is not authorized.")); return next(error); }
  });
}
