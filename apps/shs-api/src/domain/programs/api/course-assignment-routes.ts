import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { CourseAssignmentService } from "../service/course-assignment-service.js";

const service = new CourseAssignmentService();
const reject = (res: any, error: any) => res.status(error?.message === "course_assignment_view_required" ? 403 : 400).json({ ok: false, error: { code: String(error?.message || "course_assignment_rejected").toUpperCase() } });
export function registerCourseAssignmentRoutes(app: any) {
  app.get("/program-course-assignments", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => { try { return res.json({ ok: true, data: await service.list(req.user, req.query?.learner_id || undefined) }); } catch (e) { return reject(res, e); } });
  app.get("/program-course-assignments/:learnerId", requirePermission(SHS_SECURITY_PERMISSIONS.PROGRAM_COURSE_ASSIGN), async (req: any, res: any) => { try { return res.json({ ok: true, data: await service.list(req.user, req.params.learnerId) }); } catch (e) { return reject(res, e); } });
  app.post("/program-course-assignments", requirePermission(SHS_SECURITY_PERMISSIONS.PROGRAM_COURSE_ASSIGN), async (req: any, res: any) => { try { return res.status(201).json({ ok: true, data: await service.assign({ actor: req.user, learnerId: String(req.body?.learner_id || ""), programId: String(req.body?.program_id || ""), courseId: String(req.body?.course_id || ""), specializationId: String(req.body?.specialization_id || "") }) }); } catch (e: any) { return reject(res, e); } });
}
