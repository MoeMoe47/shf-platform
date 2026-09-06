export const SERVICE_KEYS = {
  CURRICULUM: "curriculum",
  REPORTING: "reporting",
  PROJECT_STUDIO: "project_studio",
  TRUTH_EVIDENCE: "truth_evidence",
  CAREER_WORKFORCE: "career_workforce",
} as const;

export const SERVICE_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  RETIRED: "RETIRED",
} as const;

export const ENTITLEMENT_STATUSES = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
} as const;

export const ENTITLEMENT_RESULTS = {
  ALLOWED: "ALLOWED",
  DENIED_NO_ENTITLEMENT: "DENIED_NO_ENTITLEMENT",
  DENIED_SUSPENDED: "DENIED_SUSPENDED",
  DENIED_REVOKED: "DENIED_REVOKED",
  DENIED_EXPIRED: "DENIED_EXPIRED",
  DENIED_SERVICE_INACTIVE: "DENIED_SERVICE_INACTIVE",
  DENIED_RELATIONSHIP_REQUIRED: "DENIED_RELATIONSHIP_REQUIRED",
  DENIED_AGREEMENT_REQUIRED: "DENIED_AGREEMENT_REQUIRED",
  DENIED_AGREEMENT_SUSPENDED: "DENIED_AGREEMENT_SUSPENDED",
  DENIED_AGREEMENT_TERMINATED: "DENIED_AGREEMENT_TERMINATED",
  DENIED_AGREEMENT_EXPIRED: "DENIED_AGREEMENT_EXPIRED",
} as const;

export const AGREEMENT_REQUIREMENTS = {
  NO_AGREEMENT_REQUIRED: "NO_AGREEMENT_REQUIRED",
  AGREEMENT_REQUIRED: "AGREEMENT_REQUIRED",
  OPTIONAL_AGREEMENT: "OPTIONAL_AGREEMENT",
} as const;

export type ServiceKey = typeof SERVICE_KEYS[keyof typeof SERVICE_KEYS] | string;
export type EntitlementStatus = typeof ENTITLEMENT_STATUSES[keyof typeof ENTITLEMENT_STATUSES];

export function toServiceCatalogResponse(row: any) {
  return {
    serviceId: row.service_id,
    serviceKey: row.service_key,
    name: row.name,
    description: row.description,
    category: row.category,
    status: row.status,
    providerOrganizationId: row.provider_organization_id,
    audience: row.audience,
    requiresRelationshipType: row.requires_relationship_type || null,
    agreementRequirement: row.agreement_requirement || AGREEMENT_REQUIREMENTS.NO_AGREEMENT_REQUIRED,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toEntitlementResponse(row: any) {
  return {
    entitlementId: row.entitlement_id,
    organizationId: row.organization_id,
    serviceId: row.service_id,
    serviceKey: row.service_key,
    serviceName: row.service_name || row.name,
    status: row.status,
    providerOrganizationId: row.provider_organization_id,
    grantedByUserId: row.granted_by_user_id || null,
    grantedAt: row.granted_at,
    effectiveFrom: row.effective_from,
    effectiveUntil: row.effective_until || null,
    suspendedByUserId: row.suspended_by_user_id || null,
    suspendedAt: row.suspended_at || null,
    revokedByUserId: row.revoked_by_user_id || null,
    revokedAt: row.revoked_at || null,
    reason: row.reason || null,
    sourceRelationshipId: row.source_relationship_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadataVersion: row.metadata_version,
  };
}
