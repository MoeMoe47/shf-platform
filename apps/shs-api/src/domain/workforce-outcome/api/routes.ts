import { requirePermission } from "../../../auth/permission-guard";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions";
import { WorkforceOutcomeService } from "../service/workforce-outcome-service";

const service = new WorkforceOutcomeService();
const version = (req: any) => Number(req.body?.expectedVersion ?? req.body?.expected_version);
function errorResponse(res: any, code: string, err: any, status = 400) {
  return res.status(status).json({ ok: false, error: { code, message: err?.message || "Workforce outcome request rejected" } });
}

export function registerWorkforceOutcomeRoutes(app: any) {
  app.post("/workforce/employment-outcomes", requirePermission(SHS_SECURITY_PERMISSIONS.WORKFORCE_OUTCOMES_SUBMIT), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.submit(req.body || {}, req.user) }); }
    catch (err: any) { return errorResponse(res, "EMPLOYMENT_OUTCOME_SUBMIT_REJECTED", err); }
  });
  app.get("/workforce/employment-outcomes", requirePermission(SHS_SECURITY_PERMISSIONS.WORKFORCE_OUTCOMES_VIEW), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: { items: await service.list(req.user) } }); }
    catch (err: any) { return errorResponse(res, "EMPLOYMENT_OUTCOME_READ_REJECTED", err); }
  });
  app.get("/workforce/employment-outcomes/:outcomeId", requirePermission(SHS_SECURITY_PERMISSIONS.WORKFORCE_OUTCOMES_VIEW), async (req: any, res: any) => {
    try { const item = await service.get(req.params.outcomeId, req.user); if (!item) return errorResponse(res, "EMPLOYMENT_OUTCOME_NOT_FOUND", new Error("Employment outcome not found"), 404); return res.json({ ok: true, data: item }); }
    catch (err: any) { return errorResponse(res, "EMPLOYMENT_OUTCOME_READ_REJECTED", err); }
  });
  for (const [action, permission, method] of [
    ["verify", SHS_SECURITY_PERMISSIONS.WORKFORCE_OUTCOMES_VERIFY, "verify"],
    ["reject", SHS_SECURITY_PERMISSIONS.WORKFORCE_OUTCOMES_REJECT, "reject"],
    ["withdraw", SHS_SECURITY_PERMISSIONS.WORKFORCE_OUTCOMES_SUBMIT, "withdraw"],
  ] as const) {
    app.post(`/workforce/employment-outcomes/:outcomeId/${action}`, requirePermission(permission), async (req: any, res: any) => {
      try { return res.json({ ok: true, data: await (service as any)[method](req.params.outcomeId, req.user, version(req)) }); }
      catch (err: any) { return errorResponse(res, `EMPLOYMENT_OUTCOME_${action.toUpperCase()}_REJECTED`, err, 409); }
    });
  }
}
