import { query } from "../../../db/client.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

export class InputSecurityRepo {
  constructor(private dbQuery: typeof query = query) {}

  async createScan(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_input_security_scans (
         scan_id, organization_id, tenant_id, resource_type, resource_id, source_kind,
         source_ref, content_type, content_sha256, scanner_provider, scanner_version,
         scan_status, risk_level, finding_count, decision, review_required,
         submitted_by, scanned_at, metadata_json
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),$18)
       RETURNING *`,
      [input.scan_id, input.organization_id, input.tenant_id, input.resource_type, input.resource_id, input.source_kind, input.source_ref || null, input.content_type || null, input.content_sha256 || null, input.scanner_provider, input.scanner_version, input.scan_status, input.risk_level, input.finding_count, input.decision, input.review_required === true, input.submitted_by, JSON.stringify(input.metadata_json || {})],
    );
    return result.rows[0];
  }

  async createFinding(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_input_security_findings (
         finding_id, scan_id, organization_id, tenant_id, resource_type, resource_id,
         category, severity, confidence, decision_code, excerpt, start_offset, end_offset, metadata_json
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [input.finding_id, input.scan_id, input.organization_id, input.tenant_id, input.resource_type, input.resource_id, input.category, input.severity, input.confidence, input.decision_code, input.excerpt || null, input.start_offset ?? null, input.end_offset ?? null, JSON.stringify(input.metadata_json || {})],
    );
    return result.rows[0];
  }

  async getScan(scanId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`SELECT * FROM ai_input_security_scans WHERE scan_id=$1 AND organization_id=$2 AND tenant_id=$3`, [scanId, organizationId, tenantId]);
    return result.rows[0] || null;
  }

  async getLatestScan(resource: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `SELECT * FROM ai_input_security_scans
       WHERE organization_id=$1 AND tenant_id=$2 AND resource_type=$3 AND resource_id=$4
       ORDER BY created_at DESC LIMIT 1`,
      [resource.organization_id, resource.tenant_id, resource.resource_type, resource.resource_id],
    );
    return result.rows[0] || null;
  }

  async listFindings(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `SELECT * FROM ai_input_security_findings
       WHERE organization_id=$1 AND tenant_id=$2
         AND ($3::text IS NULL OR scan_id=$3)
       ORDER BY created_at DESC`,
      [input.organization_id, input.tenant_id, input.scan_id || null],
    );
    return result.rows;
  }

  async createReview(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_input_security_reviews (
         review_id, scan_id, organization_id, tenant_id, decision, rationale, reviewed_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [input.review_id, input.scan_id, input.organization_id, input.tenant_id, input.decision, input.rationale || null, input.reviewed_by],
    );
    return result.rows[0];
  }

  async getLatestReview(scanId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `SELECT * FROM ai_input_security_reviews
       WHERE scan_id=$1 AND organization_id=$2 AND tenant_id=$3
       ORDER BY reviewed_at DESC LIMIT 1`,
      [scanId, organizationId, tenantId],
    );
    return result.rows[0] || null;
  }

  async createAdmissionDecision(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_context_admission_decisions (
         admission_id, organization_id, tenant_id, scan_id, session_id, delegation_id,
         resource_type, resource_id, resource_classification, intended_use,
         model_provider, model_identifier, admitted, decision, decision_code,
         warning_codes, security_finding_ids, evaluated_by, metadata_json
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [input.admission_id, input.organization_id, input.tenant_id, input.scan_id || null, input.session_id || null, input.delegation_id || null, input.resource_type, input.resource_id, input.resource_classification, input.intended_use, input.model_provider || null, input.model_identifier || null, input.admitted === true, input.decision, input.decision_code, input.warning_codes || [], input.security_finding_ids || [], input.evaluated_by, JSON.stringify(input.metadata_json || {})],
    );
    return result.rows[0];
  }
}
