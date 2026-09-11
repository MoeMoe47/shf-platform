import { createHash } from "node:crypto";

/**
 * Bounded Wave 1 orchestration. Each dependency remains the authority for its
 * own record; this service only carries the proof-loop correlation and checks
 * the handoff preconditions between authorities.
 */
export type AssuranceProofLoopDependencies = {
  funding: { createReference(actor: any, input: any): Promise<any>; link(actor: any, input: any): Promise<any> };
  assurance: { createSourceAuthority(actor: any, input: any): Promise<any>; createClaim(actor: any, input: any): Promise<any> };
  claims: { linkEvidence(actor: any, claimId: string, input: any): Promise<any>; submitClaim(actor: any, claimId: string): Promise<any> };
  verification: { createVerification(actor: any, input: any): Promise<any>; startVerification(actor: any, id: string): Promise<any>; determineVerification(actor: any, id: string, input: any): Promise<any> };
  metrics: { calculate(actor: any, input: any): Promise<any>; determineTruth(actor: any, input: any): Promise<any> };
  oversight: { createPlan(actor: any, input: any): Promise<any>; createActivity(actor: any, input: any): Promise<any>; createFinding(actor: any, input: any): Promise<any>; createAction(actor: any, input: any): Promise<any>; retest(actor: any, input: any): Promise<any>; createDecision(actor: any, input: any): Promise<any>; createAudit(actor: any, input: any): Promise<any>; createWorkpaper(actor: any, input: any): Promise<any> };
  publicReport: (actor: any, input: any) => Promise<any>;
};

export type AssuranceProofLoopInput = {
  actor: any;
  caseReference: string;
  source: any;
  funding: any;
  programReference: string;
  providerReference: string;
  serviceReference: string;
  claim: any;
  evidence: any;
  verification: any;
  metric: any;
  warning: any;
  finding: any;
  correctiveAction: any;
  decision: any;
  audit: any;
  publicReport: any;
};

function required(value: unknown, name: string) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`GPA_PROOF_LOOP_${name}_REQUIRED`);
  return text;
}

function provenance(input: any, caseReference: string) {
  const value = input?.provenance || input?.provenanceReference;
  if (!value) throw new Error("GPA_PROOF_LOOP_PROVENANCE_REQUIRED");
  return typeof value === "string" ? { reference: value, caseReference } : { ...value, caseReference };
}

export class AssuranceProofLoopService {
  constructor(private readonly deps: AssuranceProofLoopDependencies) {}

  async execute(input: AssuranceProofLoopInput) {
    const actor = input.actor;
    const caseReference = required(input.caseReference, "CASE_REFERENCE");
    const scope = { organizationId: actor.organizationId || actor.organization_id, tenantId: actor.tenantId || actor.tenant_id };
    required(scope.organizationId, "ORGANIZATION_SCOPE");
    required(scope.tenantId, "TENANT_SCOPE");

    const source = await this.deps.assurance.createSourceAuthority(actor, {
      ...input.source,
      metadata: { ...(input.source.metadata || {}), caseReference },
      provenance: provenance(input.source, caseReference),
    });
    const funding = await this.deps.funding.createReference(actor, {
      ...input.funding,
      provenanceReference: input.funding.provenanceReference || `source:${source.sourceAuthorityId || source.source_authority_id}`,
      sourceSystemId: input.funding.sourceSystemId || input.source.sourceSystemId,
      sourceRecordId: input.funding.sourceRecordId || input.source.sourceRecordId,
    });
    const fundingProgram = await this.deps.funding.link(actor, {
      fromType: input.funding.canonicalRecordType || "AWARD",
      fromReference: input.funding.canonicalRecordId,
      toType: "PROGRAM",
      toReference: input.programReference,
      relationshipType: "AWARDS",
      provenanceReference: `case:${caseReference}`,
      sourceSystemId: input.source.sourceSystemId,
      sourceRecordId: `${input.source.sourceRecordId}:program`,
    });

    const claim = await this.deps.assurance.createClaim(actor, {
      ...input.claim,
      programReference: input.programReference,
      providerReference: input.providerReference,
      serviceReference: input.serviceReference,
      metadata: { ...(input.claim.metadata || {}), caseReference, fundingReference: funding.funding_reference_id || funding.fundingReferenceId },
    });
    const claimId = claim.claimId || claim.claim_id;
    await this.deps.claims.linkEvidence(actor, claimId, { ...input.evidence, provenance: provenance(input.evidence, caseReference), organizationId: scope.organizationId, tenantId: scope.tenantId });
    await this.deps.claims.submitClaim(actor, claimId);

    const verification = await this.deps.verification.createVerification(actor, {
      ...input.verification,
      claimId,
      subjectReference: input.serviceReference,
      evidenceReferences: [input.evidence.evidenceId || input.evidence.evidence_id],
      provenance: provenance(input.verification, caseReference),
    });
    const verificationId = verification.verificationId || verification.verification_id;
    await this.deps.verification.startVerification(actor, verificationId);
    const verified = await this.deps.verification.determineVerification(actor, verificationId, { ...input.verification, reviewerReference: input.verification.reviewerReference, admissibleEvidenceIds: [input.evidence.evidenceId || input.evidence.evidence_id], auditGrade: true });
    if (verified.status !== "PASSED") throw new Error("GPA_PROOF_LOOP_VERIFICATION_REQUIRED");

    const metricResult = await this.deps.metrics.calculate(actor, {
      ...input.metric,
      programReference: input.programReference,
      providerReference: input.providerReference,
      inputs: [{ value: input.metric.value, claimId, verificationId, evidenceReferences: [input.evidence.evidenceId || input.evidence.evidence_id], verificationLevel: verified.achieved_level, provenanceReference: input.evidence.provenanceReference || input.evidence.provenance?.reference, sourceAuthorityReference: source.sourceAuthorityId || source.source_authority_id }],
    });
    const truth = await this.deps.metrics.determineTruth(actor, { ...input.metric, metricResultId: metricResult.metric_result_id || metricResult.metricResultId, factType: "VERIFIED_SERVICE_DELIVERY", subjectType: "SERVICE", subjectReference: input.serviceReference, reconciliationCaseId: input.metric.reconciliationCaseId, reason: `Wave 1 assurance case ${caseReference}` });

    const plan = await this.deps.oversight.createPlan(actor, { ...input.warning.plan, programReference: input.programReference, providerReference: input.providerReference, fundingReference: funding.funding_reference_id || funding.fundingReferenceId, provenance: provenance(input.warning, caseReference) });
    const warning = await this.deps.oversight.createActivity(actor, { ...input.warning, activityId: input.warning.warningId, monitoringPlanId: plan.monitoring_plan_id || plan.monitoringPlanId, activityType: "ASSURANCE_WARNING", exceptions: [{ warningId: input.warning.warningId, rule: input.warning.rule, threshold: input.warning.threshold }], result: { status: "OPEN", metricResultReference: metricResult.metric_result_id || metricResult.metricResultId }, provenance: provenance(input.warning, caseReference) });
    const finding = await this.deps.oversight.createFinding(actor, { ...input.finding, monitoringReference: warning.activity_id || warning.activityId, programReference: input.programReference, providerReference: input.providerReference, verificationReferences: [verificationId], evidenceReferences: [input.evidence.evidenceId || input.evidence.evidence_id], provenance: provenance(input.finding, caseReference) });
    const findingId = finding.finding_id || finding.findingId;
    const action = await this.deps.oversight.createAction(actor, { ...input.correctiveAction, findingId, programReference: input.programReference, providerReference: input.providerReference, provenance: provenance(input.correctiveAction, caseReference) });
    const actionId = action.corrective_action_id || action.correctiveActionId;
    const completed = await this.deps.oversight.retest(actor, { correctiveActionId: actionId, evidenceReferences: [input.evidence.evidenceId || input.evidence.evidence_id], result: "PASS" });
    const decision = await this.deps.oversight.createDecision(actor, { ...input.decision, subjectType: "CORRECTIVE_ACTION", subjectReference: actionId, factsConsidered: [truth.truth_fact_id || truth.truthFactId], metricsConsidered: [metricResult.metric_result_id || metricResult.metricResultId], evidenceConsidered: [input.evidence.evidenceId || input.evidence.evidence_id], provenance: provenance(input.decision, caseReference) });
    const audit = await this.deps.oversight.createAudit(actor, { ...input.audit, programReference: input.programReference, providerReference: input.providerReference, provenance: provenance(input.audit, caseReference) });
    await this.deps.oversight.createWorkpaper(actor, { auditEngagementId: audit.audit_engagement_id || audit.auditEngagementId, auditStep: "ASSURANCE_PROOF_LOOP", evidenceReferences: [input.evidence.evidenceId || input.evidence.evidence_id], procedures: ["source-to-public-projection lineage review"], conclusion: "Bounded assurance case completed", provenance: { caseReference, truth: truth.truth_fact_id || truth.truthFactId, metric: metricResult.metric_result_id || metricResult.metricResultId, finding: findingId, correctiveAction: actionId, decision: decision.decision_id || decision.decisionId } });
    const publicReport = await this.deps.publicReport(actor, { ...input.publicReport, caseReference, truthReference: truth.truth_fact_id || truth.truthFactId, metricResultReference: metricResult.metric_result_id || metricResult.metricResultId });

    return { caseReference, source, funding, fundingProgram, claim, verification: verified, truth, metricResult, warning, finding, correctiveAction: completed, decision, audit, publicReport, digest: createHash("sha256").update(JSON.stringify({ caseReference, claimId, verificationId, truth: truth.truth_fact_id || truth.truthFactId })).digest("hex") };
  }
}
