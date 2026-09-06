export const AWARENESS_CATEGORIES = ["BLOCKER", "RISK", "DEADLINE", "APPROVAL_REQUIRED", "SECURITY_ALERT", "GOVERNANCE_ALERT", "AGENT_EXCEPTION", "DATA_QUALITY", "SERVICE_DEGRADATION", "PERFORMANCE_CHANGE", "OUTCOME_CHANGE", "FUNDING_OBLIGATION_ISSUE", "OPPORTUNITY", "FOLLOW_UP", "INFORMATIONAL"] as const;
export const AWARENESS_SEVERITIES = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const AWARENESS_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const VERIFICATION_CLASSES = ["VERIFIED_FACT", "CANONICAL_OPERATIONAL_FACT", "SECURITY_GOVERNANCE_FACT", "EXTERNAL_OBSERVATION", "DERIVED_FINDING", "RECOMMENDATION"] as const;
export const FINDING_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"] as const;

export function toFindingResponse(row: any) {
  return {
    findingId: row.finding_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    dedupeKey: row.dedupe_key,
    findingType: row.finding_type,
    category: row.category,
    severity: row.severity,
    priority: row.priority,
    title: row.title,
    summary: row.summary,
    sourceType: row.source_type,
    sourceRefs: row.source_refs || [],
    evidenceRefs: row.evidence_refs || [],
    truthRefs: row.truth_refs || [],
    metricRefs: row.metric_refs || [],
    externalSourceRefs: row.external_source_refs || [],
    confidence: row.confidence === null || row.confidence === undefined ? null : Number(row.confidence),
    verificationClass: row.verification_class,
    firstObservedAt: row.first_observed_at,
    lastObservedAt: row.last_observed_at,
    status: row.status,
    acknowledgedAt: row.acknowledged_at || null,
    resolvedAt: row.resolved_at || null,
    generatedBy: row.generated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBriefResponse(row: any) {
  return {
    briefId: row.brief_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    reportingPeriodStart: row.reporting_period_start,
    reportingPeriodEnd: row.reporting_period_end,
    generatedFor: row.generated_for,
    generatedAt: row.generated_at,
    sourceWindow: row.source_window,
    findingRefs: row.finding_refs || [],
    verifiedOutcomeRefs: row.verified_outcome_refs || [],
    agentActivityRefs: row.agent_activity_refs || [],
    externalObservationRefs: row.external_observation_refs || [],
    brief: row.brief_json,
    status: row.status,
    version: row.version,
  };
}
