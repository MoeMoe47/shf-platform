import { query } from "../../../db/client.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

function json(value: unknown) { return JSON.stringify(value ?? []); }

export class SourceScopeRepo {
  constructor(private dbQuery: typeof query = query) {}
  private executor(executor?: Executor): Executor { return executor || { query: this.dbQuery }; }

  async createJurisdiction(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_jurisdictions
      (jurisdiction_id, organization_id, tenant_id, jurisdiction_type, canonical_name, state_country_code, geographic_reference, parent_jurisdiction_id, effective_from, effective_to, status, created_by, provenance_json)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [input.jurisdiction_id, input.organization_id, input.tenant_id, input.jurisdiction_type, input.canonical_name, input.state_country_code || null, input.geographic_reference || null, input.parent_jurisdiction_id || null, input.effective_from, input.effective_to || null, input.status || "ACTIVE", input.created_by, json(input.provenance_json)]);
    return result.rows[0];
  }

  async listJurisdictions(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_jurisdictions WHERE organization_id=$1 AND tenant_id=$2 ORDER BY canonical_name", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async createSourceSystem(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_source_systems
      (source_system_id, organization_id, tenant_id, canonical_name, provider_vendor, source_owner_reference, jurisdiction_id, environment, system_type, data_domains, record_types, authority_role, authority_precedence, effective_from, effective_to, status, data_classification, integration_mode, credential_reference, last_verified_metadata_at, provenance_json, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [input.source_system_id, input.organization_id, input.tenant_id, input.canonical_name, input.provider_vendor || null, input.source_owner_reference, input.jurisdiction_id || null, input.environment, input.system_type, json(input.data_domains), json(input.record_types), input.authority_role || "SOURCE_SYSTEM", input.authority_precedence ?? 0, input.effective_from, input.effective_to || null, input.status || "DRAFT", input.data_classification, input.integration_mode, input.credential_reference || null, input.last_verified_metadata_at || null, json(input.provenance_json), input.created_by]);
    return result.rows[0];
  }

  async listSourceSystems(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_source_systems WHERE organization_id=$1 AND tenant_id=$2 ORDER BY canonical_name", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async listSourceHealth(scope: any, executor?: Executor) {
    return (await this.executor(executor).query("SELECT * FROM gpa_source_health WHERE organization_id=$1 AND tenant_id=$2 ORDER BY source_system_id", [scope.organizationId, scope.tenantId])).rows;
  }

  async getSourceHealth(id: string, scope: any, executor?: Executor) {
    return (await this.executor(executor).query("SELECT * FROM gpa_source_health WHERE source_system_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, scope.organizationId, scope.tenantId])).rows[0] || null;
  }

  async listMappings(scope: any, executor?: Executor) {
    return (await this.executor(executor).query("SELECT * FROM gpa_semantic_mappings WHERE organization_id=$1 AND tenant_id=$2 ORDER BY source_system_id, mapping_id, version DESC", [scope.organizationId, scope.tenantId])).rows;
  }

  async getSourceSystem(id: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_source_systems WHERE source_system_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }

  async listPurposes(executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_purposes WHERE status='ACTIVE' ORDER BY purpose_id");
    return result.rows;
  }

  async createPolicy(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_data_use_policies
      (policy_id, version, organization_id, tenant_id, source_system_id, source_class, allowed_purposes, allowed_actions, allowed_action_classes, allowed_data_domains, allowed_record_types, allowed_fields, jurisdiction_id, legal_basis_reference, agreement_reference, requires_legal_basis, requires_agreement, classification_ceiling, retention_rule_reference, redisclosure_rule, effective_from, effective_to, status, approved_by, provenance_json, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING *`,
      [input.policy_id, input.version, input.organization_id, input.tenant_id, input.source_system_id || null, input.source_class || null, json(input.allowed_purposes), json(input.allowed_actions), json(input.allowed_action_classes || ["READ"]), json(input.allowed_data_domains), json(input.allowed_record_types), json(input.allowed_fields), input.jurisdiction_id || null, input.legal_basis_reference || null, input.agreement_reference || null, input.requires_legal_basis !== false, input.requires_agreement === true, input.classification_ceiling, input.retention_rule_reference || null, input.redisclosure_rule || null, input.effective_from, input.effective_to || null, input.status || "DRAFT", input.approved_by || null, json(input.provenance_json), input.created_by]);
    return result.rows[0];
  }

  async listPolicies(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_data_use_policies WHERE organization_id=$1 AND tenant_id=$2 ORDER BY policy_id, version DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }

  async createProvenance(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_source_provenance
      (provenance_id, organization_id, tenant_id, source_system_id, source_record_id, connector_id, connector_version, jurisdiction_id, retrieved_at, source_timestamp, batch_event_id, transformation_reference, validation_status, rejected_reason, data_use_policy_id, data_use_policy_version, actor_service_identity, correlation_id, provenance_json)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [input.provenance_id, input.organization_id, input.tenant_id, input.source_system_id, input.source_record_id, input.connector_id || null, input.connector_version || null, input.jurisdiction_id || null, input.retrieved_at, input.source_timestamp || null, input.batch_event_id || null, input.transformation_reference || null, input.validation_status, input.rejected_reason || null, input.data_use_policy_id || null, input.data_use_policy_version || null, input.actor_service_identity, input.correlation_id, json(input.provenance_json)]);
    return result.rows[0];
  }

  async createAccessDecision(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_source_access_decisions
      (access_decision_id, organization_id, tenant_id, principal_reference, requesting_organization_id, source_system_id, program_reference, jurisdiction_id, purpose_id, action_class, action, data_domain, record_type, requested_fields, requested_classification, policy_id, policy_version, decision, reason_code, correlation_id, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [input.access_decision_id, input.organization_id, input.tenant_id, input.principal_reference, input.requesting_organization_id, input.source_system_id, input.program_reference || null, input.jurisdiction_id || null, input.purpose_id, input.action_class, input.action, input.data_domain, input.record_type, json(input.requested_fields), input.requested_classification, input.policy_id || null, input.policy_version || null, input.decision, input.reason_code, input.correlation_id, json(input.metadata)]);
    return result.rows[0];
  }

  async listAccessDecisions(scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_source_access_decisions WHERE organization_id=$1 AND tenant_id=$2 ORDER BY decided_at DESC", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }
}
