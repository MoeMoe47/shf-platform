import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { SpecializationRequestService } from "../service/specialization-request-service.js";

const service = new SpecializationRequestService();
const reject = (res: any, error: any) => res.status(error?.message === "request_not_found" ? 404 : 403).json({ ok: false, error: { code: String(error?.message || "request_rejected").toUpperCase() } });

export function registerSpecializationRequestRoutes(app: any) {
  app.get("/program-specialization-requests/pending", requirePermission(SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.listPending(req.user, req.query?.program_id || undefined) }); } catch (error) { return reject(res, error); }
  });
  app.get("/program-specialization-requests", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.list(req.user, req.query?.learner_id || undefined, req.query?.program_id || undefined) }); } catch (error) { return reject(res, error); }
  });
  app.post("/program-specialization-requests", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.request({ actor: req.user, specializationId: String(req.body?.specialization_id || ""), programId: req.body?.program_id, learnerRationale: req.body?.learner_rationale }) }); } catch (error) { return reject(res, error); }
  });
  app.get("/program-specialization-requests/:requestId", requirePermission(SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.getById(req.user, req.params.requestId) }); } catch (error) { return reject(res, error); }
  });
  app.post("/program-specialization-requests/:requestId/confirm", requirePermission(SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.confirm({ actor: req.user, requestId: req.params.requestId, specializationId: req.body?.specialization_id, staffNote: req.body?.staff_note }) }); } catch (error) { return reject(res, error); }
  });
  app.post("/program-specialization-requests/:requestId/decline", requirePermission(SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.decline({ actor: req.user, requestId: req.params.requestId, staffNote: req.body?.staff_note }) }); } catch (error) { return reject(res, error); }
  });
}
