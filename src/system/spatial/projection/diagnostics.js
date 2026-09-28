const definition = (stage, severity, safeForClient, blocking, resultStatus, message) =>
  Object.freeze({ stage, severity, safeForClient, blocking, resultStatus, message });

export const PROJECTION_DIAGNOSTIC_CATALOG = Object.freeze({
  ADAPTER_NOT_FOUND: definition("REGISTRY", "ERROR", false, true, "INVALID", "No projection adapter is registered for this record."),
  ADAPTER_COLLISION: definition("REGISTRY", "ERROR", false, true, null, "Projection adapter registration collides with an existing adapter."),
  INVALID_ADAPTER: definition("REGISTRY", "ERROR", false, true, null, "Projection adapter definition is invalid."),
  INVALID_SOURCE_AUTHORITY: definition("ADAPTER", "ERROR", false, true, "INVALID", "Source authority is invalid."),
  INVALID_FEATURE: definition("VALIDATION", "ERROR", false, true, "INVALID", "Projected feature is invalid."),
  INVALID_PROVENANCE: definition("VALIDATION", "ERROR", false, true, "INVALID", "Projected provenance is invalid."),
  UNKNOWN_COORDINATE_SPACE: definition("VALIDATION", "ERROR", false, true, "INVALID", "Coordinate space is unknown."),
  COORDINATE_FAMILY_MISMATCH: definition("VALIDATION", "ERROR", false, true, "INVALID", "Coordinate family does not match the coordinate space."),
  INVALID_LAYER: definition("LAYER", "ERROR", false, true, "INVALID", "Spatial layer is invalid or unavailable."),
  INVALID_DOMAIN_STATE: definition("VALIDATION", "ERROR", false, true, "INVALID", "Domain supplied an invalid spatial state."),
  INVALID_TEMPORAL_SOURCE: definition("VALIDATION", "WARNING", false, false, null, "Temporal source data is invalid or incomplete."),
  NOT_PUBLISHED: definition("ELIGIBILITY", "INFO", false, true, "SUPPRESSED", "Feature is not published."),
  RESTRICTED: definition("ELIGIBILITY", "INFO", true, true, "RESTRICTED", "Feature is restricted for this viewer."),
  FEATURE_NOT_AVAILABLE: definition("ELIGIBILITY", "INFO", true, true, null, "Feature is not available."),
  STALE_SOURCE: definition("FRESHNESS", "WARNING", true, "PER_STALE_POLICY", ["STALE", "SUPPRESSED", "UNAVAILABLE"], "Source data is stale."),
  EMERGENCY_AUTHORITY_NOT_CONFIRMED: definition("STATE_RESOLUTION", "WARNING", false, false, null, "Emergency authority is not confirmed."),
  EVENT_SOON_THRESHOLD_NOT_CONFIGURED: definition("STATE_RESOLUTION", "INFO", false, false, null, "EVENT_SOON threshold is not configured."),
});

export const PROJECTION_DIAGNOSTIC_DETAIL_KEYS = Object.freeze([
  "expectedCoordinateFamily",
  "field",
  "issueCode",
  "maskMode",
  "receivedCoordinateFamily",
  "stalePolicy",
]);

export function createProjectionDiagnostic(code, details) {
  const row = PROJECTION_DIAGNOSTIC_CATALOG[code];
  if (!row) throw new Error(`Unknown projection diagnostic code: ${code}`);
  const diagnostic = { code, ...row, blocking: row.blocking === "PER_STALE_POLICY" ? true : row.blocking };
  delete diagnostic.resultStatus;
  if (details) {
    const safeDetails = {};
    for (const key of PROJECTION_DIAGNOSTIC_DETAIL_KEYS) {
      if (Object.prototype.hasOwnProperty.call(details, key)) safeDetails[key] = details[key];
    }
    if (Object.keys(safeDetails).length > 0) diagnostic.details = Object.freeze(safeDetails);
  }
  return Object.freeze(diagnostic);
}

export function clientDiagnostic(diagnostic) {
  const row = PROJECTION_DIAGNOSTIC_CATALOG[diagnostic?.code];
  if (!row?.safeForClient) return null;
  return Object.freeze({ code: diagnostic.code, message: row.message });
}
