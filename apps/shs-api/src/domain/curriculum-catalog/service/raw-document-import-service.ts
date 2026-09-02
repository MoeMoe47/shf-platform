// SHF Lesson + Assignment + Curriculum — Phase 4.6: Raw Document
// Extraction, Structure Detection, and Draft Curriculum Transformation.
//
// Orchestration only. Uses Phase 1's canonical Source Asset / Source
// Document Version domain exclusively (Step 1) — no second upload
// system, no second source table. The output of buildStructuredSource
// FromDocument() is a StructuredCurriculumSource — the EXACT type
// curriculum-import-source-adapter.ts already produces for structured
// static-JSON sources — so createImportJob/buildDraft/executeImportJob
// in curriculum-import-job-service.ts require zero changes to their own
// candidate/diff/transaction logic to support raw documents. This is
// the whole point of this file: it is a second SOURCE, not a second
// PIPELINE.
import { createHash } from "node:crypto";
import * as sourceRepo from "../../source-ingestion/repo/source-repo.js";
import { LocalPrivateSourceStorage, type SourceStorage } from "../../source-ingestion/storage/source-storage.js";
import { extractDocument, canonicalExtractionHash, OcrRequiredError, ExtractionError, type ExtractedDocument, type ExtractedBlock } from "./document-extraction-service.js";
import { detectStructure, type SourceStructure, type SourceStructureUnitNode, type SourceStructureLessonNode } from "./document-structure-service.js";
import { sanitizeStableKey } from "./curriculum-catalog-service.js";
import type { StructuredCurriculumSource, StructuredSourceUnit, StructuredSourceLesson, StructuredSourceMedia } from "./curriculum-import-source-adapter.js";

export class RawDocumentError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = "RawDocumentError"; }
}

interface ExtractionArtifact {
  extractedDocument: ExtractedDocument;
  structure: SourceStructure;
}

type Actor = { user_id: string; organization_id: string };

function artifactStorageKey(sourceDocumentVersionId: string): string {
  return `source-extractions/${sourceDocumentVersionId}.json`;
}

async function loadVersionAndAsset(actor: Actor, sourceDocumentVersionId: string, storage: SourceStorage) {
  const version = await sourceRepo.getVersion(actor.organization_id, sourceDocumentVersionId);
  if (!version) throw new RawDocumentError("SOURCE_VERSION_NOT_FOUND", "Source document version does not exist in your organization.");
  const asset = await sourceRepo.getAsset(actor.organization_id, version.source_asset_id);
  if (!asset || asset.status !== "ACTIVE") throw new RawDocumentError("SOURCE_ASSET_NOT_FOUND", "Source asset does not exist or is not active in your organization.");
  return { version, asset, storage };
}

// Step 11/54: same content + same extractor version -> reuse the
// existing artifact rather than re-running extraction. A caller that
// wants a genuine re-run (e.g. after an extractor upgrade) still gets
// one, since the version check below only short-circuits an exact match.
export async function processSourceDocumentVersion(actor: Actor, sourceDocumentVersionId: string): Promise<ExtractionArtifact> {
  const storage = new LocalPrivateSourceStorage();
  const { version, asset } = await loadVersionAndAsset(actor, sourceDocumentVersionId, storage);

  const sourceType = (version.metadata?.input_type || null) as "PDF" | "DOCX" | "TXT" | "MARKDOWN" | null;
  if (!sourceType) throw new RawDocumentError("UNKNOWN_SOURCE_TYPE", "This source document version does not record a recognized input type.");

  const currentExtractorVersion = extractorVersionFor(sourceType);
  if (version.extraction_status === "SUCCEEDED" && version.parser_version === currentExtractorVersion && version.extracted_text_location) {
    try {
      return await readArtifact(storage, version.extracted_text_location);
    } catch {
      // Stored artifact went missing/corrupt — fall through and re-extract rather than fail closed forever.
    }
  }

  // Interim, standalone-committed write (Step 12/18/55: a crash mid-
  // extraction must leave a diagnosable PROCESSING row, not silently
  // roll back to invisible — the same reasoning Phase 4.5A applied to
  // IMPORTING).
  await sourceRepo.updateVersionProcessing(actor.organization_id, sourceDocumentVersionId, {
    processingStatus: "PROCESSING", extractionStatus: "PENDING",
  });

  let buffer: Buffer;
  try {
    buffer = await storage.get(asset.storage_key);
  } catch (err: any) {
    await failVersion(actor, sourceDocumentVersionId, "FAILED", `unable to read stored source file: ${String(err?.message || err).slice(0, 200)}`);
    throw new RawDocumentError("SOURCE_READ_FAILED", "The stored source file could not be read.");
  }

  let extractedDocument: ExtractedDocument;
  try {
    extractedDocument = await extractDocument(sourceType, buffer);
  } catch (err: any) {
    if (err instanceof OcrRequiredError) {
      await failVersion(actor, sourceDocumentVersionId, "OCR_REQUIRED", err.message);
      throw new RawDocumentError("OCR_REQUIRED", err.message);
    }
    const message = err instanceof ExtractionError ? err.message : `extraction failed: ${String(err?.message || err).slice(0, 300)}`;
    await failVersion(actor, sourceDocumentVersionId, "FAILED", message);
    throw new RawDocumentError("EXTRACTION_FAILED", message);
  }

  const structure = detectStructure(extractedDocument, asset.original_filename.replace(/\.[^.]+$/, ""));
  const derivedHash = canonicalExtractionHash(extractedDocument);
  const artifact: ExtractionArtifact = { extractedDocument, structure };

  await storage.putOverwrite(artifactStorageKey(sourceDocumentVersionId), Buffer.from(JSON.stringify(artifact)));
  await sourceRepo.updateVersionProcessing(actor.organization_id, sourceDocumentVersionId, {
    processingStatus: "PROCESSED", extractionStatus: "SUCCEEDED",
    parserVersion: extractedDocument.extractorVersion, extractedTextLocation: artifactStorageKey(sourceDocumentVersionId),
    derivedHash,
    metadataPatch: {
      extraction: {
        blockCount: extractedDocument.blocks.length,
        pageCount: extractedDocument.pageCount,
        warnings: extractedDocument.warnings,
        structureConfidence: structure.overallConfidence,
        unitCount: structure.units.length,
        lessonCount: structure.units.reduce((n, u) => n + u.lessons.length, 0),
      },
    },
  });

  return artifact;
}

async function failVersion(actor: Actor, sourceDocumentVersionId: string, extractionStatus: "FAILED" | "OCR_REQUIRED", message: string) {
  await sourceRepo.updateVersionProcessing(actor.organization_id, sourceDocumentVersionId, {
    processingStatus: "FAILED", extractionStatus,
    metadataPatch: { extraction: { error: message.slice(0, 500) } },
  });
}

function extractorVersionFor(sourceType: "PDF" | "DOCX" | "TXT" | "MARKDOWN"): string {
  switch (sourceType) {
    case "PDF": return "pdf-parse@2.4.5";
    case "DOCX": return "mammoth@1.12.2";
    case "MARKDOWN": return "shf-markdown-blocks@1";
    case "TXT": return "shf-txt-blocks@1";
  }
}

async function readArtifact(storage: SourceStorage, storageKey: string): Promise<ExtractionArtifact> {
  const bytes = await storage.get(storageKey);
  return JSON.parse(bytes.toString("utf8"));
}

// Read-only preview (Steps 30-32, 36-38) — never mutates processing
// state or catalog rows.
export async function getExtractionPreview(actor: Actor, sourceDocumentVersionId: string) {
  const storage = new LocalPrivateSourceStorage();
  const { version } = await loadVersionAndAsset(actor, sourceDocumentVersionId, storage);
  if (version.extraction_status !== "SUCCEEDED" || !version.extracted_text_location) {
    return { version, extractedDocument: null, structure: null };
  }
  const artifact = await readArtifact(storage, version.extracted_text_location);
  return { version, extractedDocument: artifact.extractedDocument, structure: artifact.structure };
}

function canonicalize(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v).sort().reduce((acc: Record<string, unknown>, k) => { acc[k] = (v as any)[k]; return acc; }, {});
    }
    return v;
  });
}
function hashOf(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function blockTextsFor(blockIds: string[], blockById: Map<string, ExtractedBlock>) {
  return blockIds.map((id) => blockById.get(id)).filter((b): b is ExtractedBlock => !!b);
}

// Conservative link extraction (Step 32): only blocks that genuinely
// carry an href produce a RESOURCE candidate — no image/decorative
// extraction is attempted for raw documents in this phase (honest gap,
// not fabricated coverage).
function extractLinkResources(blocks: ExtractedBlock[], sourceDocumentVersionId: string, lessonSourceReference: string): StructuredSourceMedia[] {
  const withLinks = blocks.filter((b) => typeof b.href === "string" && b.href);
  return withLinks.map((b, index) => ({
    sourceReference: `${lessonSourceReference}#block=${b.blockId}`,
    stableKey: sanitizeStableKey(`${sourceDocumentVersionId}-${b.blockId}-${b.href}`),
    title: b.text.slice(0, 120) || b.href!,
    description: null,
    externalUrl: b.href!,
    sequence: index + 1,
    sourceHash: hashOf({ href: b.href, text: b.text }),
    accessibilityWarnings: [],
    raw: { blockId: b.blockId, href: b.href, text: b.text },
  }));
}

function pageOrBlockSpan(node: { pageRange: { start: number; end: number } | null; blockIds: string[] }): string {
  if (node.pageRange) return `pages=${node.pageRange.start}-${node.pageRange.end}`;
  return `blocks=${node.blockIds[0]}-${node.blockIds[node.blockIds.length - 1]}`;
}

function buildLesson(lessonNode: SourceStructureLessonNode, sequence: number, sourceDocumentVersionId: string, blockById: Map<string, ExtractedBlock>, docSourceRef: string, unitNodeId: string): StructuredSourceLesson {
  const blocks = blockTextsFor(lessonNode.blockIds, blockById);
  const stableKey = sanitizeStableKey(lessonNode.nodeId);
  const sourceReference = `${docSourceRef}#unit=${unitNodeId}#lesson=${lessonNode.nodeId}#${pageOrBlockSpan(lessonNode)}`;
  const raw = {
    sourceKind: "RAW_DOCUMENT" as const,
    confidence: lessonNode.confidence,
    confidenceReason: lessonNode.confidenceReason,
    pageRange: lessonNode.pageRange,
    blockIds: lessonNode.blockIds,
    sections: blocks.map((b) => ({ heading: b.type === "HEADING" ? b.text : undefined, body: b.type !== "HEADING" ? b.text : undefined, type: b.type })).filter((s) => s.heading || s.body),
  };
  return {
    sourceReference, stableKey, title: lessonNode.title, sequence,
    sourceHash: hashOf({ nodeId: lessonNode.nodeId, blocks: blocks.map((b) => ({ t: b.type, x: b.text })) }),
    raw,
    resources: extractLinkResources(blocks, sourceDocumentVersionId, sourceReference),
    arcadeReferences: [], // Step 31: raw documents never fabricate Arcade references — none are generated unless a future source format explicitly provides one.
  };
}

function buildUnit(unitNode: SourceStructureUnitNode, sequence: number, sourceDocumentVersionId: string, blockById: Map<string, ExtractedBlock>, docSourceRef: string): StructuredSourceUnit {
  const stableKey = sanitizeStableKey(unitNode.nodeId);
  const sourceReference = `${docSourceRef}#unit=${unitNode.nodeId}#${pageOrBlockSpan(unitNode)}`;
  const lessons = unitNode.lessons.map((lessonNode, index) => buildLesson(lessonNode, index + 1, sourceDocumentVersionId, blockById, docSourceRef, unitNode.nodeId));
  return {
    stableKey, title: unitNode.title, sequence, sourceReference, lessons,
    sourceHash: hashOf({ nodeId: unitNode.nodeId, lessons: lessons.map((l) => ({ k: l.stableKey, h: l.sourceHash })) }),
  };
}

// The one function curriculum-import-job-service.ts calls for a
// RAW_DOCUMENT import job — everything downstream of this point (draft
// building, validation, diffing, transactional execution, resource/
// Arcade handling) is Phase 4.5A/B/D's existing, completely unmodified
// machinery.
// `documentKey` (Step 46-48): source_document_versions in this schema
// all share ONE asset's stored bytes (versions here track re-EXTRACTION
// of the same upload, confirmed by fresh audit — there is no per-version
// storage_key). A genuinely revised document — the real-world "Version
// 2" this phase's re-import/versioning steps require — must therefore be
// uploaded as a NEW Source Asset (a different content_hash), not a
// second version of the old one. `documentKey` is how staff assert "this
// new asset continues that course": it defaults to the asset's own id
// (so a document processed once, never revised, needs no extra
// argument), but re-processing under the SAME explicit documentKey used
// for an earlier asset targets the SAME existing course — mirroring
// exactly how a STATIC_JSON import's own `sourceKey` already works as an
// admin-asserted continuity handle, independent of which literal files
// happen to back it.
export async function buildStructuredSourceFromDocument(actor: Actor, sourceDocumentVersionId: string, documentKey?: string): Promise<StructuredCurriculumSource> {
  const storage = new LocalPrivateSourceStorage();
  const { version, asset } = await loadVersionAndAsset(actor, sourceDocumentVersionId, storage);
  if (version.extraction_status !== "SUCCEEDED" || !version.extracted_text_location) {
    throw new RawDocumentError("EXTRACTION_NOT_READY", "This source document version has not been successfully extracted yet.");
  }
  const artifact = await readArtifact(storage, version.extracted_text_location);
  const blockById = new Map(artifact.extractedDocument.blocks.map((b) => [b.blockId, b] as const));
  const docSourceRef = `doc:${sourceDocumentVersionId}`;
  const units = artifact.structure.units.map((unitNode, index) => buildUnit(unitNode, index + 1, sourceDocumentVersionId, blockById, docSourceRef));
  const continuityKey = documentKey?.trim() || asset.source_asset_id;

  return {
    sourceKey: docSourceRef,
    courseStableKey: sanitizeStableKey(`doc-${continuityKey}`),
    courseTitle: artifact.structure.courseTitle,
    units,
    sourceHash: hashOf({ asset: asset.source_asset_id, units: units.map((u) => ({ k: u.stableKey, h: u.sourceHash })) }),
  };
}
