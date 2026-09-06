export const INPUT_SECURITY_STATUSES = ["NOT_SCANNED", "SCANNING", "CLEAR", "SUSPICIOUS", "BLOCKED", "QUARANTINED", "REVIEW_REQUIRED", "SCANNER_UNAVAILABLE"] as const;
export const CONTEXT_ADMISSION_DECISIONS = ["ALLOW", "ALLOW_WITH_WARNING", "REQUIRE_REVIEW", "QUARANTINE", "BLOCK"] as const;
export const INPUT_RISK_LEVELS = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"] as const;

export const INPUT_SECURITY_FINDING_CATEGORIES = {
  DIRECT_PROMPT_INJECTION: "DIRECT_PROMPT_INJECTION",
  INDIRECT_PROMPT_INJECTION: "INDIRECT_PROMPT_INJECTION",
  SYSTEM_POLICY_OVERRIDE: "SYSTEM_POLICY_OVERRIDE",
  TOOL_USE_MANIPULATION: "TOOL_USE_MANIPULATION",
  DATA_EXFILTRATION: "DATA_EXFILTRATION",
  CROSS_AGENT_MANIPULATION: "CROSS_AGENT_MANIPULATION",
  EXTERNAL_ACTION_COERCION: "EXTERNAL_ACTION_COERCION",
  OBFUSCATION_HIDDEN_INSTRUCTION: "OBFUSCATION_HIDDEN_INSTRUCTION",
  APPROVAL_BYPASS: "APPROVAL_BYPASS",
  PRIVILEGE_ESCALATION_INSTRUCTION: "PRIVILEGE_ESCALATION_INSTRUCTION",
} as const;

export const CONTEXT_ADMISSION_CODES = {
  INPUT_NOT_SCANNED: "INPUT_NOT_SCANNED",
  SECURITY_SCANNER_UNAVAILABLE: "SECURITY_SCANNER_UNAVAILABLE",
  PROMPT_INJECTION_DETECTED: "PROMPT_INJECTION_DETECTED",
  INDIRECT_INJECTION_DETECTED: "INDIRECT_INJECTION_DETECTED",
  SYSTEM_OVERRIDE_ATTEMPT: "SYSTEM_OVERRIDE_ATTEMPT",
  TOOL_MANIPULATION_DETECTED: "TOOL_MANIPULATION_DETECTED",
  EXFILTRATION_ATTEMPT: "EXFILTRATION_ATTEMPT",
  CONTENT_QUARANTINED: "CONTENT_QUARANTINED",
  SECURITY_REVIEW_REQUIRED: "SECURITY_REVIEW_REQUIRED",
  RESOURCE_CLASSIFICATION_DENIED: "RESOURCE_CLASSIFICATION_DENIED",
  MODEL_NOT_ALLOWED_FOR_RESOURCE: "MODEL_NOT_ALLOWED_FOR_RESOURCE",
  SOURCE_PROVENANCE_MISSING: "SOURCE_PROVENANCE_MISSING",
  CONTEXT_ADMISSION_DENIED: "CONTEXT_ADMISSION_DENIED",
  CONTEXT_ADMISSION_ALLOWED: "CONTEXT_ADMISSION_ALLOWED",
} as const;

export function toScanResponse(row: any, findings: any[] = []) {
  return {
    scanId: row.scan_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    sourceKind: row.source_kind,
    sourceRef: row.source_ref || null,
    contentType: row.content_type || null,
    scannerProvider: row.scanner_provider,
    scannerVersion: row.scanner_version,
    scanStatus: row.scan_status,
    riskLevel: row.risk_level,
    findingCount: Number(row.finding_count || 0),
    decision: row.decision,
    reviewRequired: Boolean(row.review_required),
    submittedBy: row.submitted_by,
    scannedAt: row.scanned_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    findings: findings.map(toFindingResponse),
  };
}

export function toFindingResponse(row: any) {
  return {
    findingId: row.finding_id,
    scanId: row.scan_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    category: row.category,
    severity: row.severity,
    confidence: row.confidence,
    decisionCode: row.decision_code,
    excerpt: row.excerpt || null,
    startOffset: row.start_offset ?? null,
    endOffset: row.end_offset ?? null,
    createdAt: row.created_at,
  };
}

export function toAdmissionResponse(row: any) {
  return {
    admissionId: row.admission_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    scanId: row.scan_id || null,
    sessionId: row.session_id || null,
    delegationId: row.delegation_id || null,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    resourceClassification: row.resource_classification,
    intendedUse: row.intended_use,
    modelProvider: row.model_provider || null,
    modelIdentifier: row.model_identifier || null,
    admitted: Boolean(row.admitted),
    decision: row.decision,
    decisionCode: row.decision_code,
    warningCodes: row.warning_codes || [],
    securityFindingIds: row.security_finding_ids || [],
    evaluatedBy: row.evaluated_by,
    evaluatedAt: row.evaluated_at,
  };
}
