export const METAVERSE_UNLOCK_STATES = [
  "AVAILABLE",
  "LOCKED",
  "HIDDEN",
  "RESTRICTED",
  "ASSIGNED",
  "COMPLETED_ACCESSIBLE",
  "TEMPORARILY_UNAVAILABLE",
];

export const METAVERSE_UNLOCK_PROJECTION_META = {
  canonicalSource: "MET-3 Learner Unlock Projection",
  productionApiWired: false,
  fixtureMode: "development-only deterministic fixture",
  clientMayGrantUnlock: false,
  cameraMayGrantUnlock: false,
  queryParamsMayGrantUnlock: false,
  duplicatesUnlockAuthority: false,
};

const LOCKED_NEXT_ACTION = {
  next_action_type: "START_LESSON",
  next_action_resource_id: "data-center-foundations-lesson-4",
  next_action_label: "Complete prerequisite lesson",
  route_reference: "/curriculum.html#/curriculum/learning",
};

function baseDecision(resource, decision, reasonText, nextAction = null) {
  return {
    resource_id: resource.id,
    resource_type: resource.type,
    decision,
    reason_code: decision === "AVAILABLE" ? "ORGANIZATION_POLICY" : "PREREQUISITE_MISSING",
    reason_text: reasonText,
    next_action: nextAction,
    projection_version: "MET-4_CLIENT_PROJECTION_ADAPTER",
    authority: "server-required",
  };
}

export function resolveMetaverseUiUnlock(resource, options = {}) {
  const env = import.meta.env || {};
  const fixtureEnabled = options.fixtureEnabled ?? Boolean(env.DEV || env.VITE_METAVERSE_ENABLE_DEV_UNLOCK_FIXTURE === "1");
  if (options.clientGranted || options.cameraGranted || options.queryGranted) {
    return baseDecision(resource, "RESTRICTED", "Access cannot be granted by client, camera, or URL state.");
  }
  if (!fixtureEnabled) {
    return baseDecision(resource, "RESTRICTED", "Server unlock projection is required before entry.");
  }
  if (resource.type === "DISTRICT") return baseDecision(resource, "AVAILABLE", "Available to authenticated organization learners.");
  if (resource.id === "main-data-center") return baseDecision(resource, "LOCKED", "Complete the prerequisite lesson to unlock this facility.", LOCKED_NEXT_ACTION);
  if (resource.id === "data-center-safety-simulation") return baseDecision(resource, "LOCKED", "Complete Lesson 4 and pass the safety assessment to unlock this simulation.", LOCKED_NEXT_ACTION);
  if (resource.id === "civic-council-session") return baseDecision(resource, "RESTRICTED", "This experience is limited to authorized Civic Council participants.");
  if (resource.type === "ACTIVITY") return baseDecision(resource, "AVAILABLE", "Available because the current development fixture allows this placeholder.");
  return baseDecision(resource, "AVAILABLE", "Available to authenticated organization learners.");
}

export function canEnterMetaverseResource(decision) {
  return ["AVAILABLE", "ASSIGNED", "COMPLETED_ACCESSIBLE"].includes(decision?.decision);
}

export function unlockStateLabel(decision) {
  const labels = {
    AVAILABLE: "Available",
    LOCKED: "Locked",
    HIDDEN: "Hidden",
    RESTRICTED: "Restricted",
    ASSIGNED: "Assigned",
    COMPLETED_ACCESSIBLE: "Completed, accessible",
    TEMPORARILY_UNAVAILABLE: "Temporarily unavailable",
  };
  return labels[decision] || "Unknown";
}
