import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { RegistrySubmissionService } from "../service/registry-submission-service.js";

const service = new RegistrySubmissionService();
function reject(res: any, error: any) {
  const code = String(error?.message || "REGISTRY_SUBMISSION_REQUEST_REJECTED");
  const notFound = ["REGISTRY_SUBMISSION_NOT_FOUND"].includes(code);
  const forbidden = ["REGISTRY_SUBMISSION_FORBIDDEN", "REGISTRY_PACKAGE_NOT_ELIGIBLE", "REGISTRY_PACKAGE_HASH_MISMATCH"].includes(code);
  const conflict = ["REGISTRY_RETRY_INVALID", "REGISTRY_SUBMISSION_FAILED"].includes(code);
  return res.status(notFound ? 404 : forbidden ? 403 : conflict ? 409 : 400).json(fail(code, code));
}

export function registerRegistrySubmissionRoutes(app: any) {
  app.post("/agent-packages/:packageId/registry-submissions", requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_SUBMIT), async (req: any, res: any) => {
    try {
      if (req.body && Object.keys(req.body).length) throw new Error("REGISTRY_SUBMISSION_FIELD_NOT_ALLOWED");
      return res.status(201).json(ok(await service.submit(req.user, req.params.packageId)));
    } catch (error) { return reject(res, error); }
  });
  app.get("/agent-packages/:packageId/registry-submissions", requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_VIEW), async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.list(req.user, req.params.packageId) })); } catch (error) { return reject(res, error); }
  });
  app.get("/registry-submissions/:submissionId", requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_VIEW), async (req: any, res: any) => {
    try { return res.json(ok(await service.get(req.user, req.params.submissionId))); } catch (error) { return reject(res, error); }
  });
  app.post("/registry-submissions/:submissionId/retry", requirePermission(SHS_SECURITY_PERMISSIONS.AGENT_REGISTRY_SUBMIT), async (req: any, res: any) => {
    try {
      if (req.body && Object.keys(req.body).length) throw new Error("REGISTRY_SUBMISSION_FIELD_NOT_ALLOWED");
      return res.status(201).json(ok(await service.retry(req.user, req.params.submissionId)));
    } catch (error) { return reject(res, error); }
  });
}
