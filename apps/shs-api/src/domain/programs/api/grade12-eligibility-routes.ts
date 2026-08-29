import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { Grade12EligibilityService } from "../service/grade12-eligibility-service.js";

const service = new Grade12EligibilityService();

export function registerGrade12EligibilityRoutes(app: any) {
  app.get("/programs/:programId/grade12-eligibility", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.evaluate(req.user, req.query?.learner_id || undefined, req.params.programId) }); } catch (error: any) { return res.status(403).json({ ok: false, error: { code: String(error?.message || "eligibility_rejected").toUpperCase() } }); }
  });
  app.get("/programs/:programId/grade12-entry", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try {
      const eligibility = await service.evaluate(req.user, req.query?.learner_id || undefined, req.params.programId);
      if (!eligibility.eligible) return res.status(403).json({ ok: false, data: eligibility, error: { code: "GRADE12_REQUIREMENTS_INCOMPLETE" } });
      return res.json({ ok: true, data: { ...eligibility, gate: "OPEN_PLACEHOLDER_ONLY", capstone_role: { specialization_id: eligibility.specialization_id, status: "FUTURE_CONTRACT_ONLY" } } });
    } catch (error: any) { return res.status(403).json({ ok: false, error: { code: String(error?.message || "grade12_entry_rejected").toUpperCase() } }); }
  });
}
