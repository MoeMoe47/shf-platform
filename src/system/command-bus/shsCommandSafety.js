import {
  SHS_COMMAND_BUS_SAFETY_COPY,
  SHS_COMMAND_DANGEROUS_CAPABILITIES,
} from "./shsCommandTypes";

const BLOCKED_NAME_PATTERNS = [
  /delete database/i,
  /publish reports/i,
  /mark public approved/i,
  /mutate truth spine/i,
  /execute shell/i,
  /run python/i,
  /send external email/i,
  /webhook delivery/i,
  /oauth login/i,
  /bank connection/i,
  /payment processing/i,
  /api token creation/i,
];

const BLOCKED_KEY_PATTERNS = [
  /autonomous/i,
  /automatic/i,
  /recursive/i,
  /external_api/i,
  /webhook/i,
  /oauth/i,
  /credential/i,
  /secret/i,
  /token/i,
  /api_key/i,
  /bank/i,
  /plaid/i,
  /payment/i,
  /publish_report/i,
  /shf_impact/i,
  /public_approved/i,
  /production_write/i,
  /shell/i,
  /python/i,
  /delete/i,
  /network/i,
  /command_chain/i,
];

const BLOCKED_VALUE_PATTERNS = [
  /autonomous execution/i,
  /automatic execution/i,
  /recursive execution/i,
  /external api/i,
  /send webhook/i,
  /oauth/i,
  /bank connection/i,
  /plaid/i,
  /payment processing/i,
  /publish report/i,
  /mark public approved/i,
  /mutate shf impact/i,
  /production write/i,
  /execute shell/i,
  /run python/i,
  /delete file/i,
  /network execution/i,
  /bearer\s+/i,
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

export function scanCommandSafety(command = {}) {
  const issues = [];
  BLOCKED_NAME_PATTERNS.forEach((pattern) => {
    if (pattern.test(command.command_name || "")) {
      issues.push({ path: "command_name", reason: `blocked command pattern: ${pattern.source}`, severity: "critical" });
    }
  });
  if (["automatic", "autonomous", "background execution"].includes(command.execution_mode)) {
    issues.push({ path: "execution_mode", reason: "automatic and autonomous execution modes are blocked in V1", severity: "critical" });
  }
  Object.entries(SHS_COMMAND_DANGEROUS_CAPABILITIES).forEach(([flag, enabled]) => {
    if (enabled) issues.push({ path: flag, reason: "dangerous command capability enabled", severity: "critical" });
  });
  issues.push(...scanPayload(command.payload || {}));
  const critical = issues.filter((issue) => issue.severity === "critical");
  return {
    safe: critical.length === 0,
    safety_status: critical.length ? "blocked" : "allowed",
    issue_count: issues.length,
    issues,
    dangerous_capabilities: SHS_COMMAND_DANGEROUS_CAPABILITIES,
    safety_copy: SHS_COMMAND_BUS_SAFETY_COPY,
  };
}

export function createBlockedCommandExamples() {
  return [
    "Delete Database",
    "Publish Reports",
    "Mark Public Approved",
    "Mutate Truth Spine",
    "Execute Shell",
    "Run Python",
    "Send External Email",
    "Webhook Delivery",
    "OAuth Login",
    "Bank Connection",
    "Payment Processing",
    "API Token Creation",
  ];
}

export function createBlockedCommandPreview() {
  return scanCommandSafety({
    command_name: "Delete Database",
    execution_mode: "blocked",
    payload: {
      shell_request: "execute shell",
      python_request: "run python",
      webhook_delivery: true,
      payment_processing: true,
    },
  });
}
