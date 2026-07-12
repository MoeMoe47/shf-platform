import { clampScore, createLayerStatus, statusFromScore } from "./shsExecutiveCommandCenterTypes";

export function normalizeExecutiveStatus(value, fallbackScore = 75) {
  const safe = String(value || "").toLowerCase();
  if (["healthy", "ready", "attention", "blocked", "degraded", "unavailable", "needs_review"].includes(safe)) {
    return safe;
  }
  return statusFromScore(fallbackScore);
}

export function normalizeLayerStatus(input = {}) {
  return createLayerStatus({
    ...input,
    readiness_score: clampScore(input.readiness_score),
    health_score: clampScore(input.health_score ?? input.readiness_score),
  });
}

export function getStatusLabel(status) {
  return {
    healthy: "Healthy",
    ready: "Ready",
    attention: "Attention",
    blocked: "Blocked",
    degraded: "Degraded",
    unavailable: "Unavailable",
    needs_review: "Needs Review",
  }[status] || "Needs Review";
}

export function getPostureLabel(posture) {
  return {
    live_local: "Live Local",
    persisted_local: "Persisted Local",
    derived_local: "Derived Local",
    sample: "Sample",
    unavailable: "Unavailable",
    needs_review: "Needs Review",
  }[posture] || "Needs Review";
}
