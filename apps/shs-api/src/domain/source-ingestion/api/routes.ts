import multer from "multer";
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/source-service.js";
import { SourceIngestionError } from "../service/source-service.js";
import { SourceValidationError } from "../service/source-validation.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 } });

function actorFromRequest(req: any) {
  return { user_id: String(req.user.user_id), organization_id: String(req.user.active_organization_id || req.user.organization_id), tenant_id: String(req.user.tenant_id) };
}

// Most local routes intentionally support the repository's development
// fallback identity. Source material is institutional input, so this domain
// requires an explicit bearer token or production session cookie as well as
// the normal permission and organization checks.
function requireExplicitAuthentication(req: any, res: any, next: any) {
  const authorization = String(req.headers?.authorization || "").trim();
  const hasSession = String(req.headers?.cookie || "").split(";").some((item) => item.trim().startsWith("shs_session="));
  if (!authorization && !hasSession) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
  return next();
}

function parseUpload(req: any, res: any, next: any) {
  upload.single("file")(req, res, (error: any) => {
    if (error instanceof multer.MulterError) return res.status(413).json(fail("UPLOAD_LIMIT", "Upload exceeds the allowed limit."));
    if (error) return res.status(400).json(fail("UPLOAD_INVALID", "Upload could not be read."));
    return next();
  });
}

function sendError(error: any, res: any, next: any) {
  if (error instanceof SourceValidationError || error instanceof SourceIngestionError) {
    return res.status(error instanceof SourceIngestionError ? error.statusCode : 400).json(fail(error.code, error.message));
  }
  return next(error);
}

export function registerSourceIngestionRoutes(app: any) {
  app.post("/curriculum/source-assets", requireExplicitAuthentication, requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_SOURCE_UPLOAD), parseUpload, async (req: any, res: any, next: any) => {
    try {
      if (!req.file) return res.status(400).json(fail("FILE_REQUIRED", "A source file is required."));
      return res.status(201).json(ok(await service.createSourceAsset(actorFromRequest(req), req.file, req)));
    } catch (error) { return sendError(error, res, next); }
  });

  app.get("/curriculum/source-assets", requireExplicitAuthentication, requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_SOURCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listAssets(actorFromRequest(req).organization_id) })); } catch (error) { return sendError(error, res, next); }
  });
  app.get("/curriculum/source-assets/:id", requireExplicitAuthentication, requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_SOURCE_VIEW), async (req: any, res: any, next: any) => {
    try {
      const item = await service.getAsset(actorFromRequest(req).organization_id, req.params.id);
      if (!item) return res.status(404).json(fail("NOT_FOUND", "Source asset not found."));
      const { storage_key: _storageKey, ...safe } = item;
      return res.json(ok(safe));
    } catch (error) { return sendError(error, res, next); }
  });
  app.get("/curriculum/source-assets/:id/versions", requireExplicitAuthentication, requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_SOURCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listVersions(actorFromRequest(req).organization_id, req.params.id) })); } catch (error) { return sendError(error, res, next); }
  });
  app.get("/curriculum/source-assets/:id/download", requireExplicitAuthentication, requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_SOURCE_VIEW), async (req: any, res: any, next: any) => {
    try {
      const result = await service.downloadSourceAsset(actorFromRequest(req), req.params.id);
      if (!result) return res.status(404).json(fail("NOT_FOUND", "Source asset not found."));
      res.setHeader("Content-Type", result.asset.media_type);
      res.setHeader("Content-Length", String(result.content.length));
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", `attachment; filename="${String(result.asset.original_filename).replace(/["\\\r\n]/g, "_")}"`);
      return res.send(result.content);
    } catch (error) { return sendError(error, res, next); }
  });
}
