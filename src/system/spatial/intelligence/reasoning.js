import {
  FRESHNESS_STATES,
  createEvidenceReference,
  resolveFreshness,
  resolveTemporalContext,
} from "./index.js";
import { evaluateRelationship, RELATIONSHIP_TYPES } from "./relationships.js";

export const REASONING_CLASSES = Object.freeze({
  GEOMETRIC_FACT: "GEOMETRIC_FACT",
  PRESENTATION_DERIVATION: "PRESENTATION_DERIVATION",
});

const OPERATIONS = Object.freeze({
  RELATIONSHIP: "RELATIONSHIP",
  FRESHNESS: "FRESHNESS",
});

const PROHIBITED_CLASSES = new Set(["DOMAIN_FACT", "POLICY_DECISION"]);
const PROHIBITED_OPERATIONS = new Set([
  "PROVIDER_SERVES_COUNTY",
  "ASSIGNS_STUDENT_DISTRICT",
  "ASSIGNS_DISPATCH_UNIT",
  "AUTHORIZES_ORGANIZATION",
  "DECIDES_ELIGIBILITY",
]);

function failure(request, reason) {
  const authorityBoundary = request?.reasoningClass === REASONING_CLASSES.GEOMETRIC_FACT
    ? "GEOMETRIC_FACT_ONLY"
    : request?.reasoningClass === REASONING_CLASSES.PRESENTATION_DERIVATION
      ? "PRESENTATION_DERIVATION_ONLY"
      : undefined;
  return Object.freeze({
    ok: false,
    resultType: "SPATIAL_INTELLIGENCE",
    reasoningClass: request?.reasoningClass ?? null,
    operation: request?.operation ?? null,
    authorityBoundary,
    reason,
  });
}

function isRestricted(input) {
  return input?.visibility === "HIDDEN"
    || input?.visibility === "RESTRICTED"
    || input?.publicationState === "NOT_PUBLISHED"
    || input?.publicEligibility?.publicationState === "NOT_PUBLISHED";
}

function isUsableInput(input) {
  return Boolean(input)
    && input.eligible !== false
    && input.geometryQualified !== false
    && !isRestricted(input)
    && input.provenance
    && typeof input.provenance.sourceRecordId === "string"
    && input.provenance.sourceRecordId.length > 0;
}

function evidenceReferences(request) {
  if (!Array.isArray(request?.evidenceReferences)) return Object.freeze([]);
  return Object.freeze(request.evidenceReferences.map((reference) => createEvidenceReference(reference)));
}

function temporalContext(request) {
  const sourceTemporal = request?.temporalContext && typeof request.temporalContext === "object"
    ? request.temporalContext
    : request;
  return resolveTemporalContext({
    observedAt: sourceTemporal?.observedAt,
    effectiveFrom: sourceTemporal?.effectiveFrom,
    effectiveTo: sourceTemporal?.effectiveTo,
    retrievedAt: sourceTemporal?.retrievedAt,
    supersededAt: sourceTemporal?.supersededAt,
    projectedAt: request?.projectedAt ?? sourceTemporal?.projectedAt,
  }, request?.projectedAt ?? sourceTemporal?.projectedAt);
}

function freshnessState(request) {
  const sourceFreshness = request?.freshnessInput && typeof request.freshnessInput === "object"
    ? request.freshnessInput
    : request;
  const explicitState = request?.freshnessState;
  if (Object.values(FRESHNESS_STATES).includes(explicitState)) return explicitState;
  const resolved = resolveFreshness({
    ...sourceFreshness,
    freshness: sourceFreshness?.freshness,
  }, {
    now: request?.now ?? request?.projectedAt ?? null,
    maxSourceAgeMs: request?.maxSourceAgeMs,
    freshnessPolicy: request?.freshnessPolicy,
  });
  return resolved.state;
}

function derivation(method, version) {
  return Object.freeze({
    method,
    methodVersion: version,
    deterministic: true,
    tolerance: null,
    transformAuthority: null,
  });
}

function relationshipResult(request) {
  if (request.reasoningClass !== REASONING_CLASSES.GEOMETRIC_FACT) {
    return failure(request, "RELATIONSHIP_REQUIRES_GEOMETRIC_FACT");
  }
  if (!isUsableInput(request.left) || !isUsableInput(request.right)) return failure(request, "INELIGIBLE_OR_RESTRICTED_INPUT");

  const topology = evaluateRelationship(request.left, request.right, request.relationship);
  if (!topology.ok) return failure(request, topology.reason);

  const temporal = temporalContext(request);
  if (!temporal.ok) return failure(request, temporal.error);

  return Object.freeze({
    ok: true,
    resultType: "SPATIAL_INTELLIGENCE",
    reasoningClass: REASONING_CLASSES.GEOMETRIC_FACT,
    operation: OPERATIONS.RELATIONSHIP,
    relationship: topology.relationship,
    value: topology.value,
    coordinateSpace: topology.coordinateSpace,
    inputReferences: topology.inputReferences,
    evidenceReferences: evidenceReferences(request),
    temporalContext: temporal,
    freshnessState: freshnessState(request),
    derivation: derivation("wave7c-relationship-delegation", "wave7d-v1"),
    limitations: Object.freeze(["geometric fact only", "no domain or policy inference"]),
    authorityBoundary: "GEOMETRIC_FACT_ONLY",
    diagnostics: Object.freeze([]),
  });
}

function freshnessResult(request) {
  if (request.reasoningClass !== REASONING_CLASSES.PRESENTATION_DERIVATION) {
    return failure(request, "FRESHNESS_REQUIRES_PRESENTATION_DERIVATION");
  }
  const temporal = temporalContext(request);
  if (!temporal.ok) return failure(request, temporal.error);
  return Object.freeze({
    ok: true,
    resultType: "SPATIAL_INTELLIGENCE",
    reasoningClass: REASONING_CLASSES.PRESENTATION_DERIVATION,
    operation: OPERATIONS.FRESHNESS,
    coordinateSpace: request.coordinateSpace ?? request.coordinateSpaceId ?? null,
    inputReferences: Object.freeze({}),
    evidenceReferences: evidenceReferences(request),
    temporalContext: temporal,
    freshnessState: freshnessState(request),
    derivation: derivation("wave7b-freshness-resolution", "wave7d-v1"),
    limitations: Object.freeze(["presentation derivation only", "does not establish source truth"]),
    authorityBoundary: "PRESENTATION_DERIVATION_ONLY",
    diagnostics: Object.freeze([]),
  });
}

export function evaluateSpatialIntelligence(request = {}) {
  if (PROHIBITED_CLASSES.has(request.reasoningClass)) return failure(request, "PROHIBITED_AUTHORITY_CLASS");
  if (PROHIBITED_OPERATIONS.has(request.operation)) return failure(request, "PROHIBITED_AUTHORITY_OPERATION");
  if (!Object.values(REASONING_CLASSES).includes(request.reasoningClass)) return failure(request, "UNKNOWN_REASONING_CLASS");
  if (!Object.values(OPERATIONS).includes(request.operation)) return failure(request, "UNSUPPORTED_OPERATION");
  if (request.reasoningClass === REASONING_CLASSES.GEOMETRIC_FACT && request.operation === OPERATIONS.RELATIONSHIP) {
    return relationshipResult(request);
  }
  if (request.reasoningClass === REASONING_CLASSES.PRESENTATION_DERIVATION && request.operation === OPERATIONS.FRESHNESS) {
    return freshnessResult(request);
  }
  return failure(request, "REASONING_CLASS_OPERATION_MISMATCH");
}

function safeEvidenceSummary(references) {
  if (!Array.isArray(references)) return Object.freeze([]);
  return Object.freeze(references.map((reference) => {
    const summary = {};
    for (const field of ["sourceAuthority", "sourceRecordId"]) {
      if (reference?.[field] !== null && reference?.[field] !== undefined) summary[field] = reference[field];
    }
    return Object.freeze(summary);
  }));
}

export function sanitizeIntelligenceResult(result = {}) {
  if (result.visibility === "HIDDEN" || result.visibility === "RESTRICTED") {
    return Object.freeze({ kind: "SPATIAL_INTELLIGENCE", status: "RESTRICTED" });
  }
  if (result.publicationState === "NOT_PUBLISHED") {
    return Object.freeze({ kind: "SPATIAL_INTELLIGENCE", status: "SUPPRESSED" });
  }

  return Object.freeze({
    kind: "SPATIAL_INTELLIGENCE",
    status: result.ok === false ? "FAILED" : "OK",
    resultType: result.resultType,
    reasoningClass: result.reasoningClass,
    operation: result.operation,
    relationship: result.relationship,
    value: result.value,
    coordinateSpace: result.coordinateSpace,
    inputReferences: result.inputReferences,
    freshnessState: result.freshnessState,
    temporalSummary: result.temporalContext ? Object.freeze({ projectedAt: result.temporalContext.projectedAt ?? null }) : undefined,
    evidenceSummary: safeEvidenceSummary(result.evidenceReferences),
    derivation: result.derivation ? Object.freeze({ deterministic: result.derivation.deterministic, methodVersion: result.derivation.methodVersion }) : undefined,
    limitations: result.limitations,
    diagnostics: Object.freeze([]),
  });
}

export function semanticResult(result = {}) {
  const copy = JSON.parse(JSON.stringify(result));
  if (copy.temporalContext) delete copy.temporalContext.projectedAt;
  return copy;
}
