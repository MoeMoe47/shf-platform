// AX-3: governed derived representations. This module is intentionally
// storage- and provider-neutral; source domains remain lifecycle authorities.

export const ACCESSIBILITY_CONTENT_ENGINE_VERSION = 1;

export const REPRESENTATION_TYPES = Object.freeze([
  "ORIGINAL", "ACCESSIBLE_HTML", "LARGE_PRINT", "HIGH_CONTRAST",
  "SIMPLIFIED_READING", "READ_ALOUD", "AUDIO", "TRANSCRIPT",
  "CAPTIONED_MEDIA", "BRAILLE_READY", "TAGGED_PDF", "EPUB",
  "TRANSLATED_TEXT", "ACCESSIBLE_PRINT", "PLAIN_TEXT",
]);

export const SUPPORT_STATUS = Object.freeze([
  "SUPPORTED", "PARTIAL", "EXTERNAL_DEPENDENCY", "FUTURE_PHASE", "UNSUPPORTED",
]);

export const TRANSFORMATION_STATUS = Object.freeze([
  "REQUESTED", "ELIGIBLE", "GENERATING", "GENERATED", "VALIDATING",
  "READY", "FAILED", "UNSUPPORTED", "STALE", "SUPERSEDED",
]);

export const VALIDATION_STATUS = Object.freeze([
  "NOT_VALIDATED", "AUTOMATED_CHECKED", "HUMAN_REVIEWED",
  "VERIFIED_ACCESSIBLE", "FAILED_VALIDATION",
]);

export const SOURCE_TYPES = Object.freeze([
  "HTML", "MARKDOWN", "PLAIN_TEXT", "PDF", "DOCX", "IMAGE", "VIDEO",
  "AUDIO", "QUIZ", "FORM", "TABLE", "DIAGRAM", "CURRICULUM_LESSON",
  "DGAL_DOCUMENT", "PUBLIC_ARTICLE", "ARCADE_INSTRUCTIONS", "STUDIO_RESOURCE",
]);

const E = "SUPPORTED";
const P = "PARTIAL";
const F = "FUTURE_PHASE";
const X = "EXTERNAL_DEPENDENCY";

export const REPRESENTATION_SUPPORT = Object.freeze({
  ORIGINAL: { status: E, sources: SOURCE_TYPES },
  ACCESSIBLE_HTML: { status: E, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "PUBLIC_ARTICLE", "ARCADE_INSTRUCTIONS", "TABLE", "FORM", "QUIZ"] },
  LARGE_PRINT: { status: E, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "PUBLIC_ARTICLE", "DGAL_DOCUMENT"] },
  HIGH_CONTRAST: { status: E, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "PUBLIC_ARTICLE"] },
  SIMPLIFIED_READING: { status: P, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "PUBLIC_ARTICLE", "ARCADE_INSTRUCTIONS"] },
  READ_ALOUD: { status: P, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "PUBLIC_ARTICLE"] },
  AUDIO: { status: F, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "PUBLIC_ARTICLE", "VIDEO"] },
  TRANSCRIPT: { status: P, sources: ["VIDEO", "AUDIO", "CURRICULUM_LESSON", "DGAL_DOCUMENT"] },
  CAPTIONED_MEDIA: { status: P, sources: ["VIDEO"] },
  BRAILLE_READY: { status: X, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "DGAL_DOCUMENT"] },
  TAGGED_PDF: { status: F, sources: ["HTML", "MARKDOWN", "CURRICULUM_LESSON", "DGAL_DOCUMENT"] },
  EPUB: { status: F, sources: ["HTML", "MARKDOWN", "CURRICULUM_LESSON", "PUBLIC_ARTICLE"] },
  TRANSLATED_TEXT: { status: X, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "PUBLIC_ARTICLE"] },
  ACCESSIBLE_PRINT: { status: P, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "PUBLIC_ARTICLE", "DGAL_DOCUMENT"] },
  PLAIN_TEXT: { status: E, sources: ["HTML", "MARKDOWN", "PLAIN_TEXT", "CURRICULUM_LESSON", "PUBLIC_ARTICLE", "ARCADE_INSTRUCTIONS"] },
});

const REQUIRED_SOURCE_FIELDS = ["sourceType", "sourceId", "sourceVersion", "ownerDomain", "visibility", "language", "mimeType"];

export function createSourceContract(input = {}) {
  for (const field of REQUIRED_SOURCE_FIELDS) {
    if (input[field] === undefined || input[field] === null || input[field] === "") {
      throw new Error(`AX-3 source contract requires ${field}`);
    }
  }
  if (!SOURCE_TYPES.includes(input.sourceType)) throw new Error("AX-3 sourceType is unsupported");
  return Object.freeze({
    sourceType: input.sourceType, sourceId: String(input.sourceId), sourceVersion: String(input.sourceVersion),
    sourceHash: input.sourceHash || null, ownerDomain: String(input.ownerDomain),
    organizationId: input.organizationId || null, tenantId: input.tenantId || null,
    visibility: String(input.visibility), language: String(input.language), mimeType: String(input.mimeType),
    createdAt: input.createdAt || null, updatedAt: input.updatedAt || null,
  });
}

export function getRepresentationSupport(sourceType, representationType) {
  const entry = REPRESENTATION_SUPPORT[representationType];
  if (!entry || !SOURCE_TYPES.includes(sourceType)) return { status: "UNSUPPORTED", eligible: false };
  return { status: entry.sources.includes(sourceType) ? entry.status : "UNSUPPORTED", eligible: entry.sources.includes(sourceType) };
}

export function isAccessAtMostAsOpen(sourceVisibility, derivedVisibility) {
  const rank = { PRIVATE: 0, INTERNAL: 1, AUTHENTICATED: 2, PUBLIC: 3 };
  return rank[String(derivedVisibility).toUpperCase()] <= rank[String(sourceVisibility).toUpperCase()];
}

export function evaluateTransformation({ source, representationType, actor, provider = null } = {}) {
  const support = getRepresentationSupport(source?.sourceType, representationType);
  if (!source || !support.eligible) return { allowed: false, status: "UNSUPPORTED", reason: "SOURCE_OR_FORMAT_UNSUPPORTED" };
  if (!actor?.canAccessSource) return { allowed: false, status: "FAILED", reason: "SOURCE_ACCESS_DENIED" };
  if (support.status === X && !provider) return { allowed: false, status: "UNSUPPORTED", reason: "EXTERNAL_PROVIDER_REQUIRED" };
  if (support.status === F) return { allowed: false, status: "UNSUPPORTED", reason: "FUTURE_PHASE" };
  if (provider && actor?.canSendToProvider !== true) return { allowed: false, status: "FAILED", reason: "PROVIDER_POLICY_DENIED" };
  return { allowed: true, status: "ELIGIBLE", reason: "ELIGIBLE" };
}

export function representationReuseKey({ source, representationType, language = source?.language, transformationVersion = "ax3-v1" } = {}) {
  if (!source?.sourceId || !source?.sourceVersion || !representationType) throw new Error("AX-3 reuse key requires source identity and type");
  return [source.sourceType, source.sourceId, source.sourceVersion, representationType, language || "und", transformationVersion].join("::");
}

export function createRepresentation({ source, representationType, status = "GENERATED", validationStatus = "NOT_VALIDATED", language, mimeType, generatedBy = "AX-3", transformationVersion = "ax3-v1", accessPolicy, storageRef = null, now = new Date().toISOString() } = {}) {
  const canonicalSource = createSourceContract(source);
  if (!REPRESENTATION_TYPES.includes(representationType)) throw new Error("AX-3 representationType is unsupported");
  if (!TRANSFORMATION_STATUS.includes(status)) throw new Error("AX-3 transformation status is unsupported");
  if (!VALIDATION_STATUS.includes(validationStatus)) throw new Error("AX-3 validation status is unsupported");
  const derivedVisibility = accessPolicy?.visibility || canonicalSource.visibility;
  if (!isAccessAtMostAsOpen(canonicalSource.visibility, derivedVisibility)) throw new Error("AX-3 derived access cannot exceed source access");
  return Object.freeze({
    representationId: `ax3_${canonicalSource.sourceType.toLowerCase()}_${canonicalSource.sourceId}_${representationType.toLowerCase()}_${canonicalSource.sourceVersion}`,
    source: canonicalSource, representationType, status, language: language || canonicalSource.language,
    mimeType: mimeType || "text/plain", generatedBy, generatedAt: now, validatedAt: validationStatus === "NOT_VALIDATED" ? null : now,
    validationStatus, provenance: { sourceRef: `${canonicalSource.sourceType}:${canonicalSource.sourceId}`, sourceVersion: canonicalSource.sourceVersion, sourceHash: canonicalSource.sourceHash, transformationVersion, method: generatedBy },
    storageRef, expiresAt: null, version: transformationVersion, accessPolicy: { ...accessPolicy, visibility: derivedVisibility },
    reuseKey: representationReuseKey({ source: canonicalSource, representationType, language: language || canonicalSource.language, transformationVersion }),
  });
}

export function markSourceChanged(representation, currentSourceVersion) {
  if (!representation?.source?.sourceVersion) throw new Error("AX-3 representation source is required");
  return representation.source.sourceVersion === String(currentSourceVersion) ? representation : Object.freeze({ ...representation, status: "STALE" });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

export function projectAccessibleHtml(source = {}) {
  const title = escapeHtml(source.title || "Accessible content");
  const blocks = Array.isArray(source.blocks) ? source.blocks : [{ type: "paragraph", text: source.text || "" }];
  const body = blocks.map((block) => {
    const text = escapeHtml(block.text);
    if (block.type === "heading") return `<h2>${text}</h2>`;
    if (block.type === "list") return `<ul>${(Array.isArray(block.items) ? block.items : [block.text]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    return `<p>${text}</p>`;
  }).join("");
  return `<article aria-labelledby="ax3-content-title"><h1 id="ax3-content-title">${title}</h1>${body}</article>`;
}

export function projectPlainText(source = {}) {
  const lines = [source.title, ...(source.blocks || []).flatMap((block) => block.type === "list" ? (block.items || []) : [block.text])].filter(Boolean);
  return lines.join("\n\n");
}

export const AX3_AUTHORITY_BOUNDARIES = Object.freeze({
  sourceAuthority: "source-domain",
  transformationAuthority: "accessibility-content-engine",
  forbiddenWrites: ["Evidence", "Truth", "accommodation", "DGAL lifecycle", "signature", "assessment", "credential", "verification"],
  permissionRule: "derived access is never more open than source access",
  preferenceRule: "preference does not imply availability or fulfillment",
});
