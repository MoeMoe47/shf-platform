import { randomUUID } from "node:crypto";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import {
  assuranceScope,
  GOVERNMENT_ASSURANCE_CODES,
  requireScope,
  toPublicRow,
  type AssuranceActor,
} from "../model/government-assurance.js";
import { GovernmentAssuranceRepo } from "../repo/government-assurance-repo.js";

function normalizeActor(actor: any): AssuranceActor {
  return {
    userId: String(actor?.userId || actor?.user_id || actor?.id || ""),
    organizationId: String(actor?.organizationId || actor?.organization_id || actor?.active_organization_id || ""),
    tenantId: String(actor?.tenantId || actor?.tenant_id || ""),
    permissions: actor?.permissions || [],
    actor_type: actor?.actor_type || actor?.actorType || "user",
    source: actor?.source,
  };
}

function permission(actor: AssuranceActor, value: string) {
  if (!hasPermission(actor.permissions || [], value)) throw new Error(GOVERNMENT_ASSURANCE_CODES.PERMISSION_REQUIRED);
}

function dateOrNow(value: any) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error("GOVERNMENT_ASSURANCE_INVALID_DATE");
  return date;
}

export class GovernmentAssuranceService {
  constructor(private repo = new GovernmentAssuranceRepo()) {}

  private context(actorInput: any) {
    const actor = normalizeActor(actorInput);
    const scope = assuranceScope(actor);
    return { actor, scope };
  }

  async listClaims(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_VIEW);
    return (await this.repo.listClaims(scope)).map(toPublicRow);
  }

  async createClaim(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_MANAGE); requireScope(input, scope);
    if (!String(input.claimantReference || input.claimant_reference || "").trim() || !String(input.claimType || input.claim_type || "").trim() || input.assertedValue === undefined || !String(input.assertedUnit || input.asserted_unit || "").trim()) throw new Error("GOVERNMENT_ASSURANCE_CLAIM_FIELDS_REQUIRED");
    const row = await this.repo.createClaim({
      claim_id: String(input.claimId || input.claim_id || `gpa_claim_${randomUUID()}`), organization_id: scope.organizationId, tenant_id: scope.tenantId,
      claimant_reference: String(input.claimantReference || input.claimant_reference), program_reference: input.programReference || input.program_reference || null,
      claim_type: String(input.claimType || input.claim_type), subject_type: input.subjectType || input.subject_type || "UNSPECIFIED", subject_reference: input.subjectReference || input.subject_reference || "UNSPECIFIED", metric_reference: input.metricReference || input.metric_reference || null, asserted_population: input.assertedPopulation || input.asserted_population || {}, reporting_period_start: input.reportingPeriodStart || input.reporting_period_start || null,
      reporting_period_end: input.reportingPeriodEnd || input.reporting_period_end || null, asserted_value: input.assertedValue,
      asserted_unit: String(input.assertedUnit || input.asserted_unit), status: "DRAFT", supersedes_claim_id: input.supersedesClaimId || input.supersedes_claim_id || null,
      version: Number(input.version || 1), created_by: scope.userId, metadata: input.metadata || {},
    });
    return toPublicRow(row);
  }

  async listSourceAuthorities(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_AUTHORITY_VIEW);
    return (await this.repo.listSourceAuthorities(scope)).map(toPublicRow);
  }

  async createSourceAuthority(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_AUTHORITY_MANAGE); requireScope(input, scope);
    if (!input.sourceSystemId && !input.source_system_id || !input.sourceOwnerReference && !input.source_owner_reference || !input.dataDomain && !input.data_domain || !input.recordType && !input.record_type) throw new Error("GOVERNMENT_ASSURANCE_SOURCE_AUTHORITY_FIELDS_REQUIRED");
    return toPublicRow(await this.repo.createSourceAuthority({
      source_authority_id: String(input.sourceAuthorityId || input.source_authority_id || `gpa_source_authority_${randomUUID()}`), organization_id: scope.organizationId, tenant_id: scope.tenantId,
      source_system_id: String(input.sourceSystemId || input.source_system_id), source_owner_reference: String(input.sourceOwnerReference || input.source_owner_reference), data_domain: String(input.dataDomain || input.data_domain), record_type: String(input.recordType || input.record_type), jurisdiction: input.jurisdiction || null, precedence: Number(input.precedence || 0), effective_from: dateOrNow(input.effectiveFrom || input.effective_from), effective_to: input.effectiveTo || input.effective_to || null, status: input.status || "DRAFT", conflict_policy_reference: input.conflictPolicyReference || input.conflict_policy_reference || null, created_by: scope.userId, metadata: input.metadata || {},
    }));
  }

  async listMetrics(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_METRIC_VIEW);
    return (await this.repo.listMetrics(scope)).map(toPublicRow);
  }

  async createMetric(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_METRIC_MANAGE); requireScope(input, scope);
    if (!input.metricId && !input.metric_id || !input.canonicalName && !input.canonical_name || !input.definition || !input.unitValueType && !input.unit_value_type || !input.authorityOwnerReference && !input.authority_owner_reference) throw new Error("GOVERNMENT_ASSURANCE_METRIC_FIELDS_REQUIRED");
    return toPublicRow(await this.repo.createMetric({
      metric_id: String(input.metricId || input.metric_id), version: Number(input.version || 1), organization_id: scope.organizationId, tenant_id: scope.tenantId, program_reference: input.programReference || input.program_reference || null, canonical_name: String(input.canonicalName || input.canonical_name), definition: String(input.definition), unit_value_type: String(input.unitValueType || input.unit_value_type), effective_from: dateOrNow(input.effectiveFrom || input.effective_from), effective_to: input.effectiveTo || input.effective_to || null, authority_owner_reference: String(input.authorityOwnerReference || input.authority_owner_reference), status: input.status || "DRAFT", created_by: scope.userId, metadata: input.metadata || {},
    }));
  }

  async listVerificationMethods(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_VIEW);
    return (await this.repo.listVerificationMethods(scope)).map(toPublicRow);
  }

  async createVerificationMethod(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_MANAGE); requireScope(input, scope);
    if (!input.methodId && !input.method_id || !input.methodType && !input.method_type || !input.description) throw new Error("GOVERNMENT_ASSURANCE_VERIFICATION_METHOD_FIELDS_REQUIRED");
    return toPublicRow(await this.repo.createVerificationMethod({
      method_id: String(input.methodId || input.method_id), version: Number(input.version || 1), organization_id: scope.organizationId, tenant_id: scope.tenantId, method_type: String(input.methodType || input.method_type), description: String(input.description), required_evidence_types: input.requiredEvidenceTypes || input.required_evidence_types || [], effective_from: dateOrNow(input.effectiveFrom || input.effective_from), effective_to: input.effectiveTo || input.effective_to || null, status: input.status || "DRAFT", created_by: scope.userId, eligible_claim_types: input.eligibleClaimTypes || input.eligible_claim_types || [], eligible_subject_types: input.eligibleSubjectTypes || input.eligible_subject_types || [], required_source_authority_level: input.requiredSourceAuthorityLevel || input.required_source_authority_level, minimum_evidence_count: Number(input.minimumEvidenceCount ?? input.minimum_evidence_count ?? 1), reviewer_requirements: input.reviewerRequirements || input.reviewer_requirements || {}, automation_allowed: input.automationAllowed === true || input.automation_allowed === true, human_review_required: input.humanReviewRequired !== false && input.human_review_required !== false, sampling_requirement_reference: input.samplingRequirementReference || input.sampling_requirement_reference, verification_threshold: input.verificationThreshold || input.verification_threshold || {}, owner_reference: input.ownerReference || input.owner_reference, approver_reference: input.approverReference || input.approver_reference, provenance: input.provenance || {}, metadata: input.metadata || {},
    }));
  }

  async listVerifications(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_VIEW);
    return (await this.repo.listVerifications(scope)).map(toPublicRow);
  }

  async createVerification(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_MANAGE); requireScope(input, scope);
    if (!input.subjectType && !input.subject_type || !input.subjectReference && !input.subject_reference || !input.methodId && !input.method_id || !input.verifierReference && !input.verifier_reference) throw new Error("GOVERNMENT_ASSURANCE_VERIFICATION_FIELDS_REQUIRED");
    const claimId = input.claimId || input.claim_id || null;
    if (claimId && this.repo.getClaim && !(await this.repo.getClaim(String(claimId), scope))) throw new Error(GOVERNMENT_ASSURANCE_CODES.CLAIM_NOT_FOUND);
    return toPublicRow(await this.repo.createVerification({
      verification_id: String(input.verificationId || input.verification_id || `gpa_verification_${randomUUID()}`), organization_id: scope.organizationId, tenant_id: scope.tenantId, claim_id: claimId, subject_type: String(input.subjectType || input.subject_type), subject_reference: String(input.subjectReference || input.subject_reference), method_id: String(input.methodId || input.method_id), method_version: Number(input.methodVersion || input.method_version || 1), verifier_reference: String(input.verifierReference || input.verifier_reference), status: "UNREVIEWED", result: input.result || {}, evidence_references: input.evidenceReferences || input.evidence_references || [], policy_version_reference: input.policyVersionReference || input.policy_version_reference || null, created_by: scope.userId,
    }));
  }

  async listTruthFacts(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_TRUTH_VIEW);
    return (await this.repo.listTruthFacts(scope)).map(toPublicRow);
  }

  async determineTruthFact(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_TRUTH_DETERMINE); requireScope(input, scope);
    if (["ai", "agent", "reporting", "oracle"].includes(String(actor.actor_type || "").toLowerCase())) throw new Error(GOVERNMENT_ASSURANCE_CODES.TRUTH_ACTOR_DENIED);
    if (!input.verificationId || !input.provenance || !input.factType || !input.subjectType || !input.subjectReference) throw new Error("GOVERNMENT_ASSURANCE_TRUTH_PROVENANCE_REQUIRED");
    const verification = await this.repo.getVerification(String(input.verificationId), scope);
    if (!verification || verification.status !== "PASSED") throw new Error(GOVERNMENT_ASSURANCE_CODES.TRUTH_VERIFICATION_REQUIRED);
    return toPublicRow(await this.repo.createTruthFact({
      truth_fact_id: String(input.truthFactId || input.truth_fact_id || `gpa_truth_${randomUUID()}`), organization_id: scope.organizationId, tenant_id: scope.tenantId, fact_type: String(input.factType), subject_type: String(input.subjectType), subject_reference: String(input.subjectReference), claim_id: input.claimId || input.claim_id || null, verification_id: String(input.verificationId), source_references: input.sourceReferences || input.source_references || [], fact_value: input.factValue, status: input.status || "ACCEPTED", provenance: input.provenance, supersedes_truth_fact_id: input.supersedesTruthFactId || input.supersedes_truth_fact_id || null, determined_by: scope.userId, created_by: scope.userId,
    }));
  }

  async listReconciliationCases(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_RECONCILIATION_VIEW);
    return (await this.repo.listReconciliationCases(scope)).map(toPublicRow);
  }

  async createReconciliationCase(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_RECONCILIATION_MANAGE); requireScope(input, scope);
    if (!input.subjectType && !input.subject_type || !input.subjectReference && !input.subject_reference || !input.conflictReason && !input.conflict_reason) throw new Error("GOVERNMENT_ASSURANCE_RECONCILIATION_FIELDS_REQUIRED");
    return toPublicRow(await this.repo.createReconciliationCase({
      reconciliation_case_id: String(input.reconciliationCaseId || input.reconciliation_case_id || `gpa_reconciliation_${randomUUID()}`), organization_id: scope.organizationId, tenant_id: scope.tenantId, subject_type: String(input.subjectType || input.subject_type), subject_reference: String(input.subjectReference || input.subject_reference), competing_source_references: input.competingSourceReferences || input.competing_source_references || [], competing_claim_references: input.competingClaimReferences || input.competing_claim_references || [], conflict_reason: String(input.conflictReason || input.conflict_reason), source_authority_references: input.sourceAuthorityReferences || input.source_authority_references || [], status: "OPEN", created_by: scope.userId, metadata: input.metadata || {},
    }));
  }
}
