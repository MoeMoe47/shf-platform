import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ok, fail } from "../../../api/response-envelope.js";
import { createEvidenceRule, projectAuthoritativeFact, supersedeEvidence } from "../service/verified-evidence-service.js";

export function registerVerifiedEvidenceRoutes(app: any) {
  app.post("/verified-evidence/rules", requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_MANAGE), async (req: any, res: any) => {
    try {
      return res.json(ok(await createEvidenceRule(req.user, req.body || {})));
    } catch (error: any) {
      return res.status(400).json(fail(String(error?.message || "evidence_rule_rejected").toUpperCase(), "Evidence rule rejected."));
    }
  });
  app.post("/verified-evidence/projections", requirePermission(SHS_SECURITY_PERMISSIONS.TRUTH_OVERRIDE), async (req: any, res: any) => {
    try {
      return res.json(ok(await projectAuthoritativeFact(req.user, req.body || {})));
    } catch (error: any) {
      return res.status(400).json(fail(String(error?.message || "projection_failed").toUpperCase(), "Evidence projection rejected."));
    }
  });
  app.post("/verified-evidence/:evidenceId/supersede", requirePermission(SHS_SECURITY_PERMISSIONS.TRUTH_OVERRIDE), async (req: any, res: any) => {
    try { return res.json(ok(await supersedeEvidence(req.user, req.params.evidenceId, req.body?.status === "REVIEWABLE" ? "REVIEWABLE" : "REVIEWED"))); }
    catch (error: any) { return res.status(400).json(fail("EVIDENCE_CORRECTION_FAILED", String(error?.message || "Unable to supersede evidence."))); }
  });
}
