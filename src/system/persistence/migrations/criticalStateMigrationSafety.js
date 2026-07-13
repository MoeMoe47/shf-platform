import { scanPersistencePayload } from "../persistenceSafety";

const UNSAFE_KEYS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /api[_-]?key/i,
  /^apiKey$/i,
  /(^|_)token$/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /oauth/i,
  /private[_-]?key/i,
  /seed[_-]?phrase/i,
  /banking[_ -]?credential/i,
  /bank[_ -]?account[_ -]?credential/i,
  /payment[_ -]?credential/i,
  /public[_ -]?approved[_ -]?mutation/i,
  /shf[_ -]?impact[_ -]?mutation/i,
  /auth[_ -]?mutation/i,
  /shell[_ -]?command/i,
  /python[_ -]?execution/i,
  /webhook[_ -]?delivery/i,
  /external[_ -]?api[_ -]?credential/i,
];

const UNSAFE_VALUES = [
  /BEGIN PRIVATE KEY/i,
  /access[_-]?token\s*[:=]/i,
  /refresh[_-]?token\s*[:=]/i,
  /api[_-]?key\s*[:=]/i,
  /password\s*[:=]/i,
  /mark public approved/i,
  /mutate SHF Impact/i,
  /execute shell/i,
  /run python/i,
  /send webhook/i,
  /external api credential/i,
];

function scanValue(value, path = "record", findings = []) {
  if (value == null) return findings;
  if (typeof value === "string") {
    UNSAFE_VALUES.forEach((pattern) => {
      if (pattern.test(value)) findings.push({ path, reason: `unsafe_value:${pattern.source}` });
    });
    return findings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanValue(item, `${path}[${index}]`, findings));
    return findings;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      UNSAFE_KEYS.forEach((pattern) => {
        if (pattern.test(key)) findings.push({ path: `${path}.${key}`, reason: `unsafe_key:${pattern.source}` });
      });
      scanValue(nested, `${path}.${key}`, findings);
    });
  }
  return findings;
}

export function scanCriticalStateRecord(record = {}) {
  const persistenceScan = scanPersistencePayload(record);
  const migrationFindings = scanValue(record);
  const findings = [...(persistenceScan.findings || []), ...migrationFindings];
  return {
    safe: findings.length === 0,
    unsafe_field_count: findings.length,
    findings,
    persistence_scan: persistenceScan,
  };
}

export function sanitizeCriticalStateRecord(record = {}) {
  const scan = scanCriticalStateRecord(record);
  return {
    record: scan.safe ? record : null,
    blocked: !scan.safe,
    safety_result: scan,
  };
}

export function scanCriticalStateRecords(records = []) {
  const results = records.map((record) => scanCriticalStateRecord(record));
  const findings = results.flatMap((result) => result.findings);
  return {
    safe: findings.length === 0,
    unsafe_field_count: findings.length,
    blocked_count: results.filter((result) => !result.safe).length,
    findings,
  };
}
