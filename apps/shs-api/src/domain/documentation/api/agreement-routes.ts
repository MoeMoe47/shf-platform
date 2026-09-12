import multer from "multer";
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { DocumentationAgreementService } from "../service/agreement-service.js";

const service = new DocumentationAgreementService();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 } });
const actor = (req: any) => req.user;
function sendError(res: any, error: any) { const message = String(error?.message || "Documentation agreement operation failed"); const status = /FORBIDDEN|REQUIRED|INVALID|NOT_FOUND|MISMATCH|UNAVAILABLE|ORG_CONTEXT|DECISION|SIGNER|SELF_VERIFY|STATE_CONFLICT|UPLOAD/.test(message) ? 400 : 500; return res.status(status).json(fail("DOCUMENTATION_AGREEMENT_REJECTED", message)); }
function requireAnyPermission(...permissions: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
    if (!req.user.active_organization_id || !req.user.tenant_id) return res.status(403).json(fail("ORG_CONTEXT_REQUIRED", "Valid active organization context is required."));
    if (!(req.user.permissions || []).some((permission: string) => permissions.includes(permission))) return res.status(403).json(fail("FORBIDDEN", "A manual-signature access permission is required."));
    return next();
  };
}

export function registerDocumentationAgreementRoutes(app: any) {
  app.post("/documentation/acknowledgments", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_ACKNOWLEDGE), async (req: any, res: any) => { try { return res.status(201).json(ok(await service.acknowledge(actor(req), req.body || {}))); } catch (error) { return sendError(res, error); } });
  app.get("/documentation/acknowledgments/:id", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_ACKNOWLEDGMENT_VIEW), async (req: any, res: any) => { try { const item = await service.getAcknowledgment(actor(req), req.params.id); return item ? res.json(ok(item)) : res.status(404).json(fail("ACKNOWLEDGMENT_NOT_FOUND", "Acknowledgment not found.")); } catch (error) { return sendError(res, error); } });
  app.post("/documentation/manual-signatures", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_MANUAL_SIGNATURE_UPLOAD), (req: any, res: any, next: any) => upload.single("file")(req, res, (error: any) => { if (error) return res.status(413).json(fail("UPLOAD_INVALID", "Signed artifact upload could not be read.")); next(); }), async (req: any, res: any) => { try { if (!req.file) return res.status(400).json(fail("FILE_REQUIRED", "A signed artifact is required.")); return res.status(201).json(ok(await service.uploadManualSignature(actor(req), req.body || {}, req.file))); } catch (error) { return sendError(res, error); } });
  app.get("/documentation/manual-signatures/:id", requireAnyPermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_MANUAL_SIGNATURE_UPLOAD, SHS_SECURITY_PERMISSIONS.DOCUMENTATION_MANUAL_SIGNATURE_VERIFY), async (req: any, res: any) => { try { const item = await service.getManualSignature(actor(req), req.params.id); return item ? res.json(ok(item)) : res.status(404).json(fail("MANUAL_SIGNATURE_NOT_FOUND", "Manual signature record not found.")); } catch (error) { return sendError(res, error); } });
  app.get("/documentation/manual-signatures/:id/artifact", requireAnyPermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_MANUAL_SIGNATURE_UPLOAD, SHS_SECURITY_PERMISSIONS.DOCUMENTATION_MANUAL_SIGNATURE_VERIFY), async (req: any, res: any) => { try { const result = await service.getSignedArtifact(actor(req), req.params.id); if (!result) return res.status(404).json(fail("MANUAL_SIGNATURE_NOT_FOUND", "Manual signature record not found.")); res.type(result.record.signed_artifact_media_type); res.setHeader("X-Content-Type-Options", "nosniff"); return res.send(result.bytes); } catch (error) { return sendError(res, error); } });
  app.post("/documentation/manual-signatures/:id/verify", requirePermission(SHS_SECURITY_PERMISSIONS.DOCUMENTATION_MANUAL_SIGNATURE_VERIFY), async (req: any, res: any) => { try { return res.json(ok(await service.verifyManualSignature(actor(req), req.params.id, req.body || {}))); } catch (error) { return sendError(res, error); } });
}
