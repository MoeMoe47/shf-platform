export const COMMAND_CENTER_SPATIAL_VIEW_ALLOWED_FIELDS = Object.freeze([
  "kind",
  "viewId",
  "label",
  "coordinateFamily",
  "coordinateSpace",
  "qualifiedClientId",
  "clientStatus",
  "layerSummaries",
  "visibleFeatureSummaries",
  "selectedFeatureSummary",
  "relationshipSummaries",
  "intelligenceSummaries",
  "evidenceSummaries",
  "temporalSummary",
  "freshnessSummary",
  "limitations",
  "authorityBoundary",
  "systemStatus",
]);

export const COMMAND_CENTER_SPATIAL_VIEW_STATE_RULES = Object.freeze({
  unknownRemainsUnknown: true,
  unavailableRemainsUnavailable: true,
  unqualifiedRemainsUnqualified: true,
  fakePopulatedValuesRequired: false,
});

function freezeArray(value) {
  return Object.freeze(Array.isArray(value) ? value.map((entry) => freezeRecord(entry)) : []);
}

function freezeRecord(value) {
  if (Array.isArray(value)) return freezeArray(value);
  if (!value || typeof value !== "object") return value;
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, freezeRecord(entry)])));
}

export function createCommandCenterSpatialView(input = {}) {
  const view = {
    kind: "CommandCenterSpatialView",
    viewId: input.viewId ?? null,
    label: input.label ?? null,
    coordinateFamily: input.coordinateFamily ?? null,
    coordinateSpace: input.coordinateSpace ?? null,
    qualifiedClientId: input.qualifiedClientId ?? null,
    clientStatus: input.clientStatus ?? "UNKNOWN",
    layerSummaries: freezeArray(input.layerSummaries),
    visibleFeatureSummaries: freezeArray(input.visibleFeatureSummaries),
    selectedFeatureSummary: freezeRecord(input.selectedFeatureSummary ?? null),
    relationshipSummaries: freezeArray(input.relationshipSummaries),
    intelligenceSummaries: freezeArray(input.intelligenceSummaries),
    evidenceSummaries: freezeArray(input.evidenceSummaries),
    temporalSummary: freezeRecord(input.temporalSummary ?? null),
    freshnessSummary: freezeRecord(input.freshnessSummary ?? null),
    limitations: freezeArray(input.limitations),
    authorityBoundary: freezeRecord(input.authorityBoundary ?? Object.freeze({
      sourceAuthority: false,
      domainAuthority: false,
      policyAuthority: false,
      navigationAuthority: false,
      publicationAuthority: false,
      authorizationAuthority: false,
      eligibilityAuthority: false,
      metricAuthority: false,
      transformAuthority: false,
    })),
    systemStatus: input.systemStatus ?? "UNKNOWN",
  };
  return Object.freeze(view);
}
