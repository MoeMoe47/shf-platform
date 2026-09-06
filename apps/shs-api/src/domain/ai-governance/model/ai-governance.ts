export const AI_GOVERNANCE_SERVICE_KEY = "ai_governance";

export const RESOURCE_CLASSIFICATIONS = ["PUBLIC", "INTERNAL", "SENSITIVE", "RESTRICTED"] as const;
export type ResourceClassification = typeof RESOURCE_CLASSIFICATIONS[number];

export const CLASSIFICATION_RANK: Record<ResourceClassification, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  SENSITIVE: 2,
  RESTRICTED: 3,
};

export const MODEL_LIFECYCLE_STATUSES = ["ACTIVE", "DEPRECATED", "BLOCKED", "RETIRED"] as const;
export const MODEL_APPROVAL_STATUSES = ["APPROVED", "BLOCKED"] as const;
export const SESSION_STATUSES = ["ACTIVE", "CLOSED", "EXPIRED", "REVOKED", "DENIED"] as const;

export const AI_AUTHORITY_DENIAL_CODES = {
  NO_DELEGATION: "NO_DELEGATION",
  DELEGATION_EXPIRED: "DELEGATION_EXPIRED",
  DELEGATION_REVOKED: "DELEGATION_REVOKED",
  DELEGATION_NOT_YET_VALID: "DELEGATION_NOT_YET_VALID",
  PRINCIPAL_MISMATCH: "PRINCIPAL_MISMATCH",
  AGENT_MISMATCH: "AGENT_MISMATCH",
  ORGANIZATION_MISMATCH: "ORGANIZATION_MISMATCH",
  TENANT_MISMATCH: "TENANT_MISMATCH",
  PURPOSE_NOT_ALLOWED: "PURPOSE_NOT_ALLOWED",
  ACTION_NOT_ALLOWED: "ACTION_NOT_ALLOWED",
  ACTION_EXPLICITLY_DENIED: "ACTION_EXPLICITLY_DENIED",
  RESOURCE_OUT_OF_SCOPE: "RESOURCE_OUT_OF_SCOPE",
  RESOURCE_CLASSIFICATION_DENIED: "RESOURCE_CLASSIFICATION_DENIED",
  MODEL_NOT_APPROVED: "MODEL_NOT_APPROVED",
  MODEL_CLASSIFICATION_DENIED: "MODEL_CLASSIFICATION_DENIED",
  MODEL_CONSTRAINT_MISMATCH: "MODEL_CONSTRAINT_MISMATCH",
  ENTITLEMENT_DENIED: "ENTITLEMENT_DENIED",
  PRINCIPAL_PERMISSION_DENIED: "PRINCIPAL_PERMISSION_DENIED",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  SESSION_CLOSED: "SESSION_CLOSED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_REVOKED: "SESSION_REVOKED",
  SESSION_MISMATCH: "SESSION_MISMATCH",
} as const;

export type AiAuthorityDenialCode =
  typeof AI_AUTHORITY_DENIAL_CODES[keyof typeof AI_AUTHORITY_DENIAL_CODES];

export function normalizeResourceScope(scope: any) {
  const resources = Array.isArray(scope?.resources) ? scope.resources : [];
  return {
    resources: resources
      .map((item: any) => ({
        resourceType: String(item?.resourceType || item?.resource_type || "").trim(),
        resourceId: String(item?.resourceId || item?.resource_id || "").trim(),
      }))
      .filter((item: any) => item.resourceType && item.resourceId),
    all: scope?.all === true,
    allowRestricted: scope?.allowRestricted === true || scope?.allow_restricted === true,
  };
}

export function resourceInScope(scope: any, resource: any) {
  const normalized = normalizeResourceScope(scope);
  if (normalized.all) return true;
  const resourceType = String(resource?.resourceType || resource?.resource_type || "").trim();
  const resourceId = String(resource?.resourceId || resource?.resource_id || "").trim();
  return normalized.resources.some((item) => item.resourceType === resourceType && item.resourceId === resourceId);
}

export function toDelegationResponse(row: any) {
  return {
    delegationId: row.delegation_id,
    principalUserId: row.principal_user_id,
    agentIdentifier: row.agent_identifier,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    purpose: row.purpose,
    resourceScope: row.resource_scope,
    allowedActions: row.allowed_actions || [],
    forbiddenActions: row.forbidden_actions || [],
    autonomyProfile: row.autonomy_profile,
    modelProviderConstraint: row.model_provider_constraint || null,
    modelIdentifierConstraint: row.model_identifier_constraint || null,
    restrictedResourceAccess: Boolean(row.restricted_resource_access),
    allowRedelegation: Boolean(row.allow_redelegation),
    validFrom: row.valid_from,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at || null,
    revokedBy: row.revoked_by || null,
    revocationReason: row.revocation_reason || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.revoked_at ? "REVOKED" : new Date(row.expires_at).getTime() <= Date.now() ? "EXPIRED" : "ACTIVE",
  };
}

export function toClassificationResponse(row: any) {
  return {
    classificationId: row.classification_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    classification: row.classification,
    classificationReason: row.classification_reason || null,
    classifiedBy: row.classified_by,
    supersededAt: row.superseded_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toModelResponse(row: any) {
  return {
    modelPolicyId: row.model_policy_id,
    organizationId: row.organization_id || null,
    tenantId: row.tenant_id || null,
    providerIdentifier: row.provider_identifier,
    modelIdentifier: row.model_identifier,
    displayName: row.display_name,
    lifecycleStatus: row.lifecycle_status,
    approvalStatus: row.approval_status,
    classificationCeiling: row.classification_ceiling,
    capabilityMetadata: row.capability_metadata || {},
    effectiveFrom: row.effective_from,
    retiresAt: row.retires_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSessionResponse(row: any) {
  return {
    sessionId: row.session_id,
    agentIdentifier: row.agent_identifier,
    actingForUserId: row.acting_for_user_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    delegationId: row.delegation_id,
    declaredPurpose: row.declared_purpose,
    autonomyProfile: row.autonomy_profile,
    modelProvider: row.model_provider || null,
    modelIdentifier: row.model_identifier || null,
    status: row.status,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    closedAt: row.closed_at || null,
    closeReason: row.close_reason || null,
    securityMetadata: row.security_metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
