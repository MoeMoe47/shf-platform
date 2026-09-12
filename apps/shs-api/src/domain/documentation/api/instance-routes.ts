import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { DocumentationInstanceService } from "../service/documentation-instance-service.js";

const service = new DocumentationInstanceService();
const actor = (req: any) => req.user;

function routeError(res: any, error: any) {
  const message = String(error?.message || "Documentation operation failed");
  const status = /FORBIDDEN|REQUIRED|INVALID|NOT_FOUND|UNAVAILABLE|ORG_CONTEXT/.test(message) ? 400 : 500;
  return res.status(status).json(fail("DOCUMENTATION_OPERATION_REJECTED", message));
}

export function registerDocumentationInstanceRoutes(app: any) {
  app.post("/documentation/documents", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_GENERATE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.createDocument(actor(req), req.body || {}))); } catch (error) { return routeError(res, error); }
  });
  app.get("/documentation/documents/:documentInstanceId", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_VIEW), async (req: any, res: any) => {
    try { const item = await service.getDocument(actor(req), req.params.documentInstanceId); return item ? res.json(ok(item)) : res.status(404).json(fail("DOCUMENT_NOT_FOUND", "Document instance not found.")); } catch (error) { return routeError(res, error); }
  });
  app.get("/documentation/documents/:documentInstanceId/artifact", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_VIEW), async (req: any, res: any) => {
    try { const result = await service.getArtifact(actor(req), req.params.documentInstanceId); res.type(result.instance.artifact_mime_type || "text/html"); return res.send(result.bytes); } catch (error) { return routeError(res, error); }
  });
  app.post("/documentation/documents/:documentInstanceId/evidence-links", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_EVIDENCE_LINK), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.linkEvidence(actor(req), req.params.documentInstanceId, req.body || {}))); } catch (error) { return routeError(res, error); }
  });
  app.post("/documentation/packets", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_PACKET_CREATE), async (req: any, res: any) => {
    try { return res.status(201).json(ok(await service.createPacket(actor(req), req.body || {}))); } catch (error) { return routeError(res, error); }
  });
  app.get("/documentation/packets/:packetInstanceId", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_VIEW), async (req: any, res: any) => {
    try { const item = await service.getPacket(actor(req), req.params.packetInstanceId); return item ? res.json(ok(item)) : res.status(404).json(fail("PACKET_NOT_FOUND", "Packet instance not found.")); } catch (error) { return routeError(res, error); }
  });
}
