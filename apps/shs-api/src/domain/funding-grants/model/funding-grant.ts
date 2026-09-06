export const GRANT_STATUSES = ["AWARDED", "ACTIVE", "SUSPENDED", "CLOSED", "CANCELLED"] as const;
export const GRANT_RESTRICTION_TYPES = [
  "UNRESTRICTED",
  "PROGRAM_RESTRICTED",
  "PURPOSE_RESTRICTED",
  "TIME_RESTRICTED",
  "GEOGRAPHY_RESTRICTED",
  "POPULATION_RESTRICTED",
  "OTHER",
] as const;

export type GrantStatus = typeof GRANT_STATUSES[number];
export type GrantRestrictionType = typeof GRANT_RESTRICTION_TYPES[number];

export class FundingGrantError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "FundingGrantError";
  }
}

export function toGrantResponse(row: any) {
  if (!row) return null;
  const awardAmount = String(row.award_amount ?? row.awardAmount ?? "0.00");
  const allocatedAmount = String(row.allocated_amount ?? row.allocatedAmount ?? "0.00");
  const remainingAmount = String(row.remaining_amount ?? row.remainingAmount ?? awardAmount);
  return {
    grantId: row.grant_id || row.grantId,
    grantNumber: row.grant_number || row.grantNumber || null,
    externalReference: row.external_reference || row.externalReference || null,
    title: row.title,
    funderOrganizationId: row.funder_organization_id || row.funderOrganizationId,
    recipientOrganizationId: row.recipient_organization_id || row.recipientOrganizationId,
    reportingOrganizationId: row.reporting_organization_id || row.reportingOrganizationId,
    status: row.status,
    awardAmount,
    allocatedAmount,
    remainingAmount,
    currency: row.currency,
    startDate: row.start_date || row.startDate,
    endDate: row.end_date || row.endDate || null,
    purpose: row.purpose || null,
    restrictionType: row.restriction_type || row.restrictionType,
    restrictedProgramId: row.restricted_program_id || row.restrictedProgramId || null,
    createdByUserId: row.created_by_user_id || row.createdByUserId || null,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    metadataVersion: Number(row.metadata_version || row.metadataVersion || 1),
    allocations: Array.isArray(row.allocations) ? row.allocations.map(toAllocationResponse) : undefined,
  };
}

export function toAllocationResponse(row: any) {
  if (!row) return null;
  return {
    allocationId: row.allocation_id || row.allocationId,
    grantId: row.grant_id || row.grantId,
    programId: row.program_id || row.programId,
    programName: row.program_name || row.programName || null,
    allocatedAmount: String(row.allocated_amount ?? row.allocatedAmount ?? "0.00"),
    purpose: row.purpose || null,
    ownerOrganizationId: row.owner_organization_id || row.ownerOrganizationId || null,
    operatorOrganizationId: row.operator_organization_id || row.operatorOrganizationId || null,
    accountableOrganizationId: row.accountable_organization_id || row.accountableOrganizationId || null,
    createdByUserId: row.created_by_user_id || row.createdByUserId || null,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    metadataVersion: Number(row.metadata_version || row.metadataVersion || 1),
  };
}
