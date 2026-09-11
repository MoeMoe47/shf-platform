import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";

const PROVIDER_TYPES = new Set(["FOR_PROFIT", "NONPROFIT", "PUBLIC", "QUASI_PUBLIC", "GOVERNMENT_CONTRACTOR", "SUBCONTRACTOR"]);

export type ServiceClaimAssuranceInput = {
  organizationId: string;
  tenantId: string;
  provider: { reference: string; organizationType: string; active: boolean; qualified: boolean; authorized: boolean };
  service: { reference: string; authorized: boolean; periodStart: string; periodEnd: string; claimDate: string; approvedRate: number; claimedUnits: number; claimedAmount: number; currency: string };
  claim: { reference: string; status?: string; duplicate?: boolean; overlapping?: boolean };
  evidence: { required: boolean; admitted: boolean; provenanceComplete: boolean; integrityVerified: boolean; references: string[] };
  verification: { status: "PASSED" | "FAILED" | "PARTIAL" | "UNRESOLVED"; reference: string };
  reconciliation: { status: "RESOLVED" | "OPEN" | "UNRESOLVED" | "NOT_REQUIRED"; reference?: string };
  externalPayment?: { invoiceReference?: string; authorizedAmount?: number; paymentReference?: string };
  exception?: { authorized: boolean; decisionReference?: string; rationale?: string };
};

export class ServiceClaimAssuranceService {
  assess(actor: any, input: ServiceClaimAssuranceInput) {
    if (!hasPermission(actor?.permissions || [], SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_VIEW)) throw new Error("GPA_PERMISSION_REQUIRED");
    const actorOrganization = String(actor?.organizationId || actor?.organization_id || actor?.active_organization_id || "");
    const actorTenant = String(actor?.tenantId || actor?.tenant_id || "");
    if (!input.organizationId || input.organizationId !== actorOrganization || input.tenantId !== actorTenant || input.tenantId !== `tenant:${input.organizationId}`) throw new Error("GPA_SCOPE_INVALID");
    const blockers: string[] = [];
    const providerType = String(input.provider?.organizationType || "").toUpperCase();
    if (!PROVIDER_TYPES.has(providerType)) blockers.push("PROVIDER_TYPE_UNSUPPORTED");
    if (!input.provider?.active || !input.provider?.authorized || !input.provider?.qualified) blockers.push("PROVIDER_NOT_AUTHORIZED_OR_QUALIFIED");
    if (!input.service?.authorized) blockers.push("SERVICE_NOT_AUTHORIZED");
    const claimTime = new Date(input.service?.claimDate || "").getTime();
    const start = new Date(input.service?.periodStart || "").getTime();
    const end = new Date(input.service?.periodEnd || "").getTime();
    if (!Number.isFinite(claimTime) || !Number.isFinite(start) || !Number.isFinite(end) || claimTime < start || claimTime > end) blockers.push("CLAIM_OUT_OF_PERIOD");
    if (!Number.isFinite(input.service?.approvedRate) || input.service.approvedRate < 0 || input.service.claimedUnits < 0 || input.service.claimedAmount < 0) blockers.push("CLAIM_AMOUNT_INVALID");
    const expectedAmount = input.service.claimedUnits * input.service.approvedRate;
    if (Math.abs(expectedAmount - input.service.claimedAmount) > 0.005) blockers.push("CLAIM_RATE_MISMATCH");
    if (input.evidence?.required && (!input.evidence.admitted || !input.evidence.provenanceComplete || !input.evidence.integrityVerified || !input.evidence.references?.length)) blockers.push("EVIDENCE_NOT_ADMISSIBLE");
    if (input.verification?.status !== "PASSED") blockers.push(`VERIFICATION_${input.verification?.status || "UNRESOLVED"}`);
    if (input.reconciliation?.status === "OPEN" || input.reconciliation?.status === "UNRESOLVED") blockers.push("RECONCILIATION_UNRESOLVED");
    if (input.claim?.duplicate || input.claim?.overlapping) blockers.push(input.claim.duplicate ? "DUPLICATE_CLAIM" : "OVERLAPPING_CLAIM");
    const exceptionAuthorized = Boolean(input.exception?.authorized && input.exception.decisionReference && input.exception.rationale);
    const truthEligible = blockers.length === 0 || (blockers.every((x) => x === "VERIFICATION_FAILED") && exceptionAuthorized);
    const paymentEligible = truthEligible && Boolean(input.externalPayment?.invoiceReference) && Number(input.externalPayment?.authorizedAmount) === input.service.claimedAmount;
    return {
      providerType,
      claimReference: input.claim.reference,
      evidenceReferences: input.evidence.references || [],
      verificationReference: input.verification.reference,
      reconciliationReference: input.reconciliation.reference || null,
      invoiceReference: input.externalPayment?.invoiceReference || null,
      externalPaymentAuthority: "EXTERNAL_SYSTEM_OF_RECORD",
      expectedAmount,
      amount: input.service.claimedAmount,
      currency: input.service.currency,
      blockers,
      acceptedTruthEligible: truthEligible,
      payableEligible: paymentEligible,
      paymentBoundary: paymentEligible ? "EXTERNAL_AUTHORIZATION_REQUIRED" : "BLOCKED_PENDING_ASSURANCE",
      exception: exceptionAuthorized ? { authorized: true, decisionReference: input.exception?.decisionReference } : null,
      fraudDetermination: "NOT_MADE",
    };
  }
}
