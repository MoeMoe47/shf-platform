import { SHS_JOB_DANGEROUS_CAPABILITIES, SHS_JOB_SCHEDULER_SAFETY_COPY } from "./shsJobTypes";

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
  /shf_impact_data/i,
  /warehouse/i,
  /webhook/i,
  /notification/i,
  /external_worker/i,
  /cron_server/i,
];

const BLOCKED_VALUE_PATTERNS = [
  /execute production/i,
  /mutate production/i,
  /publish report/i,
  /send webhook/i,
  /send notification/i,
  /write warehouse/i,
  /external worker/i,
  /cron server/i,
  /autonomous execution/i,
  /bearer\s+/i,
  /oauth/i,
];

function scanPayload(value, path = "payload") {
  const issues = [];
  if (value == null) return issues;
  if (typeof value === "string") {
    BLOCKED_VALUE_PATTERNS.forEach((pattern) => {
      if (pattern.test(value)) issues.push({ path, reason: `blocked value pattern: ${pattern.source}`, severity: "critical" });
    });
    return issues;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => issues.push(...scanPayload(item, `${path}[${index}]`)));
    return issues;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      BLOCKED_KEY_PATTERNS.forEach((pattern) => {
        if (pattern.test(key)) issues.push({ path: `${path}.${key}`, reason: `blocked key pattern: ${pattern.source}`, severity: "critical" });
      });
      issues.push(...scanPayload(nested, `${path}.${key}`));
    });
  }
  return issues;
}

export function scanJobSafety(job = {}) {
  const issues = [];
  if (job.local_only !== true) {
    issues.push({ path: "local_only", reason: "jobs must remain local_only", severity: "critical" });
  }
  if (job.risk_level === "critical") {
    issues.push({ path: "risk_level", reason: "critical jobs require manual review", severity: "medium" });
  }
  Object.entries(SHS_JOB_DANGEROUS_CAPABILITIES).forEach(([flag, enabled]) => {
    if (enabled) issues.push({ path: flag, reason: "dangerous scheduler capability enabled", severity: "critical" });
  });
  issues.push(...scanPayload(job.payload || {}));
  const critical = issues.filter((issue) => issue.severity === "critical");
  return {
    safe: critical.length === 0,
    safety_status: critical.length ? "blocked" : job.risk_level === "critical" ? "needs_review" : "allowed",
    issue_count: issues.length,
    issues,
    dangerous_capabilities: SHS_JOB_DANGEROUS_CAPABILITIES,
    safety_copy: SHS_JOB_SCHEDULER_SAFETY_COPY,
  };
}

export function createBlockedDangerousJobPreview() {
  return scanJobSafety({
    local_only: true,
    risk_level: "high",
    payload: {
      blocked_webhook_marker: "send webhook",
      blocked_worker_marker: "external worker",
      blocked_mutation_marker: "mutate production",
    },
  });
}

