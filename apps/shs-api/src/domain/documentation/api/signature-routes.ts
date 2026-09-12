import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { DocumentationSignatureService } from "../service/signature-service.js";

const service = new DocumentationSignatureService();
const actor = (req: any) => req.user;
function error(res: any, issue: any) {
  const message = String(issue?.message || "Signature operation failed");
  const status = /FORBIDDEN|REQUIRED|INVALID|NOT_FOUND|MISMATCH|UNAVAILABLE|CONFLICT|PROVIDER|SESSION|ARTIFACT|ORG_CONTEXT|SIGNER/.test(message) ? 400 : 500;
  return res.status(status).json(fail("DOCUMENTATION_SIGNATURE_REJECTED", message));
}

export function registerDocumentationSignatureRoutes(app: any) {
  app.post("/documentation/signatures", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_SIGNATURE_REQUEST), async (req: any, res: any) => { try { return res.status(201).json(ok(await service.createRequest(actor(req), req.body || {}))); } catch (issue) { return error(res, issue); } });
  app.get("/documentation/signatures/:id", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_SIGNATURE_VIEW), async (req: any, res: any) => { try { const value = await service.get(actor(req), req.params.id); return value ? res.json(ok(value)) : res.status(404).json(fail("SIGNATURE_REQUEST_NOT_FOUND", "Signature request not found.")); } catch (issue) { return error(res, issue); } });
  app.post("/documentation/signatures/:id/session", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_SIGNATURE_SESSION), async (req: any, res: any) => { try { return res.json(ok(await service.createSession(actor(req), req.params.id))); } catch (issue) { return error(res, issue); } });
  app.post("/documentation/signatures/:id/refresh", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_SIGNATURE_VIEW), async (req: any, res: any) => { try { return res.json(ok(await service.refresh(actor(req), req.params.id))); } catch (issue) { return error(res, issue); } });
  app.post("/documentation/signatures/:id/void", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_SIGNATURE_VOID), async (req: any, res: any) => { try { return res.json(ok(await service.voidRequest(actor(req), req.params.id, String(req.body?.reason || "authorized_void")))); } catch (issue) { return error(res, issue); } });
  app.get("/documentation/signatures/:id/artifact", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_SIGNATURE_ARTIFACT_RETRIEVE), async (req: any, res: any) => { try { const result = await service.retrieveArtifact(actor(req), req.params.id); res.type(result.request.signed_artifact_media_type || "application/octet-stream"); res.setHeader("X-Content-Type-Options", "nosniff"); return res.send(result.bytes); } catch (issue) { return error(res, issue); } });
  app.post("/documentation/signatures/:id/evidence-links", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_EVIDENCE_LINK), async (req: any, res: any) => { try { return res.status(201).json(ok(await service.linkEvidence(actor(req), req.params.id, String(req.body?.evidenceReference || "")))); } catch (issue) { return error(res, issue); } });
  // Provider callbacks are authenticated by the selected adapter, not by a user session.
  app.post("/documentation/signatures/provider/:provider/webhook", async (req: any, res: any) => { try { const environment = String(req.query?.environment || req.body?.environment || "TEST").toUpperCase(); const result = await service.processWebhook(String(req.params.provider), environment as any, { "x-test-signature": req.headers["x-test-signature"] }, req.body || {}); return res.json(ok(result)); } catch (issue) { return error(res, issue); } });
}
