import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { ClaimVerificationRepo } from "../repo/claim-verification-repo.js";
import { GovernmentAssuranceRepo } from "../repo/government-assurance-repo.js";
import { MetricTruthService } from "../service/metric-truth-service.js";

type Scope = { organizationId: string; tenantId: string; userId: string };

function requireScope(actor: any): Scope {
  const organizationId = String(actor?.organization_id || actor?.organizationId || "").trim();
  const tenantId = String(actor?.tenant_id || actor?.tenantId || `tenant:${organizationId}`).trim();
  const userId = String(actor?.user_id || actor?.userId || actor?.id || "").trim();
  if (!organizationId || tenantId !== `tenant:${organizationId}` || !userId) throw new Error("CURRICULUM_METRIC_SCOPE_REQUIRED");
  return { organizationId, tenantId, userId };
}

/**
 * Compatibility boundary from the Curriculum verified projection into the
 * existing assurance claim/verification and MetricTruth authorities.
 * Curriculum remains the source of learner-result semantics; GPA remains the
 * authority for registered metrics and institutional truth.
 */
export class CurriculumMetricTruthAdapter {
  constructor(
    private dbQuery: typeof query = query,
    private assurance = new GovernmentAssuranceRepo(dbQuery),
    private verification = new ClaimVerificationRepo(dbQuery),
    private metricTruth = new MetricTruthService(assurance, verification, null),
  ) {}

  async calculateVerifiedLearnerMetric(actor: any, input: any) {
    const scope = requireScope(actor);
    const metricId = String(input?.metricId || input?.metric_id || "").trim();
    const metricVersion = Number(input?.metricVersion || input?.metric_version || 1);
    if (!metricId) throw new Error("CURRICULUM_METRIC_ID_REQUIRED");
    const programId = input?.programId || input?.program_id || null;
    const learnerId = input?.learnerId || input?.learner_id || null;
    const rows = await this.dbQuery(
      `SELECT f.truth_fact_id, f.learner_user_id, f.organization_id, o.tenant_id,
              o.program_id, o.cohort_id, o.course_id, o.unit_stable_key,
              o.lesson_stable_key, o.activity_id, o.assignment_id, f.evidence_id,
              f.source_record_id, f.source_type, f.provenance_json,
              o.outcome_id, o.outcome_type, o.score, o.evaluated_at,
              m.mastery_id, m.competency_id, m.mastery_status, m.verification_status
         FROM curriculum_truth_facts f
         JOIN curriculum_learner_outcomes o
           ON o.organization_id=f.organization_id AND o.tenant_id=$2
          AND o.learner_user_id=f.learner_user_id
          AND (o.source_id=f.source_record_id OR o.outcome_id=f.source_record_id)
          AND o.status='CURRENT' AND o.outcome_type IN ('PASSED','DEMONSTRATED')
         JOIN curriculum_learner_mastery m
           ON m.organization_id=f.organization_id AND m.tenant_id=$2
          AND m.learner_user_id=f.learner_user_id
          AND m.competency_id=f.competency_id
          AND m.source_outcome_id=o.outcome_id
          AND m.verification_status='VERIFIED'
          AND m.mastery_status IN ('DEMONSTRATED','MASTERED')
         WHERE f.organization_id=$1
           AND ($3::text IS NULL OR o.program_id=$3)
           AND ($4::text IS NULL OR f.learner_user_id=$4)
         ORDER BY f.occurred_at, f.truth_fact_id`,
      [scope.organizationId, scope.tenantId, programId, learnerId],
    );
    if (!rows.rows.length) throw new Error("CURRICULUM_VERIFIED_LEARNER_FACT_REQUIRED");

    const inputs = [] as any[];
    for (const row of rows.rows) {
      const claimId = `curriculum_metric_claim:${row.truth_fact_id}:${metricId}:${metricVersion}`;
      const verificationId = `curriculum_metric_verification:${row.truth_fact_id}:${metricId}:${metricVersion}`;
      const existingClaim = await this.assurance.getClaim(claimId, scope);
      if (!existingClaim) {
        await this.assurance.createClaim({
          claim_id: claimId, organization_id: scope.organizationId, tenant_id: scope.tenantId,
          claimant_reference: "curriculum-learner-result-adapter", program_reference: row.program_id,
          claim_type: "CURRICULUM_VERIFIED_LEARNER_RESULT", subject_type: "LEARNER",
          subject_reference: row.learner_user_id, metric_reference: `${metricId}:${metricVersion}`,
          asserted_value: { value: 1, outcomeId: row.outcome_id, masteryId: row.mastery_id },
          asserted_population: { learnerUserId: row.learner_user_id }, asserted_unit: "verified_learner",
          status: "VERIFIED", created_by: scope.userId,
          metadata: { sourceTruthFactId: row.truth_fact_id, sourceType: row.source_type, sourceRecordId: row.source_record_id },
        });
      }
      const existingVerification = await this.verification.getVerification(verificationId, scope);
      if (!existingVerification) {
        await this.verification.createVerification({
          verification_id: verificationId, organization_id: scope.organizationId, tenant_id: scope.tenantId,
          claim_id: claimId, subject_type: "LEARNER", subject_reference: row.learner_user_id,
          method_id: "curriculum-learner-result-verification", method_version: 1,
          verifier_reference: "curriculum-competency-decision", status: "PASSED",
          result: { sourceTruthFactId: row.truth_fact_id, masteryStatus: row.mastery_status },
          evidence_references: row.evidence_id ? [row.evidence_id] : [],
          policy_version_reference: "curriculum-learner-result.v1", created_by: scope.userId,
          requested_level: "V2", verification_mode: "HUMAN", source_authority_references: ["curriculum_truth_facts"],
          provenance: { sourceTruthFactId: row.truth_fact_id, sourceAuthority: "curriculum_truth_facts" },
        });
        await this.verification.updateVerification(verificationId, scope, {
          status: "PASSED", completed_at: new Date(), achieved_level: "V2",
          reviewer_reference: "curriculum-competency-decision", reviewer_decision: "DEMONSTRATED",
          determination_rationale: "Existing Curriculum competency decision and verified learner fact",
          provenance: { sourceTruthFactId: row.truth_fact_id, sourceAuthority: "curriculum_truth_facts" },
        });
      }
      inputs.push({
        claimId, verificationId, value: 1, verificationLevel: "V2",
        provenanceReference: `curriculum-truth:${row.truth_fact_id}`,
        sourceAuthorityReference: "curriculum_truth_facts",
        evidenceReferences: row.evidence_id ? [row.evidence_id] : [],
        organizationId: scope.organizationId, tenantId: scope.tenantId,
      });
    }

    const existing = await this.dbQuery(
      `SELECT * FROM gpa_metric_results
        WHERE organization_id=$1 AND tenant_id=$2 AND metric_id=$3 AND metric_version=$4
          AND COALESCE(program_reference,'')=COALESCE($5,'')
          AND input_references=$6::jsonb AND status NOT IN ('SUPERSEDED','REJECTED')
        ORDER BY calculated_at DESC LIMIT 1`,
      [scope.organizationId, scope.tenantId, metricId, metricVersion, programId, JSON.stringify(inputs.map((item) => ({ claimId: item.claimId, verificationId: item.verificationId, evidenceReferences: item.evidenceReferences, sourceProvenanceReference: item.provenanceReference, sourceAuthorityReference: item.sourceAuthorityReference })))],
    );
    if (existing.rows[0]) return existing.rows[0];

    const prior = await this.dbQuery(
      `SELECT metric_result_id FROM gpa_metric_results
        WHERE organization_id=$1 AND tenant_id=$2 AND metric_id=$3 AND metric_version=$4
          AND COALESCE(program_reference,'')=COALESCE($5,'')
          AND status IN ('CALCULATED','ACCEPTED')
        ORDER BY calculated_at DESC LIMIT 1`,
      [scope.organizationId, scope.tenantId, metricId, metricVersion, programId],
    );
    const result = await this.metricTruth.calculate(actor, {
      metricId, metricVersion, programReference: programId,
      metricResultId: input?.metricResultId || input?.metric_result_id || `curriculum_metric_result_${randomUUID()}`,
      inputs, calculationVersion: `curriculum-learner-result-${metricId}-${metricVersion}`,
    });
    if (prior.rows[0] && prior.rows[0].metric_result_id !== result.metric_result_id) {
      await this.dbQuery(
        `UPDATE gpa_metric_results SET status='SUPERSEDED'
          WHERE metric_result_id=$1 AND organization_id=$2 AND tenant_id=$3
            AND metric_id=$4 AND status IN ('CALCULATED','ACCEPTED')`,
        [prior.rows[0].metric_result_id, scope.organizationId, scope.tenantId, metricId],
      );
      await this.dbQuery(
        `UPDATE gpa_metric_results SET supersedes_metric_result_id=$5
          WHERE metric_result_id=$1 AND organization_id=$2 AND tenant_id=$3 AND metric_id=$4`,
        [result.metric_result_id, scope.organizationId, scope.tenantId, metricId, prior.rows[0].metric_result_id],
      );
    }
    return result;
  }
}

export const curriculumMetricTruthAdapter = new CurriculumMetricTruthAdapter();
