import { randomUUID } from "node:crypto";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { assuranceScope, requireScope, type AssuranceActor } from "../model/government-assurance.js";
import {
  ADMISSIBILITY_DECISIONS, GPA_VERIFICATION_CODES, maxAchievableLevel, levelRank,
} from "../model/claim-verification.js";
import { ClaimVerificationRepo } from "../repo/claim-verification-repo.js";
import { SourceScopeService } from "./source-scope-service.js";

function actor(input: any): AssuranceActor {
  return {
    userId: String(input?.userId || input?.user_id || input?.id || ""),
    organizationId: String(input?.organizationId || input?.organization_id || input?.active_organization_id || ""),
    tenantId: String(input?.tenantId || input?.tenant_id || ""),
    permissions: input?.permissions || [], actor_type: input?.actor_type || input?.actorType || "user", source: input?.source,
  };
}
function permission(a: AssuranceActor, p: string) { if (!hasPermission(a.permissions || [], p)) throw new Error("GPA_PERMISSION_REQUIRED"); }
function scope(a: AssuranceActor) { return assuranceScope(a); }
function value(input: any, camel: string, snake = camel) { return input?.[camel] ?? input?.[snake]; }
function date(valueInput: any) { const d = valueInput ? new Date(valueInput) : new Date(); if (Number.isNaN(d.getTime())) throw new Error("GPA_INVALID_DATE"); return d; }

export type AccessEvaluator = (actor: any, input: any) => Promise<any>;

export class ClaimVerificationService {
  constructor(
    private repo = new ClaimVerificationRepo(),
    private sourceScope = new SourceScopeService(),
    private auditWriter: typeof writeAuditEvent | null = writeAuditEvent,
    private accessEvaluator?: AccessEvaluator,
  ) {}

  private context(input: any) { const a = actor(input); return { actor: a, scope: scope(a) }; }
  private async audit(a: AssuranceActor, s: any, targetType: string, targetId: string, action: string, previous: any, next: any, reason?: string) {
    if (!this.auditWriter) return;
    await this.auditWriter({ audit_event_id: `gpa_audit_${randomUUID()}`, organization_id: s.organizationId, actor_user_id: a.userId, target_object_type: targetType, target_object_id: targetId, action_type: action, previous_state_json: previous, new_state_json: next, reason_code: reason || null, correlation_id: `gpa_corr_${randomUUID()}`, source_channel: "government_assurance" });
  }

  async getClaim(actorInput: any, claimId: string) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_VIEW);
    return this.repo.getClaim(claimId, s);
  }

  async getVerification(actorInput: any, verificationId: string) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_VIEW);
    return this.repo.getVerification(verificationId, s);
  }

  async submitClaim(actorInput: any, claimId: string) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_SUBMIT);
    const claim = await this.repo.getClaim(claimId, s); if (!claim) throw new Error(GPA_VERIFICATION_CODES.CLAIM_NOT_FOUND);
    if (!["DRAFT", "EVIDENCE_INCOMPLETE", "UNDER_REVIEW"].includes(claim.status)) throw new Error(GPA_VERIFICATION_CODES.CLAIM_STATE_INVALID);
    const result = await this.repo.updateClaimLifecycle(claimId, s, "SUBMITTED", new Date(), null);
    await this.audit(a, s, "GPA_CLAIM", claimId, "SUBMITTED", claim, result);
    return result;
  }

  async withdrawClaim(actorInput: any, claimId: string) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_MANAGE);
    const claim = await this.repo.getClaim(claimId, s); if (!claim) throw new Error(GPA_VERIFICATION_CODES.CLAIM_NOT_FOUND);
    const result = await this.repo.updateClaimLifecycle(claimId, s, "WITHDRAWN", null, new Date());
    await this.audit(a, s, "GPA_CLAIM", claimId, "WITHDRAWN", claim, result);
    return result;
  }

  async supersedeClaim(actorInput: any, claimId: string, input: any) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_MANAGE); requireScope(input, s);
    const claim = await this.repo.getClaim(claimId, s); if (!claim) throw new Error(GPA_VERIFICATION_CODES.CLAIM_NOT_FOUND);
    const replacement = await this.repo.createClaim({ claim_id: String(value(input, "claimId", "claim_id") || `gpa_claim_${randomUUID()}`), organization_id: s.organizationId, tenant_id: s.tenantId, claimant_reference: claim.claimant_reference, program_reference: claim.program_reference, claim_type: claim.claim_type, subject_type: claim.subject_type, subject_reference: claim.subject_reference, metric_reference: claim.metric_reference, reporting_period_start: claim.reporting_period_start, reporting_period_end: claim.reporting_period_end, asserted_value: input.assertedValue ?? claim.asserted_value, asserted_population: input.assertedPopulation ?? claim.asserted_population, asserted_unit: input.assertedUnit || claim.asserted_unit, supersedes_claim_id: claimId, version: Number(claim.version || 1) + 1, created_by: s.userId, metadata: input.metadata || claim.metadata });
    const superseded = await this.repo.updateClaimLifecycle(claimId, s, "SUPERSEDED", null, null); await this.audit(a, s, "GPA_CLAIM", claimId, "SUPERSEDED", claim, superseded); return replacement;
  }

  async linkEvidence(actorInput: any, claimId: string, input: any) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_EVIDENCE_LINK); requireScope(input, s);
    const claim = await this.repo.getClaim(claimId, s); if (!claim) throw new Error(GPA_VERIFICATION_CODES.CLAIM_NOT_FOUND);
    if (["WITHDRAWN", "SUPERSEDED", "REJECTED"].includes(claim.status)) throw new Error(GPA_VERIFICATION_CODES.CLAIM_STATE_INVALID);
    const evidenceId = String(value(input, "evidenceId", "evidence_id") || ""); if (!evidenceId) throw new Error(GPA_VERIFICATION_CODES.EVIDENCE_REQUIRED);
    let access: any = null;
    if (input.sourceSystemId || input.source_system_id) {
      const evaluate = this.accessEvaluator || ((aa: any, ii: any) => this.sourceScope.evaluateAccess(aa, ii));
      access = await evaluate(a, {
        sourceSystemId: String(value(input, "sourceSystemId", "source_system_id")), purposeId: "CLAIM_VERIFICATION", actionClass: "READ", action: "evidence.read",
        dataDomain: String(value(input, "dataDomain", "data_domain") || "evidence"), recordType: String(value(input, "recordType", "record_type") || "evidence"),
        requestedFields: input.requestedFields || input.requested_fields || [], requestedClassification: input.classification || input.requestedClassification,
        programReference: claim.program_reference, jurisdictionId: input.jurisdictionId || input.jurisdiction_id,
        agentAuthority: input.agentAuthority,
      });
    }
    const reasons: string[] = [];
    if (access && !access.allowed) reasons.push(access.reasonCode === "GPA_PURPOSE_DENIED" ? "PURPOSE_NOT_ALLOWED" : access.reasonCode === "GPA_CLASSIFICATION_DENIED" ? "CLASSIFICATION_DENIED" : "SOURCE_NOT_AUTHORIZED");
    if (!input.provenanceComplete && !(input.provenance || input.provenanceReference || input.provenance_reference)) reasons.push("MISSING_PROVENANCE");
    if (input.integrityVerified === false) reasons.push("INTEGRITY_UNVERIFIED");
    if (input.subjectMatches === false) reasons.push("SUBJECT_MISMATCH");
    if (input.superseded) reasons.push("SUPERSEDED");
    if (input.stale) reasons.push("STALE");
    const decision = reasons.length ? reasons[0] : "ADMISSIBLE";
    const link = await this.repo.createEvidenceLink({ claim_evidence_link_id: String(value(input, "claimEvidenceLinkId", "claim_evidence_link_id") || `gpa_claim_evidence_${randomUUID()}`), claim_id: claimId, organization_id: s.organizationId, tenant_id: s.tenantId, evidence_id: evidenceId, evidence_authority: input.evidenceAuthority || "PREPARE_PROVE_EVIDENCE", relationship_type: input.relationshipType || input.relationship_type || "SUPPORTING", evidence_role: input.evidenceRole || input.evidence_role || "SUPPORTING", requirement_reference: input.requirementReference || input.requirement_reference, submitted_by: s.userId, provenance_json: input.provenance || {} });
    const admissibility = await this.repo.createAdmissibility({ admissibility_id: `gpa_admissibility_${randomUUID()}`, claim_evidence_link_id: link.claim_evidence_link_id, organization_id: s.organizationId, tenant_id: s.tenantId, decision, reason_codes: reasons.length ? reasons : ["ADMISSIBLE"], source_authority_reference: input.sourceAuthorityReference || input.source_authority_reference, data_use_policy_reference: access?.policyId, evaluated_by: s.userId, metadata: { accessDecisionId: access?.accessDecisionId } });
    await this.repo.createCustodyEvent({ custody_event_id: `gpa_custody_${randomUUID()}`, evidence_id: evidenceId, organization_id: s.organizationId, tenant_id: s.tenantId, event_type: "ACCESSED", actor_reference: s.userId, source_reference: input.sourceRecordId || input.source_record_id, occurred_at: new Date(), content_hash: input.contentHash || input.content_hash, classification: input.classification, metadata: { claimId, admissibility: decision } });
    await this.audit(a, s, "GPA_CLAIM_EVIDENCE_LINK", link.claim_evidence_link_id, "EVIDENCE_LINKED", null, { link, admissibility });
    return { link, admissibility, access };
  }

  async getClaimEvidence(actorInput: any, claimId: string) { const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_VIEW); return this.repo.listClaimEvidence(claimId, s); }

  async readiness(actorInput: any, claimId: string, input: any = {}) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_VIEW);
    const claim = await this.repo.getClaim(claimId, s); if (!claim) throw new Error(GPA_VERIFICATION_CODES.CLAIM_NOT_FOUND);
    const links = await this.repo.listClaimEvidence(claimId, s); const blockers: string[] = [];
    if (!links.length) blockers.push("GPA_EVIDENCE_REQUIRED");
    if (links.length < Number(input.minimumEvidenceCount || 1)) blockers.push("GPA_EVIDENCE_REQUIRED");
    if (input.methodRequired && !input.methodId) blockers.push("GPA_VERIFICATION_METHOD_NOT_FOUND");
    if (input.dataQualityCriticalFailure) blockers.push("GPA_CRITICAL_DATA_QUALITY_FAILURE");
    if (input.entityResolutionStatus === "AMBIGUOUS" || input.entityResolutionStatus === "UNRESOLVED") blockers.push("GPA_ENTITY_MATCH_AMBIGUOUS");
    if (input.duplicateConfirmed) blockers.push("GPA_DUPLICATE_INPUT_INVALID");
    if (input.reconciliationUnresolved) blockers.push("GPA_RECONCILIATION_UNRESOLVED");
    return { claimId, ready: blockers.length === 0, blockers, evidenceCount: links.length, status: blockers.length ? "EVIDENCE_INCOMPLETE" : "READY_FOR_VERIFICATION" };
  }

  async requestVerification(actorInput: any, input: any) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_REQUEST); requireScope(input, s);
    const claimId = String(value(input, "claimId", "claim_id") || ""); const claim = await this.repo.getClaim(claimId, s); if (!claim) throw new Error(GPA_VERIFICATION_CODES.CLAIM_NOT_FOUND);
    const methodId = String(value(input, "methodId", "method_id") || ""); const methodVersion = Number(value(input, "methodVersion", "method_version") || 1); const method = await this.repo.getMethod(methodId, methodVersion, s);
    if (!method) throw new Error(GPA_VERIFICATION_CODES.METHOD_NOT_FOUND);
    const now = new Date(); if (method.status !== "ACTIVE") throw new Error(GPA_VERIFICATION_CODES.METHOD_INACTIVE); if (new Date(method.effective_from) > now || (method.effective_to && new Date(method.effective_to) <= now)) throw new Error(GPA_VERIFICATION_CODES.METHOD_EXPIRED);
    if (Array.isArray(method.eligible_claim_types) && method.eligible_claim_types.length && !method.eligible_claim_types.includes(claim.claim_type)) throw new Error(GPA_VERIFICATION_CODES.METHOD_INELIGIBLE);
    if (Array.isArray(method.eligible_subject_types) && method.eligible_subject_types.length && !method.eligible_subject_types.includes(claim.subject_type)) throw new Error(GPA_VERIFICATION_CODES.METHOD_INELIGIBLE);
    const verifier = String(value(input, "verifierReference", "verifier_reference") || a.userId); if (verifier === claim.claimant_reference) throw new Error(GPA_VERIFICATION_CODES.SELF_VERIFICATION_DENIED);
    const links = await this.repo.listClaimEvidence(claimId, s); if (links.length < Number(method.minimum_evidence_count || 1)) throw new Error(GPA_VERIFICATION_CODES.EVIDENCE_REQUIRED);
    const result = await this.repo.createVerification({ verification_id: String(value(input, "verificationId", "verification_id") || `gpa_verification_${randomUUID()}`), organization_id: s.organizationId, tenant_id: s.tenantId, claim_id: claimId, subject_type: claim.subject_type || "UNSPECIFIED", subject_reference: claim.subject_reference || claimId, method_id: methodId, method_version: methodVersion, verifier_reference: verifier, evidence_references: links.map((l: any) => l.evidence_id), policy_version_reference: input.policyVersionReference || input.policy_version_reference, created_by: s.userId, requested_level: input.requestedLevel || input.requested_level || "V2", verification_mode: input.verificationMode || input.verification_mode || "HUMAN", source_authority_references: input.sourceAuthorityReferences || [] });
    await this.repo.createWorkItem({ work_item_id: `gpa_verification_work_${randomUUID()}`, claim_id: claimId, verification_id: result.verification_id, organization_id: s.organizationId, tenant_id: s.tenantId, assigned_verifier_reference: verifier, priority: input.priority, target_level: result.requested_level, blocker_codes: [], status: "OPEN" });
    await this.audit(a, s, "GPA_VERIFICATION", result.verification_id, "VERIFICATION_REQUESTED", null, result);
    return result;
  }

  async startVerification(actorInput: any, verificationId: string) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_PERFORM); const verification = await this.repo.getVerification(verificationId, s); if (!verification) throw new Error(GPA_VERIFICATION_CODES.METHOD_NOT_FOUND);
    const claim = verification.claim_id ? await this.repo.getClaim(verification.claim_id, s) : null; if (claim && String(verification.verifier_reference) === String(claim.claimant_reference)) throw new Error(GPA_VERIFICATION_CODES.SELF_VERIFICATION_DENIED);
    const result = await this.repo.updateVerification(verificationId, s, { status: "IN_PROGRESS", started_at: new Date() }); await this.audit(a, s, "GPA_VERIFICATION", verificationId, "VERIFICATION_STARTED", verification, result); return result;
  }

  async addContradiction(actorInput: any, verificationId: string, input: any) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_PERFORM); const verification = await this.repo.getVerification(verificationId, s); if (!verification) throw new Error(GPA_VERIFICATION_CODES.METHOD_NOT_FOUND);
    const result = await this.repo.createContradiction({ contradiction_id: `gpa_contradiction_${randomUUID()}`, verification_id: verificationId, organization_id: s.organizationId, tenant_id: s.tenantId, contradiction_type: input.contradictionType || "SOURCE_CONFLICT", left_reference: input.leftReference, right_reference: input.rightReference, severity: input.severity || "HIGH", materiality: input.materiality || "BLOCKING", reconciliation_case_id: input.reconciliationCaseId, created_by: s.userId, metadata: input.metadata || {} });
    await this.audit(a, s, "GPA_VERIFICATION", verificationId, "CONTRADICTION_ADDED", null, result, GPA_VERIFICATION_CODES.CONTRADICTION_BLOCKING); return result;
  }

  async determineVerification(actorInput: any, verificationId: string, input: any = {}) {
    const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_REVIEW); const verification = await this.repo.getVerification(verificationId, s); if (!verification) throw new Error(GPA_VERIFICATION_CODES.METHOD_NOT_FOUND);
    const method = await this.repo.getMethod(verification.method_id, verification.method_version, s); if (!method || method.status !== "ACTIVE") throw new Error(GPA_VERIFICATION_CODES.METHOD_INACTIVE);
    const claim = verification.claim_id ? await this.repo.getClaim(verification.claim_id, s) : null; if (claim && String(verification.verifier_reference) === String(claim.claimant_reference)) throw new Error(GPA_VERIFICATION_CODES.SELF_VERIFICATION_DENIED);
    if (method.human_review_required && !input.reviewerReference && !input.reviewer_reference) throw new Error(GPA_VERIFICATION_CODES.REVIEW_REQUIRED);
    if (method.human_review_required && String(input.reviewerReference || input.reviewer_reference) === String(verification.verifier_reference)) throw new Error(GPA_VERIFICATION_CODES.SELF_VERIFICATION_DENIED);
    const contradictions = await this.repo.listContradictions(verificationId, s); if (contradictions.some((item: any) => item.status === "OPEN" && item.materiality === "BLOCKING")) throw new Error(GPA_VERIFICATION_CODES.CONTRADICTION_BLOCKING);
    const links = verification.claim_id ? await this.repo.listClaimEvidence(verification.claim_id, s) : [];
    const admissible = links.filter((l: any) => input.admissibleEvidenceIds?.includes(l.evidence_id) || input.admissibleEvidenceIds === undefined);
    const achieved = maxAchievableLevel({ evidenceCount: links.length, admissibleCount: admissible.length, corroboratingCount: links.filter((l: any) => l.relationship_type === "CORROBORATING").length, authoritativeCount: input.authoritativeEvidence ? 1 : 0, auditGrade: Boolean(input.auditGrade) });
    const requested = verification.requested_level || "V0"; const partial = levelRank(achieved) < levelRank(requested); const status = partial ? "PARTIAL" : "PASSED";
    const result = await this.repo.updateVerification(verificationId, s, { status, completed_at: new Date(), achieved_level: achieved, reviewer_reference: input.reviewerReference || input.reviewer_reference, reviewer_decision: input.reviewerDecision || input.reviewer_decision || status, determination_rationale: input.rationale || `Achieved ${achieved}; requested ${requested}.`, confidence: input.confidence, result: { truthPromotion: false, requestedLevel: requested, achievedLevel: achieved, evidenceCount: admissible.length } });
    if (claim && result.status === "PASSED") await this.repo.updateClaimLifecycle(claim.claim_id, s, "VERIFIED", null, null);
    if (claim && result.status === "PARTIAL") await this.repo.updateClaimLifecycle(claim.claim_id, s, "PARTIALLY_VERIFIED", null, null);
    await this.audit(a, s, "GPA_VERIFICATION", verificationId, "VERIFICATION_DETERMINED", verification, result, partial ? GPA_VERIFICATION_CODES.LEVEL_NOT_EARNED : undefined); return result;
  }

  async listWorkQueue(actorInput: any) { const { actor: a, scope: s } = this.context(actorInput); permission(a, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_VIEW); return this.repo.listWorkQueue(s); }
}
