import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { SpecializationAssignmentService } from "../service/specialization-assignment-service.js";

const service = new SpecializationAssignmentService();
const reject = (res: any, error: any) => res.status(error?.message === "assignment_not_found" ? 404 : 403).json({ ok: false, error: { code: String(error?.message || "assignment_rejected").toUpperCase() } });

export function registerSpecializationAssignmentRoutes(app: any) {
  app.get("/program-specialization-assignments/available", async (_req: any, res: any) => res.json({ ok: true, data: await service.listAvailable() }));
  app.get("/program-specialization-assignments", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.getLearnerAssignment(req.user) }); } catch (error) { return reject(res, error); }
  });
  app.get("/program-specialization-assignments/:learnerId", requirePermission(SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.getLearnerAssignment(req.user, req.params.learnerId, req.query?.program_id) }); } catch (error) { return reject(res, error); }
  });
  app.post("/program-specialization-assignments", requirePermission(SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.assign({ actor: req.user, learnerId: String(req.body?.learner_id || ""), programId: String(req.body?.program_id || ""), specializationId: String(req.body?.specialization_id || ""), assignmentSource: req.body?.assignment_source, grade: req.body?.grade, assignmentType: req.body?.assignment_type }) }); } catch (error) { return reject(res, error); }
  });
  app.post("/program-specialization-assignments/:assignmentId/change", requirePermission(SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.change({ actor: req.user, assignmentId: req.params.assignmentId, specializationId: String(req.body?.specialization_id || ""), source: req.body?.assignment_source }) }); } catch (error) { return reject(res, error); }
  });
}
