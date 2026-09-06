export const SERVICE_AGREEMENT_STATUSES = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  TERMINATED: "TERMINATED",
  EXPIRED: "EXPIRED",
} as const;

export type ServiceAgreementStatus = typeof SERVICE_AGREEMENT_STATUSES[keyof typeof SERVICE_AGREEMENT_STATUSES];

export function toServiceAgreementResponse(row: any) {
  return {
    agreementId: row.agreement_id,
    providerOrganizationId: row.provider_organization_id,
    consumerOrganizationId: row.consumer_organization_id,
    serviceId: row.service_id,
    serviceKey: row.service_key,
    serviceName: row.service_name || row.name,
    sourceRelationshipId: row.source_relationship_id || null,
    sourceEntitlementId: row.source_entitlement_id || null,
    status: row.status,
    effectiveFrom: row.effective_from,
    effectiveUntil: row.effective_until || null,
    serviceScope: row.service_scope,
    supportLevel: row.support_level,
    serviceExpectations: row.service_expectations || {},
    agreementReference: row.agreement_reference || null,
    currentVersion: row.current_version,
    createdByUserId: row.created_by_user_id || null,
    approvedByUserId: row.approved_by_user_id || null,
    approvedAt: row.approved_at || null,
    activatedByUserId: row.activated_by_user_id || null,
    activatedAt: row.activated_at || null,
    suspendedByUserId: row.suspended_by_user_id || null,
    suspendedAt: row.suspended_at || null,
    terminatedByUserId: row.terminated_by_user_id || null,
    terminatedAt: row.terminated_at || null,
    terminationReason: row.termination_reason || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadataVersion: row.metadata_version,
  };
}

export function toServiceAgreementVersionResponse(row: any) {
  return {
    agreementVersionId: row.agreement_version_id,
    agreementId: row.agreement_id,
    versionNumber: row.version_number,
    serviceScope: row.service_scope,
    supportLevel: row.support_level,
    serviceExpectations: row.service_expectations || {},
    agreementReference: row.agreement_reference || null,
    changeReason: row.change_reason || null,
    createdByUserId: row.created_by_user_id || null,
    createdAt: row.created_at,
  };
}
