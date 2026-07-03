import {
  SHS_TRACKING_DANGEROUS_FLAGS,
  SHS_TRACKING_SAFETY_COPY,
} from "./shsTrackingTypes";

const BLOCKED_KEY_PATTERNS = [
  /credential/i,
  /token/i,
  /api[_-]?key/i,
  /oauth/i,
  /password/i,
  /private[_-]?key/i,
  /bank/i,
  /account/i,
  /payment/i,
  /public_approved/i,
  /publicApproved/i,
  /shf_impact/i,
  /shfImpact/i,
  /cookie/i,
  /pixel/i,
  /webhook/i,
  /notification/i,
  /warehouse/i,
];

const BLOCKED_VALUE_PATTERNS = [
  /BEGIN PRIVATE KEY/i,
  /oauth[_-]?token/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /api[_-]?key/i,
  /tracking pixel/i,
  /third[_-]?party analytics/i,
  /webhook/i,
  /warehouse write/i,
  /publish report/i,
  /mark public approved/i,
];

function scanValue(value, path = "event", findings = []) {
  if (value === null || value === undefined) return findings;
  if (typeof value === "string") {
    BLOCKED_VALUE_PATTERNS.forEach((pattern) => {
      if (pattern.test(value)) findings.push({ path, reason: `blocked_value:${pattern.source}` });
    });
    return findings;
  }
  if (typeof value !== "object") return findings;
  Object.entries(value).forEach(([key, child]) => {
    const nextPath = `${path}.${key}`;
    BLOCKED_KEY_PATTERNS.forEach((pattern) => {
      if (pattern.test(key)) findings.push({ path: nextPath, reason: `blocked_key:${pattern.source}` });
    });
    scanValue(child, nextPath, findings);
  });
  return findings;
}

export function scanTrackingEventSafety(event = {}) {
  const findings = scanValue(event);
  const blockedVisibility = event.visibility === "public_candidate_blocked" ? [] : [];
  return {
    safe: findings.length === 0 && blockedVisibility.length === 0,
    findings: [...findings, ...blockedVisibility],
    safety_status: findings.length ? "blocked" : "allowed",
    safety_copy: SHS_TRACKING_SAFETY_COPY,
    dangerous_flags: { ...SHS_TRACKING_DANGEROUS_FLAGS },
  };
}

export function stripUnsafeTrackingMetadata(metadata = {}) {
  const clean = {};
  Object.entries(metadata || {}).forEach(([key, value]) => {
    if (BLOCKED_KEY_PATTERNS.some((pattern) => pattern.test(key))) return;
    if (typeof value === "string" && BLOCKED_VALUE_PATTERNS.some((pattern) => pattern.test(value))) return;
    clean[key] = value;
  });
  return clean;
}

export function assertTrackingEventSafe(event = {}) {
  const result = scanTrackingEventSafety(event);
  if (!result.safe) {
    const error = new Error("Tracking safety scanner blocked unsafe internal event.");
    error.safety_result = result;
    throw error;
  }
  return result;
}

