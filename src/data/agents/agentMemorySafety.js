export const AGENT_MEMORY_REQUIRED_DEFAULTS = Object.freeze({
  visibility: "internal_only",
  safe_for_public: false,
  public_approved: false,
  shf_impact_data_mutated: false,
  production_action_executed: false,
});

export const AGENT_MEMORY_BLOCKED_PATTERNS = Object.freeze([
  { key: "secret_like_text", pattern: /\b(secret|private[_-]?key|access[_-]?token|bearer\s+[a-z0-9._-]+)\b/i },
  { key: "api_key_like_text", pattern: /\b(api[_-]?key|sk-[a-z0-9_-]{12,})\b/i },
  { key: "password_like_text", pattern: /\b(password|passwd|pwd)\s*[:=]/i },
  { key: "raw_ssn_like_text", pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { key: "claims_public_approval", pattern: /\b(public[_ -]?approved|mark[_ -]?public[_ -]?approved|public approval granted)\b/i },
  { key: "claims_shf_public_publishing", pattern: /\b(publish(ed)?\s+to\s+shf|shf\s+public\s+impact|public\s+impact\s+publishing)\b/i },
  { key: "claims_production_execution", pattern: /\b(executed?\s+production|production\s+action\s+executed|run\s+executor|autonomous\s+execution)\b/i },
  { key: "claims_safe_for_public", pattern: /\bsafe[_ -]?for[_ -]?public\s*[:=]?\s*true\b/i },
]);

function textForScan(record = {}) {
  return [
    record.title,
    record.summary,
    record.operator_note,
    record.source_ref,
    ...(Array.isArray(record.tags) ? record.tags : []),
  ].join(" ");
}

export function buildAgentMemoryAuditEvent(eventType, message, actor = "shs_operator") {
  const createdAt = new Date().toISOString();
  const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    event_id: `memevt_${suffix}`,
    event_type: eventType,
    actor,
    message,
    created_at: createdAt,
  };
}

export function scanAgentMemorySafety(record = {}) {
  const scannedText = textForScan(record);
  const blockedItems = AGENT_MEMORY_BLOCKED_PATTERNS
    .filter((rule) => rule.pattern.test(scannedText))
    .map((rule) => rule.key);

  if (record.safe_for_public === true) blockedItems.push("safe_for_public_not_allowed_v1");
  if (record.public_approved === true) blockedItems.push("public_approved_not_allowed_v1");
  if (record.shf_impact_data_mutated === true) blockedItems.push("shf_impact_data_mutation_not_allowed_v1");
  if (record.production_action_executed === true) blockedItems.push("production_execution_not_allowed_v1");
  if (record.visibility && record.visibility !== "internal_only") blockedItems.push("visibility_not_internal_only");

  const containsSecret = blockedItems.some((item) => item.includes("secret") || item.includes("api_key") || item.includes("password"));
  const containsPii = blockedItems.includes("raw_ssn_like_text");
  const needsReview = blockedItems.length > 0 || record.sensitivity === "high";

  return {
    blocked_items: [...new Set(blockedItems)],
    contains_secret: containsSecret,
    contains_pii: containsPii,
    safe_for_public: false,
    public_approved: false,
    shf_impact_data_mutated: false,
    production_action_executed: false,
    recommended_status: needsReview ? "needs_review" : record.status || "active",
    risk_summary: needsReview
      ? "Operator review required before this memory is used in context."
      : "No deterministic V1 safety flags detected.",
  };
}

export function applyAgentMemorySafetyDefaults(record = {}) {
  const scan = scanAgentMemorySafety(record);
  return {
    ...record,
    ...AGENT_MEMORY_REQUIRED_DEFAULTS,
    status: scan.recommended_status,
    contains_pii: scan.contains_pii,
    contains_secret: scan.contains_secret,
    safety_flags: scan.blocked_items,
    updated_at: record.updated_at || new Date().toISOString(),
  };
}

export function isMemorySafeForTaskContext(record = {}) {
  const scan = scanAgentMemorySafety(record);
  return scan.blocked_items.length === 0 && record.status !== "archived";
}
