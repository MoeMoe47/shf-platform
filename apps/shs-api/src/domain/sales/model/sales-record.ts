export const SALES_RELATIONSHIP_TYPES = ["BUYER", "INFLUENCER", "PARTNER", "FUNDER", "DELIVERY_SPONSOR"] as const;
export const SALES_RELATIONSHIP_STATUSES = ["PROSPECT", "ACTIVE", "DORMANT", "PARTNER", "CLOSED"] as const;
export const SALES_DISCOVERY_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETE", "STALE"] as const;
export const SALES_NEED_TYPES = ["BUSINESS", "TECHNICAL", "FUNDING", "WORKFORCE", "OPERATIONS", "OTHER"] as const;
export const SALES_NEED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const SALES_NEED_STATUSES = ["OPEN", "VALIDATED", "DEFERRED", "RESOLVED", "CLOSED"] as const;
export const SALES_OPPORTUNITY_STAGES = ["TARGET", "RELATIONSHIP", "DISCOVERY", "SOLUTION", "FUNDING", "PROPOSAL", "CONTRACT", "WON", "LOST"] as const;
export const SALES_OPPORTUNITY_STATUSES = ["OPEN", "PAUSED", "WON", "LOST", "ARCHIVED"] as const;
export const SALES_CURRENCIES = ["USD"] as const;

export type SalesRelationshipType = typeof SALES_RELATIONSHIP_TYPES[number];
export type SalesRelationshipStatus = typeof SALES_RELATIONSHIP_STATUSES[number];
export type SalesDiscoveryStatus = typeof SALES_DISCOVERY_STATUSES[number];
export type SalesNeedType = typeof SALES_NEED_TYPES[number];
export type SalesNeedPriority = typeof SALES_NEED_PRIORITIES[number];
export type SalesNeedStatus = typeof SALES_NEED_STATUSES[number];
export type SalesOpportunityStage = typeof SALES_OPPORTUNITY_STAGES[number];
export type SalesOpportunityStatus = typeof SALES_OPPORTUNITY_STATUSES[number];

export function toSalesRelationshipResponse(row: any) {
  if (!row) return null;
  return {
    id: row.relationship_id,
    relationshipId: row.relationship_id,
    tenantId: row.tenant_id,
    organizationId: row.organization_id,
    accountOrganizationId: row.account_organization_id,
    relationshipType: row.relationship_type,
    relationshipStatus: row.relationship_status,
    ownerUserId: row.owner_user_id || null,
    source: row.source || null,
    notes: row.notes || null,
    createdBy: row.created_by_user_id || null,
    updatedBy: row.updated_by_user_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null,
    version: row.version,
  };
}

export function toSalesDiscoveryRecordResponse(row: any) {
  if (!row) return null;
  return {
    id: row.discovery_record_id,
    discoveryRecordId: row.discovery_record_id,
    tenantId: row.tenant_id,
    organizationId: row.organization_id,
    accountOrganizationId: row.account_organization_id,
    relationshipId: row.relationship_id || null,
    discoveryStatus: row.discovery_status,
    businessGoals: row.business_goals || [],
    painPoints: row.pain_points || [],
    currentProcesses: row.current_processes || [],
    constraints: row.constraints || [],
    timeline: row.timeline || null,
    budgetContext: row.budget_context || null,
    decisionProcess: row.decision_process || null,
    stakeholderContext: row.stakeholder_context || null,
    notes: row.notes || null,
    createdBy: row.created_by_user_id || null,
    updatedBy: row.updated_by_user_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null,
    version: row.version,
  };
}

export function toSalesNeedResponse(row: any) {
  if (!row) return null;
  return {
    id: row.need_id,
    needId: row.need_id,
    tenantId: row.tenant_id,
    organizationId: row.organization_id,
    accountOrganizationId: row.account_organization_id,
    discoveryRecordId: row.discovery_record_id || null,
    needType: row.need_type,
    title: row.title,
    description: row.description || null,
    priority: row.priority,
    status: row.status,
    source: row.source || null,
    createdBy: row.created_by_user_id || null,
    updatedBy: row.updated_by_user_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null,
    version: row.version,
  };
}

export function toSalesOpportunityResponse(row: any) {
  if (!row) return null;
  return {
    id: row.opportunity_id,
    opportunityId: row.opportunity_id,
    tenantId: row.tenant_id,
    organizationId: row.organization_id,
    accountOrganizationId: row.account_organization_id,
    relationshipId: row.relationship_id || null,
    discoveryRecordId: row.discovery_record_id || null,
    stage: row.stage,
    status: row.status,
    name: row.name,
    estimatedValue: row.estimated_value === null || row.estimated_value === undefined ? null : Number(row.estimated_value),
    currency: row.currency,
    targetCloseDate: row.target_close_date || null,
    ownerUserId: row.owner_user_id || null,
    primaryNeedIds: row.primary_need_ids || [],
    employerIncentiveAssessmentIds: row.employer_incentive_assessment_ids || [],
    createdBy: row.created_by_user_id || null,
    updatedBy: row.updated_by_user_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at || null,
    archivedAt: row.archived_at || null,
    version: row.version,
    transitionDecision: row.transition_decision || null,
  };
}
