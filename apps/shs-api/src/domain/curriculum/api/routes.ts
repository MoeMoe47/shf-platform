import { requirePermission } from "../../../auth/permission-guard";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions";
import { ok, fail } from "../../../api/response-envelope";
import { CurriculumCompletionService } from "../service/curriculum-completion-service";

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
        const code = String(error?.message || "completion_rejected");
        return res.status(400).json(fail(code.toUpperCase(), "Lesson completion rejected."));
      }
    },
  );
}
