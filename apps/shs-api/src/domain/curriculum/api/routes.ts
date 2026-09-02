import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ok, fail } from "../../../api/response-envelope.js";
import { CurriculumCompletionService, CompletionPolicyNotSatisfiedError } from "../service/curriculum-completion-service.js";

const service = new CurriculumCompletionService();

export function registerCurriculumCompletionRoutes(app: any) {
  app.post(
    "/curriculum/lessons/:lessonId/complete",
    requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE),
    async (req: any, res: any) => {
      try {
        const result = await service.complete({
          lessonId: req.params.lessonId,
          curriculumId: req.body?.curriculum,
          actor: req.user,
        });
        return res.status(200).json(ok(result));
      } catch (error: any) {
        // Phase 4 — a Completion Policy applied and was not satisfied.
        // Return the full requirement breakdown so the caller can show an
        // honest "requirements remaining" explanation instead of a
        // generic rejection (Step 31/37).
        if (error instanceof CompletionPolicyNotSatisfiedError) {
          return res.status(409).json(fail("COMPLETION_REQUIREMENTS_NOT_SATISFIED", error.evaluation.reason, "corr_completion_policy", { requirements: error.evaluation.requirements }));
        }
        const code = String(error?.message || "completion_rejected");
        return res.status(code === "grade12_course_assignment_required" ? 403 : 400).json(fail(code.toUpperCase(), "Lesson completion rejected."));
      }
    },
  );
}
