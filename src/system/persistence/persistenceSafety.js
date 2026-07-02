import {
  PERSISTENCE_DANGEROUS_FLAGS,
  SHS_PERSISTENCE_SAFETY_COPY,
} from "./persistenceTypes";

const BLOCKED_KEY_PATTERNS = [
  /credential/i,
  /api[_-]?key/i,
  /oauth/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /private[_-]?key/i,
  /secret/i,
  /password/i,
  /bank/i,
  /account[_-]?secret/i,
  /public_approved/i,
  /publicApproved/i,
  /safe_for_public/i,
  /shf_impact_data/i,
  /shfImpactData/i,
];

const BLOCKED_STRING_PATTERNS = [
  /BEGIN PRIVATE KEY/i,
  /oauth[_-]?token/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /api[_-]?key/i,
  /bank[_-]?password/i,
  /markPublicApproved/i,
  /mutateShfImpactData/i,
];

function walkPayload(value, path = "record", findings = []) {
  if (value === null || value === undefined) return findings;

  if (typeof value === "string") {
    BLOCKED_STRING_PATTERNS.forEach((pattern) => {
      if (pattern.test(value)) findings.push({ path, reason: `blocked_string:${pattern.source}` });
    });
    return findings;
  }

  if (typeof value !== "object") return findings;

  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`;
    BLOCKED_KEY_PATTERNS.forEach((pattern) => {
      if (pattern.test(key)) findings.push({ path: childPath, reason: `blocked_key:${pattern.source}` });
    });
    walkPayload(child, childPath, findings);
  });

  return findings;
}

export function scanPersistencePayload(payload) {
  const findings = walkPayload(payload);
  return {
    safe: findings.length === 0,
    findings,
    dangerous_flags: { ...PERSISTENCE_DANGEROUS_FLAGS },
    safety_copy: SHS_PERSISTENCE_SAFETY_COPY,
  };
}

export function assertPersistenceSafe(payload) {
  const result = scanPersistencePayload(payload);
  if (!result.safe) {
    const error = new Error("Persistence safety scanner blocked unsafe payload.");
    error.safety_result = result;
    throw error;
  }
  return result;
}

export function summarizePersistenceSafety(payloads = []) {
  const scans = payloads.map((payload) => scanPersistencePayload(payload));
  const blocked = scans.flatMap((scan) => scan.findings);
  return {
    status: blocked.length ? "blocked" : "pass",
    scanned_count: scans.length,
    blocked_count: blocked.length,
    findings: blocked,
    safety_copy: SHS_PERSISTENCE_SAFETY_COPY,
    dangerous_flags: { ...PERSISTENCE_DANGEROUS_FLAGS },
  };
}

