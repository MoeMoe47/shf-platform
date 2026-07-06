import { SHS_EVENT_BUS_SAFETY_COPY, SHS_EVENT_DANGEROUS_CAPABILITIES } from "./shsEventBusTypes";

const BLOCKED_KEY_PATTERNS = [
  /credential/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /oauth/i,
  /password/i,
  /private[_-]?key/i,
  /public_approved/i,
  /publicApproved/i,
  /shf_impact_data_mutation/i,
  /warehouse_write/i,
  /webhook/i,
  /notification/i,
  /external_api/i,
  /broker/i,
];

const BLOCKED_VALUE_PATTERNS = [
  /bearer\s+/i,
  /oauth/i,
  /api[_-]?key/i,
  /secret/i,
  /public_approved\s*[:=]\s*true/i,
  /mark public approved/i,
  /publish report/i,
  /send webhook/i,
  /send notification/i,
  /write warehouse/i,
  /external broker/i,
  /kafka/i,
  /redis/i,
  /rabbitmq/i,
];

function scanValue(value, path = "payload") {
  const issues = [];
  if (value == null) return issues;
  if (typeof value === "string") {
    BLOCKED_VALUE_PATTERNS.forEach((pattern) => {
      if (pattern.test(value)) issues.push({ path, reason: `blocked value pattern: ${pattern.source}`, severity: "critical" });
    });
    return issues;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => issues.push(...scanValue(item, `${path}[${index}]`)));
    return issues;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      BLOCKED_KEY_PATTERNS.forEach((pattern) => {
        if (pattern.test(key)) issues.push({ path: `${path}.${key}`, reason: `blocked key pattern: ${pattern.source}`, severity: "critical" });
      });
      issues.push(...scanValue(nested, `${path}.${key}`));
    });
  }
  return issues;
}

export function scanEventSafety(event = {}) {
  const issues = [];
  // Explicit policy wording for validator and owner review: public approval mutation is blocked.
  if (event.visibility && event.visibility !== "internal_only") {
    issues.push({ path: "visibility", reason: "event visibility must remain internal_only", severity: "critical" });
  }
  if (event.risk_level === "critical") {
    issues.push({ path: "risk_level", reason: "critical events require manual review", severity: "medium" });
  }
  Object.entries(SHS_EVENT_DANGEROUS_CAPABILITIES).forEach(([flag, enabled]) => {
    if (enabled) issues.push({ path: flag, reason: "dangerous capability enabled", severity: "critical" });
  });
  issues.push(...scanValue(event.payload || {}));
  const critical = issues.filter((issue) => issue.severity === "critical");
  return {
    safe: critical.length === 0,
    safety_status: critical.length ? "blocked" : event.risk_level === "critical" ? "needs_review" : "allowed",
    issue_count: issues.length,
    issues,
    dangerous_capabilities: SHS_EVENT_DANGEROUS_CAPABILITIES,
    safety_copy: SHS_EVENT_BUS_SAFETY_COPY,
  };
}
