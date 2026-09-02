// SHF Curriculum Phase 5.5 — student-facing read routes for the Learning
// landing / Course Workspace. Distinct from api/routes.ts (staff-only
// authoring surface, gated by CURRICULUM_CATALOG_MANAGE/APPROVE/PUBLISH/
// RETIRE) — these are read-only and scoped to the requesting student's
// own entitled work via student-catalog-service.ts, never a client-
// suppliable organization/user id. Gated by ASSIGNMENT_VIEW, the same
// permission /assignments already uses, since "my courses" here is
// derived directly from that same entitled-assignment set.
import { ok, fail } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as studentCatalog from "../service/student-catalog-service.js";

function actorFromRequest(req: any) {
  return { user_id: req.user.user_id, organization_id: req.user.organization_id, roles: req.user.roles || [] };
}

export function registerStudentCatalogRoutes(app: any) {
  app.get("/curriculum/learning/courses", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const items = await studentCatalog.listMyCourses(actorFromRequest(req));
      return res.json(ok({ items }));
    } catch (error) {
      return next(error);
    }
  });

  app.get("/curriculum/learning/courses/:courseId", requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const detail = await studentCatalog.getCourseDetail(actorFromRequest(req), req.params.courseId);
      if (!detail) return res.status(404).json(fail("NOT_FOUND", "Course not found."));
      return res.json(ok(detail));
    } catch (error) {
      return next(error);
    }
  });
}
