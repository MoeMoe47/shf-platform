import { query } from "../../../db/client.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

export class GovernmentAssuranceRepo {
  constructor(private dbQuery: typeof query = query) {}

  private executor(executor?: Executor): Executor { return executor || { query: this.dbQuery }; }

  async createClaim(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(
      `INSERT INTO gpa_claims (claim_id, organization_id, tenant_id, claimant_reference, program_reference, claim_type, subject_type, subject_reference, metric_reference, reporting_period_start, reporting_period_end, asserted_value, asserted_population, asserted_unit, status, supersedes_claim_id, version, created_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [input.claim_id, input.organization_id, input.tenant_id, input.claimant_reference, input.program_reference || null, input.claim_type, input.subject_type || "UNSPECIFIED", input.subject_reference || "UNSPECIFIED", input.metric_reference || null, input.reporting_period_start || null, input.reporting_period_end || null, JSON.stringify(input.asserted_value), JSON.stringify(input.asserted_population || {}), input.asserted_unit, input.status || "DRAFT", input.supersedes_claim_id || null, input.version || 1, input.created_by, JSON.stringify(input.metadata || {})],
    );
    return result.rows[0];
  }

  async listClaims(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_claims WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async getClaim(id: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_claims WHERE claim_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }

  async createSourceAuthority(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(
      `INSERT INTO gpa_source_authorities (source_authority_id, organization_id, tenant_id, source_system_id, source_owner_reference, data_domain, record_type, jurisdiction, precedence, effective_from, effective_to, status, conflict_policy_reference, created_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [input.source_authority_id, input.organization_id, input.tenant_id, input.source_system_id, input.source_owner_reference, input.data_domain, input.record_type, input.jurisdiction || null, input.precedence ?? 0, input.effective_from, input.effective_to || null, input.status || "DRAFT", input.conflict_policy_reference || null, input.created_by, JSON.stringify(input.metadata || {})],
    );
    return result.rows[0];
  }

  async listSourceAuthorities(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_source_authorities WHERE organization_id=$1 AND tenant_id=$2 ORDER BY precedence DESC, effective_from DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async createMetric(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(
      `INSERT INTO gpa_metrics (metric_id, version, organization_id, tenant_id, program_reference, canonical_name, definition, unit_value_type, metric_type, numerator_definition, denominator_definition, formula_reference, inclusion_criteria, exclusion_criteria, population_definition, required_evidence_classes, minimum_verification_level, source_authority_requirements, reporting_period_rules, jurisdiction_reference, effective_from, effective_to, status, authority_owner_reference, supersedes_metric_version, approval_reference, created_by, provenance, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) RETURNING *`,
      [input.metric_id, input.version, input.organization_id, input.tenant_id, input.program_reference || null, input.canonical_name, input.definition, input.unit_value_type, input.metric_type || "CUSTOM", input.numerator_definition || null, input.denominator_definition || null, input.formula_reference || null, JSON.stringify(input.inclusion_criteria || {}), JSON.stringify(input.exclusion_criteria || {}), JSON.stringify(input.population_definition || {}), JSON.stringify(input.required_evidence_classes || []), input.minimum_verification_level || "V2", JSON.stringify(input.source_authority_requirements || []), JSON.stringify(input.reporting_period_rules || {}), input.jurisdiction_reference || null, input.effective_from, input.effective_to || null, input.status || "DRAFT", input.authority_owner_reference, input.supersedes_metric_version || null, input.approval_reference || null, input.created_by, JSON.stringify(input.provenance || {}), JSON.stringify(input.metadata || {})],
    );
    return result.rows[0];
  }

  async getMetric(metricId: string, version: number, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_metrics WHERE metric_id=$1 AND version=$2 AND organization_id=$3 AND tenant_id=$4", [metricId, version, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }

  async listMetrics(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_metrics WHERE organization_id=$1 AND tenant_id=$2 ORDER BY canonical_name, version DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async createVerificationMethod(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(
      `INSERT INTO gpa_verification_methods (method_id, version, organization_id, tenant_id, method_type, description, required_evidence_types, eligible_claim_types, eligible_subject_types, required_source_authority_level, minimum_evidence_count, reviewer_requirements, automation_allowed, human_review_required, sampling_requirement_reference, verification_threshold, owner_reference, approver_reference, effective_from, effective_to, status, created_by, provenance, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING *`,
      [input.method_id, input.version, input.organization_id, input.tenant_id, input.method_type, input.description, JSON.stringify(input.required_evidence_types || []), JSON.stringify(input.eligible_claim_types || []), JSON.stringify(input.eligible_subject_types || []), input.required_source_authority_level || null, input.minimum_evidence_count ?? 1, JSON.stringify(input.reviewer_requirements || {}), input.automation_allowed === true, input.human_review_required !== false, input.sampling_requirement_reference || null, JSON.stringify(input.verification_threshold || {}), input.owner_reference || null, input.approver_reference || null, input.effective_from, input.effective_to || null, input.status || "DRAFT", input.created_by, JSON.stringify(input.provenance || {}), JSON.stringify(input.metadata || {})],
    );
    return result.rows[0];
  }

  async listVerificationMethods(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_verification_methods WHERE organization_id=$1 AND tenant_id=$2 ORDER BY method_id, version DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async createVerification(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(
      `INSERT INTO gpa_verification_records (verification_id, organization_id, tenant_id, claim_id, subject_type, subject_reference, method_id, method_version, verifier_reference, status, result, evidence_references, policy_version_reference, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [input.verification_id, input.organization_id, input.tenant_id, input.claim_id || null, input.subject_type, input.subject_reference, input.method_id, input.method_version, input.verifier_reference, input.status || "UNREVIEWED", JSON.stringify(input.result || {}), JSON.stringify(input.evidence_references || []), input.policy_version_reference || null, input.created_by],
    );
    return result.rows[0];
  }

  async listVerifications(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_verification_records WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async getVerification(id: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_verification_records WHERE verification_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }

  async createTruthFact(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(
      `INSERT INTO gpa_truth_facts (truth_fact_id, organization_id, tenant_id, fact_type, subject_type, subject_reference, claim_id, verification_id, metric_result_id, source_references, fact_value, unit_value_type, reporting_period_start, reporting_period_end, accepted_at, verification_level, authority_level, public_approval_status, confidence, reconciliation_case_id, status, provenance, supersedes_truth_fact_id, retraction_reason, determination_metadata, determined_by, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) RETURNING *`,
      [input.truth_fact_id, input.organization_id, input.tenant_id, input.fact_type, input.subject_type, input.subject_reference, input.claim_id || null, input.verification_id || null, input.metric_result_id || null, JSON.stringify(input.source_references || []), JSON.stringify(input.fact_value), input.unit_value_type || null, input.reporting_period_start || null, input.reporting_period_end || null, input.accepted_at || null, input.verification_level || null, input.authority_level || null, input.public_approval_status || "NOT_REVIEWED", input.confidence ?? null, input.reconciliation_case_id || null, input.status || "ACCEPTED", JSON.stringify(input.provenance), input.supersedes_truth_fact_id || null, input.retraction_reason || null, JSON.stringify(input.determination_metadata || {}), input.determined_by, input.created_by],
    );
    return result.rows[0];
  }

  async listTruthFacts(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_truth_facts WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async createMetricResult(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_metric_results
      (metric_result_id, metric_id, metric_version, organization_id, tenant_id, program_reference, provider_reference, jurisdiction_reference, reporting_period_start, reporting_period_end, population_reference, numerator, denominator, calculated_value, unit_value_type, input_references, input_verification_levels, calculation_version, calculation_hash, calculated_by, status, provenance, supersedes_metric_result_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING *`, [input.metric_result_id, input.metric_id, input.metric_version, input.organization_id, input.tenant_id, input.program_reference || null, input.provider_reference || null, input.jurisdiction_reference || null, input.reporting_period_start || null, input.reporting_period_end || null, JSON.stringify(input.population_reference || {}), input.numerator ?? null, input.denominator ?? null, JSON.stringify(input.calculated_value), input.unit_value_type, JSON.stringify(input.input_references || []), JSON.stringify(input.input_verification_levels || []), input.calculation_version, input.calculation_hash, input.calculated_by, input.status || "CALCULATED", JSON.stringify(input.provenance), input.supersedes_metric_result_id || null]);
    return result.rows[0];
  }
  async getMetricResult(id: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_metric_results WHERE metric_result_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }
  async listMetricResults(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_metric_results WHERE organization_id=$1 AND tenant_id=$2 ORDER BY calculated_at DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }
  async getTruthFact(id: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_truth_facts WHERE truth_fact_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }
  async updateTruthStatus(id: string, scope: any, status: string, reason?: string, executor?: Executor) {
    const result = await this.executor(executor).query("UPDATE gpa_truth_facts SET status=$4, retraction_reason=COALESCE($5,retraction_reason), updated_at=NOW() WHERE truth_fact_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *", [id, scope.organizationId, scope.tenantId, status, reason || null]);
    return result.rows[0] || null;
  }
  async createTruthDetermination(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_truth_determinations
      (determination_id, truth_fact_id, organization_id, tenant_id, decision, determining_actor, authorization_reference, claim_reference, verification_reference, metric_result_reference, evidence_references, source_authority_references, reconciliation_references, reason, policy_version_reference, correlation_id, provenance)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`, [input.determination_id, input.truth_fact_id, input.organization_id, input.tenant_id, input.decision, input.determining_actor, input.authorization_reference, input.claim_reference || null, input.verification_reference || null, input.metric_result_reference || null, JSON.stringify(input.evidence_references || []), JSON.stringify(input.source_authority_references || []), JSON.stringify(input.reconciliation_references || []), input.reason, input.policy_version_reference || null, input.correlation_id, JSON.stringify(input.provenance || {})]);
    return result.rows[0];
  }
  async listMetricResultLineage(id: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query(`SELECT mr.*, m.canonical_name, m.definition, m.minimum_verification_level, m.metric_type,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('claimId', cel.claim_id, 'evidenceId', cel.evidence_id, 'relationshipType', cel.relationship_type, 'provenance', cel.provenance_json)) FROM gpa_claim_evidence_links cel WHERE cel.claim_id = ANY(SELECT (item->>'claimId') FROM jsonb_array_elements(mr.input_references) item)), '[]'::jsonb) AS claim_evidence_lineage
      FROM gpa_metric_results mr JOIN gpa_metrics m ON m.metric_id=mr.metric_id AND m.version=mr.metric_version AND m.organization_id=mr.organization_id AND m.tenant_id=mr.tenant_id
      WHERE mr.metric_result_id=$1 AND mr.organization_id=$2 AND mr.tenant_id=$3`, [id, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }

  async createReconciliationCase(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(
      `INSERT INTO gpa_reconciliation_cases (reconciliation_case_id, organization_id, tenant_id, subject_type, subject_reference, competing_source_references, competing_claim_references, conflict_reason, source_authority_references, status, created_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [input.reconciliation_case_id, input.organization_id, input.tenant_id, input.subject_type, input.subject_reference, JSON.stringify(input.competing_source_references || []), JSON.stringify(input.competing_claim_references || []), input.conflict_reason, JSON.stringify(input.source_authority_references || []), input.status || "OPEN", input.created_by, JSON.stringify(input.metadata || {})],
    );
    return result.rows[0];
  }

  async listReconciliationCases(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_reconciliation_cases WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async getReconciliationCase(id: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_reconciliation_cases WHERE reconciliation_case_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }
}
