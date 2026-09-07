export const CLAIM_STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "SUPERSEDED"] as const;
export const SOURCE_AUTHORITY_STATUSES = ["DRAFT", "ACTIVE", "SUSPENDED", "RETIRED"] as const;
export const METRIC_STATUSES = ["DRAFT", "ACTIVE", "DEPRECATED", "RETIRED"] as const;
export const VERIFICATION_METHOD_STATUSES = ["DRAFT", "ACTIVE", "RETIRED"] as const;
export const VERIFICATION_STATUSES = ["UNREVIEWED", "IN_REVIEW", "PASSED", "FAILED", "INCONCLUSIVE", "SUPERSEDED"] as const;
export const TRUTH_STATUSES = ["CANDIDATE", "ACCEPTED", "DISPUTED", "RETRACTED", "SUPERSEDED"] as const;
export const RECONCILIATION_STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED", "UNRESOLVED", "SUPERSEDED"] as const;

export type AssuranceScope = { organizationId: string; tenantId: string; userId: string };
export type AssuranceActor = AssuranceScope & { permissions?: string[]; actor_type?: string; source?: string };

export const GOVERNMENT_ASSURANCE_CODES = {
  ORG_CONTEXT_REQUIRED: "GOVERNMENT_ASSURANCE_ORG_CONTEXT_REQUIRED",
  PERMISSION_REQUIRED: "GOVERNMENT_ASSURANCE_PERMISSION_REQUIRED",
  SCOPE_MISMATCH: "GOVERNMENT_ASSURANCE_SCOPE_MISMATCH",
  TRUTH_ACTOR_DENIED: "GOVERNMENT_ASSURANCE_TRUTH_ACTOR_DENIED",
  TRUTH_VERIFICATION_REQUIRED: "GOVERNMENT_ASSURANCE_TRUTH_VERIFICATION_REQUIRED",
  CLAIM_NOT_FOUND: "GOVERNMENT_ASSURANCE_CLAIM_NOT_FOUND",
  SOURCE_AUTHORITY_NOT_FOUND: "GOVERNMENT_ASSURANCE_SOURCE_AUTHORITY_NOT_FOUND",
  METRIC_NOT_FOUND: "GOVERNMENT_ASSURANCE_METRIC_NOT_FOUND",
  VERIFICATION_METHOD_NOT_FOUND: "GOVERNMENT_ASSURANCE_VERIFICATION_METHOD_NOT_FOUND",
} as const;

export function assuranceScope(actor: AssuranceActor): AssuranceScope {
  const userId = String(actor.userId || "").trim();
  const organizationId = String(actor.organizationId || "").trim();
  const tenantId = String(actor.tenantId || "").trim();
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) {
    throw new Error(GOVERNMENT_ASSURANCE_CODES.ORG_CONTEXT_REQUIRED);
  }
  return { userId, organizationId, tenantId };
}

export function requireScope(input: any, scope: AssuranceScope) {
  const organizationId = String(input.organizationId || input.organization_id || scope.organizationId);
  const tenantId = String(input.tenantId || input.tenant_id || scope.tenantId);
  if (organizationId !== scope.organizationId || tenantId !== scope.tenantId) {
    throw new Error(GOVERNMENT_ASSURANCE_CODES.SCOPE_MISMATCH);
  }
  return { organizationId, tenantId };
}

export function toPublicRow(row: any) {
  if (!row) return null;
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()), value,
  ]));
}
