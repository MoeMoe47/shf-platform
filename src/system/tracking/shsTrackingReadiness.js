import { SHS_TRACKING_DANGEROUS_FLAGS } from "./shsTrackingTypes";

export function calculateTrackingReadiness({
  streams = [],
  events = [],
  entityLinks = [],
  timeline = [],
  signals = [],
  reportUseReady = true,
  safetyScannerAvailable = true,
} = {}) {
  let score = 100;
  const blockers = [];
  const warnings = [];
  const dangerousTracking = Object.values(SHS_TRACKING_DANGEROUS_FLAGS).some(Boolean);

  if (!safetyScannerAvailable) {
    score -= 25;
    blockers.push("Safety scanner missing.");
  }
  if (!streams.length) {
    score -= 20;
    blockers.push("No tracking streams configured.");
  }
  if (!entityLinks.length) {
    score -= 20;
    warnings.push("No entity links available yet.");
  }
  if (!timeline.length) {
    score -= 20;
    warnings.push("No timeline entries available yet.");
  }
  if (!signals.length) {
    score -= 15;
    warnings.push("No local signals generated yet.");
  }
  if (!reportUseReady) {
    score -= 15;
    warnings.push("Report/export readiness missing.");
  }
  if (dangerousTracking) {
    score -= 50;
    blockers.push("Dangerous tracking behavior is enabled.");
  }

  return {
    score: Math.max(0, score),
    ready: score >= 80 && !blockers.length && !dangerousTracking,
    blockers,
    warnings,
    dangerous_tracking_enabled: dangerousTracking,
    no_public_approval_mutation: !SHS_TRACKING_DANGEROUS_FLAGS.public_approved_mutation_enabled,
    no_shf_impact_mutation: !SHS_TRACKING_DANGEROUS_FLAGS.shf_impact_data_mutation_enabled,
    no_external_tracking: !SHS_TRACKING_DANGEROUS_FLAGS.external_tracking_enabled,
    no_credentials_or_secrets_persisted: !SHS_TRACKING_DANGEROUS_FLAGS.credential_capture_enabled,
  };
}

