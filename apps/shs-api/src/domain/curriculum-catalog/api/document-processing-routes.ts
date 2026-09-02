// SHF Lesson + Assignment + Curriculum — Phase 4.6.
//
// Deliberately placed in curriculum-catalog, not source-ingestion:
// extraction/structure-detection exist to feed the curriculum importer,
// and curriculum-catalog already depends on source-ingestion's repo (for
// resource provenance lookups) — never the other way around. Keeping
// these routes here preserves that one-directional dependency instead of
// reaching backwards from the foundational Phase 1 domain.
//
// Organization scoping is enforced entirely inside raw-document-import-
// service.ts's own org-scoped repo reads — a request for another org's
// Source Document Version resolves to SOURCE_VERSION_NOT_FOUND, not a
// leak (Step 49).
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { processSourceDocumentVersion, getExtractionPreview, RawDocumentError } from "../service/raw-document-import-service.js";

function actorFromRequest(req: any) {
  return { user_id: String(req.user.user_id), organization_id: String(req.user.active_organization_id || req.user.organization_id) };
}

function handleError(error: unknown, res: any, next: any) {
  if (error instanceof RawDocumentError) {
    const status = error.code === "SOURCE_VERSION_NOT_FOUND" || error.code === "SOURCE_ASSET_NOT_FOUND" ? 404 : 422;
    return res.status(status).json(fail(error.code, error.message, "corr_raw_document"));
  }
  return next(error);
}

export function registerDocumentProcessingRoutes(app: any) {
  const manage = requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_CATALOG_MANAGE);
  const view = requirePermission(SHS_SECURITY_PERMISSIONS.CURRICULUM_SOURCE_VIEW);

  // Step 4/33: server-side extraction only, triggered explicitly by
  // staff — never automatic on upload, and never performed in the
  // browser.
  app.post("/curriculum/source-documents/:versionId/process", manage, async (req: any, res: any, next: any) => {
    try {
      const artifact = await processSourceDocumentVersion(actorFromRequest(req), req.params.versionId);
      res.json(ok({
        blockCount: artifact.extractedDocument.blocks.length,
        pageCount: artifact.extractedDocument.pageCount,
        warnings: artifact.extractedDocument.warnings,
        structureConfidence: artifact.structure.overallConfidence,
        unitCount: artifact.structure.units.length,
        lessonCount: artifact.structure.units.reduce((n, u) => n + u.lessons.length, 0),
      }));
    } catch (e) { handleError(e, res, next); }
  });

  // Steps 30-32, 36-38: read-only preview of extracted blocks and
  // detected structure. Never mutates processing state or creates a
  // catalog row.
  app.get("/curriculum/source-documents/:versionId/extraction", view, async (req: any, res: any, next: any) => {
    try { res.json(ok(await getExtractionPreview(actorFromRequest(req), req.params.versionId))); } catch (e) { handleError(e, res, next); }
  });
}
