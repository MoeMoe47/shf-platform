import { COMMAND_CENTER_SPATIAL_VIEW_ALLOWED_FIELDS } from "./viewModel.js";

export const COMMAND_CENTER_PRIVACY_EXCLUDED_FIELDS = Object.freeze([
  "raw source records",
  "unrestricted geometry",
  "raw provenance",
  "evidenceReferences",
  "hidden feature IDs",
  "restricted identifiers",
  "approval metadata",
  "reviewer identities",
  "authoring metadata",
  "filesystem paths",
  "internal diagnostics",
  "authentication tokens",
  "authorization objects",
  "domain authority objects",
  "policy decision objects",
  "arbitrary backend errors",
]);

export const COMMAND_CENTER_PRIVACY_POLICY = Object.freeze({
  composesExistingSanitizers: true,
  furtherRestrictsExistingSanitizers: true,
  broadensExistingSanitizers: false,
});

const BLOCKED_FIELD_NAMES = new Set([
  "rawSourceRecord",
  "rawSourceRecords",
  "geometry",
  "rawProvenance",
  "provenance",
  "evidenceReferences",
  "hiddenFeatureId",
  "hiddenFeatureIds",
  "restrictedIdentifier",
  "restrictedIdentifiers",
  "approvalMetadata",
  "reviewerIdentity",
  "reviewerIdentities",
  "authoringMetadata",
  "filesystemPath",
  "internalDiagnostics",
  "authenticationToken",
  "authorization",
  "authorizationObject",
  "domainAuthority",
  "domainAuthorityObject",
  "policyDecision",
  "policyDecisionObject",
  "backendError",
  "error",
]);

function sanitizeValue(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(sanitizeValue).filter((entry) => entry !== undefined));
  if (!value || typeof value !== "object") return value;
  const safe = {};
  for (const [key, entry] of Object.entries(value)) {
    if (BLOCKED_FIELD_NAMES.has(key)) continue;
    safe[key] = sanitizeValue(entry);
  }
  return Object.freeze(safe);
}

export function sanitizeCommandCenterSpatialView(input = {}) {
  if (input?.status === "HIDDEN" || input?.status === "RESTRICTED") {
    return Object.freeze({ kind: "CommandCenterSpatialView", clientStatus: "RESTRICTED" });
  }
  if (input?.status === "NOT_PUBLISHED") {
    return Object.freeze({ kind: "CommandCenterSpatialView", clientStatus: "SUPPRESSED" });
  }
  if (input?.status === "INVALID") {
    return Object.freeze({ kind: "CommandCenterSpatialView", clientStatus: "UNAVAILABLE" });
  }

  const safe = {};
  for (const field of COMMAND_CENTER_SPATIAL_VIEW_ALLOWED_FIELDS) {
    if (input[field] !== undefined) safe[field] = sanitizeValue(input[field]);
  }
  if (!safe.kind && input.kind === "CommandCenterSpatialView") safe.kind = "CommandCenterSpatialView";
  return Object.freeze(safe);
}
