import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { CapstoneEntryService } from "../service/capstone-entry-service.js";

const service = new CapstoneEntryService();

export function registerCapstoneEntryRoutes(app: any) {
  app.get("/programs/:programId/capstone-entry", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.evaluate(req.user, req.query?.learner_id || undefined, req.params.programId) }); } catch (error: any) { return res.status(403).json({ ok: false, error: { code: String(error?.message || "capstone_entry_rejected").toUpperCase() } }); }
  });
  app.get("/programs/:programId/capstone-eligibility", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.evaluate(req.user, req.query?.learner_id || undefined, req.params.programId) }); } catch (error: any) { return res.status(403).json({ ok: false, error: { code: String(error?.message || "capstone_entry_rejected").toUpperCase() } }); }
  });
}
