import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { PrepareProveService } from "../service/prepare-prove-service.js";

const service = new PrepareProveService();

function reject(res: any, error: any, status = 400) {
  return res.status(status).json({ ok: false, error: { code: String(error?.message || "prepare_prove_rejected").toUpperCase() } });
}

export function registerPrepareProveRoutes(app: any) {
  app.get("/prepare-prove/competency-definitions/monitoring-proof", async (_req: any, res: any) => res.json({ ok: true, data: await service.getProofDefinition() }));
  app.post("/prepare-prove/activity-results", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.submitProofResult({ actor: req.user, result: req.body?.result || {} }) }); } catch (error: any) { return reject(res, error, ["specialization_assignment_required", "grade12_course_assignment_required"].includes(error?.message) ? 403 : 400); }
  });
  app.post("/prepare-prove/evidence", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.createEvidence({ actor: req.user, sourceResultId: String(req.body?.source_result_id || ""), criterion: String(req.body?.criterion || "") }) }); } catch (error) { return reject(res, error); }
  });
  app.get("/prepare-prove/proof-status", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.getProofStatus(req.user, String(req.query?.activity_id || "grade11-technical-operations-monitoring-proof")) }); } catch (error) { return reject(res, error, 403); }
  });
  app.get("/prepare-prove/evidence/:evidenceId", requirePermission(SHS_SECURITY_PERMISSIONS.VERIFICATION_VIEW), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.getReviewPackage(req.user, req.params.evidenceId) }); } catch (error: any) { return reject(res, error, error?.message === "evidence_not_found" ? 404 : 403); }
  });
  app.post("/prepare-prove/evidence/:evidenceId/review", requirePermission(SHS_SECURITY_PERMISSIONS.VERIFICATION_REVIEW), async (req: any, res: any) => {
    if (!(req.user?.permissions || []).includes(SHS_SECURITY_PERMISSIONS.VERIFICATION_APPROVE)) return reject(res, new Error("verification_approve_required"), 403);
    try { return res.json({ ok: true, data: await service.reviewEvidence({ actor: req.user, evidenceId: req.params.evidenceId, decision: req.body?.decision }) }); } catch (error: any) { return reject(res, error, error?.message === "evidence_not_found" ? 404 : 409); }
  });
}
